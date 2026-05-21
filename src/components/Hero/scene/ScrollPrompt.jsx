import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { ORDER } from '../config.js'
import { useLayout } from '../breakpoint.js'
import { FONTS } from '../../../fonts.js'
import { useGroupFade } from '../../../hooks/useGroupFade.js'

export default function ScrollPrompt({ on }) {
  const { scrollPrompt } = useLayout()
  const y = scrollPrompt.y
  const opacity = useGroupFade(on, { duration: 0.8 })
  const bar = useRef()

  useFrame((state) => {
    if (bar.current) {
      // looping grow
      bar.current.scale.y = (state.clock.elapsedTime % 2.2) / 2.2
    }
  })

  return (
    <group>
      <Text
        font={FONTS.dmMono400}
        fontSize={9}
        color="#c8a157"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.36}
        position={[0, y, 0]}
        renderOrder={ORDER.scrollPrompt}
        fillOpacity={opacity}
      >
        SCROLL · ENTER CHAPTER I
      </Text>
      {/* pulsing bar */}
      <group position={[0, y - 12, 0]}>
        <mesh ref={bar} position={[0, -14, 0]} renderOrder={ORDER.scrollPrompt}>
          <planeGeometry args={[1.5, 28]} />
          <meshBasicMaterial
            color="#c8a157"
            transparent
            opacity={opacity * 0.85}
            toneMapped={false}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  )
}
