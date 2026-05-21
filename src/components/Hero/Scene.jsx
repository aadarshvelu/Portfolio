import { useCallback, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { EffectComposer } from '@react-three/postprocessing'
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

export default function Scene() {
  const [phase, setPhases] = useState(INITIAL)
  const setPhase = useCallback(
    (key, value) => setPhases((p) => ({ ...p, [key]: value })),
    [],
  )
  useBootSequence({ setPhase })

  // tilt the whole scene toward the pointer — flat layers at z=0 and the
  // film roll at z=920 swing by different amounts, giving real parallax.
  const tilt = useRef()
  useFrame((state) => {
    const g = tilt.current
    if (!g) return
    const targetX = -state.pointer.y * MAX_TILT
    const targetY = state.pointer.x * MAX_TILT
    g.rotation.x += (targetX - g.rotation.x) * TILT_EASE
    g.rotation.y += (targetY - g.rotation.y) * TILT_EASE
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
        <FilmRoll on={phase.film} idle={phase.idle} />
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
