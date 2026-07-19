import { forwardRef, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text, Line } from '@react-three/drei'
import { FONTS } from '../../../../fonts.js'

const LINK_DOTS = 26 // dotted underline segments beneath the Kaggle link

const CREAM = '#f2e8d8'
const DARK_CAPTION = '#2a2620'
// ── The V.O. reveal card is now a DARK FILM-SLATE, so its text + rules are
//    light-on-dark (like First Light) for legibility through the CRT. The small
//    polaroid thumbnail stays cream — it only uses CREAM / DARK_CAPTION / GOLD. ──
const GOLD = '#c8a157' // bright gold — accents / slug / link / year (and the parchment dot)
const INK = '#efe6d4' // card BODY text — light cream on the slate
const INK_MED = '#a99a7e' // muted cream — the V.O. cue line
const SEPIA = '#b3a284' // muted tan — labels / year range on the slate
const RULE = '#7f6c48' // dim gold rule, visible on the slate
const STAMP_BG = '#252c37' // raised dark panel (evidence stamp) on the slate

const DEG = Math.PI / 180
const clamp01 = (x) => Math.min(1, Math.max(0, x))
const smoothstep = (x) => {
  x = clamp01(x)
  return x * x * (3 - 2 * x)
}

const paperVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const cellFrag = /* glsl */ `
varying vec2 vUv;
float hash21(vec2 p) {
  p = fract(p * vec2(233.34, 851.74));
  p += dot(p, p + 23.45);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1, 0)), f.x),
    mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x),
    f.y
  );
}
void main() {
  float n = noise(vUv * 24.0) * 0.65 + noise(vUv * 48.0) * 0.35;
  vec3 base = vec3(0.886, 0.831, 0.722);
  vec3 aged = vec3(0.847, 0.784, 0.659);
  vec3 col = mix(base, aged, n * 0.15 + vUv.y * 0.05);
  vec2 e = smoothstep(vec2(0.0), vec2(0.08), vUv) * smoothstep(vec2(0.0), vec2(0.08), 1.0 - vUv);
  float vig = e.x * e.y;
  col = mix(mix(vec3(0.749, 0.675, 0.541), col, 0.75), col, vig);
  gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0);
}
`

const cardFrag = /* glsl */ `
varying vec2 vUv;
uniform float uOpacity;
float hash21(vec2 p) {
  p = fract(p * vec2(233.34, 851.74));
  p += dot(p, p + 23.45);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1, 0)), f.x),
    mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x),
    f.y
  );
}
void main() {
  float n = noise(vUv * 20.0) * 0.6 + noise(vUv * 44.0) * 0.4;
  vec3 base = vec3(0.070, 0.074, 0.084); // deep neutral slate — sits DARKER than the navy wall so the card reads as an object, not a cut-out
  vec3 warm = vec3(0.100, 0.105, 0.117); // subtle grain highlight
  vec3 col = mix(base, warm, n * 0.4);
  vec2 e = smoothstep(vec2(0.0), vec2(0.04), vUv) * smoothstep(vec2(0.0), vec2(0.04), 1.0 - vUv);
  float vig = e.x * e.y;
  col = mix(col * 0.82, col, vig); // darker edges → soft vignette frame
  gl_FragColor = vec4(pow(col, vec3(2.2)), uOpacity);
}
`

