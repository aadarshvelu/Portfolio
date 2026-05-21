import { useCallback, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EffectComposer } from '@react-three/postprocessing'
import { CAMERA_Z, DOLLY_END } from './config.js'
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
import Chrome from './scene/Chrome.jsx'
import ScrollPrompt from './scene/ScrollPrompt.jsx'
import BootOverlay from './scene/BootOverlay.jsx'
import OriginBeat from './scene/OriginBeat.jsx'
import Confetti from './scene/Confetti.jsx'
import ReelTransition from './scene/ReelTransition.jsx'

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
  focus: false, // Phase B — hero decluttered down to FIRST LIGHT + Beat 1
}

// pointer parallax tilt
const MAX_TILT = 0.02 // radians (~3.4°)
const TILT_EASE = 0.02 // follow speed (0..1)
// slight overscan so a tilt never reveals a gap at the screen edges
const ZOOM = 1.01

// scroll -> camera transition into the FIRST LIGHT frame
const SCROLL_SMOOTH = 0.1 // scroll-follow smoothing
const clamp01 = (x) => Math.min(1, Math.max(0, x))
const smoothstep = (x) => x * x * (3 - 2 * x)

// FIRST LIGHT frame extents in design units (see FilmFrame.jsx) — used to
// compute a park target that always keeps the frame fully on-screen.
const FRAME_W = 260
const FRAME_H = 200
const FRAME_CONTENT_LEFT = -116 // leftmost text (the chapter tag) local x

export default function Scene({ progressRef }) {
  const [phase, setPhases] = useState(INITIAL)
  const setPhase = useCallback(
    (key, value) => setPhases((p) => ({ ...p, [key]: value })),
    [],
  )
  useBootSequence({ setPhase })
  const { park, filmRoll } = useLayout()

  // tilt the whole scene toward the pointer
  const tilt = useRef()
  // marks the FIRST LIGHT (centre) frame — the scroll camera parks on it
  const frameMarker = useRef()
  const smoothed = useRef(0)
  const framePos = useMemo(() => new THREE.Vector3(), [])
  // shared point — end of the final Beat 1 line, where the confetti cone pins
  const coneAnchor = useMemo(() => new THREE.Vector3(), [])
  // strips the hero down to FIRST LIGHT + Beat 1 once the dolly is underway
  const decluttered = useRef(false)

  useFrame((state) => {
    // pointer parallax tilt
    const g = tilt.current
    if (g) {
      const targetX = -state.pointer.y * MAX_TILT
      const targetY = state.pointer.x * MAX_TILT
      g.rotation.x += (targetX - g.rotation.x) * TILT_EASE
      g.rotation.y += (targetY - g.rotation.y) * TILT_EASE
    }

    // smoothed scroll progress (0..1 across the whole runway)
    const raw = progressRef?.current ?? 0
    smoothed.current += (raw - smoothed.current) * SCROLL_SMOOTH

    // Declutter the hero as the dolly commits — fade the moon, title, chrome
    // and prompt, hide the side reels — leaving only FIRST LIGHT + Beat 1.
    // Bidirectional with hysteresis so scrolling back up restores the hero.
    if (!decluttered.current && smoothed.current > 0.085) {
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
    if (decluttered.current && smoothed.current < 0.06) {
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

    // Phase A — dolly the camera into the FIRST LIGHT frame, then hold.
    // Maps scroll 0..DOLLY_END; the park target is derived from the live
    // viewport every frame so the frame always lands fully on-screen.
    const t = smoothstep(clamp01(smoothed.current / DOLLY_END))
    const marker = frameMarker.current
    if (marker) {
      marker.getWorldPosition(framePos)
      const cam = state.camera
      const tanHalf = Math.tan((cam.fov * Math.PI) / 360)
      const aspect = state.size.width / state.size.height
      const effScale = filmRoll.scale * ZOOM

      let parkX, parkY, parkGap
      if (park.mode === 'top') {
        // portrait — frame pinned to the top edge, centred horizontally
        const visH = (FRAME_W * effScale) / park.widthFrac / aspect
        parkGap = visH / (2 * tanHalf)
        parkX = 0
        parkY = (FRAME_H * effScale) / 2 - visH * (0.5 - park.topMargin)
      } else {
        // landscape — frame pinned to the left, content sideMargin from edge
        const visH = (FRAME_H * effScale) / park.heightFrac
        parkGap = visH / (2 * tanHalf)
        const visW = visH * aspect
        parkX = FRAME_CONTENT_LEFT * effScale + visW * (0.5 - park.sideMargin)
        parkY = 0
      }

      cam.position.x = THREE.MathUtils.lerp(0, framePos.x + parkX, t)
      cam.position.y = THREE.MathUtils.lerp(0, framePos.y + parkY, t)
      cam.position.z = THREE.MathUtils.lerp(CAMERA_Z, framePos.z + parkGap, t)
      cam.updateMatrixWorld()
    }
  })

  return (
    <>
      <group ref={tilt} scale={ZOOM}>
        <Background on={phase.sky} />
        <Starfield on={phase.sky} />
        <ShootingStar on={phase.sky} />
        <Moon on={phase.moon} />
        <Clouds on={phase.moon} />
        <Title on={phase.title} />
        <FilmRoll
          on={phase.film}
          idle={phase.idle}
          frameMarker={frameMarker}
          focus={phase.focus}
        />
        <Chrome on={phase.chrome} />
        <ScrollPrompt on={phase.prompt} />
        <BootOverlay bootLine={phase.bootLine} maskGone={phase.maskGone} />
      </group>

      <OriginBeat
        smoothed={smoothed}
        frameMarker={frameMarker}
        coneAnchor={coneAnchor}
      />
      <Confetti smoothed={smoothed} coneAnchor={coneAnchor} />
      <ReelTransition smoothed={smoothed} coneAnchor={coneAnchor} />

      <EffectComposer>
        <CrtEffect />
      </EffectComposer>
    </>
  )
}
