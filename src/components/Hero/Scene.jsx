import { useCallback, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EffectComposer } from '@react-three/postprocessing'
import {
  CAMERA_Z,
  DOLLY_END,
  CELEB_END,
  TRANSITION_END,
  UPGRADE_ZOOM,
  UPGRADE_KAGGLE,
  UPGRADE_PAN_KZH,
  UPGRADE_KZH,
  UPGRADE_PAN_AWS,
  UPGRADE_AWS,
  PEEL_START,
  PEEL_END,
} from './config.js'
import { useLayout } from './breakpoint.js'
import { useBootSequence } from '../../hooks/useBootSequence.js'
import CrtEffect from './effects/CrtEffect.jsx'
import Background from './scene/Background.jsx'
import Starfield from './scene/Starfield.jsx'
import ShootingStar from './scene/ShootingStar.jsx'
import Moon from './scene/Moon.jsx'
import Clouds from './scene/Clouds.jsx'
import Title from './scene/Title.jsx'
import FilmRoll from './scene/FilmRoll.jsx'
import { FRAMES } from './scene/FilmFrame.jsx'
import CarouselArrows from './scene/CarouselArrows.jsx'
import Chrome from './scene/Chrome.jsx'
import ScrollPrompt from './scene/ScrollPrompt.jsx'
import BootOverlay from './scene/BootOverlay.jsx'
import OriginBeat from './scene/OriginBeat.jsx'
import Confetti from './scene/Confetti.jsx'
import ReelTransition from './scene/ReelTransition.jsx'
import UpgradeScene from './scene/upgrade/UpgradeScene.jsx'
import ChapterPeel from './scene/ChapterPeel.jsx'
import RosterChapter from './scene/RosterChapter.jsx'
import CraftsChapter from './scene/CraftsChapter.jsx'

const INITIAL = {
  bootLine: false,
  maskGone: false,
  sky: false,
  moon: false,
  film: false,
  title: false,
  chrome: false,
  idle: false,
  prompt: false,
  focus: false,
}

const MAX_TILT = 0.02
const TILT_EASE = 0.02
const ZOOM = 1.01

const SCROLL_SMOOTH = 0.1
const clamp01 = (x) => Math.min(1, Math.max(0, x))
const smoothstep = (x) => x * x * (3 - 2 * x)

const FRAME_W = 260
const FRAME_H = 200
const FRAME_CONTENT_LEFT = -116

const DEG = Math.PI / 180

