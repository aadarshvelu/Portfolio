import { useEffect, useState } from 'react'

/*
 * BurnReveal — a position-driven "liquid burn" hole punched through the Room
 * wrapper. The parent (ConceptIntro) supplies `position` and `enabled`; when
 * enabled, a frayed lava-edged aperture appears at `position`, letting the
 * Hero (Layer 1 underneath) show through.
 *
 * Earlier version of this component listened to window mousemove and drove its
 * own position — i.e. the burn followed the cursor automatically. That has
 * been replaced with a controlled API driven by <Magnifier/>: the burn only
 * appears while the user is actively dragging the magnifier, and the burn
 * position equals the magnifier position. (See commit notes for context.)
 *
 * Two halves in one component:
 *
 *   1. SVG <defs> — a <filter> that displaces SourceGraphic by animated
 *      fractal noise (the boiling edge), a <radialGradient> for the molten
 *      fringe, and a <mask> that paints the room visible everywhere except
 *      inside a noise-displaced black circle. The mask URL (BURN_MASK_URL)
 *      is applied by the parent to the room wrapper.
 *
 *   2. Glow ring — a single <circle> filled with the molten gradient and
 *      pushed through the same displacement filter. Painted with
 *      mix-blend-mode: screen and the same mask, so only the outer fringe is
 *      visible — gives the hole its lit/molten edge instead of a clean cut.
 *
 * Why this doesn't fight the existing scroll-driven dolly / CRT portal:
 *   - The room canvas already has alpha:true, so any mask on the room wrapper
 *     simply makes a hole the Hero shows through. The R3F scene, scroll→phase
 *     mapping, CameraRig, Television.jsx portal CustomBlend, and the boot
 *     splash are all untouched.
 *   - The mask coords use maskUnits/maskContentUnits = userSpaceOnUse, so
 *     the circle's cx/cy are in viewport pixels.
 *   - The parent's rAF loop drives the glow ring's opacity with the same
 *     `vis * reveal` value it already drives on the canvas/fx/hint, so the
 *     burn fades in with the room and out with the room — no extra state.
 */

const MASK_ID = 'concept-burn-mask'
const FILTER_ID = 'concept-burn-liquid'
const GLOW_GRADIENT_ID = 'concept-burn-glow'

// URL the parent applies to its masked wrapper.
export const BURN_MASK_URL = `url(#${MASK_ID})`
const FILTER_URL = `url(#${FILTER_ID})`
const GLOW_GRADIENT_URL = `url(#${GLOW_GRADIENT_ID})`

// Off-screen park position used when `enabled` is false. Far enough off any
// plausible viewport that the displaced edge can never creep into the
// maskable area.
const PARK = { x: -9999, y: -9999 }

// Base radius of the burn. Liquid edge can push ±~36px past this.
const RADIUS = 130

export default function BurnReveal({ position, glowRef }) {
  // The mask circle is placed at the supplied position; if position is null
  // (transient before the Magnifier reports its home anchor) we park the
  // circle offscreen so the room wrapper paints normally.
  const cx = position ? position.x : PARK.x
  const cy = position ? position.y : PARK.y

  // Reseed the noise occasionally so the silhouette doesn't lock to one
  // pattern across a long session — every 5s, +13 (prime-ish, walks 0..255).
  const [seed, setSeed] = useState(() => (Math.random() * 255) | 0)

  useEffect(() => {
    const id = setInterval(() => setSeed((s) => (s + 13) & 0xff), 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      {/* SVG <defs>: filter + gradient + mask. The mask is what the parent
          wrapper applies via mask-image. width/height are 100% so the mask
          has a real viewport with userSpaceOnUse coords in viewport pixels. */}
      <svg
        aria-hidden="true"
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <defs>
          {/* Displacement filter — fractalNoise animated via SMIL <animate>
              child of <feTurbulence>. scale is the pixel-range of the edge
              fray; baseFrequency controls how "chunky" the drips are. */}
          <filter id={FILTER_ID} x="-25%" y="-25%" width="150%" height="150%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.022 0.016"
              numOctaves="3"
              seed={seed}
            >
              <animate
                attributeName="baseFrequency"
                dur="7s"
                values="0.022 0.016; 0.038 0.012; 0.022 0.016"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              scale="36"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* Molten fringe gradient — transparent inside the hole, a thin
              yellow→orange→red→dark band at the edge, fading out. Painted
              with mix-blend-mode: screen so it brightens the dark room. */}
          <radialGradient id={GLOW_GRADIENT_ID} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff3c4" stopOpacity="0" />
            <stop offset="58%" stopColor="#000" stopOpacity="0" />
            <stop offset="68%" stopColor="#ffe28a" stopOpacity="0.85" />
            <stop offset="76%" stopColor="#ff7a1a" stopOpacity="0.8" />
            <stop offset="86%" stopColor="#a82b06" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>

          {/* The mask itself: white = room visible, black = hole. The circle
              is displaced by the filter for the frayed edge. */}
          <mask
            id={MASK_ID}
            maskUnits="userSpaceOnUse"
            maskContentUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="100%"
            height="100%"
          >
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <circle
              cx={cx}
              cy={cy}
              r={RADIUS}
              fill="black"
              filter={FILTER_URL}
            />
          </mask>
        </defs>
      </svg>

      {/* Glow ring overlay. Same mask + same filter → only the outer fringe
          survives. mix-blend-mode: screen brightens whatever room pixels are
          still showing behind the edge. Opacity is driven by the parent rAF
          loop (the same vis*reveal that fades the room itself) via glowRef. */}
      <div
        ref={glowRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          maskImage: BURN_MASK_URL,
          WebkitMaskImage: BURN_MASK_URL,
          mixBlendMode: 'screen',
          opacity: 0,
          // Will-change hint helps the compositor cache the masked layer
          // rather than re-rasterising the mask on every mouse move.
          willChange: 'opacity',
        }}
      >
        <svg
          width="100%"
          height="100%"
          style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
        >
          <circle
            cx={cx}
            cy={cy}
            r={RADIUS + 6}
            fill={GLOW_GRADIENT_URL}
            filter={FILTER_URL}
          />
        </svg>
      </div>
    </>
  )
}