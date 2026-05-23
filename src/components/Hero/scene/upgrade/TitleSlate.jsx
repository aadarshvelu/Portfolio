import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { FONTS } from '../../../../fonts.js'
import { useLayout } from '../../breakpoint.js'

const PEARL = '#f2e8d8'
const PEARL_FADE = 'rgba(242,232,216,0.32)'
const PEARL_DIM = 'rgba(242,232,216,0.62)'
const GOLD = '#c8a157'
const DARK = '#0a0c14'
const STRIPE_LIGHT = '#f2e8d8'

const DEG = Math.PI / 180

export default function TitleSlate({ opacityRef }) {
  const { upgrade } = useLayout()
  const { aboveSize, titleSize, subSize, cornerSize } = upgrade
  const { clapX, clapY, clapScale } = upgrade
  const titleX = upgrade.titleX || 0
  const titleY = upgrade.titleY || 0

  const texts = useRef([])

  useFrame(() => {
    const op = opacityRef.current
    for (const t of texts.current) {
      if (t) t.fillOpacity = op
    }
  })

  const clapRows = [
    ['Prod.', 'A. VELU', true],
    ['Scene', 'I.B', false],
    ['Shot', '01', false],
    ['Take', '02', false],
    ['Date', '— 2020 / PRESENT', false],
    ['Dir.', 'SELF', true],
  ]

  return (
    <group>
      {/* Title block + clapperboard — offset for portrait layouts */}
      <group position={[titleX, titleY, 0]}>
        {/* above-title: "The Origin · Continued" with pip dots */}
        <Text
          ref={(el) => (texts.current[0] = el)}
          font={FONTS.dmMono400}
          fontSize={aboveSize}
          color={PEARL_FADE}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.42}
          position={[0, titleSize * 0.72, 0]}
          renderOrder={53}
          fillOpacity={1}
        >
          {'●  The Origin · Continued  ●'}
        </Text>

        {/* main title */}
        <Text
          ref={(el) => (texts.current[1] = el)}
          font={FONTS.anton}
          fontSize={titleSize}
          color={PEARL}
          anchorX="center"
          anchorY="middle"
          letterSpacing={-0.012}
          position={[0, 0, 0]}
          renderOrder={53}
          fillOpacity={1}
        >
          {'THE · UPGRADE'}
        </Text>

        {/* subtitle */}
        <Text
          ref={(el) => (texts.current[2] = el)}
          font={FONTS.cormorantItalic}
          fontSize={subSize}
          color={GOLD}
          anchorX="center"
          anchorY="top"
          position={[0, -titleSize * 0.42, 0]}
          renderOrder={53}
          fillOpacity={1}
        >
          after the first light
        </Text>

        {/* clapperboard */}
        <group
          position={[clapX, clapY, 0]}
          rotation={[0, 0, -4 * DEG]}
          scale={clapScale}
        >
          {/* clap body */}
          <mesh position={[0, 0, 0]} renderOrder={53}>
            <planeGeometry args={[200, 120]} />
            <meshBasicMaterial
              color={DARK}
              transparent
              depthTest={false}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          {/* clap arm — striped top bar */}
          <mesh position={[4, 72, 0.1]} renderOrder={54}>
            <planeGeometry args={[200, 30]} />
            <meshBasicMaterial
              color={DARK}
              transparent
              depthTest={false}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          {/* stripes on the arm */}
          {Array.from({ length: 4 }, (_, i) => (
            <mesh
              key={i}
              position={[-75 + i * 50, 72, 0.2]}
              renderOrder={55}
            >
              <planeGeometry args={[22, 28]} />
              <meshBasicMaterial
                color={STRIPE_LIGHT}
                transparent
                depthTest={false}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
          ))}
          {/* clap body border */}
          <mesh position={[0, 0, -0.1]} renderOrder={52}>
            <planeGeometry args={[204, 124]} />
            <meshBasicMaterial
              color="#1a1c24"
              transparent
              opacity={0.6}
              depthTest={false}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          {/* clap text rows */}
          {clapRows.map(([key, val, gold], i) => (
            <group key={i}>
              <Text
                ref={(el) => (texts.current[6 + i * 2] = el)}
                font={FONTS.dmMono400}
                fontSize={10}
                color={PEARL_FADE}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.16}
                position={[-86, 36 - i * 18, 0.3]}
                renderOrder={56}
                fillOpacity={1}
              >
                {key}
              </Text>
              <Text
                ref={(el) => (texts.current[7 + i * 2] = el)}
                font={FONTS.dmMono400}
                fontSize={10}
                color={gold ? GOLD : PEARL}
                anchorX="right"
                anchorY="middle"
                letterSpacing={0.16}
                position={[86, 36 - i * 18, 0.3]}
                renderOrder={56}
                fillOpacity={1}
              >
                {val}
              </Text>
            </group>
          ))}
        </group>
      </group>

      {/* corner slate bottom-left */}
      <Text
        ref={(el) => (texts.current[3] = el)}
        font={FONTS.dmMono400}
        fontSize={cornerSize}
        color={GOLD}
        anchorX="left"
        anchorY="top"
        letterSpacing={0.28}
        position={[-upgrade.chrome.cornerX, upgrade.chrome.bottomY + 80, 0]}
        renderOrder={53}
        fillOpacity={1}
      >
        {"CHAPTER I — CONT'D"}
      </Text>
      <Text
        ref={(el) => (texts.current[4] = el)}
        font={FONTS.dmMono400}
        fontSize={cornerSize}
        color={PEARL_DIM}
        anchorX="left"
        anchorY="top"
        letterSpacing={0.28}
        position={[-upgrade.chrome.cornerX, upgrade.chrome.bottomY + 62, 0]}
        renderOrder={53}
        fillOpacity={1}
      >
        2020 — PRESENT
      </Text>

      {/* scroll hint */}
      <Text
        ref={(el) => (texts.current[5] = el)}
        font={FONTS.dmMono400}
        fontSize={9}
        color={GOLD}
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.42}
        position={[0, upgrade.chrome.bottomY + 110, 0]}
        renderOrder={53}
        fillOpacity={1}
      >
        SCROLL · ENTER THE SCENE
      </Text>

    </group>
  )
}
