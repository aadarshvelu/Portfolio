import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import gsap from 'gsap'
import { useLayout } from '../breakpoint.js'
import FilmFrame, { FRAMES } from './FilmFrame.jsx'

const DEG = Math.PI / 180
const SPREAD = 16 * DEG // per-frame fan angle
const DEPTH = 920 // cylinder radius
const TILT = -7 * DEG // roll tilt

export default function FilmRoll({ on, idle, frameMarker }) {
  const { filmRoll } = useLayout()
  const { y: rollY, scale, rise } = filmRoll

  const roll = useRef()
  const idleOn = useRef(false)

  useEffect(() => {
    idleOn.current = idle
  }, [idle])

  // boot: rise the roll up into place from below
  useEffect(() => {
    if (on && roll.current) {
      gsap.fromTo(
        roll.current.position,
        { y: -rise },
        { y: 0, duration: 1.2, ease: 'power3.out', overwrite: true },
      )
    }
  }, [on, rise])

  // idle: slow drift sway
  useFrame((state) => {
    if (!roll.current || !idleOn.current) return
    const t = state.clock.elapsedTime
    roll.current.rotation.y = Math.sin(t * 0.45) * 0.024
    roll.current.position.x = Math.sin(t * 0.45) * -6
  })

  return (
    <group position={[0, rollY, 0]} scale={scale}>
      <group ref={roll} position={[0, -rise, 0]} rotation={[TILT, 0, 0]}>
        {FRAMES.map((f) => (
          <group key={f.i} rotation={[0, -f.i * SPREAD, 0]}>
            <group
              position={[0, 0, DEPTH]}
              ref={f.i === 0 ? frameMarker : undefined}
            >
              <FilmFrame frame={f} idle={idle} />
            </group>
          </group>
        ))}
      </group>
    </group>
  )
}
