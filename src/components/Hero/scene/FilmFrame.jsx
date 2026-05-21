import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { FONTS } from '../../../fonts.js'
import { useTypewriter } from '../../../hooks/useTypewriter.js'

// frame 260x200, cell inset to 252x144 — origin at frame centre
const FW = 260
const FH = 200
const CW = 252
const CH = 144

// 5 frames, index -2 (left) .. +2 (right). cellA/cellB are sRGB 0..1.
export const FRAMES = [
  { i: -2, roman: '—', tag: 'PROLOGUE', meta: '2014', title: 'Cold\nOpen',
    em: 'before the work', cellA: [0.039, 0.063, 0.141], cellB: [0.020, 0.031, 0.063] },
  { i: -1, roman: 'IV.', tag: 'THE ARCHITECT', meta: '2025—', title: 'Aadarsh',
    em: 'technical lead', cellA: [0.102, 0.114, 0.173], cellB: [0.024, 0.031, 0.071] },
  { i: 0, roman: 'I.', tag: 'THE ORIGIN', meta: '2018 — 2020', title: 'First\nLight',
    em: 'before anyone was watching', center: true, cellA: [0.110, 0.165, 0.322], cellB: [0.020, 0.039, 0.110] },
  { i: 1, roman: 'II.', tag: 'THE WORK', meta: '2018—2022', title: 'Selected',
    em: 'seventeen reels', cellA: [0.102, 0.133, 0.220], cellB: [0.039, 0.063, 0.141] },
  { i: 2, roman: 'III.', tag: 'THE RECORD', meta: '2022—', title: 'Notes',
    em: 'from the cutting room', cellA: [0.086, 0.125, 0.243], cellB: [0.027, 0.035, 0.102] },
]

const baseVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

// dark film base + two sprocket-hole rows. uFade dissolves the shell away.
const frameFrag = /* glsl */ `
varying vec2 vUv;
uniform float uFade;
void main() {
  vec3 base = vec3(0.031, 0.035, 0.043);
  float band = step(0.90, vUv.y) + step(vUv.y, 0.10);
  float holes = step(0.5, fract(vUv.x * 21.0));
  vec3 col = mix(base, vec3(0.11, 0.11, 0.13), band * holes);
  gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0 - uFade);
}
`

// per-chapter cell gradient. uFade dissolves the colour panel to transparent.
const cellFrag = /* glsl */ `
varying vec2 vUv;
uniform vec3 uA;
uniform vec3 uB;
uniform float uDim;
uniform float uFade;
void main() {
  vec3 col = mix(uB, uA, vUv.y);
  float r = 1.0 - length(vUv - vec2(0.35, 0.65));
  col += vec3(0.05) * smoothstep(0.45, 1.0, r);
  col *= uDim;
  gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0 - uFade);
}
`

export default function FilmFrame({ frame, idle, focus }) {
  const { i, roman, tag, meta, title, em, center, cellA, cellB } = frame
  const ro = 12 + (2 - Math.abs(i)) * 0.4

  const cellUniforms = useMemo(
    () => ({
      uA: { value: new THREE.Vector3(...cellA) },
      uB: { value: new THREE.Vector3(...cellB) },
      uDim: { value: center ? 1.0 : 0.72 },
      uFade: { value: 0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const frameUniforms = useMemo(() => ({ uFade: { value: 0 } }), [])

  // Phase B — the centre frame dissolves its shell + colour cell to leave
  // only the title text floating on the shared night sky.
  const fade = useRef(0)
  useFrame(() => {
    const target = center && focus ? 1 : 0
    fade.current += (target - fade.current) * 0.04
    frameUniforms.uFade.value = fade.current
    cellUniforms.uFade.value = fade.current
  })

  const caption = useTypewriter('SELF-TAUGHT', {
    speed: 40,
    start: !!(center && idle),
  })

  const tagColor = center ? '#ffffff' : '#dcd9c8'
  const titleColor = center ? '#faedd2' : '#cfc6b3'
  const emColor = center ? '#c8a157' : '#9a9486'

  // The centre (FIRST LIGHT) frame parks as a full title card — scaled up
  // with a clean three-tier hierarchy. Side reels keep their compact hero
  // sizing untouched.
  const lay = center
    ? {
        label: 11,
        title: 42,
        em: 18,
        tag: [-118, 92, 2],
        meta: [118, 92, 2],
        titlePos: [-120, 54, 2],
        titleAnchorY: 'top',
        emPos: [-118, -36, 2],
        emAnchorY: 'top',
      }
    : {
        label: 9,
        title: 28,
        em: 13,
        tag: [-116, 88, 2],
        meta: [116, 88, 2],
        titlePos: [-112, -30, 2],
        titleAnchorY: 'bottom',
        emPos: [-112, -50, 2],
        emAnchorY: 'bottom',
      }

  return (
    <group>
      <mesh renderOrder={ro}>
        <planeGeometry args={[FW, FH]} />
        <shaderMaterial
          vertexShader={baseVert}
          fragmentShader={frameFrag}
          uniforms={frameUniforms}
          transparent
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0, 0, 1]} renderOrder={ro + 0.1}>
        <planeGeometry args={[CW, CH]} />
        <shaderMaterial
          vertexShader={baseVert}
          fragmentShader={cellFrag}
          uniforms={cellUniforms}
          transparent
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      <Text
        font={FONTS.dmMono400}
        fontSize={lay.label}
        color={tagColor}
        anchorX="left"
        anchorY="top"
        letterSpacing={0.2}
        position={lay.tag}
        renderOrder={ro + 0.2}
      >
        {`${roman}  ${tag}`}
      </Text>

      <Text
        font={FONTS.dmMono400}
        fontSize={lay.label}
        color="#9b9789"
        anchorX="right"
        anchorY="top"
        letterSpacing={0.16}
        position={lay.meta}
        renderOrder={ro + 0.2}
      >
        {meta}
      </Text>

      <Text
        font={FONTS.anton}
        fontSize={lay.title}
        color={titleColor}
        anchorX="left"
        anchorY={lay.titleAnchorY}
        lineHeight={0.92}
        position={lay.titlePos}
        renderOrder={ro + 0.2}
      >
        {title.toUpperCase()}
      </Text>

      <Text
        font={FONTS.cormorantItalic}
        fontSize={lay.em}
        color={emColor}
        anchorX="left"
        anchorY={lay.emAnchorY}
        position={lay.emPos}
        renderOrder={ro + 0.2}
      >
        {em}
      </Text>

      {center && (
        <>
          <Text
            font={FONTS.dmMono400}
            fontSize={11}
            color="#dcd9c8"
            anchorX="left"
            anchorY="top"
            letterSpacing={0.14}
            position={[-118, -66, 2]}
            renderOrder={ro + 0.2}
          >
            {idle ? caption : 'PRESS PLAY'}
          </Text>
          <mesh position={[-115, -92, 2]} renderOrder={ro + 0.2}>
            <circleGeometry args={[3, 16]} />
            <meshBasicMaterial
              color="#c8a157"
              transparent
              depthTest={false}
              toneMapped={false}
            />
          </mesh>
          <Text
            font={FONTS.dmMono400}
            fontSize={9}
            color="#c8a157"
            anchorX="left"
            anchorY="middle"
            letterSpacing={0.25}
            position={[-106, -92, 2]}
            renderOrder={ro + 0.2}
          >
            FOCAL
          </Text>
        </>
      )}
    </group>
  )
}
