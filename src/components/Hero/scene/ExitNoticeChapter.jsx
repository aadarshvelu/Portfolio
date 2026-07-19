/**
 * Exit Notice — Postcard
 *
 * See `exit-notice.md` at repo root for the full spec (phases, per-bp layout
 * tables, position formulas, reveal-animation schedule, render-order chart).
 *
 * Architecture:
 *   - ExitNoticeBackdrop : full-viewport cream plane, masks newspaper.
 *   - ExitNoticeChapter  : viewport-centered cardstock + content. Dollies in
 *     via root-group scale 0.92 → 1.00 + opacity stagger.
 *   - Both are siblings of paperGroup in CraftsChapter, NOT children.
 *     Both auto-size from live camera fov + peelDist.
 */

import { Fragment, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Line } from '@react-three/drei'
import { FONTS } from '../../../fonts.js'
import { ORDER } from '../config.js'
import { useBp, useLayout } from '../breakpoint.js'

const DEG = Math.PI / 180
const PI  = Math.PI
const clamp01 = (x) => Math.min(1, Math.max(0, x))
const smoothstep = (x) => x * x * (3 - 2 * x)

// ── Chapter-local p thresholds ─────────────────────────────────────────────
// The postcard is the closing message and was flying past too fast to read
// ("everyone is missing it"). Story3's park now ends at p=0.835 (CraftsChapter
// KEYS) and the runway is 2000vh, so the finale gets more of both the chapter
// budget AND physical scroll. Budget: a newspaper→note reveal 0.84→0.89, a LONG
// reading hold 0.89→0.97 before it flips, the flip to the Contact "director
// takes calls" back-face 0.97→0.992, then the clap 0.992→1.0. The 2000vh runway
// keeps the flip and clap from feeling quick despite their small p-fractions.
const EXIT_ENTER_P = 0.84   // backdrop + cardstock reveal begins (after story3 park)
const EXIT_LAND_P  = 0.89   // front content fully revealed
const FLIP_START_P = 0.97   // reading hold 0.89→0.97 — more scroll room to read the note before it flips
const FLIP_END_P   = 0.992  // flip complete; 0.992→1.00 plays the clap

// ── Render-order constants (see spec) ─────────────────────────────────────
// Backdrop sits BELOW everything in the chapter but ABOVE the newspaper. The
// newspaper text uses ORDER.nextChapter + 1 (73) and DimOverlay uses + 1 (74,
// see CraftsChapter). Backdrop = 75 sits cleanly above all newspaper layers.
// Cardstock + content jump to 80+ with a wide integer gap so three.js's
// transparent sort can never collapse them onto the backdrop bucket.
const RO_BACKDROP   = ORDER.nextChapter + 3     // 75
const RO_CARDSTOCK  = ORDER.nextChapter + 8     // 80
const RO_TEXT       = ORDER.nextChapter + 9     // 81
const RO_MARK       = ORDER.nextChapter + 10    // 82

// ── Per-breakpoint layout (DEDICATED VALUES — not scaled desktop) ─────────
const POSTCARD_BP = {
  desktop: {
    cardWFrac:       0.58,
    cardAspect:      2 / 3,
    padFrac:         0.085,
    fontHeaderMul:   0.025,
    fontBodyMul:     0.040,
    fontNoteMul:     0.036,
    fontSigMul:      0.068,
    lineGapMul:      2.8,
    headerMarginMul: 2.5,
    sigMarginMul:    1.6,
    rotationDeg:    -0.5,
    lastDateX: -.1,
    lastDateY: .06,
    lastDateFontSize: 0.0,
    SignFontSize: 0,
    SignX: 0,
    SignY: 0,
    AlwaysNoteFontSize: 0,
    AlwaysNoteY: .01,
    Line1X: 0,
    Line1Y: 0,
    Line2X: 0,
    Line2Y: 0,
    Line3X: 0,
    Line3Y: 0,
    
    WavyX: .01,
    WavyY: 0,
    CCircleX: 0,
    CCircleY: 0,
    ICircleX: 0,
    ICircleY: 0,

    ForTheRecordX: .07,
    NoteHeaderX: .06,

    // Back-face (Contact)
    fontKickerMul:    0.022,
    fontHeadlineMul:  0.090,
    fontLabelMul:     0.028,
    fontValueMul:     0.034,
    fontCueMul:       0.028,
    contactRowGapMul: 0.070,
  },
  tablet: {
    cardWFrac:       0.86,
    cardAspect:      1.0,
    padFrac:         0.075,
    fontHeaderMul:   0.024,
    fontBodyMul:     0.040,
    fontNoteMul:     0.034,
    fontSigMul:      0.060,
    lineGapMul:      3.5,
    headerMarginMul: 2.8,
    sigMarginMul:    2.0,
    rotationDeg:    -0.4,
    lastDateX: -.1,
    lastDateY: .15,
    lastDateFontSize: 0.03,
    SignFontSize: 0.06,
    SignX: -.02,
    SignY: .15,
    
    AlwaysNoteFontSize: 0.01,
    AlwaysNoteY: .168,

    Line1X: .03,
    Line1Y: .15,
    Line2X: .03,
    Line2Y: .15,
    Line3X: .03,
    Line3Y: .15,

    WavyX: -.02,
    WavyY: .15,
    CCircleX: .03,
    CCircleY: .15,
    ICircleX: .03,
    ICircleY: .15,

    ForTheRecordX: .09,
    NoteHeaderX: .06,

  },
  mobile: {
    cardWFrac:       0.94,
    cardAspect:      1.3,
    padFrac:         0.065,
    fontHeaderMul:   0.024,
    fontBodyMul:     0.050,
    fontNoteMul:     0.034,
    fontSigMul:      0.058,
    lineGapMul:      3.2,
    headerMarginMul: 3.0,
    sigMarginMul:    2.2,
    rotationDeg:    -0.3,
    lastDateX: -.1,
    lastDateY: .35,
    lastDateFontSize: 0.03,
    SignFontSize: 0.06,
    SignX: -.02,
    SignY: .35,
    
    AlwaysNoteFontSize: 0.01,
    AlwaysNoteY: .22,

    Line1X: .03,
    Line1Y: .2,
    Line2X: .03,
    Line2Y: .2,
    Line3X: .03,
    Line3Y: .2,

    WavyX: .013,
    WavyY: .2,
    CCircleX: .03,
    CCircleY: .2,
    ICircleX: .03,
    ICircleY: .2,

    ForTheRecordX: .07,
    NoteHeaderX: .06,
  },
}

