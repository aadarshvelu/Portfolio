import { useCallback, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EffectComposer } from '@react-three/postprocessing'
import { CAMERA_Z } from './config.js'
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
}

// pointer parallax tilt
const MAX_TILT = 0.02 // radians (~3.4°)
const TILT_EASE = 0.02 // follow speed (0..1)
// slight overscan so a tilt never reveals a gap at the screen edges
const ZOOM = 1.01

// scroll -> camera transition into the FIRST LIGHT frame
const END_GAP = 200 // camera distance in front of the frame at full scroll
const SCROLL_SMOOTH = 0.1 // scroll-follow smoothing
const clamp01 = (x) => Math.min(1, Math.max(0, x))
const smoothstep = (x) => x * x * (3 - 2 * x)

export default function Scene({ progressRef }) {
  const [phase, setPhases] = useState(INITIAL)
  const setPhase = useCallback(
    (key, value) => setPhases((p) => ({ ...p, [key]: value })),
    [],
  )
  useBootSequence({ setPhase })

  // tilt the whole scene toward the pointer
  const tilt = useRef()
  // marks the FIRST LIGHT (centre) frame — the scroll camera zooms to it
  const frameMarker = useRef()
  const smoothed = useRef(0)
  const framePos = useMemo(() => new THREE.Vector3(), [])

  useFrame((state) => {
    // pointer parallax tilt
    const g = tilt.current
    if (g) {
      const targetX = -state.pointer.y * MAX_TILT
      const targetY = state.pointer.x * MAX_TILT
      g.rotation.x += (targetX - g.rotation.x) * TILT_EASE
      g.rotation.y += (targetY - g.rotation.y) * TILT_EASE
    }

    // scroll -> dolly the camera into the FIRST LIGHT frame
    const raw = progressRef?.current ?? 0
    smoothed.current += (raw - smoothed.current) * SCROLL_SMOOTH
    const t = smoothstep(clamp01(smoothed.current))
    const marker = frameMarker.current
    if (marker) {
      marker.getWorldPosition(framePos)
      const cam = state.camera
      cam.position.x = THREE.MathUtils.lerp(0, framePos.x, t)
      cam.position.y = THREE.MathUtils.lerp(0, framePos.y, t)
      cam.position.z = THREE.MathUtils.lerp(CAMERA_Z, framePos.z + END_GAP, t)
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
        />
        <Chrome on={phase.chrome} />
        <ScrollPrompt on={phase.prompt} />
        <BootOverlay bootLine={phase.bootLine} maskGone={phase.maskGone} />
      </group>

      <EffectComposer>
        <CrtEffect />
      </EffectComposer>
    </>
  )
}
