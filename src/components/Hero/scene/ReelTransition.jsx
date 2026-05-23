import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CELEB_START, TRANSITION_END } from '../config.js'
import { useLayout } from '../breakpoint.js'

// Carrier reel — bursts from the confetti cone, tumbles toward the camera,
// scales to fill the viewport. Children (the Upgrade scene) ride inside, so
// when the reel fills the screen the viewer is already looking at the next
// page. No dissolve, no intermediate screen.
const SMALL_SCALE = 0.005
const LOCK_DIST = 250
const STRIP_H = 12   // height of each sprocket strip in design units
const DEG = Math.PI / 180
const TWO_PI = Math.PI * 2

const clamp01 = (x) => Math.min(1, Math.max(0, x))
const smoothstep = (x) => {
  x = clamp01(x)
  return x * x * (3 - 2 * x)
}
const lerp = THREE.MathUtils.lerp
const wrapAngle = (a) => a - TWO_PI * Math.round(a / TWO_PI)

// Canvas texture matching confetti filmTexture — dark strip with gold
// rectangular holes, one tile that repeats horizontally
function makeStripTile() {
  const cv = document.createElement('canvas')
  cv.width = 16
  cv.height = 16
  const ctx = cv.getContext('2d')
  ctx.fillStyle = '#07090f'
  ctx.fillRect(0, 0, 16, 16)
  ctx.fillStyle = '#c8a157'
  ctx.fillRect(3, 3, 10, 10)
  const tex = new THREE.CanvasTexture(cv)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  return tex
}

const ReelTransition = forwardRef(function ReelTransition(
  { smoothed, coneAnchor, children },
  ref,
) {
  const { upgrade } = useLayout()
  const CW = upgrade.design.w
  const CH = upgrade.design.h

  const group = useRef()
  const childrenGroup = useRef()
  const locked = useRef(false)
  const lockedAt = useRef(null)
  const topMatRef = useRef()
  const botMatRef = useRef()

  const stripTex = useMemo(() => {
    const tex = makeStripTile()
    tex.repeat.set(Math.round(CW / STRIP_H), 1)
    return tex
  }, [CW])

  useImperativeHandle(ref, () => ({
    get isLocked() { return locked.current },
    lockDist: LOCK_DIST,
  }))

  useFrame((state) => {
    const sm = smoothed.current ?? 0
    const tumbleSpan = TRANSITION_END - CELEB_START
    const cP = clamp01((sm - CELEB_START) / tumbleSpan)

    const grp = group.current
    if (!grp) return

    if (cP <= 0) {
      grp.visible = false
      locked.current = false
      lockedAt.current = null
      return
    }
    grp.visible = true

    const cam = state.camera
    const tanH = Math.tan((cam.fov * DEG) / 2)
    const aspect = state.size.width / state.size.height

    const visH = 2 * LOCK_DIST * tanH
    const visW = visH * aspect
    const lockScale = Math.max(visW / CW, visH / CH) * 1.06

    // Always compute tumble values so both branches stay continuous
    const vis = smoothstep(cP / 0.04)
    const ease = smoothstep(cP)

    const mx = coneAnchor.x + 13.5
    const my = coneAnchor.y + 9
    const mz = coneAnchor.z
    const lockZ = cam.position.z - LOCK_DIST

    const tumbleX = lerp(mx, cam.position.x, ease)
    const tumbleY = lerp(my, cam.position.y, ease)
    const tumbleZ = lerp(mz, lockZ, ease)
    const tumbleScale = lerp(SMALL_SCALE, lockScale, ease) * vis

    const spin = 1 - (1 - cP) ** 3

    // Capture lock pose when carrier fills viewport — use tumble values
    // at cP=1 so the frozen pose is mathematically identical to the last
    // tumble frame (smoothstep(1)=1 → tumble converges to cam position).
    if (cP >= 1 && !lockedAt.current) {
      lockedAt.current = {
        x: tumbleX,
        y: tumbleY,
        z: tumbleZ,
        scale: lockScale,
      }
    }

    // Release lock pose well into tumble territory
    if (cP < 0.90) {
      lockedAt.current = null
    }

    const stripOp = cP >= 0.85 ? 1 - smoothstep((cP - 0.85) / 0.15) : 1

    // Wrap rotation to [-π,π] so the blend takes the shortest path
    // (without this, blending 2π→0 goes through π — a visible full spin)
    const rx = wrapAngle(TWO_PI * spin)
    const ry = wrapAngle(-TWO_PI * spin)
    const rz = wrapAngle(TWO_PI * spin)

    if (lockedAt.current) {
      const blend = smoothstep(clamp01((cP - 0.92) / 0.08))
      const L = lockedAt.current

      grp.position.set(
        lerp(tumbleX, L.x, blend),
        lerp(tumbleY, L.y, blend),
        lerp(tumbleZ, L.z, blend),
      )
      grp.scale.setScalar(lerp(tumbleScale, L.scale, blend))
      grp.rotation.set(
        lerp(rx, 0, blend),
        lerp(ry, 0, blend),
        lerp(rz, 0, blend),
      )
      if (topMatRef.current) topMatRef.current.opacity = stripOp * (1 - blend)
      if (botMatRef.current) botMatRef.current.opacity = stripOp * (1 - blend)

      locked.current = blend > 0.95
    } else {
      grp.position.set(tumbleX, tumbleY, tumbleZ)
      grp.scale.setScalar(tumbleScale)
      grp.rotation.set(rx, ry, rz)
      if (topMatRef.current) topMatRef.current.opacity = stripOp
      if (botMatRef.current) botMatRef.current.opacity = stripOp

      locked.current = false
    }
  })

  return (
    <group ref={group} visible={false}>
      {children}
    </group>
  )
})

export default ReelTransition
