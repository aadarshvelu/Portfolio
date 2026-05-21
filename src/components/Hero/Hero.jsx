import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { CAMERA_Z, CAMERA_FOV, coverFov } from './config.js'
import { useBreakpoint } from '../../hooks/useBreakpoint.js'
import { BreakpointContext } from './breakpoint.js'
import { LAYOUTS } from './layouts.js'
import Scene from './Scene.jsx'

// Re-derives the camera fov so the active design rect always covers the
// viewport full-bleed (no letterbox bars).
function CoverCamera({ design }) {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  useLayoutEffect(() => {
    camera.fov = coverFov(size.width / size.height, design)
    camera.updateProjectionMatrix()
  }, [camera, size, design])
  return null
}

// The hero is a WebGL scene. World units = design pixels of the active
// breakpoint (desktop / tablet / mobile).
export default function Hero() {
  const bp = useBreakpoint()
  const ctx = useMemo(() => ({ bp, layout: LAYOUTS[bp] }), [bp])

  // page scroll -> camera transition. A plain ref the scroll listener
  // mutates and the render loop reads — no React re-render per scroll event.
  const progressRef = useRef(0)
  useEffect(() => {
    const onScroll = () => {
      const max =
        document.documentElement.scrollHeight - window.innerHeight || 1
      progressRef.current = Math.min(1, Math.max(0, window.scrollY / max))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <Canvas
      flat
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false }}
      camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV, near: 1, far: 6000 }}
      resize={{ scroll: false }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      {/* clear colour = the Background's deep-edge tone, so when the parked
          camera pans past the night-sky plane the gap stays seamless */}
      <color attach="background" args={['#1b2530']} />
      <BreakpointContext.Provider value={ctx}>
        <CoverCamera design={ctx.layout.design} />
        <Suspense fallback={null}>
          <Scene progressRef={progressRef} />
        </Suspense>
      </BreakpointContext.Provider>
    </Canvas>
  )
}
