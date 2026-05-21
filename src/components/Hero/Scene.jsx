import { useCallback, useState } from 'react'
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

export default function Scene() {
  const [phase, setPhases] = useState(INITIAL)
  const setPhase = useCallback(
    (key, value) => setPhases((p) => ({ ...p, [key]: value })),
    [],
  )
  useBootSequence({ setPhase })

  return (
    <>
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

      <EffectComposer>
        <CrtEffect />
      </EffectComposer>
    </>
  )
}
