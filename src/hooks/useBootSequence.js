import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

// Boot timeline — [absoluteSeconds, phaseKey, value]. A GSAP timeline acts as
// the scheduler; each flipped phase fades in its WebGL layer (see useFade).
const TIMELINE = [
  [0.6, 'bootLine', true],
  [2.5, 'bootLine', false],
  [2.78, 'maskGone', true],
  [2.9, 'sky', true],
  [3.22, 'moon', true],
  [3.92, 'film', true],
  [4.82, 'title', true],
  [5.52, 'chrome', true],
  [6.02, 'idle', true],
  [6.62, 'prompt', true],
]

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function useBootSequence({ setPhase }) {
  useGSAP(() => {
    // Reduced motion: jump straight to the final state.
    if (prefersReduced()) {
      TIMELINE.forEach(([, key, value]) => setPhase(key, value))
      return
    }

    const tl = gsap.timeline()
    TIMELINE.forEach(([at, key, value]) => {
      tl.call(() => setPhase(key, value), null, at)
    })
    return () => tl.kill()
  }, [])
}
