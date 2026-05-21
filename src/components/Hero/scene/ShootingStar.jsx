import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending } from 'three'
import { ORDER } from '../config.js'
import { useLayout } from '../breakpoint.js'

// A pool of slow, diagonal star streaks (top-left -> bottom-right). Each slot
// perpetually cycles: drift across -> demise -> wait (up to 3s) -> drift again.

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = /* glsl */ `
varying vec2 vUv;
uniform float uOpacity;
void main() {
  float along = pow(vUv.x, 3.0);
  float across = smoothstep(0.0, 1.0, 1.0 - abs(vUv.y - 0.5) * 2.0);
  float a = along * across * uOpacity;
  gl_FragColor = vec4(pow(vec3(0.97, 0.96, 0.92), vec3(2.2)), a);
}
`

const rand = (min, max) => min + Math.random() * (max - min)

function launch(slot, mesh, time, design) {
  slot.active = true
  slot.t0 = time
  slot.dur = rand(12, 22) // very slow
  slot.sx = rand(-0.635, -0.521) * design.w // starts off the left edge
  slot.sy = rand(-0.185, 0.833) * design.h // spread across the full height
  const ang = (rand(-26, -16) * Math.PI) / 180 // diagonal fall
  slot.dx = Math.cos(ang)
  slot.dy = Math.sin(ang)
  slot.dist = 1.224 * design.w // crosses fully and exits
  mesh.rotation.z = ang
}

export default function ShootingStar({ on }) {
  const { design, shootingStar } = useLayout()
  const { count, len, thick } = shootingStar
  const meshes = useRef([])

  const uniforms = useMemo(
    () => Array.from({ length: count }, () => ({ uOpacity: { value: 0 } })),
    [count],
  )
  const slots = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        active: false,
        nextAt: 0,
        t0: 0,
        dur: 1,
        sx: 0,
        sy: 0,
        dx: 1,
        dy: 0,
        dist: 0,
      })),
    [count],
  )
  const ctl = useMemo(() => ({ started: false }), [count])

  useFrame((state) => {
    const time = state.clock.elapsedTime

    if (!on) {
      uniforms.forEach((u) => (u.uOpacity.value = 0))
      return
    }

    if (!ctl.started) {
      ctl.started = true
      slots.forEach((s, i) => {
        s.nextAt = time + i * 2.4 + rand(0, 1.6)
      })
    }

    for (let i = 0; i < count; i++) {
      const s = slots[i]
      const m = meshes.current[i]
      const u = uniforms[i]
      if (!m) continue

      if (!s.active) {
        if (time >= s.nextAt) launch(s, m, time, design)
        else u.uOpacity.value = 0
        continue
      }

      const p = (time - s.t0) / s.dur
      if (p >= 1) {
        s.active = false
        s.nextAt = time + rand(0, 3)
        u.uOpacity.value = 0
        continue
      }

      m.position.set(s.sx + s.dx * s.dist * p, s.sy + s.dy * s.dist * p, 0)
      const fadeIn = Math.min(p / 0.08, 1)
      const fadeOut = 1 - Math.max(0, Math.min((p - 0.88) / 0.12, 1))
      u.uOpacity.value = fadeIn * fadeOut * 0.85
    }
  })

  return (
    <>
      {uniforms.map((u, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshes.current[i] = el
          }}
          renderOrder={ORDER.stars}
          position={[0, 0, 0]}
        >
          <planeGeometry args={[len, thick]} />
          <shaderMaterial
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={u}
            transparent
            blending={AdditiveBlending}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  )
}
