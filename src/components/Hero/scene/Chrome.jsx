import { Text } from '@react-three/drei'
import { ORDER } from '../config.js'
import { useLayout } from '../breakpoint.js'
import { FONTS } from '../../../fonts.js'
import { useGroupFade } from '../../../hooks/useGroupFade.js'

const RO = ORDER.chrome
const PEARL = '#f2e8d8'
const GOLD = '#c8a157'
const MUTED = '#6f6c61'
const META = '#9b9789'

// full vs truncated strings — `shortMeta` (mobile) picks the short set
const TEXT = {
  full: {
    sub: 'SOLUTIONS ARCHITECT · DXB',
    cornerR: '25.2048° N · 55.2708° E\nDUBAI / U.A.E.',
    botL1: 'REEL  N° 01   ●   FRAME  001 / 248',
    botL2: 'ASA  400T    LENS  35MM ANAMORPHIC',
    botR1: 'CHAPTER  I. THE ORIGIN',
    botR2: 'RUNTIME  04 : 32    STATUS  PLAY',
  },
  short: {
    sub: 'LEAD ARCHITECT · DXB',
    cornerR: 'DUBAI / U.A.E.',
    botL1: 'REEL N°01 · 248F',
    botL2: '35MM ANAMORPHIC',
    botR1: 'I. THE ORIGIN',
    botR2: '04:32 · PLAY',
  },
}

function RegMark({ x, y, opacity, scale }) {
  return (
    <group position={[x, y, 0]}>
      <mesh renderOrder={RO}>
        <planeGeometry args={[16 * scale, 1]} />
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
        <planeGeometry args={[1, 16 * scale]} />
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
  const { chrome } = useLayout()
  const { cornerX, topY, bottomY, regX, regY, fontScale: fs, shortMeta } = chrome
  const op = useGroupFade(on, { duration: 0.9 })
  const t = shortMeta ? TEXT.short : TEXT.full

  return (
    <group>
      {/* top-left — wordmark */}
      <Text font={FONTS.cormorantItalic500} fontSize={36 * fs} color={PEARL}
        anchorX="left" anchorY="top" position={[-cornerX, topY, 0]}
        renderOrder={RO} fillOpacity={op}>
        Aadarsh Velu
      </Text>
      <Text font={FONTS.dmMono400} fontSize={16 * fs} color={GOLD} letterSpacing={0.32}
        anchorX="left" anchorY="top" position={[-cornerX, topY - 45 * fs, 0]}
        renderOrder={RO} fillOpacity={op}>
        {t.sub}
      </Text>

      {/* bottom-left — camera metadata */}
      <Text font={FONTS.dmMono400} fontSize={10 * fs} color={META} letterSpacing={0.22}
        anchorX="left" anchorY="top" position={[-cornerX, bottomY, 0]}
        renderOrder={RO} fillOpacity={op}>
        {t.botL1}
      </Text>
      <Text font={FONTS.dmMono400} fontSize={10 * fs} color={META} letterSpacing={0.22}
        anchorX="left" anchorY="top" position={[-cornerX, bottomY - 22 * fs, 0]}
        renderOrder={RO} fillOpacity={op}>
        {t.botL2}
      </Text>

      {/* bottom-right — camera metadata */}
      <Text font={FONTS.dmMono400} fontSize={10 * fs} color={META} letterSpacing={0.22}
        anchorX="right" anchorY="top" position={[cornerX, bottomY, 0]}
        renderOrder={RO} fillOpacity={op}>
        {t.botR1}
      </Text>
      <Text font={FONTS.dmMono400} fontSize={10 * fs} color={META} letterSpacing={0.22}
        anchorX="right" anchorY="top" position={[cornerX, bottomY - 22 * fs, 0]}
        renderOrder={RO} fillOpacity={op}>
        {t.botR2}
      </Text>

      {/* registration marks */}
      <RegMark x={-regX} y={regY} opacity={op} scale={fs} />
      <RegMark x={regX} y={regY} opacity={op} scale={fs} />
      <RegMark x={-regX} y={-regY} opacity={op} scale={fs} />
      <RegMark x={regX} y={-regY} opacity={op} scale={fs} />
    </group>
  )
}
