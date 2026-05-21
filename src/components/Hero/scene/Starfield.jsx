import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DESIGN_W, DESIGN_H, ORDER } from '../config.js'
import { useFade } from '../../../hooks/useFade.js'

const COUNT = 180

const vertexShader = /* glsl */ `
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

const fragmentShader = /* glsl */ `
uniform float uOpacity;
varying float vTw;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(pow(vec3(0.957, 0.945, 0.910), vec3(2.2)), a * vTw * uOpacity);
}
`

export default function Starfield({ on }) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(COUNT * 3)
    const size = new Float32Array(COUNT)
    const phase = new Float32Array(COUNT)
    const speed = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * DESIGN_W
      pos[i * 3 + 1] = (Math.random() - 0.5) * DESIGN_H
      pos[i * 3 + 2] = 0
      const tier = Math.random()
      size[i] = tier > 0.94 ? 7 : tier > 0.78 ? 4.5 : 2.5
      phase[i] = Math.random() * Math.PI * 2
      speed[i] = 0.8 + Math.random() * 1.6
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
    g.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1))
    return g
  }, [])

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uOpacity: { value: 0 } }),
    [],
  )
  useFade(uniforms.uOpacity, on, { prop: 'value', duration: 2, to: 1 })
  useFrame((_, dt) => {
    uniforms.uTime.value += dt
  })

  return (
    <points renderOrder={ORDER.stars} geometry={geometry}>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </points>
  )
}
