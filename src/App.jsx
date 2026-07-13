import { useEffect } from 'react'
import Viewport from './components/Viewport/Viewport.jsx'
import Hero from './components/Hero/Hero.jsx'

export default function App() {
  // Freeze the app height to the stable large viewport, in pixels. Mobile
  // browsers resize the viewport as their chrome bars show/hide on scroll;
  // pinning a measured px value keeps the canvas (and the scene) from
  // reflowing. Re-measured only on a real resize — never on the chrome.
  useEffect(() => {
    const root = document.documentElement
    const coarse = window.matchMedia('(pointer: coarse)').matches
    let lockedW = -1
    let lockedH = -1
    // Measure the LARGE viewport height (100lvh) — the height with mobile
    // toolbars retracted. It is invariant to the URL/toolbar showing or hiding
    // (so it's a stable lock value), but it DOES shrink on a genuine window
    // resize: split-screen, foldable divider, multi-window.
    const measure = () => {
      const probe = document.createElement('div')
      probe.style.cssText =
        'position:fixed;top:0;left:0;width:1px;height:100lvh;visibility:hidden;pointer-events:none;'
      document.body.appendChild(probe)
      let h = probe.offsetHeight
      document.body.removeChild(probe)
      if (!h || h < window.innerHeight) h = window.innerHeight + 150
      return h
    }
    const lock = () => {
      lockedW = window.innerWidth
      lockedH = measure()
      root.style.setProperty('--app-h', `${lockedH}px`)
    }
    lock()
    let t = 0
    const onResize = () => {
      // A width change is always a real resize (orientation / desktop window).
      if (!coarse || window.innerWidth !== lockedW) {
        lock()
        return
      }
      // Width unchanged on a touch device: usually the URL/toolbar animating,
      // which we IGNORE (100lvh is invariant to it). But split-screen /
      // foldable / multi-window genuinely shrink the large viewport — caught by
      // a change in measured 100lvh. Debounce so we don't probe on every
      // scroll-driven resize, then re-lock only if lvh actually moved.
      clearTimeout(t)
      t = setTimeout(() => {
        if (Math.abs(measure() - lockedH) > 24) lock()
      }, 300)
    }
    window.addEventListener('resize', onResize)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <>
      <Viewport>
        <Hero />
      </Viewport>
      {/* scroll runway — Act I + The Upgrade */}
      <div style={{ height: '1500vh' }} aria-hidden="true" />
    </>
  )
}
