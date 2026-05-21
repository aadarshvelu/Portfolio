import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useFade } from '../../../hooks/useFade.js'

// smoke.png is 377 x 329
const BASE_W = 400
const BASE_H = (BASE_W * 329) / 377

// cloud cluster centre — move this to reposition the whole cloud
const CLUSTER = { x: 390, y: 235 }

// 3 puffs with small offsets -> tightly stacked, overlapping into one dense
// cloud mass. dx/dy are offsets from CLUSTER.
const PUFFS = [
  { dx: -50, dy: 25, scale: 1.15, opacity: 0.85, drift: 0.06, amp: 12 },
  { dx: 150, dy: 50, scale: 1.8, opacity: 0.8, drift: 0.045, amp: 10 },
  // { dx: 0, dy: 45, scale: 1.0, opacity: 0.82, drift: 0.08, amp: 14 },
]

// between moon (2) and title (3) — drifts over the moon, behind the title
const RENDER_ORDER = 2.6

export default function Clouds({ on }) {
  const tex = useTexture('/assets/smoke.png')
  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace
  }, [tex])

  const fade = useMemo(() => ({ value: 0 }), [])
  useFade(fade, on, { prop: 'value', duration: 2.6, to: 1 })

  const groups = useRef([])
  const mats = useRef([])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    PUFFS.forEach((p, i) => {
      const g = groups.current[i]
      const m = mats.current[i]
      if (g) {
        g.position.x = CLUSTER.x + p.dx + Math.sin(t * p.drift + i * 1.7) * p.amp
      }
      if (m) m.opacity = fade.value * p.opacity
    })
  })

  return (
    <>
      {PUFFS.map((p, i) => (
        <group
          key={i}
          ref={(el) => {
            groups.current[i] = el
          }}
          position={[CLUSTER.x + p.dx, CLUSTER.y + p.dy, 0]}
        >
          <mesh renderOrder={RENDER_ORDER}>
            <planeGeometry args={[BASE_W * p.scale, BASE_H * p.scale]} />
            <meshBasicMaterial
              ref={(el) => {
                mats.current[i] = el
              }}
              map={tex}
              color="#d6cfc0"
              transparent
              opacity={0}
              toneMapped={false}
              depthTest={false}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </>
  )
}
