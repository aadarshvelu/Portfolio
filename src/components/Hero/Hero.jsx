import { Suspense, useLayoutEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { CAMERA_Z, CAMERA_FOV, coverFov } from './config.js'
import Scene from './Scene.jsx'

// Re-derives the camera fov per viewport so the 1920x1080 design rect always
// covers the screen full-bleed (no letterbox bars).
function CoverCamera() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  useLayoutEffect(() => {
    camera.fov = coverFov(size.width / size.height)
    camera.updateProjectionMatrix()
  }, [camera, size])
  return null
}

// The hero is a WebGL scene. World units = design pixels.
export default function Hero() {
  return (
    <Canvas
      flat
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false }}
      camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV, near: 1, far: 6000 }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <color attach="background" args={['#000000']} />
      <CoverCamera />
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  )
}
