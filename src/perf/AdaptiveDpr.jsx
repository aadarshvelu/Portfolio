import { useCallback, useMemo, useRef, useState } from 'react'
import { PerformanceMonitor } from '@react-three/drei'

/**
 * AdaptiveDpr — resolution that follows MEASURED frame rate.
 *
 * The static tiers in concept/config/qualityProfiles.js guess a device's power
 * before a single frame renders (viewport width, core count, deviceMemory).
 * Those proxies are wrong in both directions: an 8-core laptop with weak
 * integrated graphics passes every check and still crawls; a 4-core phone with
 * a good GPU gets needlessly downgraded. Nothing available up front actually
 * answers "can this GPU run these shaders at 60fps".
 *
 * So the tier stays the CEILING, and this walks resolution down from it when
 * real frames come in slow, back up when there's headroom. Sharpness is traded
 * for smoothness only on the machines that actually need the trade.
 *
 * Floor is 1.0 (never below CSS resolution) — this site is typography-heavy and
 * sub-native rendering makes the type mushy, which costs more than it buys.
 *
 * ONLY for canvases that render straight to the screen. A canvas whose output
 * goes through an EffectComposer (renderPriority 1) must NOT use this: R3F's
 * runtime setDpr resizes the canvas backbuffer but never re-calls
 * composer.setSize, so the scene keeps rasterising at the old ratio — no saving,
 * and the post-process resamples against a stale resolution uniform. The Hero
 * deliberately uses its static tier dpr for exactly this reason.
 */
const STEP = 0.25
const FLOOR = 1
// How many direction reversals before we stop adjusting. A device sitting right
// on the boundary would otherwise see-saw by ±STEP forever, which reads as the
// picture periodically softening and re-sharpening.
const MAX_REVERSALS = 2

const round2 = (n) => Math.round(n * 100) / 100

/**
 * Owns the dpr value. Returns the current dpr plus the handlers to feed
 * <AdaptiveDprMonitor>. Kept as a hook so the <Canvas dpr> prop (outside the
 * Canvas) and the monitor (which must live inside it) can share one state.
 */
export function useAdaptiveDpr(tierDpr) {
  const [min, max] = Array.isArray(tierDpr) ? tierDpr : [FLOOR, tierDpr]
  const floor = Math.max(FLOOR, min)

  // The real ceiling is the tier cap AND the display's own ratio. Passing a
  // NUMBER to <Canvas dpr> bypasses R3F's calculateDpr, which only clamps to
  // window.devicePixelRatio for the ARRAY form — so without this, walking up
  // would supersample a 1x monitor to 2x (4x the fragments) and make the site
  // slower on exactly the plain hardware this is meant to help.
  const ceiling = useMemo(() => {
    const native = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    return round2(Math.min(max, Math.max(floor, native)))
  }, [max, floor])

  // Start where R3F would have: the device ratio clamped to the tier ceiling.
  const [dpr, setDpr] = useState(ceiling)

  // Settle bookkeeping. Deliberately NOT drei's `flipflops`: that counts every
  // adjustment (not reversals) and, once tripped, permanently stops the sampler
  // — so a healthy machine pinned at its ceiling burns the budget on no-op
  // inclines and goes inert ~10s after load, having changed nothing.
  const dirRef = useRef(0)
  const revRef = useRef(0)
  const settledRef = useRef(false)

  const step = useCallback((delta) => {
    if (settledRef.current) return
    setDpr((d) => {
      const next = round2(Math.min(ceiling, Math.max(floor, d + delta)))
      if (next === d) return d // clamped no-op — not a real adjustment
      const dir = Math.sign(delta)
      if (dirRef.current !== 0 && dir !== dirRef.current) {
        revRef.current += 1
        if (revRef.current >= MAX_REVERSALS) settledRef.current = true
      }
      dirRef.current = dir
      return next
    })
  }, [ceiling, floor])

  const onDecline = useCallback(() => step(-STEP), [step])
  const onIncline = useCallback(() => step(+STEP), [step])

  return useMemo(() => ({ dpr, onDecline, onIncline }), [dpr, onDecline, onIncline])
}

/**
 * The in-Canvas half. MUST NOT be mounted while its Canvas is idled
 * (frameloop="demand"/"never"): FPS here is frames-rendered over wall-clock, so
 * a deliberately paused canvas reads as a catastrophic frame rate and would
 * drive dpr to the floor for a scene that was merely idle, not slow. Mount it
 * only while the canvas is genuinely rendering.
 *
 * flipflops is Infinity on purpose — settling is handled in useAdaptiveDpr,
 * keyed to real reversals, so the sampler itself must stay alive.
 */
export function AdaptiveDprMonitor({ onDecline, onIncline }) {
  return <PerformanceMonitor flipflops={Infinity} onDecline={onDecline} onIncline={onIncline} />
}
