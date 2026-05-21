import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import { ORDER } from '../config.js'
import { useLayout } from '../breakpoint.js'
import { useFade } from '../../../hooks/useFade.js'

// crescent moon — anchored top-right. image ratio 962:614
const glowVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
const glowFrag = /* glsl */ `
varying vec2 vUv;
uniform float uOpacity;
void main() {
  float d = clamp(length(vUv - 0.5) * 2.0, 0.0, 1.0);
  float a = pow(1.0 - d, 2.6);
  gl_FragColor = vec4(pow(vec3(1.0, 0.93, 0.80), vec3(2.2)), a * uOpacity);
}
`

export default function Moon({ on }) {
  const { moon } = useLayout()
  const W = moon.w
  const H = (W * 614) / 962

  const tex = useTexture('/assets/moon-crescent.png')
  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace
  }, [tex])

  const moonMat = useRef()
  const glowUniforms = useMemo(() => ({ uOpacity: { value: 0 } }), [])

  useFade(moonMat, on, { duration: 1.8 })
  useFade(glowUniforms.uOpacity, on, { prop: 'value', duration: 1.8, to: 0.55 })

  return (
    <group position={[moon.x, moon.y, 0]}>
      <mesh renderOrder={ORDER.moon}>
        <planeGeometry args={[W * 1.7, H * 1.7]} />
        <shaderMaterial
          vertexShader={glowVert}
          fragmentShader={glowFrag}
          uniforms={glowUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      <mesh renderOrder={ORDER.moon}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial
          ref={moonMat}
          map={tex}
          transparent
          opacity={0}
          toneMapped={false}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
