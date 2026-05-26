import { forwardRef, useCallback, useMemo, useRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { FONTS } from '../../../../fonts.js'
import { useLayout } from '../../breakpoint.js'
import {
  UPGRADE_ZOOM,
  UPGRADE_KAGGLE,
  UPGRADE_PAN_KZH,
  UPGRADE_KZH,
  UPGRADE_PAN_AWS,
  UPGRADE_AWS,
  TRANSITION_END,
  UPGRADE_ENTER,
} from '../../config.js'
import ShootingStar from '../ShootingStar.jsx'
import TitleSlate from './TitleSlate.jsx'
import Polaroid from './Polaroid.jsx'

const SKY_OVER = 3

const PEARL_FADE = '#6f6c61'
const GOLD = '#b8860b'
const META = '#9b9789'

const clamp01 = (x) => Math.min(1, Math.max(0, x))

const bgVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
const bgFrag = /* glsl */ `
varying vec2 vUv;
uniform float uOpacity;
void main() {
  // film strip — dark base #10131c
  vec3 bg = vec3(0.063, 0.075, 0.110);
  vec3 col = bg;

  // inner slate-blue frame #1b2440 (between sprocket strips)
  float stripH = 11.0 / 72.0;
  if (vUv.y > stripH && vUv.y < 1.0 - stripH) {
    col = vec3(0.106, 0.141, 0.220);
  }

  // top + bottom dark strips #070910
  if (vUv.y < stripH || vUv.y > 1.0 - stripH) {
    col = vec3(0.027, 0.035, 0.063);
  }

  // gold sprocket holes #c8a157 — 3x5 rectangles at x=[5, 16, 27, 38]
  // reduced width: 3/48 ≈ 0.063
  float holeW = 4.5 / 47.0;
  float spacing = 10.0 / 48.0;
  float startX = 5.0 / 48.0;

  // top row of sprockets — within top dark strip
  float holeH = 5.0 / 72.0;
  float holeTop = 3.0 / 72.0;
  float holeBot = 64.0 / 72.0;

  for (float i = 0.0; i < 4.0; i++) {
    float hx = startX + i * spacing;
    // top row
    if (vUv.x > hx && vUv.x < hx + holeW &&
        vUv.y > holeTop && vUv.y < holeTop + holeH) {
      col = vec3(0.784, 0.631, 0.341);
    }
    // bottom row
    if (vUv.x > hx && vUv.x < hx + holeW &&
        vUv.y > holeBot && vUv.y < holeBot + holeH) {
      col = vec3(0.784, 0.631, 0.341);
    }
  }

  gl_FragColor = vec4(pow(col, vec3(2.2)), uOpacity);
}
`

const starVert = /* glsl */ `
attribute float aSize;
attribute float aPhase;
attribute float aSpeed;
uniform float uTime;
varying float vTw;
void main() {
  vTw = 0.25 + 0.75 * (0.5 + 0.5 * sin(uTime * aSpeed + aPhase));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize;
}
`
const starFrag = /* glsl */ `
uniform float uOpacity;
varying float vTw;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(pow(vec3(0.910, 0.933, 0.957), vec3(2.2)), a * vTw * uOpacity);
}
`

const RegMark = forwardRef(function RegMark({ x, y, scale }, ref) {
  const h = useRef()
  const v = useRef()
  useImperativeHandle(ref, () => ({
    set opacity(val) {
      const o = val * 0.32
      if (h.current) h.current.opacity = o
      if (v.current) v.current.opacity = o
    },
  }))
  return (
    <group position={[x, y, 0]}>
      <mesh renderOrder={52}>
        <planeGeometry args={[16 * scale, 1]} />
        <meshBasicMaterial
          ref={h}
          color="#f2e8d8"
          transparent
          opacity={0.32}
          toneMapped={false}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      <mesh renderOrder={52}>
        <planeGeometry args={[1, 16 * scale]} />
        <meshBasicMaterial
          ref={v}
          color="#f2e8d8"
          transparent
          opacity={0.32}
          toneMapped={false}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
})

const KAGGLE_DATA = {
  label: 'KAGGLE',
  year: '2020',
  caption: 'first run',
  tape: true,
  voiceover: {
    slug: 'KAGGLE',
    yearRange: '2020 — 2025',
    cue: '',
    lines: [
      { t: 'I wanted to understand the machines —', a: [] },
      { t: 'not just build with them.', a: [['build', GOLD]] },
      { t: '' },
      { t: 'So I went to the foundations:', a: [] },
      { t: 'math, statistics, the slow parts.', a: [] },
      { t: '' },
      { t: 'Practiced on Kaggle', a: [['Kaggle', GOLD]] },
      { t: 'until the intuition came.', a: [] },
    ],
    credential: { name: 'Kaggle — 3× Expert', year: '2022 — 2025' },
    link: { url: 'https://kaggle.com/aadarshvelu', label: '→ kaggle.com/aadarshvelu' },
    footer: '— first intuition.',
  },
}

const KOZHIKODE_DATA = {
  label: 'IIM-K',
  year: '2026',
  caption: 'the upgrade.',
  voiceover: {
    slug: 'IIM KOZHIKODE',
    yearRange: '2025 — 2026',
    cue: '',
    lines: [
      { t: 'Then the ground shifted.', a: [['shifted', GOLD]] },
      { t: '' },
      { t: 'When the tool writes the code,', a: [] },
      { t: 'the bottleneck moves —', a: [] },
      { t: 'the business problem', a: [] },
      { t: 'under the ticket.', a: [] },
      { t: '' },
      { t: 'So I went back for what', a: [] },
      { t: "code can't teach: judgment.", a: [['judgment', GOLD]] },
    ],
    credential: { name: '', year: '' },
    evidence: 'eMDP · STRATEGIC MANAGEMENT · BATCH 06 · JUN 2025 — APR 2026',
    footer: '— not a pivot. an upgrade.',
  },
}

const AWS_DATA = {
  label: 'AWS',
  year: '2023',
  caption: 'p.s.',
  voiceover: {
    slug: 'P.S. — FOR THE RECORD',
    yearRange: '2023',
    cue: '',
    lines: [
      { t: 'And — last but not least —', a: [] },
      { t: 'an AWS Solutions Architect, too.', a: [['AWS Solutions Architect', GOLD]] },
      { t: '' },
      { t: '(the cloud, on paper.)', a: [], italic: true },
    ],
    credential: { name: '', year: '' },
    evidence: 'AWS CERTIFIED SOLUTIONS ARCHITECT · ASSOCIATE',
    footer: '— end of reel.',
  },
}

const UpgradeScene = forwardRef(function UpgradeScene({ smoothed }, ref) {
  const { upgrade } = useLayout()
  const { design, starCount, chrome: ch } = upgrade

  const kaggleRef = useRef()
  const kozhikodeRef = useRef()
  const awsRef = useRef()
  const groupRef = useRef()
  const chromeOpRef = useRef(1)
  const chromeTexts = useRef([])
  const regMarks = useRef([])
  const titleOpRef = useRef(1)
  const starOpRef = useRef(0)

  useImperativeHandle(
    ref,
    () => ({
      kaggleRef,
      kozhikodeRef,
      awsRef,
    }),
    [],
  )

  const bgUniforms = useMemo(
    () => ({ uOpacity: { value: 1 } }),
    [],
  )
  const starUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uOpacity: { value: 1 } }),
    [],
  )

  const starGeo = useMemo(() => {
    const count = starCount * SKY_OVER * SKY_OVER
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const size = new Float32Array(count)
    const phase = new Float32Array(count)
    const speed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * design.w * SKY_OVER
      pos[i * 3 + 1] = (Math.random() - 0.5) * design.h * SKY_OVER
      pos[i * 3 + 2] = 0
      const tier = Math.random()
      size[i] = tier > 0.94 ? 6 : tier > 0.78 ? 4 : 2.5
      phase[i] = Math.random() * Math.PI * 2
      speed[i] = 0.6 + Math.random() * 1.4
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
    g.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1))
    return g
  }, [starCount, design.w, design.h])

  useFrame((_, dt) => {
    starUniforms.uTime.value += dt
    const sm = smoothed.current ?? 0
    const grp = groupRef.current
    if (!grp) return

    const zoomT = clamp01((sm - UPGRADE_ZOOM) / (UPGRADE_KAGGLE - UPGRADE_ZOOM))
    const chromeTarget = zoomT > 0.05 ? 0 : 1
    chromeOpRef.current += (chromeTarget - chromeOpRef.current) * 0.06
    titleOpRef.current += (chromeTarget - titleOpRef.current) * 0.06
    for (const t of chromeTexts.current) {
      if (t) t.fillOpacity = chromeOpRef.current
    }
    for (const rm of regMarks.current) {
      if (rm) rm.opacity = chromeOpRef.current
    }

    const starT = clamp01((sm - TRANSITION_END) / (UPGRADE_ENTER - TRANSITION_END))
    starUniforms.uOpacity.value = starT
    starOpRef.current = starT
  })

  const fs = ch.fontScale

  return (
    <group ref={groupRef}>
      {/* deep-night background — sized to match film texture 48:72 aspect */}
      <mesh renderOrder={50} position={[0, 0, -2]}>
        <planeGeometry args={[design.h * SKY_OVER * (48.0 / 72.0), design.h * SKY_OVER]} />
        <shaderMaterial
          vertexShader={bgVert}
          fragmentShader={bgFrag}
          uniforms={bgUniforms}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {/* starfield */}
      <points renderOrder={51} geometry={starGeo} position={[0, 0, -1]}>
        <shaderMaterial
          vertexShader={starVert}
          fragmentShader={starFrag}
          uniforms={starUniforms}
          transparent
          depthTest={false}
          depthWrite={false}
        />
      </points>

      {/* shooting stars */}
      <ShootingStar
        on
        design={design}
        config={upgrade.shootingStar}
        order={51}
        opacityRef={starOpRef}
      />

      {/* chrome — top */}
      <Text
        ref={(el) => (chromeTexts.current[0] = el)}
        font={FONTS.dmMono400}
        fontSize={10 * fs}
        color={GOLD}
        anchorX="left"
        anchorY="top"
        letterSpacing={0.28}
        position={[-ch.cornerX, ch.topY, 0]}
        renderOrder={52}
        fillOpacity={1}
      >
        {'REEL Nº 01 · CHAPTER I — CONT\'D'}
      </Text>
      <Text
        ref={(el) => (chromeTexts.current[1] = el)}
        font={FONTS.dmMono400}
        fontSize={9 * fs}
        color={PEARL_FADE}
        anchorX="left"
        anchorY="top"
        letterSpacing={0.22}
        position={[-ch.cornerX, ch.topY - 22 * fs, 0]}
        renderOrder={52}
        fillOpacity={1}
      >
        THE UPGRADE · 2020 — PRESENT
      </Text>
      <Text
        ref={(el) => (chromeTexts.current[2] = el)}
        font={FONTS.dmMono400}
        fontSize={9 * fs}
        color={PEARL_FADE}
        anchorX="right"
        anchorY="top"
        letterSpacing={0.22}
        position={[ch.cornerX, ch.topY, 0]}
        renderOrder={52}
        fillOpacity={1}
      >
        NIGHT EXT. · ASA 800T
      </Text>

      {/* chrome — bottom */}
      <Text
        ref={(el) => (chromeTexts.current[3] = el)}
        font={FONTS.dmMono400}
        fontSize={10 * fs}
        color={META}
        anchorX="left"
        anchorY="top"
        letterSpacing={0.22}
        position={[-ch.cornerX, ch.bottomY, 0]}
        renderOrder={52}
        fillOpacity={1}
      >
        SC. I.b · BEAT 01/03
      </Text>
      <Text
        ref={(el) => (chromeTexts.current[4] = el)}
        font={FONTS.dmMono400}
        fontSize={10 * fs}
        color={META}
        anchorX="right"
        anchorY="top"
        letterSpacing={0.22}
        position={[ch.cornerX, ch.bottomY, 0]}
        renderOrder={52}
        fillOpacity={1}
      >
        PAGE 14 · DRAFT 02 / REV. C
      </Text>

      {/* registration marks */}
      <RegMark ref={(el) => (regMarks.current[0] = el)} x={-ch.regX} y={ch.regY} scale={fs} />
      <RegMark ref={(el) => (regMarks.current[1] = el)} x={ch.regX} y={ch.regY} scale={fs} />
      <RegMark ref={(el) => (regMarks.current[2] = el)} x={-ch.regX} y={-ch.regY} scale={fs} />
      <RegMark ref={(el) => (regMarks.current[3] = el)} x={ch.regX} y={-ch.regY} scale={fs} />

      {/* title slate */}
      <TitleSlate opacityRef={titleOpRef} />

      {/* polaroids */}
      <Polaroid
        ref={kaggleRef}
        data={KAGGLE_DATA}
        position={[upgrade.kaggle.x, upgrade.kaggle.y, 0]}
        rotation={upgrade.kaggle.rot}
        width={upgrade.polaroidW}
        smoothed={smoothed}
        revealStart={UPGRADE_ZOOM}
        revealEnd={UPGRADE_KAGGLE}
      />
      <Polaroid
        ref={kozhikodeRef}
        data={KOZHIKODE_DATA}
        position={[upgrade.kozhikode.x, upgrade.kozhikode.y, 0]}
        rotation={upgrade.kozhikode.rot}
        width={upgrade.polaroidW * (upgrade.kozhikode.scale || 1)}
        smoothed={smoothed}
        revealStart={UPGRADE_PAN_KZH}
        revealEnd={UPGRADE_KZH}
      />
      <Polaroid
        ref={awsRef}
        data={AWS_DATA}
        position={[upgrade.aws.x, upgrade.aws.y, 0]}
        rotation={upgrade.aws.rot}
        width={upgrade.polaroidW * (upgrade.aws.scale || 1)}
        smoothed={smoothed}
        revealStart={UPGRADE_PAN_AWS}
        revealEnd={UPGRADE_AWS}
      />
    </group>
  )
})

export default UpgradeScene
