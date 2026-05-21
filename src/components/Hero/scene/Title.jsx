import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import gsap from 'gsap'
import { ORDER } from '../config.js'
import { useFade } from '../../../hooks/useFade.js'

// DIRECTOR'S CUT title artwork — centred, near the top (CSS: top 5%,
// width 78%, image ratio 1750:899)
const W = 1497.6
const H = (W * 899) / 1750
const X = 0
const Y = 101.3

export default function Title({ on }) {
  const tex = useTexture('/assets/title-directors-cut-white.png')
  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace
  }, [tex])

  const mat = useRef()
  const group = useRef()

  useFade(mat, on, { duration: 1.2 })
  useEffect(() => {
    if (on && group.current) {
      // rises into place — matches the CSS translateY(40px) -> 0
      gsap.fromTo(
        group.current.position,
        { y: Y - 40 },
        { y: Y, duration: 1.6, ease: 'power3.out', overwrite: true },
      )
    }
  }, [on])

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
