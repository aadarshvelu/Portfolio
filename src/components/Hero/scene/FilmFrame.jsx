import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { FONTS } from '../../../fonts.js'
import { useTypewriter } from '../../../hooks/useTypewriter.js'
import { edgeFor, SPREAD } from './reelGeometry.js'

// frame 260x200, cell inset to 252x144 — origin at frame centre
const FW = 260
const FH = 200
const CW = 252
const CH = 144

// CTA label ↔ suffix-glyph spacing / glyph footprint (design px)
const CTA_GAP = 9
const CTA_GLYPH = 13

const clamp01 = (x) => Math.min(1, Math.max(0, x))
const smoothstep = (x) => {
  const t = clamp01(x)
  return t * t * (3 - 2 * t)
}

// The centre frame's shell + colour cell dissolve over this scroll band as the
// camera dollies in — driven by scroll POSITION (not a time-lag behind a fast
// scroll), so the film roll is reliably gone by the FIRST LIGHT title card.
const DISSOLVE_IN = 0.045
const DISSOLVE_OUT = 0.095

// The 4 destination chapters in RING order (mirrors hero-broadcast.html's
// CHANNELS). FilmRoll tiles this array infinitely around the cylinder, so order
// here = the loop order; positioning + which one is "centre" is decided by slot
// in FilmRoll (not baked here). ORIGIN leads so slot 0 lands on FIRST LIGHT.
// cellA/cellB are sRGB 0..1.
export const FRAMES = [
  { roman: 'I.', tag: 'THE ORIGIN', meta: '2018 — 2020', title: 'First\nLight',
    em: 'before anyone was watching', cellA: [0.110, 0.165, 0.322], cellB: [0.020, 0.039, 0.110] },
  { roman: 'II.', tag: 'THE UPGRADE', meta: '2020 — 2023', title: 'The\nUpgrade',
    em: 'the years I got sharp', cellA: [0.102, 0.133, 0.220], cellB: [0.039, 0.063, 0.141] },
  { roman: 'III.', tag: 'THE WORK', meta: '2022 — now', title: 'The\nWork',
    em: 'building things that last', cellA: [0.086, 0.125, 0.243], cellB: [0.027, 0.035, 0.102] },
  { roman: 'IV.', tag: 'CONTACT', meta: 'MMXXVI', title: 'Roll\nCredits',
    em: 'the director will see you now', cellA: [0.102, 0.114, 0.173], cellB: [0.024, 0.031, 0.071] },
]

const baseVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

// dark film base + two sprocket-hole rows. uFade dissolves the shell away.
const frameFrag = /* glsl */ `
varying vec2 vUv;
uniform float uFade;
uniform float uEdge;
void main() {
  vec3 base = vec3(0.031, 0.035, 0.043);
  float band = step(0.90, vUv.y) + step(vUv.y, 0.10);
  float holes = step(0.5, fract(vUv.x * 21.0));
  vec3 col = mix(base, vec3(0.11, 0.11, 0.13), band * holes);
  gl_FragColor = vec4(pow(col, vec3(2.2)), (1.0 - uFade) * uEdge);
}
`

// per-chapter cell gradient. uFade dissolves the colour panel to transparent.
const cellFrag = /* glsl */ `
varying vec2 vUv;
uniform vec3 uA;
uniform vec3 uB;
uniform float uDim;
uniform float uFade;
uniform float uEdge;
void main() {
  vec3 col = mix(uB, uA, vUv.y);
  float r = 1.0 - length(vUv - vec2(0.35, 0.65));
  col += vec3(0.05) * smoothstep(0.45, 1.0, r);
  col *= uDim;
  gl_FragColor = vec4(pow(col, vec3(2.2)), (1.0 - uFade) * uEdge);
}
`

