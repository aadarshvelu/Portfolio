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
    const lock = () => {
      lockedW = window.innerWidth
      const probe = document.createElement('div')
      probe.style.cssText =
        'position:fixed;top:0;left:0;width:1px;height:100lvh;visibility:hidden;pointer-events:none;'
      document.body.appendChild(probe)
      let h = probe.offsetHeight
      document.body.removeChild(probe)
      if (!h || h < window.innerHeight) h = window.innerHeight + 150
      root.style.setProperty('--app-h', `${h}px`)
    }
    lock()
    const onResize = () => {
      // a real resize changes the width (orientation / desktop window);
      // the chrome bars only change height — ignore those
      if (!coarse || window.innerWidth !== lockedW) lock()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
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
