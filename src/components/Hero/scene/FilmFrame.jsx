import { useMemo } from 'react'
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
  { i: 0, roman: 'I.', tag: 'THE ORIGIN', meta: 'DXB · 2016', title: 'First\nLight',
    em: 'a story begins', center: true, cellA: [0.110, 0.165, 0.322], cellB: [0.020, 0.039, 0.110] },
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

// dark film base + two sprocket-hole rows
const frameFrag = /* glsl */ `
varying vec2 vUv;
void main() {
  vec3 base = vec3(0.031, 0.035, 0.043);
  float band = step(0.90, vUv.y) + step(vUv.y, 0.10);
  float holes = step(0.5, fract(vUv.x * 21.0));
  vec3 col = mix(base, vec3(0.11, 0.11, 0.13), band * holes);
  gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0);
}
`

// per-chapter cell gradient
const cellFrag = /* glsl */ `
varying vec2 vUv;
uniform vec3 uA;
uniform vec3 uB;
uniform float uDim;
void main() {
  vec3 col = mix(uB, uA, vUv.y);
  float r = 1.0 - length(vUv - vec2(0.35, 0.65));
  col += vec3(0.05) * smoothstep(0.45, 1.0, r);
  col *= uDim;
  gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0);
}
`

export default function FilmFrame({ frame, idle }) {
  const { i, roman, tag, meta, title, em, center, cellA, cellB } = frame
  const ro = 12 + (2 - Math.abs(i)) * 0.4

  const cellUniforms = useMemo(
    () => ({
      uA: { value: new THREE.Vector3(...cellA) },
      uB: { value: new THREE.Vector3(...cellB) },
      uDim: { value: center ? 1.0 : 0.72 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const caption = useTypewriter('I. THE ORIGIN — FIRST LIGHT', {
    speed: 40,
    start: !!(center && idle),
  })

  const tagColor = center ? '#ffffff' : '#dcd9c8'
  const titleColor = center ? '#faedd2' : '#cfc6b3'
  const emColor = center ? '#c8a157' : '#9a9486'

  return (
    <group>
      <mesh renderOrder={ro}>
        <planeGeometry args={[FW, FH]} />
        <shaderMaterial
          vertexShader={baseVert}
          fragmentShader={frameFrag}
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
        fontSize={9}
        color={tagColor}
        anchorX="left"
        anchorY="top"
        letterSpacing={0.2}
        position={[-116, 88, 2]}
        renderOrder={ro + 0.2}
      >
        {`${roman}  ${tag}`}
      </Text>

      <Text
        font={FONTS.dmMono400}
        fontSize={9}
        color="#9b9789"
        anchorX="right"
        anchorY="top"
        letterSpacing={0.16}
        position={[116, 88, 2]}
        renderOrder={ro + 0.2}
      >
        {meta}
      </Text>

      <Text
        font={FONTS.anton}
        fontSize={28}
        color={titleColor}
        anchorX="left"
        anchorY="bottom"
        lineHeight={0.92}
        position={[-112, -30, 2]}
        renderOrder={ro + 0.2}
      >
        {title.toUpperCase()}
      </Text>

      <Text
        font={FONTS.cormorantItalic}
        fontSize={13}
        color={emColor}
        anchorX="left"
        anchorY="bottom"
        position={[-112, -50, 2]}
        renderOrder={ro + 0.2}
      >
        {em}
      </Text>

      {center && (
        <>
          <Text
            font={FONTS.dmMono400}
            fontSize={9}
            color="#dcd9c8"
            anchorX="left"
            anchorY="bottom"
            letterSpacing={0.14}
            position={[-112, -70, 2]}
            renderOrder={ro + 0.2}
          >
            {idle ? caption : 'PRESS PLAY'}
          </Text>
          <mesh position={[92, -84, 2]} renderOrder={ro + 0.2}>
            <circleGeometry args={[2.6, 16]} />
            <meshBasicMaterial
              color="#c8a157"
              transparent
              depthTest={false}
              toneMapped={false}
            />
          </mesh>
          <Text
            font={FONTS.dmMono400}
            fontSize={8}
            color="#c8a157"
            anchorX="left"
            anchorY="middle"
            letterSpacing={0.25}
            position={[100, -84, 2]}
            renderOrder={ro + 0.2}
          >
            FOCAL
          </Text>
        </>
      )}
    </group>
  )
}