const Polaroid = forwardRef(function Polaroid(
  { data, position, rotation, width, smoothed, revealStart, revealEnd },
  ref,
) {
  const W = width
  const PADDING = W * 0.05
  const BOTTOM_PAD = W * 0.157
  const PHOTO = W - PADDING * 2
  const TOTAL_H = PHOTO + PADDING + BOTTOM_PAD
  const TAPE_W = W * 0.43
  const TAPE_H = W * 0.1
  const DOT_R = W * 0.021

  const placeholderTexts = useRef([])
  const revealTexts = useRef([])
  const revealMeshes = useRef([])
  const dotRef = useRef()
  const linkDots = useRef([]) // Kaggle link dotted underline
  const linkIcon = useRef() // Kaggle link external-link arrow
  const revealRef = useRef(0)
  const cardUniforms = useMemo(() => ({ uOpacity: { value: 0 } }), [])

  const { label, year, caption, tape, voiceover: vo } = data

  useFrame(() => {
    const sm = smoothed.current ?? 0
    const raw = clamp01((sm - revealStart) / (revealEnd - revealStart))
    const t = smoothstep(raw)
    revealRef.current = t

    const phOp = 1 - t
    const rvOp = t
    cardUniforms.uOpacity.value = rvOp
    for (const el of placeholderTexts.current) if (el) el.fillOpacity = phOp
    for (const el of revealTexts.current) if (el) el.fillOpacity = rvOp
    for (const el of revealMeshes.current) {
      if (el?.material) el.material.opacity = rvOp
    }
    if (dotRef.current?.material) {
      dotRef.current.material.opacity = phOp * (0.4 + 0.6 * Math.sin(Date.now() * 0.003))
    }

    // Kaggle link decoration — dotted underline + arrow, measured from the link
    // text's rendered box, faded with the reveal (rvOp).
    const linkText = revealTexts.current[23]
    if (vo.link && linkText?.textRenderInfo) {
      const bb = linkText.textRenderInfo.blockBounds // [minX, minY, maxX, maxY]
      const ax = cardW * 0.24, ay = linkY - 5.5 // the link's anchor position
      const w = bb[2] - bb[0]
      const uy = ay + bb[1] - smallFont * 0.28 // underline just below the text
      for (let d = 0; d < LINK_DOTS; d++) {
        const dot = linkDots.current[d]
        if (!dot) continue
        dot.position.set(ax + bb[0] + (w * d) / (LINK_DOTS - 1), uy, 0.21)
        dot.material.opacity = rvOp
      }
      if (linkIcon.current) {
        linkIcon.current.position.set(
          ax + bb[2] + smallFont * 0.4,
          ay + (bb[1] + bb[3]) / 2 - smallFont * 0.28,
          0.21,
        )
        linkIcon.current.material.transparent = true
        linkIcon.current.material.opacity = rvOp
      }
    }
  })

  const cardW = PHOTO * 0.92
  const cardH = PHOTO * 0.96

  const voLines = vo.lines.filter((l) => l.t !== undefined)
  const lineHeight = cardH * 0.057
  const headerY = cardH * 0.46
  const cueY = headerY - lineHeight * 1.5
  const textStartY = cueY - lineHeight * 1.3
  const fontSize = cardW * 0.058
  const smallFont = fontSize * 0.72

  // External-link arrow shape for the Kaggle link (same look as First Light).
  const linkIconPts = (() => {
    const s = smallFont * 0.9 * 0.55
    const b = s * 0.42
    return [[0, 0, 0], [s, s, 0], [s, b, 0], [s, s, 0], [b, s, 0]]
  })()

  // Compute per-line Y positions — blank lines get half-height gaps
  const lineYs = []
  let cursorY = textStartY
  for (let i = 0; i < voLines.length; i++) {
    lineYs.push(cursorY)
    if (voLines[i].t === '') {
      cursorY -= lineHeight * 0.5
    } else {
      cursorY -= lineHeight
    }
  }
  const narrationEndY = cursorY

  // Bottom section — credential/evidence/footer anchored from narration end
  // with a minimum position so short-content cards don't leave a void
  const hasCred = !!vo.credential?.name // has a cert-NAME row (e.g. Kaggle)
  const showCredLabel = hasCred || !!vo.link // "Credential" heading still shows
  // for link-only cards (e.g. AWS) — just no name row underneath it
  const credDivY = Math.min(narrationEndY - lineHeight * 1.2, -cardH * 0.15)
  const credLabelY = credDivY - lineHeight * 0.9
  const credNameY = credLabelY - lineHeight * 0.95

  // Optional second credential line (e.g. AWS card: AWS SA on line 1, ISO on 2).
  const credName2Y = credNameY - lineHeight * 1.1
  const credBottomY = hasCred
    ? (vo.credential?.name2 ? credName2Y : credNameY)
    : (showCredLabel ? credLabelY : credDivY)

  // Optional elements flow downward from the LAST credential line — evidence
  // panel first, then the link BELOW it (so e.g. the AWS card's Credly link
  // sits under the certs, or right under the heading when there's no name).
  let nextSlotY = credBottomY - lineHeight * (hasCred || showCredLabel ? 1.0 : 0.6)

  const evidenceY = vo.evidence ? nextSlotY - lineHeight * 0.4 : null
  if (vo.evidence) nextSlotY -= lineHeight * 2.8

  const linkY = vo.link ? nextSlotY : null
  if (vo.link) nextSlotY -= lineHeight * 1.1

  const footerY = Math.min(nextSlotY - lineHeight * 0.3, -cardH * 0.42)

  const colorRangesFor = (line) => {
    const base = INK
    const ranges = { 0: base }
    if (!line.a) return ranges
    for (const [sub, col] of line.a) {
      const idx = line.t.indexOf(sub)
      if (idx >= 0) {
        ranges[idx] = col
        ranges[idx + sub.length] = base
      }
    }
    return ranges
  }

  return (
    <group position={position} rotation={[0, 0, rotation * DEG]}>
      {/* marker ref for camera parking */}
      <group ref={ref} />

      {/* cream border */}
      <mesh renderOrder={55} position={[0, 0, 0]}>
        <planeGeometry args={[W, TOTAL_H]} />
        <meshBasicMaterial
          color={CREAM}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* photo cell — aged parchment */}
      <mesh renderOrder={56} position={[0, (TOTAL_H - PHOTO) / 2 - PADDING, 1]}>
        <planeGeometry args={[PHOTO, PHOTO]} />
        <shaderMaterial
          vertexShader={paperVert}
          fragmentShader={cellFrag}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {/* placeholder text */}
      <Text
        ref={(el) => (placeholderTexts.current[0] = el)}
        font={FONTS.dmMono400}
        fontSize={W * 0.065}
        color="rgba(90,77,62,0.5)"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.24}
        position={[0, (TOTAL_H - PHOTO) / 2 - PADDING + 6, 2]}
        renderOrder={57}
        fillOpacity={1}
      >
        {`${year}\n${label}`}
      </Text>

      {/* caption */}
      <Text
        ref={(el) => (placeholderTexts.current[1] = el)}
        font={FONTS.cormorantItalic}
        fontSize={W * 0.093}
        color={DARK_CAPTION}
        anchorX="center"
        anchorY="middle"
        position={[0, -TOTAL_H / 2 + BOTTOM_PAD * 0.5, 1]}
        renderOrder={57}
        fillOpacity={1}
      >
        {caption}
      </Text>

      {/* tape decoration (Kaggle only) */}
      {tape && (
        <mesh
          position={[0, TOTAL_H / 2 + TAPE_H * 0.3, 0.5]}
          rotation={[0, 0, -3 * DEG]}
          renderOrder={55}
        >
          <planeGeometry args={[TAPE_W, TAPE_H]} />
          <meshBasicMaterial
            color="#e8c88c"
            transparent
            opacity={0.45}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* gold dot affordance */}
      <mesh
        ref={dotRef}
        position={[PHOTO / 2 - DOT_R * 2, (TOTAL_H - PHOTO) / 2 - PADDING + PHOTO / 2 - DOT_R * 2, 3]}
        renderOrder={57}
      >
        <circleGeometry args={[DOT_R, 16]} />
        <meshBasicMaterial
          color={GOLD}
          transparent
          opacity={0.4}
          depthTest={false}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* ================================================================
          V.O. REVEAL CARD — archive document on parchment
          ================================================================ */}
      <group position={[0, (TOTAL_H - PHOTO) / 2 - PADDING, 4]}>
        {/* card background — dark film-slate filling the whole photo cell (inside
            the polaroid frame) so no cream/parchment shows inside; the frame stays */}
        <mesh renderOrder={58}>
          <planeGeometry args={[PHOTO, PHOTO]} />
          <shaderMaterial
            vertexShader={paperVert}
            fragmentShader={cardFrag}
            uniforms={cardUniforms}
            transparent
            depthTest={false}
            depthWrite={false}
          />
        </mesh>

        {/* archive rule line — top */}
        <mesh
          ref={(el) => (revealMeshes.current[0] = el)}
          position={[0, cardH / 2 - 2, 0.1]}
          renderOrder={58}
        >
          <planeGeometry args={[cardW * 0.88, 1.0]} />
          <meshBasicMaterial
            color={RULE}
            transparent
            opacity={0}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {/* archive rule line — bottom */}
        <mesh
          ref={(el) => (revealMeshes.current[1] = el)}
          position={[0, -cardH / 2 + 2, 0.1]}
          renderOrder={58}
        >
          <planeGeometry args={[cardW * 0.88, 1.0]} />
          <meshBasicMaterial
            color={RULE}
            transparent
            opacity={0}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {/* header — slug */}
        <Text
          ref={(el) => (revealTexts.current[0] = el)}
          font={FONTS.dmMono400}
          fontSize={smallFont}
          color={GOLD}
          anchorX="left"
          anchorY="top"
          letterSpacing={0.08}
          position={[-cardW * 0.42, headerY, 0.2]}
          renderOrder={59}
          fillOpacity={0}
        >
          {vo.slug}
        </Text>

        {/* header — year */}
        <Text
          ref={(el) => (revealTexts.current[1] = el)}
          font={FONTS.dmMono400}
          fontSize={smallFont}
          color={SEPIA}
          anchorX="right"
          anchorY="top"
          letterSpacing={0.08}
          position={[cardW * 0.42, headerY, 0.2]}
          renderOrder={59}
          fillOpacity={0}
        >
          {vo.yearRange}
        </Text>

        {/* header divider */}
        <mesh
          ref={(el) => (revealMeshes.current[2] = el)}
          position={[0, headerY - lineHeight * 1.2, 0.2]}
          renderOrder={59}
        >
          <planeGeometry args={[cardW * 0.84, 0.8]} />
          <meshBasicMaterial
            color={RULE}
            transparent
            opacity={0}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {/* V.O. cue */}
        <Text
          ref={(el) => (revealTexts.current[2] = el)}
          font={FONTS.dmMono400}
          fontSize={smallFont * 1.25}
          color={INK_MED}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.32}
          position={[0, cueY, 0.2]}
          renderOrder={59}
          fillOpacity={0}
        >
          {vo.cue}
        </Text>

        {/* narration lines */}
        {voLines.map((line, i) => {
          if (!line.t) return null
          return (
            <Text
              key={i}
              ref={(el) => (revealTexts.current[3 + i] = el)}
              font={FONTS.cormorantItalic500}
              fontSize={fontSize}
              color={INK}
              colorRanges={colorRangesFor(line)}
              anchorX="center"
              anchorY="middle"
              position={[0, lineYs[i], 0.2]}
              renderOrder={59}
              fillOpacity={0}
            >
              {line.t}
            </Text>
          )
        })}

        {/* credential divider */}
        <mesh
          ref={(el) => (revealMeshes.current[3] = el)}
          position={[0, credDivY, 0.2]}
          renderOrder={59}
        >
          <planeGeometry args={[cardW * 0.84, 0.8]} />
          <meshBasicMaterial
            color={RULE}
            transparent
            opacity={0}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {/* "Credential" heading — shows for any card with a cert name OR a
            link (e.g. AWS: no name row, but the heading still labels the link
            below it). Only fully absent when a card has neither. */}
        {showCredLabel && (
          <Text
            ref={(el) => (revealTexts.current[20] = el)}
            font={FONTS.dmMono400}
            fontSize={smallFont}
            color={SEPIA}
            anchorX="left"
            anchorY="top"
            letterSpacing={0.32}
            position={[-cardW * 0.42, credLabelY, 0.2]}
            renderOrder={59}
            fillOpacity={0}
          >
            Credential
          </Text>
        )}
        {hasCred && (
          <>
            <Text
              ref={(el) => (revealTexts.current[21] = el)}
              font={FONTS.dmMono400}
              fontSize={smallFont * (vo.credential.nameSize || 1.35) - 1.5}
              color={INK}
              colorRanges={colorRangesFor({ t: vo.credential.name, a: vo.credential.nameA })}
              anchorX="left"
              anchorY="top"
              letterSpacing={0.18}
              maxWidth={cardW * 0.84}
              position={[-cardW * 0.42, credNameY - 2, 0.2]}
              renderOrder={59}
              fillOpacity={0}
            >
              {vo.credential.name}
            </Text>
            {vo.credential.name2 && (
              <Text
                ref={(el) => (revealTexts.current[26] = el)}
                font={FONTS.dmMono400}
                fontSize={smallFont * (vo.credential.nameSize || 1.35)}
                color={INK}
                colorRanges={colorRangesFor({ t: vo.credential.name2, a: vo.credential.name2A })}
                anchorX="left"
                anchorY="top"
                letterSpacing={0.18}
                maxWidth={cardW * 0.84}
                position={[-cardW * 0.42, credName2Y - 2, 0.2]}
                renderOrder={59}
                fillOpacity={0}
              >
                {vo.credential.name2}
              </Text>
            )}
          </>
        )}

        {/* link (Kaggle only) — dotted underline + external-link arrow */}
        {vo.link && (
          <>
            <Text
              ref={(el) => (revealTexts.current[23] = el)}
              font={FONTS.dmMono400}
              fontSize={smallFont * 0.9}
              color={GOLD}
              anchorX="right"
              anchorY="top"
              letterSpacing={0.14}
              position={[cardW * 0.24, linkY - 5.5, 0.2]}
              renderOrder={59}
              fillOpacity={0}
              onClick={(e) => {
                e.stopPropagation()
                window.open(vo.link.url, '_blank', 'noopener,noreferrer')
              }}
              onPointerOver={() => { document.body.style.cursor = 'pointer' }}
              onPointerOut={() => { document.body.style.cursor = '' }}
            >
              {vo.link.label}
            </Text>
            {Array.from({ length: LINK_DOTS }, (_, d) => (
              <mesh key={d} ref={(el) => (linkDots.current[d] = el)} renderOrder={59}>
                <circleGeometry args={[smallFont * 0.05, 10]} />
                <meshBasicMaterial color={GOLD} transparent opacity={0} depthTest={false} depthWrite={false} toneMapped={false} />
              </mesh>
            ))}
            <Line
              ref={linkIcon}
              points={linkIconPts}
              color={GOLD}
              lineWidth={1.6}
              transparent
              opacity={0}
              renderOrder={59}
            />
          </>
        )}

        {/* evidence panel (IIM K + AWS) */}
        {vo.evidence && (
          <>
            <mesh
              ref={(el) => (revealMeshes.current[4] = el)}
              position={[0, evidenceY, 0.2]}
              renderOrder={59}
            >
              <planeGeometry args={[cardW * 0.84, lineHeight * 2.2]} />
              <meshBasicMaterial
                color={STAMP_BG}
                transparent
                opacity={0}
                depthTest={false}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
            <Text
              ref={(el) => (revealTexts.current[24] = el)}
              font={FONTS.dmMono400}
              fontSize={smallFont * 0.85}
              color={SEPIA}
              anchorX="center"
              anchorY="middle"
              letterSpacing={0.28}
              maxWidth={cardW * 0.80}
              position={[0, evidenceY, 0.3]}
              renderOrder={60}
              fillOpacity={0}
            >
              {vo.evidence}
            </Text>
          </>
        )}

      </group>
    </group>
  )
})

export default Polaroid
