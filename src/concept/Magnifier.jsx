import { forwardRef, useCallback, useEffect, useState } from 'react'

/*
 * Magnifier — a brass-and-glass magnifier widget that lets the user peek at
 * the Hero through the Room's burn mask. Always present on desktop, always
 * showing a sneak peak at its home corner.
 *
 * Visual model (matches the reference image):
 *   - Brass ring (the lens frame) with a wood handle going to the corner
 *   - The center is glass — the Hero shows through the room's burn mask
 *   - The inner edge of the brass ring has a burning/molten overlay (the
 *     "burning around the magnifier lens border")
 *   - During drag, ~16 flame particles rise off the lens border (the "bit
 *     of flame to feel like burn")
 *
 * Interaction:
 *   - At rest: lens parked at the bottom-right home position, full handle
 *     visible, subtle burning border, no flame particles
 *   - On mousedown over lens or handle: lens jumps to cursor, handle hides,
 *     flame particles engage, border burns hotter
 *   - On mousemove (window-level while dragging): lens follows cursor
 *   - On mouseup: lens springs back to the home position, handle re-anchors
 *
 * The lens is the burn hole: it always reports its center to the parent
 * (ConceptIntro), which positions the burn mask there. So the magnifier
 * "magnifies" exactly what's behind the room at its current position.
 *
 * LENS_R MUST match BurnReveal's RADIUS — the mask circle and the visual
 * lens circle are concentric; any mismatch and the brass frame doesn't
 * contain the burn hole.
 */

// MUST match RADIUS in BurnReveal.jsx
export const LENS_R = 130

// Where the lens sits when not being dragged. Inset from the corner by
// enough to give the handle room to anchor + a comfortable breathing gap.
function getHome() {
  if (typeof window === 'undefined') return { x: 0, y: 0 }
  return {
    x: Math.max(LENS_R + 110, window.innerWidth - LENS_R - 60),
    y: Math.max(LENS_R + 110, window.innerHeight - LENS_R - 60),
  }
}

