import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { Text } from '@react-three/drei'
import { DESIGN_W, DESIGN_H, ORDER } from '../config.js'
import { FONTS } from '../../../fonts.js'
import { useTypewriter } from '../../../hooks/useTypewriter.js'
import { useGroupFade } from '../../../hooks/useGroupFade.js'

const BOOT_TEXT = 'Life is a film. This is my story.'

export default function BootOverlay({ bootLine, maskGone }) {
  const maskMat = useRef()
  const typed = useTypewriter(BOOT_TEXT, { speed: 35, start: bootLine })
  const lineOpacity = useGroupFade(bootLine, { duration: 0.3 })

  useEffect(() => {
    if (maskGone && maskMat.current) {
      gsap.to(maskMat.current, {
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        overwrite: true,
      })
    }
  }, [maskGone])

  return (
    <>
      <mesh renderOrder={ORDER.bootMask} position={[0, 0, 0]}>
        <planeGeometry args={[DESIGN_W, DESIGN_H]} />
        <meshBasicMaterial
          ref={maskMat}
          color="#000000"
          transparent
          opacity={1}
          toneMapped={false}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      <Text
        font={FONTS.dmMono400}
        fontSize={14}
        color="#f2e8d8"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.32}
        position={[0, 0, 0]}
        renderOrder={ORDER.bootLine}
        fillOpacity={lineOpacity}
      >
        {typed}
      </Text>
    </>
  )
}
