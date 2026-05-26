import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import gsap from 'gsap'
import { ORDER } from '../config.js'
import { useLayout } from '../breakpoint.js'
import { useFade } from '../../../hooks/useFade.js'

// AADARSH VELU title artwork — image ratio 1656:548
export default function Title({ on }) {
  const { title } = useLayout()
  const W = title.w
  const H = (W * 548) / 1656
  const X = title.x
  const Y = title.y

  const tex = useTexture('/assets/title-aadarsh-velu.png')
  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace
  }, [tex])

  const mat = useRef()
  const group = useRef()

  useFade(mat, on, { duration: 1.2 })
  useEffect(() => {
    if (on && group.current) {
      // rises into place
      gsap.fromTo(
        group.current.position,
        { y: Y - 40 },
        { y: Y, duration: 1.6, ease: 'power3.out', overwrite: true },
      )
    }
  }, [on, X, Y])

  return (
    <group ref={group} position={[X, Y, 0]}>
      <mesh renderOrder={ORDER.title}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial
          ref={mat}
          map={tex}
          transparent
          opacity={0}
          toneMapped={false}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
