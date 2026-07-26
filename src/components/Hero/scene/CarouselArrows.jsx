import { useMemo, useState } from 'react'
import { Line } from '@react-three/drei'
import { useLayout } from '../breakpoint.js'

/**
 * CarouselArrows — in-scene (R3F) prev/next controls flanking the reel.
 *
 * Real 3D meshes with onClick, NOT DOM buttons — clicks are handled by the Hero
 * canvas's own raycaster, so there's no stacking / pointer-events fight with the
 * concept-room overlay above (that overlay is pointer-events:none, so events
 * fall through to this canvas). Shown only in browse mode (idle && !focus).
 *
 * Look: a thin gold-cream ring with a chevron stroke inside (‹ ›) — no boxes.
 * Positions are in design space (world units = design px, origin centre, +y up).
 */
export default function CarouselArrows({ show, onPrev, onNext }) {
  const { arrows } = useLayout()
  const x = arrows.x // per-breakpoint horizontal position (world units from centre)
  const y = arrows.y // per-breakpoint vertical level, near the reel

  return (
    <group visible={show}>
      <Arrow position={[-x, y, 0]} dir={-1} onClick={onPrev} />
      <Arrow position={[x, y, 0]} dir={1} onClick={onNext} />
    </group>
  )
}

const R = 30 // ring radius (design px)
const AX = 9 // chevron half-width
const AY = 14 // chevron half-height

// circle outline points for the ring
const RING_PTS = Array.from({ length: 65 }, (_, i) => {
  const a = (i / 64) * Math.PI * 2
  return [Math.cos(a) * R, Math.sin(a) * R, 0]
})

function Arrow({ position, dir, onClick }) {
  const [hover, setHover] = useState(false)
  const tint = hover ? '#e9c877' : '#e7ddc9'
  const s = hover ? 1.12 : 1

  // chevron: ">" points right (dir 1), "<" points left (dir -1)
  const chevron = useMemo(
    () => [
      [-AX * dir, AY, 0],
      [AX * dir, 0, 0],
      [-AX * dir, -AY, 0],
    ],
    [dir],
  )

  return (
    <group position={position} scale={s}>
      {/* faint dark disc so the control reads against the busy reel */}
      <mesh position={[0, 0, -0.4]} renderOrder={58}>
        <circleGeometry args={[R + 2, 48]} />
        <meshBasicMaterial
          color="#080b14"
          transparent
          opacity={hover ? 0.5 : 0.32}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* thin ring */}
      <Line
        points={RING_PTS}
        color={tint}
        lineWidth={hover ? 2 : 1.4}
        transparent
        opacity={hover ? 1 : 0.72}
        depthTest={false}
        renderOrder={59}
      />

      {/* chevron glyph */}
      <Line
        points={chevron}
        color={tint}
        lineWidth={hover ? 3.4 : 2.6}
        transparent
        opacity={hover ? 1 : 0.9}
        depthTest={false}
        renderOrder={60}
      />

      {/* Invisible hit target IN FRONT — a MESH is a reliable raycast target;
          a bare group / Line is not. Carries the pointer handlers. */}
      <mesh
        position={[0, 0, 2]}
        onClick={(e) => {
          e.stopPropagation()
          if (onClick) onClick()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <circleGeometry args={[R + 6, 32]} />
        <meshBasicMaterial transparent opacity={0} depthTest={false} depthWrite={false} />
      </mesh>
    </group>
  )
}
