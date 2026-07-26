import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import gsap from 'gsap'
import { useLayout } from '../breakpoint.js'
import FilmFrame, { FRAMES } from './FilmFrame.jsx'
import { SPREAD, DEPTH, TILT, MARGIN, wrap } from './reelGeometry.js'

export default function FilmRoll({ on, idle, frameMarker, focus, carouselOffset = 0, onEnter, smoothed, onSettled }) {
  const { filmRoll } = useLayout()
  const { y: rollY, scale, rise } = filmRoll

  const roll = useRef()
  const idleOn = useRef(false)
  const baseRotY = useRef(0)
  const animating = useRef(false) // reel is mid-rotation — suppress idle sway
  // Which chapter currently sits at centre (slot 0). Snap-back carousel: GSAP
  // rotates the roll one step to reveal the neighbour, then `committed` catches
  // up and the rotation resets to 0 — infinite spin with no accumulating angle.
  const [committed, setCommitted] = useState(0)

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

  // carousel: rotate toward the requested offset, then commit + reset.
  useEffect(() => {
    const delta = carouselOffset - committed
    // Nothing to do only if we're also already settled. If a rotation is still
    // in flight (e.g. you scrolled mid-click and retuned to 0), fall through so
    // the new gsap tween overwrites the stale one and lands on the right frame.
    if (delta === 0 && !animating.current) return
    animating.current = true
    gsap.to(baseRotY, {
      current: delta * SPREAD,
      duration: 0.7,
      ease: 'power2.inOut',
      overwrite: true,
      onComplete: () => {
        baseRotY.current = 0
        setCommitted(carouselOffset)
        animating.current = false
        if (onSettled) onSettled()
      },
    })
  }, [carouselOffset, committed, onSettled])

  // roll rotation = carousel base + a slow idle drift sway (browse only; not
  // while a rotation/retune is in flight, so the spin stays clean).
  useFrame((state) => {
    if (!roll.current) return
    const t = state.clock.elapsedTime
    const drift = idleOn.current && !focus && !animating.current
    const sway = drift ? Math.sin(t * 0.45) * 0.024 : 0
    roll.current.rotation.y = baseRotY.current + sway
    roll.current.position.x = drift ? Math.sin(t * 0.45) * -6 : 0
  })

  return (
    <group position={[0, rollY, 0]} scale={scale}>
      <group ref={roll} position={[0, -rise, 0]} rotation={[TILT, 0, 0]}>
        {Array.from({ length: MARGIN * 2 + 1 }, (_, k) => {
          const s = k - MARGIN // slot: -MARGIN .. +MARGIN
          const frame = FRAMES[wrap(s + committed, FRAMES.length)]
          const isCenter = s === 0
          // Every slot is mounted; FilmFrame fades + culls itself each frame by
          // its LIVE rotated distance (baseRotY), so a frame swinging toward the
          // edge during a paginate fades as it goes instead of glowing there.
          return (
            <group
              key={s}
              rotation={[0, -s * SPREAD, 0]}
              visible={isCenter || !focus}
            >
              <group
                position={[0, 0, DEPTH]}
                ref={isCenter ? frameMarker : undefined}
              >
                <FilmFrame
                  frame={frame}
                  idle={idle}
                  focus={focus}
                  center={isCenter}
                  slot={s}
                  baseRotY={baseRotY}
                  onEnter={isCenter ? onEnter : undefined}
                  smoothed={isCenter ? smoothed : undefined}
                />
              </group>
            </group>
          )
        })}
      </group>
    </group>
  )
}