const RED       = '#b6342b'
const RED_DK    = '#8a2a20'
const INK       = '#1a1612'
const INK_FADE  = '#3a3128'

const TEXT_LINE_1 = 'AI helped me write the code.'
const TEXT_LINE_2 = 'The creativity is mine.'
const TEXT_LINE_3 = 'So is the intelligence.'

const GOLD = '#c8a157'
const WARM = '#ffd07a'

// Clapperboard back-face palette — text reads light on dark slate
const CLAP_INK      = '#ece5d0'   // headline + values
const CLAP_INK_FADE = '#a8a292'   // kicker + labels
const CLAP_DIVIDER  = '#7a7464'   // rule under headline

// Contact data — same content as Contact.html
const CONTACT_ROWS = [
  { label: 'EMAIL',    value: 'aadarshvelu@gmail.com',     href: 'mailto:aadarshvelu@gmail.com' },
  { label: 'LINKEDIN', value: 'linkedin.com/in/aadarshvelu', href: 'https://linkedin.com/in/aadarshvelu' },
  { label: 'INDIA',    value: '+91 86100 47522',             href: 'tel:+918610047522' },
  { label: 'UAE',      value: '+971 52 807 0820',            href: 'tel:+971528070820' },
  { label: 'RÉSUMÉ',   split: true,
    preview:  'https://resume.whoisaadar.sh',
    download: 'https://resume.whoisaadar.sh/download' },
]
const CONTACT_KICKER_LEFT   = 'REEL Nº 02'
const CONTACT_KICKER_RIGHT  = ' · CONTACT · WHERE TO REACH HIM'
const CONTACT_HEADLINE_LEFT = 'The director takes'
const CONTACT_HEADLINE_GOLD = ' calls.'
const CONTACT_CUE = '— Two phones · one inbox · always answering.'

// ── Backdrop shader — early-morning sunny sky ─────────────────────────────
// Three vertical bands (gold horizon → warm peach → soft pink lavender) plus
// a subtle radial bloom near the lower-center that reads as a low sun
// breaking through. Solid alpha — masks newspaper completely when fully in.
const skyVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const skyFrag = /* glsl */ `
  varying vec2 vUv;
  uniform float uOpacity;
  void main() {
    // Vertical gradient — bottom (warm gold) → top (soft lavender pink)
    vec3 cBottom = vec3(0.984, 0.835, 0.502);   // #fbd580 morning gold
    vec3 cMid    = vec3(0.961, 0.682, 0.553);   // #f5ae8d warm peach
    vec3 cTop    = vec3(0.886, 0.749, 0.792);   // #e2bfca soft dawn pink
    float t = vUv.y;
    vec3 col = mix(cBottom, cMid, smoothstep(0.0, 0.55, t));
    col      = mix(col,     cTop, smoothstep(0.45, 1.0, t));

    // Low sun bloom — soft warm halo offset slightly right of center, low
    // in the frame. Adds depth without becoming a literal sun disc.
    vec2  sunPos  = vec2(0.62, 0.18);
    float d       = distance(vUv, sunPos);
    float bloom   = smoothstep(0.55, 0.05, d) * 0.45;
    col += vec3(1.0, 0.92, 0.72) * bloom;

    // Subtle vignette — pulls the edges down a hair so the postcard centre
    // reads brighter than the corners.
    vec2  e = vUv - 0.5;
    float vig = 1.0 - dot(e, e) * 0.45;
    col *= vig;

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), uOpacity);
  }
`