export default function Scene({ progressRef, carouselOffset = 0, onPrev, onNext, onEnter, onReelSettled }) {
  const [phase, setPhases] = useState(INITIAL)
  const setPhase = useCallback(
    (key, value) => setPhases((p) => ({ ...p, [key]: value })),
    [],
  )
  useBootSequence({ setPhase })
  const { park, filmRoll, upgrade } = useLayout()

  // The focused (centred) carousel chapter drives the big broadcast title.
  const focusedChapter =
    FRAMES[((carouselOffset % FRAMES.length) + FRAMES.length) % FRAMES.length]

  const tilt = useRef()
  const frameMarker = useRef()
  const smoothed = useRef(0)
  const framePos = useMemo(() => new THREE.Vector3(), [])
  const coneAnchor = useMemo(() => new THREE.Vector3(), [])
  const decluttered = useRef(false)

  const upgradeRef = useRef()
  const reelRef = useRef()
  const reelWrapRef = useRef()
  const confettiWrapRef = useRef()
  const peelCapturedRef = useRef(false)
  const actIRef = useRef()

  const actIPark = useMemo(() => new THREE.Vector3(), [])
  const camPark = useRef(null)

  const polaroidPos = useMemo(() => new THREE.Vector3(), [])
  const polaroidScale = useMemo(() => new THREE.Vector3(), [])

  useFrame((state) => {
    const g = tilt.current
    if (g) {
      const targetX = -state.pointer.y * MAX_TILT
      const targetY = state.pointer.x * MAX_TILT
      g.rotation.x += (targetX - g.rotation.x) * TILT_EASE
      g.rotation.y += (targetY - g.rotation.y) * TILT_EASE
    }

    const raw = progressRef?.current ?? 0
    smoothed.current += (raw - smoothed.current) * SCROLL_SMOOTH

    // Act I declutter
    if (!decluttered.current && smoothed.current > 0.038) {
      decluttered.current = true
      setPhases((p) => ({
        ...p,
        moon: false,
        title: false,
        chrome: false,
        prompt: false,
        focus: true,
      }))
    }
    if (decluttered.current && smoothed.current < 0.027) {
      decluttered.current = false
      setPhases((p) => ({
        ...p,
        moon: true,
        title: true,
        chrome: true,
        prompt: true,
        focus: false,
      }))
    }

    if (actIRef.current) actIRef.current.visible = smoothed.current < CELEB_END

    const cam = state.camera
    const tanHalf = Math.tan((cam.fov * Math.PI) / 360)
    const aspect = state.size.width / state.size.height

    // ── Act I camera: dolly into FIRST LIGHT, then hold ──
    const t = smoothstep(clamp01(smoothed.current / DOLLY_END))
    const marker = frameMarker.current
    if (marker) {
      marker.getWorldPosition(framePos)
      const effScale = filmRoll.scale * ZOOM

      let parkX, parkY, parkGap
      if (park.mode === 'top') {
        const visH = (FRAME_W * effScale) / park.widthFrac / aspect
        parkGap = visH / (2 * tanHalf)
        parkX = 0
        parkY = (FRAME_H * effScale) / 2 - visH * (0.5 - park.topMargin)
      } else {
        const visH = (FRAME_H * effScale) / park.heightFrac
        parkGap = visH / (2 * tanHalf)
        const visW = visH * aspect
        parkX = FRAME_CONTENT_LEFT * effScale + visW * (0.5 - park.sideMargin)
        parkY = 0
      }

      // Act I park target
      actIPark.set(
        framePos.x + parkX,
        framePos.y + parkY,
        framePos.z + parkGap,
      )

      // If we're still in Act I territory, position the camera here
      if (smoothed.current <= TRANSITION_END) {
        cam.position.x = THREE.MathUtils.lerp(0, actIPark.x, t)
        cam.position.y = THREE.MathUtils.lerp(0, actIPark.y, t)
        cam.position.z = THREE.MathUtils.lerp(CAMERA_Z, actIPark.z, t)
      }
    }

    // ── Upgrade camera: carrier fills viewport, polaroid zoom chain ──
    if (smoothed.current > TRANSITION_END) {
      // Freeze the Act I park target so the tilt group's pointer-driven
      // rotation no longer feeds into the camera position.  Without this
      // the marker's world-position wobble causes aggressive panning
      // because the upgrade content (frozen reel) doesn't move with it.
      if (!camPark.current) {
        camPark.current = actIPark.clone()
      }

      let cx = camPark.current.x
      let cy = camPark.current.y
      let cz = camPark.current.z

      const ur = upgradeRef.current
      if (ur && smoothed.current > UPGRADE_ZOOM) {
        const parks = [
          { ref: ur.kaggleRef, start: UPGRADE_ZOOM, end: UPGRADE_KAGGLE, fillFrac: upgrade.kagglePark.fillFrac },
          { ref: ur.kozhikodeRef, start: UPGRADE_PAN_KZH, end: UPGRADE_KZH, fillFrac: upgrade.kozhikodePark.fillFrac },
          { ref: ur.awsRef, start: UPGRADE_PAN_AWS, end: UPGRADE_AWS, fillFrac: upgrade.awsPark.fillFrac },
        ]

        let fromX = cx, fromY = cy, fromZ = cz

        for (const pk of parks) {
          if (smoothed.current < pk.start) break
          const pRef = pk.ref?.current
          if (!pRef) continue
          pRef.getWorldPosition(polaroidPos)
          pRef.getWorldScale(polaroidScale)
          const ws = polaroidScale.x
          const effPolH = upgrade.polaroidW * 1.2 * ws
          const visH = effPolH / pk.fillFrac
          const parkDist = visH / (2 * tanHalf)
          const toX = polaroidPos.x
          const toY = polaroidPos.y
          const toZ = polaroidPos.z + parkDist
          const pT = smoothstep(
            clamp01((smoothed.current - pk.start) / (pk.end - pk.start)),
          )
          cx = THREE.MathUtils.lerp(fromX, toX, pT)
          cy = THREE.MathUtils.lerp(fromY, toY, pT)
          cz = THREE.MathUtils.lerp(fromZ, toZ, pT)
          fromX = toX
          fromY = toY
          fromZ = toZ
        }
      }

      cam.position.set(cx, cy, cz)
    } else {
      camPark.current = null
    }

    // Blend camera rotation from 0 (Act I — parallax is on the tilt group)
    // to tilt values (Upgrade — parallax is on the camera itself).  Ramps
    // over a 0.02-wide scroll band so the handoff is invisible.
    // Suppress tilt as peel approaches so the peel mesh stays viewport-aligned.
    const rotT = clamp01((smoothed.current - TRANSITION_END) / 0.02)
    const tiltFade = 1 - clamp01((smoothed.current - UPGRADE_PAN_AWS) / (PEEL_START - UPGRADE_PAN_AWS))
    const finalRotT = rotT * tiltFade
    const gt = tilt.current
    if (gt) {
      cam.rotation.x = gt.rotation.x * finalRotT
      cam.rotation.y = gt.rotation.y * finalRotT
    } else {
      cam.rotation.x = 0
      cam.rotation.y = 0
    }

    cam.updateMatrixWorld()

    if (reelWrapRef.current) {
      reelWrapRef.current.visible = !peelCapturedRef.current
    }
    // Confetti / cone is an Act-I → Upgrade hand-off effect. Hide once the
    // carrier locks (TRANSITION_END) — without this, the cone + foil/film
    // instances clamp at cp=1 and keep rendering through Upgrade and Crafts.
    if (confettiWrapRef.current) {
      confettiWrapRef.current.visible = smoothed.current < TRANSITION_END
    }
  })

  return (
    <>
      <group ref={actIRef}>
        <group ref={tilt} scale={ZOOM}>
          <Background on={phase.sky} />
          <Starfield on={phase.sky} />
          <ShootingStar on={phase.sky} />
          <Moon on={phase.moon} />
          <Clouds on={phase.moon} />
          <Title on={phase.title} chapter={focusedChapter} />
          <FilmRoll
            on={phase.film}
            idle={phase.idle}
            frameMarker={frameMarker}
            focus={phase.focus}
            carouselOffset={carouselOffset}
            onEnter={onEnter}
            smoothed={smoothed}
            onSettled={onReelSettled}
          />
          <CarouselArrows
            show={phase.idle && !phase.focus}
            onPrev={onPrev}
            onNext={onNext}
          />
          <Chrome on={phase.chrome} />
          <ScrollPrompt on={phase.prompt} />
          <BootOverlay maskGone={phase.maskGone} />
        </group>

        <OriginBeat
          smoothed={smoothed}
          frameMarker={frameMarker}
          coneAnchor={coneAnchor}
        />
      </group>
      <group ref={confettiWrapRef}>
        <Confetti smoothed={smoothed} coneAnchor={coneAnchor} />
      </group>
      <group ref={reelWrapRef}>
        <ReelTransition ref={reelRef} smoothed={smoothed} coneAnchor={coneAnchor}>
          <UpgradeScene ref={upgradeRef} smoothed={smoothed} />
        </ReelTransition>
      </group>

      <ChapterPeel smoothed={smoothed} start={PEEL_START} end={PEEL_END} capturedRef={peelCapturedRef} reelWrapRef={reelWrapRef}>
        <RosterChapter smoothed={smoothed} />
        <CraftsChapter smoothed={smoothed} />
      </ChapterPeel>

      <EffectComposer>
        <CrtEffect />
      </EffectComposer>
    </>
  )
}
