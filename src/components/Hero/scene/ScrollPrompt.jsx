import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { ORDER } from '../config.js'
import { FONTS } from '../../../fonts.js'
import { useGroupFade } from '../../../hooks/useGroupFade.js'

export default function ScrollPrompt({ on }) {
  const opacity = useGroupFade(on, { duration: 0.8 })
  const bar = useRef()

  useFrame((state) => {
    if (bar.current) {
      // looping grow, transform-origin top
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
        position={[0, -486, 0]}
        renderOrder={ORDER.scrollPrompt}
        fillOpacity={opacity}
      >
        SCROLL · ENTER CHAPTER I
      </Text>
      {/* pulsing bar — geometry shifted so it scales from its top edge */}
      <group position={[0, -498, 0]}>
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