// ── Cardstock shader (aged paper with noise + corner wear) ─────────────────
const cardVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const cardFrag = /* glsl */ `
  varying vec2 vUv;
  uniform float uOpacity;
  float hash21(vec2 p) { p = fract(p * vec2(233.34, 851.74)); p += dot(p, p + 23.45); return fract(p.x * p.y); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x),
               mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y);
  }
  void main() {
    float d = length(vUv - 0.5) * 1.8;
    vec3 c1 = vec3(0.965, 0.937, 0.851);
    vec3 c2 = vec3(0.925, 0.874, 0.749);
    vec3 c3 = vec3(0.863, 0.784, 0.627);
    vec3 col = mix(mix(c1, c2, clamp(d * 1.2, 0.0, 1.0)), c3, clamp(d * 0.6, 0.0, 1.0));
    float g = noise(vUv * 180.0) * 0.06 + noise(vUv * 360.0) * 0.03;
    col += g - 0.04;
    vec2 ec = abs(vUv - 0.5);
    col -= length(max(ec - 0.4, 0.0)) * 0.18;
    gl_FragColor = vec4(clamp(col, 0.0, 1.0), uOpacity);
  }
`

// ── Clapperboard SLATE body (no stripes — arm is its own hinged mesh) ─────
const clapboardFrag = /* glsl */ `
  varying vec2 vUv;
  uniform float uOpacity;
  float hash21(vec2 p) { p = fract(p * vec2(233.34, 851.74)); p += dot(p, p + 23.45); return fract(p.x * p.y); }
  void main() {
    vec3 slate = vec3(0.085, 0.085, 0.095);
    float g = (hash21(vUv * 600.0) - 0.5) * 0.025;
    vec3 col = slate + g;
    vec2 ec = abs(vUv - 0.5);
    col -= length(max(ec - 0.48, 0.0)) * 0.6;
    gl_FragColor = vec4(clamp(col, 0.0, 1.0), uOpacity);
  }
`

// ── Clap-arm STRIPES shader (rendered on a hinged plank above the slate) ──
const clapStripesFrag = /* glsl */ `
  varying vec2 vUv;
  uniform float uOpacity;
  void main() {
    float t = (vUv.x + (1.0 - vUv.y) * 0.3) * 9.0;
    float stripe = step(0.5, fract(t));
    vec3 col = mix(vec3(0.06, 0.06, 0.07), vec3(0.945, 0.928, 0.875), stripe);
    // Dark trim along top + bottom edges so the plank reads as a solid arm
    float topEdge = smoothstep(0.92, 1.0, vUv.y);
    float botEdge = smoothstep(0.08, 0.0, vUv.y);
    col -= (topEdge + botEdge) * 0.18;
    gl_FragColor = vec4(clamp(col, 0.0, 1.0), uOpacity);
  }
`

// ── Geometry helpers (card-local units, cardW = 1.0) ──────────────────────
function makeWavy(x0, y0, w, amp) {
  const pts = []
  for (let i = 0; i <= 48; i++) {
    const t = i / 48
    pts.push([x0 + t * w, y0 + Math.sin(t * Math.PI * 5) * amp, 0.01])
  }
  return pts
}

function makeCircle(cx, cy, rx, ry) {
  const pts = []
  for (let i = 0; i <= 72; i++) {
    const a = (i / 72) * Math.PI * 2
    const wobble = 1 + 0.04 * Math.sin(a * 3.7 + 0.8)
    pts.push([cx + Math.cos(a) * rx * wobble, cy + Math.sin(a) * ry * wobble, 0.01])
  }
  return pts
}

function exitTOf(p) {
  return clamp01((p - EXIT_ENTER_P) / (EXIT_LAND_P - EXIT_ENTER_P))
}
function flipTOf(p) {
  return clamp01((p - FLIP_START_P) / (FLIP_END_P - FLIP_START_P))
}

// ═══════════════════════════════════════════════════════════════════════════
// BACKDROP — full-viewport mask
// ═══════════════════════════════════════════════════════════════════════════

