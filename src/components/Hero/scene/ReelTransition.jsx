import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { CELEB_START, TRANSITION_END } from '../config.js'
import { useLayout } from '../breakpoint.js'
import { FONTS } from '../../../fonts.js'

// Confetti → new screen. One celluloid frame bursts out of the cone with the
// rest of the confetti — same tumble — but its trajectory is aimed straight
// at the camera. It flies at you, growing the whole way, squares up as it
// nears, and locks when it fills the viewport. That frame carries the next
// page ("THE UPGRADE") and becomes the new screen. Fully scroll-driven.
const CARRIER_W = 130
const CARRIER_H = 85
const SMALL_SCALE = 0.07 // confetti-piece size as it leaves the cone
const LOCK_DIST = 250 // camera→frame distance when locked (fills the viewport)
const NIGHT = '#0a1126' // 1–2 AM deep-night cell colour
const DEG = Math.PI / 180
const TWO_PI = Math.PI * 2

const clamp01 = (x) => Math.min(1, Math.max(0, x))
const smoothstep = (x) => {
  x = clamp01(x)
  return x * x * (3 - 2 * x)
}
const lerp = THREE.MathUtils.lerp

export default function ReelTransition({ smoothed, coneAnchor }) {
  const { reel } = useLayout()
  const group = useRef()
  const plate = useRef()
  const slate = useRef([])

  // carrier card layout — corners on desktop; a centred stack in portrait so
  // the tag/meta never fall off the side of the locked frame.
  // order: [tag, meta, title, em]
  const card = useMemo(() => {
    if (reel.mode === 'stack') {
      return [
        { size: reel.labelSize, ax: 'center', ay: 'middle', pos: [0, 18, 1] },
        { size: reel.labelSize, ax: 'center', ay: 'middle', pos: [0, -19, 1] },
        { size: reel.titleSize, ax: 'center', ay: 'middle', pos: [0, 4, 1] },
        { size: reel.emSize, ax: 'center', ay: 'middle', pos: [0, -8, 1] },
      ]
    }
    return [
      { size: reel.labelSize, ax: 'left', ay: 'top', pos: [-56, 33, 1] },
      { size: reel.labelSize, ax: 'right', ay: 'top', pos: [56, 33, 1] },
      { size: reel.titleSize, ax: 'center', ay: 'middle', pos: [0, 4, 1] },
      { size: reel.emSize, ax: 'center', ay: 'middle', pos: [0, -17, 1] },
    ]
  }, [reel])

  // celluloid frame texture — 1–2 AM cell framed by sprocket bands
  const tex = useMemo(() => {
    const cv = document.createElement('canvas')
    cv.width = 160
    cv.height = 104
    const x = cv.getContext('2d')
    x.fillStyle = NIGHT
    x.fillRect(0, 0, 160, 104)
    x.fillStyle = '#05060d'
    x.fillRect(0, 0, 160, 13)
    x.fillRect(0, 91, 160, 13)
    x.fillStyle = '#c8a157'
    for (let i = 8; i < 160; i += 18) {
      x.fillRect(i, 4, 8, 5)
      x.fillRect(i, 95, 8, 5)
    }
    return new THREE.CanvasTexture(cv)
  }, [])

  useFrame((state) => {
    const sm = smoothed.current ?? 0
    // one progress: bursts from the cone, flies camera-ward, locks
    const cP = clamp01((sm - CELEB_START) / (TRANSITION_END - CELEB_START))
    const grp = group.current
    if (!grp) return
    if (cP <= 0) {
      grp.visible = false
      return
    }
    grp.visible = true

    const vis = smoothstep(cP / 0.04) // quick fade-in among the burst
    const ease = smoothstep(cP)

    const cam = state.camera
    const tanH = Math.tan((cam.fov * DEG) / 2)
    const aspect = state.size.width / state.size.height

    // start point — the cone mouth, where the confetti bursts from
    const mx = coneAnchor.x + 13.5
    const my = coneAnchor.y + 9
    const mz = coneAnchor.z

    // lock — flush to the camera, centred, filling the viewport
    const lockZ = cam.position.z - LOCK_DIST
    const visH = 2 * LOCK_DIST * tanH
    const visW = visH * aspect
    const lockScale = Math.max(visW / CARRIER_W, visH / CARRIER_H) * 1.06

    grp.position.set(
      lerp(mx, cam.position.x, ease),
      lerp(my, cam.position.y, ease),
      lerp(mz, lockZ, ease),
    )
    grp.scale.setScalar(lerp(SMALL_SCALE, lockScale, ease) * vis)

    // burst tumble — a fast decelerating spin: one turn on x/z, two on y,
    // each landing exactly square (a whole multiple of 2π) as it locks
    const spin = 1 - (1 - cP) ** 3
    grp.rotation.set(TWO_PI * spin, -2 * TWO_PI * spin, TWO_PI * spin)

    if (plate.current) plate.current.material.opacity = vis
    for (const t of slate.current) if (t) t.fillOpacity = vis
  })

  return (
    <group ref={group} visible={false}>
      <mesh ref={plate} renderOrder={40}>
        <planeGeometry args={[CARRIER_W, CARRIER_H]} />
        <meshBasicMaterial
          map={tex}
          transparent
          side={THREE.DoubleSide}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* the next page — "THE UPGRADE" chapter card, like a hero reel frame */}
      <Text
        ref={(el) => (slate.current[0] = el)}
        font={FONTS.dmMono400}
        fontSize={card[0].size}
        color="#dcd9c8"
        anchorX={card[0].ax}
        anchorY={card[0].ay}
        letterSpacing={0.2}
        position={card[0].pos}
        renderOrder={41}
        fillOpacity={0}
      >
        THE ORIGIN — CONT'D
      </Text>
      <Text
        ref={(el) => (slate.current[1] = el)}
        font={FONTS.dmMono400}
        fontSize={card[1].size}
        color="#9b9789"
        anchorX={card[1].ax}
        anchorY={card[1].ay}
        letterSpacing={0.16}
        position={card[1].pos}
        renderOrder={41}
        fillOpacity={0}
      >
        2022 — 2024
      </Text>
      <Text
        ref={(el) => (slate.current[2] = el)}
        font={FONTS.anton}
        fontSize={card[2].size}
        color="#f2e8d8"
        anchorX={card[2].ax}
        anchorY={card[2].ay}
        position={card[2].pos}
        renderOrder={41}
        fillOpacity={0}
      >
        THE UPGRADE
      </Text>
      <Text
        ref={(el) => (slate.current[3] = el)}
        font={FONTS.cormorantItalic}
        fontSize={card[3].size}
        color="#c8a157"
        anchorX={card[3].ax}
        anchorY={card[3].ay}
        position={card[3].pos}
        renderOrder={41}
        fillOpacity={0}
      >
        after the first light
      </Text>
    </group>
  )
}
