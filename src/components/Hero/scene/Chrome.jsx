import { Text } from '@react-three/drei'
import { ORDER } from '../config.js'
import { FONTS } from '../../../fonts.js'
import { useGroupFade } from '../../../hooks/useGroupFade.js'

const RO = ORDER.chrome
const PEARL = '#f2e8d8'
const GOLD = '#c8a157'
const MUTED = '#6f6c61'
const META = '#9b9789'

function RegMark({ x, y, opacity }) {
  return (
    <group position={[x, y, 0]}>
      <mesh renderOrder={RO}>
        <planeGeometry args={[16, 1]} />
        <meshBasicMaterial
          color={PEARL}
          transparent
          opacity={opacity * 0.4}
          toneMapped={false}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
      <mesh renderOrder={RO}>
        <planeGeometry args={[1, 16]} />
        <meshBasicMaterial
          color={PEARL}
          transparent
          opacity={opacity * 0.4}
          toneMapped={false}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

export default function Chrome({ on }) {
  const op = useGroupFade(on, { duration: 0.9 })

  return (
    <group>
      {/* top-left — wordmark */}
      <Text font={FONTS.cormorantItalic500} fontSize={30} color={PEARL}
        anchorX="left" anchorY="top" position={[-900, 412, 0]}
        renderOrder={RO} fillOpacity={op}>
        Aadarsh Velu
      </Text>
      <Text font={FONTS.dmMono400} fontSize={9} color={GOLD} letterSpacing={0.32}
        anchorX="left" anchorY="top" position={[-900, 374, 0]}
        renderOrder={RO} fillOpacity={op}>
        LEAD TECHNICAL ARCHITECT · DXB
      </Text>

      {/* top-right — nav */}
      <Text font={FONTS.dmMono400} fontSize={11} color={PEARL} letterSpacing={0.26}
        anchorX="right" anchorY="top" position={[900, 410, 0]}
        renderOrder={RO} fillOpacity={op}>
        WORK    ·    RECORD    ·    CONTACT
      </Text>
      <Text font={FONTS.dmMono400} fontSize={9} color={MUTED} letterSpacing={0.22}
        anchorX="right" anchorY="top" position={[900, 388, 0]}
        renderOrder={RO} fillOpacity={op}>
        REEL N°01 / 2026
      </Text>

      {/* corner meta */}
      <Text font={FONTS.dmMono400} fontSize={9} color={MUTED} letterSpacing={0.28}
        anchorX="left" anchorY="top" lineHeight={1.6} position={[-900, 322, 0]}
        renderOrder={RO} fillOpacity={op}>
        {'A. VELU\nPRESENTS'}
      </Text>
      <Text font={FONTS.dmMono400} fontSize={9} color={MUTED} letterSpacing={0.28}
        anchorX="right" anchorY="top" textAlign="right" lineHeight={1.6}
        position={[900, 322, 0]} renderOrder={RO} fillOpacity={op}>
        {'25.2048° N · 55.2708° E\nDUBAI / U.A.E.'}
      </Text>

      {/* bottom-left — camera metadata */}
      <Text font={FONTS.dmMono400} fontSize={10} color={META} letterSpacing={0.22}
        anchorX="left" anchorY="top" position={[-900, -384, 0]}
        renderOrder={RO} fillOpacity={op}>
        REEL  N° 01   ●   FRAME  001 / 248
      </Text>
      <Text font={FONTS.dmMono400} fontSize={10} color={META} letterSpacing={0.22}
        anchorX="left" anchorY="top" position={[-900, -406, 0]}
        renderOrder={RO} fillOpacity={op}>
        ASA  400T    LENS  35MM ANAMORPHIC
      </Text>

      {/* bottom-right — camera metadata */}
      <Text font={FONTS.dmMono400} fontSize={10} color={META} letterSpacing={0.22}
        anchorX="right" anchorY="top" position={[900, -384, 0]}
        renderOrder={RO} fillOpacity={op}>
        CHAPTER  I. THE ORIGIN
      </Text>
      <Text font={FONTS.dmMono400} fontSize={10} color={META} letterSpacing={0.22}
        anchorX="right" anchorY="top" position={[900, -406, 0]}
        renderOrder={RO} fillOpacity={op}>
        RUNTIME  04 : 32    STATUS  PLAY
      </Text>

      {/* registration marks */}
      <RegMark x={-928} y={404} opacity={op} />
      <RegMark x={928} y={404} opacity={op} />
      <RegMark x={-928} y={-404} opacity={op} />
      <RegMark x={928} y={-404} opacity={op} />
    </group>
  )
}
