import { useEffect, useState } from 'react'

// Picks the hero layout: 'mobile' | 'tablet' | 'desktop'.
// Tablet is portrait-only (a landscape tablet falls to the desktop layout,
// which is ~16:9 and works fine).
function detect() {
  if (typeof window === 'undefined') return 'desktop'
  const w = window.innerWidth
  const portrait = window.innerHeight >= window.innerWidth
  if (w < 768) return 'mobile'
  if (w < 1280 && portrait) return 'tablet'
  return 'desktop'
}

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
