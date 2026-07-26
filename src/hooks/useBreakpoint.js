import { useEffect, useState } from 'react'

// Picks the hero layout: 'mobile' | 'tablet' | 'desktop'.
// Tablet is portrait-only (a landscape tablet falls to the desktop layout,
// which is ~16:9 and works fine).
// Pure breakpoint detector — reused outside React (e.g. the DOM scroll cue) so
// its breakpoints always match the hero scene's.
export function detectBreakpoint() {
  if (typeof window === 'undefined') return 'desktop'
  const w = window.innerWidth
  const portrait = window.innerHeight >= window.innerWidth
  if (w < 768) return 'mobile'
  if (w < 1280 && portrait) return 'tablet'
  return 'desktop'
}

const detect = detectBreakpoint

export function useBreakpoint() {
  const [bp, setBp] = useState(detect)

  useEffect(() => {
    const update = () => setBp(detect())
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  return bp
}