const Magnifier = forwardRef(function Magnifier({ onPositionChange }, ref) {
  const [dragging, setDragging] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [pos, setPos] = useState(getHome)

  const handleDown = useCallback(
    (e) => {
      if (e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      setDragging(true)
      const p = { x: e.clientX, y: e.clientY }
      setPos(p)
      onPositionChange?.(p)
    },
    [onPositionChange],
  )

  // While dragging: every cursor move updates the burn position; mouseup
  // releases and springs back to the home anchor. Listening on window (not
  // the SVG group) so a fast drag that escapes the lens bounding box still
  // tracks — and so the lens can stay a pure-visual sibling with no
  // pointer-event fight against the room canvas beneath it.
  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      const p = { x: e.clientX, y: e.clientY }
      setPos(p)
      onPositionChange?.(p)
    }
    const onUp = () => {
      setDragging(false)
      const home = getHome()
      setPos(home)
      onPositionChange?.(home)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging, onPositionChange])

  const lensX = pos.x
  const lensY = pos.y
  const home = getHome()

  // Handle attaches to the lens at 45° down-right (matches the reference)
  // and extends toward the home anchor's outer corner. Hidden during the
  // drag — it would otherwise have to either stretch absurdly or stay
  // anchored and "trail" the moving lens; both look worse than just the
  // floating lens alone.
  const a = Math.PI / 4
  const handleStartX = lensX + Math.cos(a) * (LENS_R * 0.88)
  const handleStartY = lensY + Math.sin(a) * (LENS_R * 0.88)
  const handleEndX = home.x + LENS_R + 38
  const handleEndY = home.y + LENS_R + 38

  // Border opacity ramps up while engaged (hover) and full-bore during drag.
  const borderOpacity = dragging ? 1 : hovered ? 0.8 : 0.55

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none', // default — only the explicit <g> children below
                              // opt back in to pointer events via auto
        zIndex: 10000,
        cursor: dragging ? 'grabbing' : 'grab',
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
      >
        <defs>
          {/* Walnut handle gradient — dark with a subtle vertical sheen */}
          <linearGradient id="mag-wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5a2e10" />
            <stop offset="0.3" stopColor="#8b4513" />
            <stop offset="0.7" stopColor="#6b3410" />
            <stop offset="1" stopColor="#3a1a05" />
          </linearGradient>

          {/* Polished brass — light at the top-left, dark at the bottom-right */}
          <linearGradient id="mag-brass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f7e2a3" />
            <stop offset="0.4" stopColor="#c89a4f" />
            <stop offset="0.7" stopColor="#8b6a32" />
            <stop offset="1" stopColor="#5a4220" />
          </linearGradient>

          {/* Glass tint — a subtle off-axis white sheen, like a real lens */}
          <radialGradient id="mag-glass" cx="35%" cy="30%" r="65%">
            <stop offset="0" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="0.5" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="1" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          {/* Burning border — the molten ring sitting on the inner edge of
              the brass frame. Bright yellow at the inner rim, fading to red
              and dark at the outer rim. Filtered through turbulence so it
              "boils" with the same family of motion as the burn mask. */}
          <radialGradient id="mag-flame" cx="50%" cy="50%" r="50%">
            <stop offset="0.85" stopColor="#000" stopOpacity="0" />
            <stop offset="0.91" stopColor="#ffe28a" stopOpacity="0.95" />
            <stop offset="0.95" stopColor="#ff9a3c" stopOpacity="0.9" />
            <stop offset="0.99" stopColor="#c2410c" stopOpacity="0.7" />
            <stop offset="1" stopColor="#7a1a04" stopOpacity="0.4" />
          </radialGradient>

          {/* Single flame particle — bright core fading to transparent red.
              cy=80% puts the bright "base" at the bottom (lens edge) and
              the transparent tip at the top (where it dissipates). */}
          <radialGradient id="mag-flame-particle" cx="50%" cy="80%" r="60%">
            <stop offset="0" stopColor="#fff3c4" stopOpacity="1" />
            <stop offset="0.4" stopColor="#ff9a3c" stopOpacity="0.95" />
            <stop offset="1" stopColor="#c2410c" stopOpacity="0" />
          </radialGradient>

          {/* Flame filter — fractal noise displaced through displacement
              filter for an organic "boiling" edge. Independent from the
              burn-mask filter so the two can animate at different rates. */}
          <filter
            id="mag-flame-filter"
            x="-15%"
            y="-15%"
            width="130%"
            height="130%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.05 0.08"
              numOctaves="3"
              seed="7"
            >
              <animate
                attributeName="baseFrequency"
                dur="2.4s"
                values="0.05 0.08;0.09 0.05;0.05 0.08"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale="14" />
          </filter>
        </defs>

        {/* Handle (only when not dragging) */}
        {!dragging && (
          <g
            onMouseDown={handleDown}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{ pointerEvents: 'auto', cursor: 'grab' }}
          >
            {/* Walnut handle */}
            <line
              x1={handleStartX}
              y1={handleStartY}
              x2={handleEndX}
              y2={handleEndY}
              stroke="url(#mag-wood)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Wood grain highlight (thin lighter line above the handle) */}
            <line
              x1={handleStartX + 2}
              y1={handleStartY - 4}
              x2={handleEndX + 2}
              y2={handleEndY - 4}
              stroke="rgba(255,255,255,0.10)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Brass collar where the handle meets the lens */}
            <circle
              cx={handleStartX}
              cy={handleStartY}
              r="14"
              fill="url(#mag-brass)"
              stroke="#3a2810"
              strokeWidth="1"
            />
            {/* Anchor cap at the far end (the rounded knob in the reference) */}
            <circle
              cx={handleEndX}
              cy={handleEndY}
              r="9"
              fill="url(#mag-wood)"
              stroke="rgba(0,0,0,0.05)"
              strokeWidth="1"
            />
          </g>
        )}

        {/* Lens visual + hit area */}
        <g
          onMouseDown={handleDown}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{ pointerEvents: 'auto', cursor: dragging ? 'grabbing' : 'grab' }}
        >
          {/* Drop shadow under the lens (gives it weight on the desk) */}
          <circle
            cx={lensX + 3}
            cy={lensY + 5}
            r={LENS_R}
            fill="rgba(0,0,0,0.4)"
          />

          {/* Glass + brass frame */}
          <circle
            cx={lensX}
            cy={lensY}
            r={LENS_R}
            fill="url(#mag-glass)"
            stroke="url(#mag-brass)"
            strokeWidth="10"
          />

          {/* Inner shadow ring — gives the lens a recessed "depth" feel */}
          <circle
            cx={lensX}
            cy={lensY}
            r={LENS_R - 8}
            fill="none"
            stroke="rgba(0,0,0,0.35)"
            strokeWidth="3"
          />

          {/* Burning/molten border overlay. Painted on the inner edge with
              screen blend so it brightens whatever's beneath (the Hero
              showing through the burn hole). Filtered through the flame
              turbulence for organic drips/flares. */}
          <circle
            cx={lensX}
            cy={lensY}
            r={LENS_R - 4}
            fill="none"
            stroke="url(#mag-flame)"
            strokeWidth="10"
            filter="url(#mag-flame-filter)"
            opacity={borderOpacity}
            style={{ mixBlendMode: 'screen' }}
          />
        </g>

        {/* Flame particles rising off the lens border — only during drag */}
        {dragging && <FlameParticles cx={lensX} cy={lensY} r={LENS_R} />}
      </svg>
    </div>
  )
})

/**
 * FlameParticles — ~16 little flames positioned around the lens border,
 * each rising outward from the lens and fading. Staggered delays so they
 * don't all flare at the same instant. Pure SVG + SMIL — no JS per-frame.
 */
function FlameParticles({ cx, cy, r }) {
  const N = 16
  const flames = []
  for (let i = 0; i < N; i++) {
    const angle = (i / N) * Math.PI * 2
    // Pseudo-random per-flame size jitter (deterministic so React doesn't
    // reshuffle them on re-render and reset the SMIL animation).
    const sizeJitter = 0.8 + (((i * 7919) % 100) / 333) // ~0.8 - 1.1
    flames.push({
      id: i,
      angle,
      delay: ((i / N) * 1.4).toFixed(2),
      sizeJitter,
    })
  }

  return (
    <g style={{ pointerEvents: 'none' }}>
      {flames.map((f) => {
        const x = cx + Math.cos(f.angle) * r
        const y = cy + Math.sin(f.angle) * r
        // Rotate so the flame's "up" points outward from the lens center.
        const rotation = (f.angle * 180) / Math.PI - 90
        return (
          <g key={f.id} transform={`translate(${x} ${y}) rotate(${rotation})`}>
            <ellipse
              cx="0"
              cy="0"
              rx={2.5 * f.sizeJitter}
              ry={6 * f.sizeJitter}
              fill="url(#mag-flame-particle)"
              opacity="0"
            >
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.15;0.65;1"
                dur="1.4s"
                begin={`${f.delay}s`}
                repeatCount="indefinite"
              />
              {/* Translate inside the rotated frame: y goes from +4 (just
                  inside the border) to -22 (well outside), so each flame
                  rises outward and dissipates. */}
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 4;0 -22"
                dur="1.4s"
                begin={`${f.delay}s`}
                repeatCount="indefinite"
              />
            </ellipse>
          </g>
        )
      })}
    </g>
  )
}

export default Magnifier