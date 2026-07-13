import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import gsap from 'gsap'
import { ORDER } from '../config.js'
import { useLayout } from '../breakpoint.js'
import { FONTS } from '../../../fonts.js'

/**
 * Title — the big broadcast title. No longer a baked "AADARSH VELU" image: it
 * tracks the FOCUSED carousel chapter (First Light / The Upgrade / The Work /
 * Roll Credits) and re-renders live as the reel is stepped.
 *
 * Ported from hero-broadcast.html's `.btitle`:
 *   - Anton, vertically stretched (scaleY 1.32)
 *   - RGB chroma-split (a red layer nudged left, a cyan layer nudged right)
 *   - a soft gold phosphor glow (troika outline blur)
 *   - a torn glitch burst every time the focused chapter CHANGES
 *
 * `on` gates browse-mode visibility (fades out on scroll-in / declutter).
 * `chapter` is the focused FRAMES entry; a change to its title fires the glitch.
 */
const PHOSPHOR = '#f6ecd2'
const GOLD = '#c8a157'
const RED = '#ff3142'
const CYAN = '#2fd2ff'
const STRETCH = 1.32 // vertical squash-stretch, matches .btitle h1

export default function Title({ on, chapter }) {
  const { title } = useLayout()
  const X = title.x
  const Y = title.y
  const size = title.w * 0.113 // headline size relative to the title runway (⅔ of prior)
  const split0 = size * 0.017 // resting chroma offset
  const text = (chapter?.title || 'First\nLight').toUpperCase()

  const group = useRef()
  const mainRef = useRef()
  const redRef = useRef()
  const cyanRef = useRef()

  const vis = useRef(0) // browse-mode visibility 0..1
  const glitch = useRef(0) // 1 → 0 burst on chapter change

  // fade in/out + rise with `on`
  useEffect(() => {
    gsap.to(vis, {
      current: on ? 1 : 0,
      duration: on ? 1.1 : 0.4,
      ease: 'power2.out',
      overwrite: true,
    })
    if (on && group.current) {
      gsap.fromTo(
        group.current.position,
        { y: Y - 34 },
        { y: Y, duration: 1.4, ease: 'power3.out', overwrite: true },
      )
    }
  }, [on, Y])

  // glitch burst whenever the focused chapter title changes
  useEffect(() => {
    gsap.fromTo(
      glitch,
      { current: 1 },
      { current: 0, duration: 0.42, ease: 'steps(5)', overwrite: true },
    )
  }, [text])

  useFrame(() => {
    const g = glitch.current
    const v = vis.current

    // horizontal jitter during the burst (steppy, decays with g)
    const jx = g > 0 ? Math.sin(g * 37.0) * size * 0.045 : 0
    if (group.current) group.current.position.x = X + jx

    // chroma spread widens during the burst
    const split = split0 + g * size * 0.05
    if (redRef.current) redRef.current.position.x = -split
    if (cyanRef.current) cyanRef.current.position.x = split

    // fill opacities: main flickers on the burst, chroma sit behind at ~half
    const flick = 1 - g * 0.5
    if (mainRef.current) {
      mainRef.current.fillOpacity = v * flick
      mainRef.current.outlineOpacity = v * 0.55 * flick
    }
    if (redRef.current) redRef.current.fillOpacity = v * 0.5
    if (cyanRef.current) cyanRef.current.fillOpacity = v * 0.5
  })

  const common = {
    font: FONTS.anton,
    fontSize: size,
    anchorX: 'center',
    anchorY: 'middle',
    textAlign: 'center',
    lineHeight: 0.82,
    letterSpacing: -0.012,
    depthOffset: -1,
    'material-depthTest': false,
    'material-depthWrite': false,
    'material-toneMapped': false,
  }

  return (
    <group ref={group} position={[X, Y, 0]} scale={[1, STRETCH, 1]}>
      {/* red chroma layer (nudged left, behind) */}
      <Text
        ref={redRef}
        {...common}
        color={RED}
        fillOpacity={0}
        position={[-split0, 0, -0.4]}
        renderOrder={ORDER.title}
      >
        {text}
      </Text>

      {/* cyan chroma layer (nudged right, behind) */}
      <Text
        ref={cyanRef}
        {...common}
        color={CYAN}
        fillOpacity={0}
        position={[split0, 0, -0.2]}
        renderOrder={ORDER.title + 0.01}
      >
        {text}
      </Text>

      {/* main phosphor fill + gold outline glow (on top) */}
      <Text
        ref={mainRef}
        {...common}
        color={PHOSPHOR}
        fillOpacity={0}
        position={[0, 0, 0]}
        renderOrder={ORDER.title + 0.02}
        outlineColor={GOLD}
        outlineWidth="3%"
        outlineBlur="18%"
        outlineOpacity={0}
      >
        {text}
      </Text>
    </group>
  )
}
