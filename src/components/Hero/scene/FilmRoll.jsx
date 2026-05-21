import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import gsap from 'gsap'
import { DESIGN_H } from '../config.js'
import FilmFrame, { FRAMES } from './FilmFrame.jsx'

const DEG = Math.PI / 180
const SPREAD = 16 * DEG // per-frame fan angle
const DEPTH = 920 // cylinder radius
const TILT = -7 * DEG // roll tilt

// reel vertical centre — matches the prototype's `.film-wrap { top: 56% }`
const ROLL_Y = DESIGN_H / 2 - 0.7 * DESIGN_H

const RISE = 700 // how far below the roll starts before rising into place

export default function FilmRoll({ on, idle }) {
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
        { y: -RISE },
        { y: 0, duration: 1.2, ease: 'power3.out', overwrite: true },
      )
    }
  }, [on])

  // idle: slow drift sway
  useFrame((state) => {
    if (!roll.current || !idleOn.current) return
    const t = state.clock.elapsedTime
    roll.current.rotation.y = Math.sin(t * 0.45) * 0.024
    roll.current.position.x = Math.sin(t * 0.45) * -6
  })

  return (
    <group position={[0, ROLL_Y, 0]}>
      <group ref={roll} position={[0, -RISE, 0]} rotation={[TILT, 0, 0]}>
        {FRAMES.map((f) => (
          <group key={f.i} rotation={[0, -f.i * SPREAD, 0]}>
            <group position={[0, 0, DEPTH]}>
              <FilmFrame frame={f} idle={idle} />
            </group>
          </group>
        ))}
      </group>
    </group>
  )
}