export function ExitNoticeBackdrop({ pRef }) {
  const { peel: peelLayout } = useLayout()
  const peelDist = peelLayout.peelDist
  const overscan = peelLayout.overscan

  const meshRef = useRef()
  const skyUniforms = useMemo(() => ({ uOpacity: { value: 0 } }), [])

  useFrame((state) => {
    const cam = state.camera
    const p = pRef.current ?? 0

    const h_vp = 2 * peelDist * Math.tan((cam.fov * DEG) / 2) * overscan
    const w_vp = h_vp * state.size.width / state.size.height

    const exitT = exitTOf(p)
    const alpha = smoothstep(clamp01(exitT / 0.25))

    skyUniforms.uOpacity.value = alpha
    if (meshRef.current) {
      meshRef.current.scale.set(w_vp, h_vp, 1)
      meshRef.current.visible = alpha > 0.001
    }
  })

  return (
    <mesh
      ref={meshRef}
      renderOrder={RO_BACKDROP}
      position={[0, 0, 0.05]}
      visible={false}
    >
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={skyVert}
        fragmentShader={skyFrag}
        uniforms={skyUniforms}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// CARD — cardstock + content, viewport-centered
// ═══════════════════════════════════════════════════════════════════════════

export default function ExitNoticeChapter({ pRef }) {
  const bp = useBp()
  const L  = POSTCARD_BP[bp] ?? POSTCARD_BP.desktop
  const { peel: peelLayout } = useLayout()
  const peelDist = peelLayout.peelDist
  const overscan = peelLayout.overscan

  // ── Card-local geometry (cardW = 1.0; root group scales to world cardW) ─
  const cardH    = L.cardAspect
  const pad      = L.padFrac
  const leftX    = -0.5 + pad
  const rightX   =  0.5 - pad

  const fsHeader = L.fontHeaderMul
  const fsBody   = L.fontBodyMul
  const fsNote   = L.fontNoteMul
  const fsSig    = L.fontSigMul

  const headerY  =  cardH / 2 - L.headerMarginMul * fsHeader
  const ruleY    =  headerY - 1.4 * fsHeader
  const lineGap  =  L.lineGapMul * fsBody
  const line1Y   = +lineGap
  const line2Y   =  0
  const line3Y   = -lineGap
  const sigY     = -cardH / 2 + L.sigMarginMul * fsSig

  // ── Char-width math (Courier monospace) ─────────────────────────────────
  const chBody   = fsBody * 0.604
  const chHeader = fsHeader * 0.604 * (1 + 0.26)  // header has letterSpacing 0.26

  // ── Red-pen mark positions ──────────────────────────────────────────────
  // Line 1: "AI helped me write the code." — chars 23..27 = "code." (28 total)
  const wavyX0 = leftX + 23 * chBody
  const wavyY0 = line1Y - 0.6 * fsBody
  const wavyW  = 5 * chBody
  const wavyAmp = 0.005

  // Line 2: "The creativity is mine." — "creativity" = chars 4..13 (10 chars wide)
  const cCx  = leftX + (4 + 5) * chBody   // center of "creativity"
  const cRx  = 5 * chBody + 0.28 * fsBody
  const cRy  = 0.62 * fsBody

  // Line 3: "So is the intelligence." — "intelligence" = chars 10..21 (12 chars wide)
  const iCx  = leftX + (10 + 6) * chBody  // center of "intelligence"
  const iRx  = 6 * chBody + 0.28 * fsBody
  const iRy  = 0.62 * fsBody

  // Note "always was. ↘" — above "mine" (chars 18..21 of line 2)
  const noteX = leftX + 16 * chBody
  const noteY = line2Y + 0.45 * fsBody

  // ── Pre-computed geometry ───────────────────────────────────────────────
  const wavyPts = useMemo(
    () => makeWavy(wavyX0- + L.WavyX, wavyY0 + L.WavyY, wavyW, wavyAmp),
    [wavyX0, wavyY0, wavyW]
  )
  const cCirclePts = useMemo(
    () => makeCircle(cCx + L.CCircleX, line2Y + L.CCircleY, cRx, cRy),
    [cCx, cRx, cRy, line2Y]
  )
  const iCirclePts = useMemo(
    () => makeCircle(iCx + L.ICircleX, line3Y + L.ICircleY, iRx, iRy),
    [iCx, iRx, iRy, line3Y]
  )
  const rulePts = useMemo(
    () => [[leftX + .03, ruleY, 0.005], [rightX, ruleY, 0.005]],
    [leftX, rightX, ruleY]
  )

  // ── Back-face (Contact) layout — desktop fallback for un-tuned bp ───────
  const D = POSTCARD_BP.desktop
  const fsKicker   = L.fontKickerMul    ?? D.fontKickerMul
  const fsHeadline = L.fontHeadlineMul  ?? D.fontHeadlineMul
  const fsLabel    = L.fontLabelMul     ?? D.fontLabelMul
  const fsValue    = L.fontValueMul     ?? D.fontValueMul
  const fsCue      = L.fontCueMul       ?? D.fontCueMul
  // Arm is now a hinged plank above the slate — slate top is clean again
  const bKickerY    =  cardH / 2 - 0.10 * cardH
  const bHeadlineY  =  cardH / 2 - 0.27 * cardH
  // Divider under the headline; rows fill the band down to just above the cue
  const bDividerY   =  cardH * 0.10
  const bCueY       = -cardH / 2 + 0.10 * cardH
  // Contact rows (incl. the RÉSUMÉ row) fill the band between the divider and
  // just above the cue, evenly spaced — so any row count stays clear of both.
  const bRowTop = bDividerY - 0.05
  const bRowBot = bCueY + 0.05
  const bRowGap = (bRowTop - bRowBot) / Math.max(1, CONTACT_ROWS.length - 1)
  const bRowYs  = CONTACT_ROWS.map((_, i) => bRowTop - i * bRowGap)
  const chKicker       = fsKicker * 0.604 * (1 + 0.42)
  const bKickerSplit   = leftX + 10 * chKicker
  const chHeadline     = fsHeadline * 0.43
  const bHeadlineSplit = leftX + 17.5 * chHeadline
  const bDividerPts    = [[leftX, bDividerY, 0.005], [rightX, bDividerY, 0.005]]

  // ── Shader + refs ───────────────────────────────────────────────────────
  const cardUniforms  = useMemo(() => ({ uOpacity: { value: 0 } }), [])
  const cardUniformsB = useMemo(() => ({ uOpacity: { value: 0 } }), [])
  const armUniforms   = useMemo(() => ({ uOpacity: { value: 0 } }), [])
  const armRef        = useRef()

  const rootRef = useRef()
  const tiltRef = useRef()
  const frontFaceRef = useRef(), backFaceRef = useRef()
  const rHeader = useRef(), rHeaderG = useRef(), rHeaderR = useRef()
  const rLine1  = useRef(), rLine2  = useRef(),  rLine3  = useRef()
  const rNote   = useRef(), rSigName = useRef(), rSigDate = useRef()
  const rRule   = useRef(), rWavy   = useRef()
  const rCCircle = useRef(), rICircle = useRef(), rSwoosh = useRef()
  const rBKickerG = useRef(), rBKickerL = useRef()
  const rBHeadL   = useRef(), rBHeadG   = useRef()
  const rBDivider = useRef()
  const rBLabels  = [useRef(), useRef(), useRef(), useRef(), useRef()]
  const rBValues  = [useRef(), useRef(), useRef(), useRef(), useRef()]
  const rBPips    = [useRef(), useRef(), useRef(), useRef(), useRef()]
  const rBCue     = useRef()
  const rBPrev    = useRef(), rBSep = useRef(), rBDl = useRef() // RÉSUMÉ split links

  useFrame((state) => {
    const cam = state.camera
    const p   = pRef.current ?? 0

    // Live viewport size in world units at chapter render plane
    const h_vp = 2 * peelDist * Math.tan((cam.fov * DEG) / 2) * overscan
    const w_vp = h_vp * state.size.width / state.size.height
    const cardWworld = w_vp * L.cardWFrac

    const exitT = exitTOf(p)
    const flipT = flipTOf(p)

    // ── Root group: viewport-center + dolly scale + flip ──
    // Z tilt now lives on the inner front/back groups so it doesn't compose
    // oddly with the Y flip. Y rotation flips the card over to its back.
    const rg = rootRef.current
    if (rg) {
      const dolly = 0.92 + 0.08 * smoothstep(exitT)
      rg.scale.setScalar(cardWworld * dolly)
      rg.position.set(0, 0, 0.10)
      rg.rotation.set(0, flipT * PI, 0)
      rg.visible = exitT > 0.001
    }
    // drei <Text> doesn't cull by face winding — hide the away-facing face
    // so its mirrored ghost doesn't bleed through.
    if (frontFaceRef.current) frontFaceRef.current.visible = flipT < 0.5
    if (backFaceRef.current)  backFaceRef.current.visible  = flipT >= 0.5

    // ── Opacity stagger ──
    cardUniforms.uOpacity.value = smoothstep(exitT)

    const tText    = smoothstep(clamp01((exitT - 0.10) / 0.40))
    const tCircle  = smoothstep(clamp01((exitT - 0.30) / 0.35))
    const tWavy    = smoothstep(clamp01((exitT - 0.30) / 0.35))
    const tNote    = smoothstep(clamp01((exitT - 0.45) / 0.35))
    const tSig     = smoothstep(clamp01((exitT - 0.55) / 0.35))

    const setText = (ref, v) => {
      if (!ref.current) return
      ref.current.fillOpacity = v
      if (ref.current.material) ref.current.material.opacity = v
    }
    setText(rHeader, tText)
    setText(rHeaderG, tText)
    setText(rHeaderR, tText)
    setText(rLine1, tText)
    setText(rLine2, tText)
    setText(rLine3, tText)
    setText(rNote, tNote)
    setText(rSigName, tSig)
    setText(rSigDate, tSig)

    const setLine = (ref, v) => {
      if (ref.current?.material) ref.current.material.opacity = v
    }
    setLine(rRule, tText)
    setLine(rWavy, tWavy)
    setLine(rCCircle, tCircle)
    setLine(rICircle, tCircle)
    setLine(rSwoosh, tSig)

    // Back-side cardstock + Contact content
    cardUniformsB.uOpacity.value = smoothstep(exitT)
    armUniforms.uOpacity.value   = smoothstep(exitT)

    // Pointer-driven 3D tilt — same parallax feel as Hero. Wraps both faces
    // so it composes correctly with the flip and clap. Eases toward target
    // each frame so motion feels weighted, not jittery.
    if (tiltRef.current) {
      const MAX_TILT  = 0.05    // ~2.9° max
      const TILT_EASE = 0.06
      // Tilt only kicks in once the card has revealed
      const k = smoothstep(exitT)
      const targetX = -state.pointer.y * MAX_TILT * k
      const targetY =  state.pointer.x * MAX_TILT * k
      const r = tiltRef.current.rotation
      r.x += (targetX - r.x) * TILT_EASE
      r.y += (targetY - r.y) * TILT_EASE
    }

    // Clap animation — fires AFTER the card's Y flip locks (p >= FLIP_END_P).
    // The final scroll segment (FLIP_END_P → 1.0) drives a full open/close
    // cycle: 0° → 15° → 0°. Arm sits at 0° before and stays at 0° after.
    if (armRef.current) {
      const clapT = clamp01((p - FLIP_END_P) / (1.0 - FLIP_END_P))
      armRef.current.rotation.z = Math.sin(clapT * PI) * 15 * DEG
    }
    const tBack = smoothstep(clamp01((flipT - 0.45) / 0.35))
    setText(rBKickerG, tBack)
    setText(rBKickerL, tBack)
    setText(rBHeadL,   tBack)
    setText(rBHeadG,   tBack)
    setText(rBCue,     tBack)
    setLine(rBDivider, tBack)
    for (let i = 0; i < CONTACT_ROWS.length; i++) {
      setText(rBLabels[i], tBack)
      setText(rBValues[i], tBack)
      if (rBPips[i].current) rBPips[i].current.material.opacity = tBack
    }
    setText(rBPrev, tBack)
    setText(rBSep, tBack)
    setText(rBDl, tBack)
  })

  return (
    // renderOrder on this group is REQUIRED. Three.js's projectObject uses
    // the innermost ancestor Group's renderOrder as the primary sort key
    // for its descendants, overriding each mesh's own renderOrder. Without
    // this, cardstock + content inherit the default groupOrder of 0 from
    // this <group>, sort BEFORE the backdrop (which sits under ChapterPeel's
    // children group at renderOrder 72), and get painted over.
    <group ref={rootRef} renderOrder={RO_CARDSTOCK} visible={false}>
    {/* TILT wrapper — pointer-driven 3D parallax, applied AFTER the flip so
        it tilts whichever face is showing. renderOrder propagates. */}
    <group ref={tiltRef} renderOrder={RO_CARDSTOCK}>
    {/* FRONT FACE — Exit Notice. renderOrder REQUIRED so this inner group's
        groupOrder doesn't fall back to 0 and let the backdrop paint over it. */}
    <group ref={frontFaceRef} renderOrder={RO_CARDSTOCK} rotation={[0, 0, L.rotationDeg * DEG]}>
      {/* Cardstock paper — aged cream with noise + corner wear */}
      <mesh renderOrder={RO_CARDSTOCK}>
        <planeGeometry args={[1, cardH]} />
        <shaderMaterial
          vertexShader={cardVert}
          fragmentShader={cardFrag}
          uniforms={cardUniforms}
          transparent
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {/* Header rule */}
      <Line
        ref={rRule}
        points={rulePts}
        color={INK}
        lineWidth={0.6}
        transparent
        opacity={0}
        renderOrder={RO_TEXT}
      />

      {/* Header — left: "A Note · " (ink) */}
      <Text
        ref={rHeader}
        font={FONTS.dmMono400}
        fontSize={fsHeader}
        color={INK_FADE}
        anchorX="left"
        anchorY="middle"
        letterSpacing={0.26}
        fillOpacity={0}
        renderOrder={RO_TEXT}
        position={[leftX + L.NoteHeaderX, headerY, 0.008]}
      >
        {'A Note · '}
      </Text>

      {/* Header — gold accent: "For the Record" */}
      <Text
        ref={rHeaderG}
        font={FONTS.dmMono400}
        fontSize={fsHeader}
        color={RED_DK}
        anchorX="left"
        anchorY="middle"
        letterSpacing={0.26}
        fillOpacity={0}
        renderOrder={RO_TEXT}
        position={[(leftX + 9 * chHeader) + L.ForTheRecordX, headerY, 0.008]}
      >
        {'For the Record'}
      </Text>

      {/* Header — right */}
      <Text
        ref={rHeaderR}
        font={FONTS.dmMono400}
        fontSize={fsHeader}
        color={INK_FADE}
        anchorX="right"
        anchorY="middle"
        letterSpacing={0.26}
        fillOpacity={0}
        renderOrder={RO_TEXT}
        position={[rightX, headerY, 0.008]}
      >
        {'Filed by Hand'}
      </Text>

      {/* Three statements (Courier bold) */}
      <Text
        ref={rLine1}
        font={FONTS.courierPrimeBold}
        fontSize={fsBody}
        color={INK}
        anchorX="left"
        anchorY="middle"
        fillOpacity={0}
        renderOrder={RO_TEXT}
        position={[leftX + L.Line1X, line1Y + L.Line1Y, 0.008]}
      >
        {TEXT_LINE_1}
      </Text>
      <Text
        ref={rLine2}
        font={FONTS.courierPrimeBold}
        fontSize={fsBody}
        color={INK}
        anchorX="left"
        anchorY="middle"
        fillOpacity={0}
        renderOrder={RO_TEXT}
        position={[leftX + L.Line2X, line2Y + L.Line2Y, 0.008]}
      >
        {TEXT_LINE_2}
      </Text>
      <Text
        ref={rLine3}
        font={FONTS.courierPrimeBold}
        fontSize={fsBody}
        color={INK}
        anchorX="left"
        anchorY="middle"
        fillOpacity={0}
        renderOrder={RO_TEXT}
        position={[leftX + L.Line3X, line3Y + L.Line3Y, 0.008]}
      >
        {TEXT_LINE_3}
      </Text>

      {/* Red pen marks */}
      <Line
        ref={rWavy}
        points={wavyPts}
        color={RED}
        lineWidth={1.6}
        transparent
        opacity={0}
        renderOrder={RO_MARK}
      />
      <Line
        ref={rCCircle}
        points={cCirclePts}
        color={RED}
        lineWidth={1.8}
        transparent
        opacity={0}
        renderOrder={RO_MARK}
      />
      <Line
        ref={rICircle}
        points={iCirclePts}
        color={RED}
        lineWidth={1.8}
        transparent
        opacity={0}
        renderOrder={RO_MARK}
      />

      {/* Handwritten "always was. ↘" */}
      <Text
        ref={rNote}
        font={FONTS.caveat600}
        fontSize={fsNote + L.AlwaysNoteFontSize}
        color={RED}
        anchorX="left"
        anchorY="bottom"
        lineHeight={1.1}
        fillOpacity={0}
        renderOrder={RO_MARK}
        rotation={[0, 0, -5 * DEG]}
        position={[noteX, noteY + L.AlwaysNoteY, 0.015]}
      >
        {'always\nwas. ↘'}
      </Text>

      {/* Signature */}
      <Text
        ref={rSigName}
        font={FONTS.caveat700}
        fontSize={fsSig + L.SignFontSize}
        color={RED}
        anchorX="right"
        anchorY="middle"
        fillOpacity={0}
        renderOrder={RO_MARK}
        rotation={[0, 0, -6 * DEG]}
        position={[rightX + L.SignX, sigY + L.SignY, 0.015]}
      >
        {'Aadarsh Velu'}
      </Text>
      {/* <Line
        ref={rSwoosh}
        points={swooshPts}
        color={RED}
        lineWidth={2.2}
        transparent
        opacity={0}
        renderOrder={RO_MARK}
      /> */}
      <Text
        ref={rSigDate}
        font={FONTS.dmMono400}
        fontSize={(fsHeader * 0.88) + L.lastDateFontSize}
        color={RED}
        anchorX="right"
        anchorY="top"
        letterSpacing={0.06}
        fillOpacity={0}
        renderOrder={RO_MARK}
        rotation={[0, 0, -6 * DEG]}
        position={[rightX + L.lastDateX, (sigY - 1.4 * fsSig) + L.lastDateY, 0.015]}
      >
        {"— May '26"}
      </Text>
    </group>

    {/* ─── BACK FACE — Contact
            Locally rotated π around Y so content initially faces -Z. After
            rootRef rotates Y → π, total = 2π and the back presents to camera
            with text reading correctly. Z tilt negated so visible tilt matches
            the front (Y rotation flips the local Z axis). ─── */}
    <group ref={backFaceRef} renderOrder={RO_CARDSTOCK} rotation={[0, PI, -L.rotationDeg * DEG]}>
      <mesh renderOrder={RO_CARDSTOCK}>
        <planeGeometry args={[1, cardH]} />
        <shaderMaterial
          vertexShader={cardVert}
          fragmentShader={clapboardFrag}
          uniforms={cardUniformsB}
          transparent
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {/* Hinged clap arm — pivots at bottom-left (where the slate top meets
          the arm). Rotation driven by useFrame: 0° → 15° → 0° over the back
          half of the flip, like a full clap. */}
      {(() => {
        const armH   = 0.14 * cardH
        const armW   = 1.0
        const hingeX = -0.5
        const hingeY =  cardH / 2
        return (
          <group ref={armRef} renderOrder={RO_CARDSTOCK} position={[hingeX, hingeY, 0.012]} rotation={[0, 0, 0]}>
            <mesh renderOrder={RO_CARDSTOCK} position={[armW / 2, armH / 2, 0]}>
              <planeGeometry args={[armW, armH]} />
              <shaderMaterial
                vertexShader={cardVert}
                fragmentShader={clapStripesFrag}
                uniforms={armUniforms}
                transparent
                depthTest={false}
                depthWrite={false}
              />
            </mesh>
          </group>
        )
      })()}

      {/* Kicker — gold "REEL Nº 02" + rest in ink-fade */}
      <Text ref={rBKickerG}
        font={FONTS.dmMono400} fontSize={fsKicker} color={GOLD}
        anchorX="left" anchorY="middle" letterSpacing={0.42}
        fillOpacity={0} renderOrder={RO_TEXT}
        position={[leftX, bKickerY, 0.008]}>
        {CONTACT_KICKER_LEFT}
      </Text>
      <Text ref={rBKickerL}
        font={FONTS.dmMono400} fontSize={fsKicker} color={CLAP_INK_FADE}
        anchorX="left" anchorY="middle" letterSpacing={0.42}
        fillOpacity={0} renderOrder={RO_TEXT}
        position={[bKickerSplit, bKickerY, 0.008]}>
        {CONTACT_KICKER_RIGHT}
      </Text>

      {/* Headline — Anton, big, with "calls." in gold */}
      <Text ref={rBHeadL}
        font={FONTS.anton} fontSize={fsHeadline} color={CLAP_INK}
        anchorX="left" anchorY="top" letterSpacing={-0.012}
        maxWidth={1 - 2 * pad}
        fillOpacity={0} renderOrder={RO_TEXT}
        position={[leftX, bHeadlineY+.07, 0.008]}>
        {CONTACT_HEADLINE_LEFT}
      </Text>
      <Text ref={rBHeadG}
        font={FONTS.anton} fontSize={fsHeadline} color={GOLD}
        anchorX="left" anchorY="top" letterSpacing={-0.012}
        fillOpacity={0} renderOrder={RO_TEXT}
        position={[bHeadlineSplit-.038, bHeadlineY+.07, 0.008]}>
        {CONTACT_HEADLINE_GOLD}
      </Text>

      {/* Divider rule */}
      <Line ref={rBDivider} points={bDividerPts}
        color={CLAP_DIVIDER} lineWidth={0.5} transparent opacity={0}
        renderOrder={RO_TEXT} />

      {/* Contact rows — label left, pip + value right */}
      {/* IMPORTANT: do NOT wrap each row in a <group>. A nested Group resets
          groupOrder to 0, so its descendants sort BEHIND the backdrop and
          become invisible. Use Fragment to keep them in the back-face group's
          groupOrder=RO_CARDSTOCK bucket. */}
      {CONTACT_ROWS.map((row, i) => {
        const rowY = bRowYs[i]
        const pipSize = fsValue * 0.30
        // Split "Preview / Download" layout — right-aligned to rightX. Courier
        // Prime is monospace, so char advance ≈ 0.6·em lets us place the parts.
        const charW = fsValue * 0.6
        const sw1 = 'Preview'.length * charW
        const swS = ' / '.length * charW
        const sw2 = 'Download'.length * charW
        const splitStartX = rightX - (sw1 + swS + sw2)
        const linkProps = (href) => ({
          onClick: (e) => { e.stopPropagation(); window.open(href, '_blank', 'noopener,noreferrer') },
          onPointerOver: (e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' },
          onPointerOut: (e) => { e.stopPropagation(); document.body.style.cursor = '' },
        })
        return (
          <Fragment key={row.label}>
            <Text ref={rBLabels[i]}
              font={FONTS.dmMono400} fontSize={fsLabel} color={CLAP_INK_FADE}
              anchorX="left" anchorY="middle" letterSpacing={0.42}
              fillOpacity={0} renderOrder={RO_TEXT}
              position={[leftX, rowY, 0.008]}>
              {row.label}
            </Text>
            <mesh ref={rBPips[i]}
              position={[rightX - 0.58, rowY, 0.009]}
              renderOrder={RO_TEXT}>
              <circleGeometry args={[pipSize, 16]} />
              <meshBasicMaterial color={WARM} transparent depthTest={false} depthWrite={false} opacity={0} />
            </mesh>
            {row.split ? (
              <>
                <Text ref={rBPrev}
                  font={FONTS.courierPrimeBold} fontSize={fsValue} color={GOLD}
                  anchorX="left" anchorY="middle" fillOpacity={0} renderOrder={RO_TEXT}
                  position={[splitStartX, rowY, 0.008]} {...linkProps(row.preview)}>
                  Preview
                </Text>
                <Text ref={rBSep}
                  font={FONTS.courierPrimeBold} fontSize={fsValue} color={CLAP_INK_FADE}
                  anchorX="left" anchorY="middle" fillOpacity={0} renderOrder={RO_TEXT}
                  position={[splitStartX + sw1, rowY, 0.008]}>
                  {' / '}
                </Text>
                <Text ref={rBDl}
                  font={FONTS.courierPrimeBold} fontSize={fsValue} color={GOLD}
                  anchorX="left" anchorY="middle" fillOpacity={0} renderOrder={RO_TEXT}
                  position={[splitStartX + sw1 + swS, rowY, 0.008]} {...linkProps(row.download)}>
                  Download
                </Text>
              </>
            ) : (
              <Text ref={rBValues[i]}
                font={FONTS.courierPrimeBold} fontSize={fsValue} color={row.gold ? GOLD : CLAP_INK}
                anchorX="right" anchorY="middle"
                fillOpacity={0} renderOrder={RO_TEXT}
                position={[rightX, rowY, 0.008]}
                onClick={(e) => {
                  e.stopPropagation()
                  if (row.href) window.open(row.href, (row.href.startsWith('http') || row.href.startsWith('/')) ? '_blank' : '_self')
                }}
                onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }}
                onPointerOut ={(e) => { e.stopPropagation(); document.body.style.cursor = '' }}>
                {row.value}
              </Text>
            )}
          </Fragment>
        )
      })}

      {/* Cue — italic Cormorant, gold */}
      <Text ref={rBCue}
        font={FONTS.cormorantItalic500} fontSize={fsCue} color={GOLD}
        anchorX="center" anchorY="middle"
        fillOpacity={0} renderOrder={RO_TEXT}
        position={[0, bCueY, 0.008]}>
        {CONTACT_CUE}
      </Text>
    </group>
    </group>
    </group>
  )
}