export default function FilmFrame({ frame, focus, center = false, slot = 0, baseRotY, onEnter, smoothed }) {
  const { roman, tag, meta, title, em, cellA, cellB } = frame
  // FIRST LIGHT enters by scrolling into Act I; the others by the play button.
  const isFirstLight = tag === 'THE ORIGIN'
  // SELF-TAUGHT types out on the focus title card (Origin only).
  const caption = useTypewriter('SELF-TAUGHT', {
    speed: 40,
    start: !!(center && focus && isFirstLight),
  })
  // `dist` = resting |slot| from centre; `edge0` is the resting fade (the LIVE
  // fade, tracking rotation, is recomputed each frame in useFrame below).
  const dist = Math.abs(slot)
  const edge0 = center ? 1 : edgeFor(dist)
  // renderOrder: nearer the centre paints on top.
  const ro = 12 + (2 - Math.min(dist, 2)) * 0.4

  const cellUniforms = useMemo(
    () => ({
      uA: { value: new THREE.Vector3(...cellA) },
      uB: { value: new THREE.Vector3(...cellB) },
      uDim: { value: center ? 1.0 : 0.72 },
      uFade: { value: 0 },
      uEdge: { value: edge0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const frameUniforms = useMemo(
    () => ({ uFade: { value: 0 }, uEdge: { value: edge0 } }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // Phase B — the centre frame dissolves its shell + colour cell to leave
  // only the title text floating on the shared night sky. `uEdge` fades the
  // outer reel frames toward the strip edges so they recede into dark instead
  // of piling up / bleeding through each other.
  const fade = useRef(0)
  const groupRef = useRef() // whole frame — culled when its live edge is ~0
  const titleRef = useRef() // heading — develops IN on focus
  const emRef = useRef() // subtitle — browse only
  const playRef = useRef() // PRESS PLAY label — browse only, pulses
  const playTriRef = useRef() // play triangle — browse only, pulses
  const focalRef = useRef() // FOCAL label — browse only
  const focalDotRef = useRef() // FOCAL dot — browse only
  const hovered = useRef(false) // CTA hover — solid + bright while pointed at
  // Focus title-card elements — the inverse of browse: they develop IN on
  // scroll-in (opacity ∝ fade) to rebuild the full left-aligned FIRST LIGHT card.
  const tagRef = useRef()
  const metaRef = useRef()
  const emCardRef = useRef()
  const selfRef = useRef()
  const focalCardRef = useRef()
  const focalDotCardRef = useRef()
  useFrame((state) => {
    // Centre frame: dissolve is a pure function of scroll depth (deterministic —
    // gone by the title card regardless of scroll speed). Others: the old
    // focus-driven ease (harmless; they're hidden on focus anyway).
    let f
    if (center && smoothed) {
      f = smoothstep((smoothed.current - DISSOLVE_IN) / (DISSOLVE_OUT - DISSOLVE_IN))
      fade.current = f
    } else {
      const target = center && focus ? 1 : 0
      fade.current += (target - fade.current) * 0.04
      f = fade.current
    }
    // LIVE edge fade — by the frame's ACTUAL rotated distance from centre
    // (baseRotY), not its resting slot. So a frame swinging toward the strip
    // edge during a paginate fades as it travels, instead of a still-bright
    // frame glowing at the rim. Everything (shell, cell, text) rides this.
    const off = baseRotY ? baseRotY.current / SPREAD : 0
    const edge = edgeFor(Math.abs(off - slot))

    frameUniforms.uFade.value = f
    cellUniforms.uFade.value = f
    frameUniforms.uEdge.value = edge
    cellUniforms.uEdge.value = edge
    // Cull the whole frame once it's essentially faded (keeps the far reel from
    // drawing invisible troika text). Centre is never culled.
    if (groupRef.current) groupRef.current.visible = center || edge > 0.003

    // Shared heading + subtitle ride the live edge (side frames), or the
    // develop-in / browse-out cross-fade at centre.
    if (titleRef.current) titleRef.current.fillOpacity = center ? edge * f : edge
    if (emRef.current) emRef.current.fillOpacity = center ? edge * (1 - f) : edge
    if (!center) return

    // The centre frame's heading duplicates the big broadcast title in browse,
    // so it's hidden there and "develops" in as the shell dissolves on scroll-in
    // (fade 0→1). The browse-only call-to-action group is the inverse: full in
    // browse, faded out on scroll-in so the title card is left clean.
    const browse = edge * (1 - f)
    // pulse breathes to signal a button; hovering pins it solid + bright
    const pulse = hovered.current
      ? 1
      : 0.62 + 0.38 * Math.sin(state.clock.elapsedTime * 2.4)
    if (playRef.current) playRef.current.fillOpacity = browse * pulse
    if (playTriRef.current) playTriRef.current.material.opacity = browse * pulse
    if (focalRef.current) focalRef.current.fillOpacity = browse
    if (focalDotRef.current) focalDotRef.current.material.opacity = browse

    // Focus title card — develops in on scroll-in (opacity ∝ fade)
    const card = edge * f
    if (tagRef.current) tagRef.current.fillOpacity = card
    if (metaRef.current) metaRef.current.fillOpacity = card
    if (emCardRef.current) emCardRef.current.fillOpacity = card
    if (selfRef.current) selfRef.current.fillOpacity = card
    if (focalCardRef.current) focalCardRef.current.fillOpacity = card
    if (focalDotCardRef.current) focalDotCardRef.current.material.opacity = card

    // Place the glyph as a SUFFIX after the label and keep the label+glyph pair
    // centred: measure the rendered label width, then park both around x=0.
    const info = playRef.current?.textRenderInfo
    if (info && playTriRef.current) {
      const w = info.blockBounds[2] - info.blockBounds[0]
      const total = w + CTA_GAP + CTA_GLYPH
      playRef.current.position.x = -total / 2
      playTriRef.current.position.x = -total / 2 + w + CTA_GAP + CTA_GLYPH / 2
    }
  })

  const titleColor = center ? '#faedd2' : '#cfc6b3'
  const emColor = center ? '#c8a157' : '#9a9486'

  // The centre (FIRST LIGHT) frame parks as a full title card — scaled up
  // with a clean three-tier hierarchy. Side reels keep their compact hero
  // sizing untouched.
  const lay = center
    ? {
        label: 11,
        title: 42,
        em: 20,
        titlePos: [-120, 54, 2],
        titleAnchorY: 'top',
        // subtitle centred in the upper cell; CTA stack sits below it
        emPos: [0, 28, 2],
        emAnchorX: 'center',
        emAnchorY: 'middle',
      }
    : {
        label: 9,
        title: 28,
        em: 13,
        titlePos: [-112, -30, 2],
        titleAnchorY: 'bottom',
        emPos: [-112, -50, 2],
        emAnchorX: 'left',
        emAnchorY: 'bottom',
      }

  return (
    <group ref={groupRef}>
      <mesh renderOrder={ro}>
        <planeGeometry args={[FW, FH]} />
        <shaderMaterial
          vertexShader={baseVert}
          fragmentShader={frameFrag}
          uniforms={frameUniforms}
          transparent
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0, 0, 1]} renderOrder={ro + 0.1}>
        <planeGeometry args={[CW, CH]} />
        <shaderMaterial
          vertexShader={baseVert}
          fragmentShader={cellFrag}
          uniforms={cellUniforms}
          transparent
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      <Text
        ref={titleRef}
        font={FONTS.anton}
        fontSize={lay.title}
        color={titleColor}
        anchorX="left"
        anchorY={lay.titleAnchorY}
        lineHeight={0.92}
        position={lay.titlePos}
        fillOpacity={center ? 0 : edge0}
        renderOrder={ro + 0.2}
        depthOffset={-1}
        material-depthTest={false}
        material-depthWrite={false}
      >
        {title.toUpperCase()}
      </Text>

      <Text
        ref={emRef}
        font={FONTS.cormorantItalic}
        fontSize={lay.em}
        color={emColor}
        anchorX={lay.emAnchorX}
        anchorY={lay.emAnchorY}
        position={lay.emPos}
        fillOpacity={edge0}
        renderOrder={ro + 0.2}
        depthOffset={-1}
        material-depthTest={false}
        material-depthWrite={false}
      >
        {em}
      </Text>

      {center && (
        <>
          {/* ── Focus title card (left-aligned) — the full FIRST LIGHT card that
              develops in on scroll-in (opacity ∝ fade). Heading is the shared
              Anton text above. These are the inverse of the browse elements. ── */}
          <Text
            ref={tagRef}
            font={FONTS.dmMono400}
            fontSize={11}
            color="#dcd9c8"
            anchorX="left"
            anchorY="top"
            letterSpacing={0.2}
            position={[-118, 92, 2]}
            fillOpacity={0}
            renderOrder={ro + 0.2}
            depthOffset={-1}
            material-depthTest={false}
            material-depthWrite={false}
          >
            {`${roman}  ${tag}`}
          </Text>
          <Text
            ref={metaRef}
            font={FONTS.dmMono400}
            fontSize={11}
            color="#9b9789"
            anchorX="left"
            anchorY="top"
            letterSpacing={0.16}
            position={[44, 92, 2]}
            fillOpacity={0}
            renderOrder={ro + 0.2}
            depthOffset={-1}
            material-depthTest={false}
            material-depthWrite={false}
          >
            {meta}
          </Text>
          <Text
            ref={emCardRef}
            font={FONTS.cormorantItalic}
            fontSize={18}
            color="#c8a157"
            anchorX="left"
            anchorY="top"
            position={[-118, -28, 2]}
            fillOpacity={0}
            renderOrder={ro + 0.2}
            depthOffset={-1}
            material-depthTest={false}
            material-depthWrite={false}
          >
            {em}
          </Text>
          {isFirstLight && (
            <Text
              ref={selfRef}
              font={FONTS.dmMono400}
              fontSize={11}
              color="#dcd9c8"
              anchorX="left"
              anchorY="top"
              letterSpacing={0.14}
              position={[-118, -58, 2]}
              fillOpacity={0}
              renderOrder={ro + 0.2}
              depthOffset={-1}
              material-depthTest={false}
              material-depthWrite={false}
            >
              {caption}
            </Text>
          )}
          <mesh ref={focalDotCardRef} position={[-115, -84, 2]} renderOrder={ro + 0.2}>
            <circleGeometry args={[3, 16]} />
            <meshBasicMaterial
              color="#c8a157"
              transparent
              opacity={0}
              depthTest={false}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <Text
            ref={focalCardRef}
            font={FONTS.dmMono400}
            fontSize={9}
            color="#c8a157"
            anchorX="left"
            anchorY="middle"
            letterSpacing={0.25}
            position={[-106, -84, 2]}
            fillOpacity={0}
            renderOrder={ro + 0.2}
            depthOffset={-1}
            material-depthTest={false}
            material-depthWrite={false}
          >
            FOCAL
          </Text>

          {/* Call to action, inside the cell below the subtitle. FIRST LIGHT
              enters by scrolling into Act I (SCROLL DOWN + a ▽ glyph); the other
              chapters by the play button (PRESS PLAY + a ▶ glyph). The glyph is a
              SUFFIX — the label + glyph are measured and centred in the fade
              loop. Both pulse together (breathing) to read as a button. */}
          <Text
            ref={playRef}
            font={FONTS.dmMono400}
            fontSize={11}
            color="#efe7d6"
            anchorX="left"
            anchorY="middle"
            letterSpacing={0.16}
            position={[-40, -14, 2]}
            fillOpacity={edge0}
            renderOrder={ro + 0.2}
            depthOffset={-1}
            material-depthTest={false}
            material-depthWrite={false}
          >
            {isFirstLight ? 'SCROLL DOWN' : 'PRESS PLAY'}
          </Text>
          <mesh
            ref={playTriRef}
            position={[40, -14, 2]}
            rotation={[0, 0, isFirstLight ? -Math.PI / 2 : 0]}
            renderOrder={ro + 0.2}
          >
            <circleGeometry args={[6.5, 3]} />
            <meshBasicMaterial
              color="#efe7d6"
              transparent
              depthTest={false}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          {/* FOCAL status pip, centred below the CTA */}
          <mesh ref={focalDotRef} position={[-26, -44, 2]} renderOrder={ro + 0.2}>
            <circleGeometry args={[3, 16]} />
            <meshBasicMaterial
              color="#c8a157"
              transparent
              depthTest={false}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <Text
            ref={focalRef}
            font={FONTS.dmMono400}
            fontSize={9}
            color="#c8a157"
            anchorX="left"
            anchorY="middle"
            letterSpacing={0.25}
            position={[-18, -44, 2]}
            fillOpacity={edge0}
            renderOrder={ro + 0.2}
            depthOffset={-1}
            material-depthTest={false}
            material-depthWrite={false}
          >
            FOCAL
          </Text>

          {/* Invisible click target over the CTA (browse only). A mesh is a
              reliable raycast target; the room canvas above is pointer-events
              none so the click reaches the Hero canvas. */}
          {onEnter && !focus && (
            <mesh
              position={[0, -14, 3]}
              onClick={(e) => {
                e.stopPropagation()
                onEnter()
              }}
              onPointerOver={(e) => {
                e.stopPropagation()
                hovered.current = true
                document.body.style.cursor = 'pointer'
              }}
              onPointerOut={() => {
                hovered.current = false
                document.body.style.cursor = 'auto'
              }}
            >
              <planeGeometry args={[172, 44]} />
              <meshBasicMaterial transparent opacity={0} depthTest={false} depthWrite={false} />
            </mesh>
          )}
        </>
      )}
    </group>
  )
}
