import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text, Line } from '@react-three/drei'
import { FONTS } from '../../../fonts.js'
import { PEEL_START, ROSTER_START, ROSTER_END, CRAFTS_START, ORDER } from '../config.js'
import { useLayout } from '../breakpoint.js'
import { LAYOUTS } from '../layouts.js'
import { enable_ix } from "../config.js"

/**
 * Chapter III — The Roster ("Night Flight"), in WebGL so it lives inside the
 * CRT tube like every other chapter (grain, scanlines, rounded screen, chroma
 * all come from the post-process for free). Rendered as a camera-aligned scene
 * inside the page-peel: the Upgrade curls away to reveal this reel-road, and you
 * fly it across the 5 postings.
 *
 * Layout is a 100-unit-wide space (100 u = the OVERSCANNED peel width). The
 * visible viewport is smaller: halfW = 50/overscan (≈47.6, constant), halfH =
 * 50/(overscan·aspect) (varies). HUD clusters anchor to the LIVE edges each
 * frame (topRef → +halfH, botRef → -halfH). Because everything is sized as a
 * fraction of WIDTH, a narrow portrait screen makes type tiny — so the per-bp
 * `roster` config scales fonts + row spacing by `k`, the beacons by `beacon`,
 * and deepens the wave (`amp`) so the landscape design still reads on mobile.
 */

const DEG = Math.PI / 180
const clamp01 = (x) => Math.min(1, Math.max(0, x))
const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2)

// Loglines are kept short so each renders on ONE line at the chyron's font
// size / maxWidth — longer copy wraps to a second line and overprints the row
// below (baked local-y spacing). Keep each b1/b2 ≲ 60 chars.

const all_roles = [
  { num: '01', year: '2020', dates: 'JUN 2020 — FEB 2022', title: 'Junior Software Engineer', company: 'Orbital',
    b1: 'Stakeholder reporting UI — live activity + summaries.',
    b2: 'Built a shared design system adopted across new products.',
    b3: 'Learned to break systems before shipping them.',
    tools: 'React.js · Redux Toolkit · AWS Serverless · Node.js · Antd · TypeScript' },
  { num: '02', year: '2022', dates: 'FEB 2022 — MAY 2024', title: 'Senior Full-Stack Engineer', company: 'SM Technology',
    b1: 'Reusable business-module packages for plug-in delivery.',
    b2: 'Cut project timelines; helped win new partners.',
    b3: 'Doubled as data engineer — built optimized ETL pipelines.',
    tools: 'React.js · Redux Toolkit · Python · Django · FastAPI · AWS · Airflow' },
  { num: '03', year: '2024', dates: 'MAY 2024 — FEB 2025', title: 'IT Analyst · Full-Stack', company: 'Intellectyx',
    b1: 'Robust LMS — SCORM + Azure Entra ID single sign-on.',
    b2: 'Multi-region LMS across UK · USA · Europe.',
    tools: 'React.js · Redux Toolkit · Python · Django · GoLang · FastAPI · Azure' },
  { num: '04', year: '2025', dates: 'MAR 2025 — OCT 2025', title: 'Full-Stack Engineer - AI', company: 'PieLabs Inc',
    b1: 'AI researcher — computer-use QA agent, 13.5s to 5s per step.',
    b2: 'Internal LLM log-observability — I/O + token capture.',
    b3: 'Built a human-in-the-loop portal to label data for fine-tuning.',
    tools: 'GoLang · React.js · Python · Gemini · Playwright · AWS · GCP' },
  { num: '05', year: 'NOW', dates: 'NOV 2025 — PRESENT', title: 'Solutions Architect', company: 'Elyts',
    b1: 'Managed End-to-end system design, infra & payments.',
    b2: 'Developed AI Tools (Hourglass · HireHouse) — to manage my day-to-day problems.',
    b3: 'Shipped Web3 rails — swap · bridge · on/off-ramp — via an MCP app.',
    links: [
      { t: 'Hourglass', url: 'https://hourglass.elyts.tech' },
      { t: 'HireHouse', url: 'https://hirehouse.elyts.tech' },
      { t: 'tanat.app', url: 'https://tanat.app' },
      { t: 'deploy.finance', url: 'https://deploy.finance' },
    ],
    tools: 'GoLang · Python · React.js · Web3 · AWS · GCP' },
]

const alter_roles = [
  all_roles[0],
  all_roles[1],
  {
    ...all_roles[3],
    num: '03',
    dates: 'MAY 2024 — OCT 2025'
  },
  {
    ...all_roles[4],
    num: '04'
  }
]

const ROLES = enable_ix ? all_roles : alter_roles
// The inter-copy gap is placed as LEADING whitespace (and the string ENDS in a
// visible glyph, ✦). troika's blockBounds trims TRAILING whitespace only, so a
// trailing-gap string would measure short and the two-copy marquee would hiccup
// at every wrap. Leading gap → measured width = exactly 2× one copy → seamless.
const HIGHLIGHT = `      ★ ~80% HIRING NOISE REMOVED   ✦   INTERNAL AI SYSTEMS ADOPTED COMPANY-WIDE   ${enable_ix ? "✦   MULTI-REGION LMS · UK · USA · EUROPE" : ""}   ✦   REUSABLE MODULES THAT WON PARTNERS   ✦   END-TO-END SYSTEM DESIGN & PAYMENTS   ✦`

const N = ROLES.length
const TL_X0 = -40 // timeline rail extent (fixed — halfW is constant across bp)
const TL_W = 80
const NOTCH_X = ROLES.map((_, i) => TL_X0 + (i / (N - 1)) * TL_W)

const CREAM = '#f6ecd2', GOLD = '#c8a157', DIM = '#9b9789', SKY = '#0a1024'
const RO = ORDER.nextChapter

// External-link arrow (↗) drawn as thin STROKED quads in the unit box [0..1], so
// it keeps the line-arrow look but renders through meshBasicMaterial → bright gold
// (drei <Line>/LineMaterial ignores toneMapped and comes out dim).
const ARROW_GEO = (() => {
  const segs = [[[0, 0], [1, 1]], [[1, 1], [0.4, 1]], [[1, 1], [1, 0.4]]]
  const th = 0.08, pos = []
  for (const [[x0, y0], [x1, y1]] of segs) {
    let dx = x1 - x0, dy = y1 - y0
    const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len
    const nx = -dy * th / 2, ny = dx * th / 2
    pos.push(x0 + nx, y0 + ny, 0, x0 - nx, y0 - ny, 0, x1 - nx, y1 - ny, 0)
    pos.push(x0 + nx, y0 + ny, 0, x1 - nx, y1 - ny, 0, x1 + nx, y1 + ny, 0)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  return g
})()

function makeReelTex() {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128
  const x = cv.getContext('2d')
  const CX = 64, CY = 64, DARK = '#0b1120'
  // flange (gold disc)
  const g = x.createRadialGradient(52, 44, 6, CX, CY, 62)
  g.addColorStop(0, '#f8efd6'); g.addColorStop(0.5, '#e2cf9f'); g.addColorStop(1, '#c2a05a')
  x.fillStyle = g; x.beginPath(); x.arc(CX, CY, 60, 0, 7); x.fill()
  // spokes — thin gold ribs from hub to rim BETWEEN the windows (drawn first so
  // the windows carve the flange into arms)
  x.strokeStyle = '#d8c084'; x.lineWidth = 3; x.lineCap = 'round'
  const HOLES = 5, RING = 33, RH = 17
  for (let i = 0; i < HOLES; i++) {
    const a = ((i + 0.5) / HOLES) * Math.PI * 2 - Math.PI / 2
    x.beginPath(); x.moveTo(CX + Math.cos(a) * 20, CY + Math.sin(a) * 20)
    x.lineTo(CX + Math.cos(a) * 54, CY + Math.sin(a) * 54); x.stroke()
  }
  // big REEL WINDOWS (large open cut-outs, not clustered button holes) — this is
  // what reads as a film reel, with the spokes showing between them
  x.fillStyle = DARK
  for (let i = 0; i < HOLES; i++) {
    const a = (i / HOLES) * Math.PI * 2 - Math.PI / 2
    x.beginPath(); x.arc(CX + Math.cos(a) * RING, CY + Math.sin(a) * RING, RH, 0, 7); x.fill()
  }
  // bright outer rim (flange edge) — redrawn as rings so windows never eat it
  x.lineWidth = 6; x.strokeStyle = '#f4e4b6'; x.beginPath(); x.arc(CX, CY, 55, 0, 7); x.stroke()
  x.lineWidth = 2.5; x.strokeStyle = '#a5823f'; x.beginPath(); x.arc(CX, CY, 59, 0, 7); x.stroke()
  // hub — gold boss that carries the reel-number label
  const hg = x.createRadialGradient(58, 58, 3, CX, CY, 22); hg.addColorStop(0, '#f8efd6'); hg.addColorStop(1, '#e0c88f')
  x.fillStyle = hg; x.beginPath(); x.arc(CX, CY, 21, 0, 7); x.fill()
  x.lineWidth = 2.5; x.strokeStyle = '#b9933f'; x.beginPath(); x.arc(CX, CY, 21, 0, 7); x.stroke()
  const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return t
}
function makeHaloTex() {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128
  const x = cv.getContext('2d')
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(200,161,87,.55)'); g.addColorStop(0.42, 'rgba(200,161,87,.12)'); g.addColorStop(0.66, 'rgba(200,161,87,0)')
  x.fillStyle = g; x.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(cv)
}

// ── Film-strip road ─────────────────────────────────────────────────────────
// The "string" between reels is a strip of celluloid: a ribbon mesh following
// the sine path, threading through each reel. The texture runs along it (uScroll)
// and the travelled portion lights up (uProgress), with a warm glow where the
// film feeds out of the current reel toward the next.
const FILM_CELL = 3.4 // local length of one film frame along the path

function makeFilmTex() {
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 96
  const x = cv.getContext('2d')
  x.fillStyle = '#0e0b06'; x.fillRect(0, 0, 64, 96)                 // celluloid base
  x.fillStyle = '#241a0e'; x.fillRect(5, 22, 54, 52)               // frame window
  x.strokeStyle = 'rgba(200,161,87,0.30)'; x.lineWidth = 1.6; x.strokeRect(5, 22, 54, 52)
  x.fillStyle = '#050403'; x.fillRect(0, 0, 3, 96); x.fillRect(61, 0, 3, 96) // frame dividers
  x.fillStyle = '#eaddbb'                                           // sprocket perforations
  const perf = (cx, cy) => {
    const w = 16, h = 9, r = 3, px = cx - w / 2, py = cy - h / 2
    x.beginPath()
    x.moveTo(px + r, py)
    x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r)
    x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r)
    x.closePath(); x.fill()
  }
  perf(32, 11); perf(32, 85)
  const t = new THREE.CanvasTexture(cv)
  t.wrapS = THREE.RepeatWrapping
  t.wrapT = THREE.ClampToEdgeWrapping
  t.anisotropy = 4
  return t
}

// Ribbon mesh following the sine path. UV.x = arc-length (0..1) so sprockets stay
// evenly spaced through the wave; UV.y = across the strip (0..1).
function buildFilmRibbon(roadY, SEG, width) {
  const end = (N - 1) * SEG
  const steps = 240
  const half = width / 2
  const P = []
  let acc = 0, prevX = 0, prevY = 0
  for (let i = 0; i <= steps; i++) {
    const X = (i / steps) * end
    const Y = roadY(X)
    if (i > 0) acc += Math.hypot(X - prevX, Y - prevY)
    P.push([X, Y, acc]); prevX = X; prevY = Y
  }
  const total = acc || 1
  const pos = new Float32Array((steps + 1) * 2 * 3)
  const uv = new Float32Array((steps + 1) * 2 * 2)
  const idx = []
  for (let i = 0; i <= steps; i++) {
    const [X, Y, len] = P[i]
    const a = P[Math.max(0, i - 1)], b = P[Math.min(steps, i + 1)]
    let tx = b[0] - a[0], ty = b[1] - a[1]
    const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl
    const nx = -ty, ny = tx // in-plane normal
    const uu = len / total
    const o = i * 2
    pos[o * 3] = X + nx * half; pos[o * 3 + 1] = Y + ny * half; pos[o * 3 + 2] = 0
    pos[(o + 1) * 3] = X - nx * half; pos[(o + 1) * 3 + 1] = Y - ny * half; pos[(o + 1) * 3 + 2] = 0
    uv[o * 2] = uu; uv[o * 2 + 1] = 1
    uv[(o + 1) * 2] = uu; uv[(o + 1) * 2 + 1] = 0
    if (i < steps) { const A = o, B = o + 1, C = o + 2, D = o + 3; idx.push(A, B, C, B, D, C) }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  g.setIndex(idx)
  return { geometry: g, total }
}

const filmVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
const filmFrag = /* glsl */ `
  uniform sampler2D uTex;
  uniform float uProgress, uScroll, uRepeat, uOpacity;
  varying vec2 vUv;
  void main() {
    vec4 tex = texture2D(uTex, vec2(vUv.x * uRepeat + uScroll, vUv.y));
    // travelled film (behind the fly point) runs lit; ahead it waits, dim
    float lit = smoothstep(uProgress + 0.012, uProgress - 0.012, vUv.x);
    vec3 col = tex.rgb * mix(0.4, 1.05, lit);
    // warm glow at the leading edge — film feeding out of the current reel
    float edge = smoothstep(0.03, 0.0, abs(vUv.x - uProgress));
    col += vec3(1.0, 0.82, 0.45) * edge * 0.5;
    gl_FragColor = vec4(col, tex.a * uOpacity);
  }
`

export default function RosterChapter({ smoothed }) {
  const L = useLayout()
  // The mobile breakpoint (innerWidth < 768) also fires in LANDSCAPE, where
  // halfH collapses and the portrait-tuned mobile config (big k, deep wave)
  // would shove the bottom cluster across centre into the title. Fall back to
  // the landscape-safe desktop roster config whenever the viewport is
  // landscape. Tracked separately because rotating a phone keeps width < 768,
  // so the breakpoint (and this component) wouldn't otherwise re-render.
  const [portrait, setPortrait] = useState(
    () => typeof window === 'undefined' || window.innerHeight >= window.innerWidth,
  )
  useEffect(() => {
    const update = () => setPortrait(window.innerHeight >= window.innerWidth)
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])
  const { peelDist, overscan } = L.peel
  const R = portrait ? L.peel.roster : LAYOUTS.desktop.peel.roster
  const k = R.k // type / spacing scale
  const bc = R.beacon // beacon size scale

  const rootRef = useRef()
  const topRef = useRef()
  const botRef = useRef()
  const roadRef = useRef()
  const grp = useRef([]), reel = useRef([]), num = useRef([]), halo = useRef([]), label = useRef([])
  const indRef = useRef() // timeline indicator
  const fillRef = useRef() // timeline progress fill
  const marqRef = useRef()
  const marqWidthRef = useRef(0)
  const [active, setActive] = useState(0)

  const reelTex = useMemo(makeReelTex, [])
  const haloTex = useMemo(makeHaloTex, [])
  const filmTex = useMemo(makeFilmTex, [])

  // Reel-road geometry from the per-bp config. UPHILL CAREER TRACK: the reels
  // CLIMB left→right (beacon i at y = i·RISE) — 2020 at the bottom, NOW at the
  // top — with a gentle film sag between each pair (smaller than the rise, so it
  // always reads as ascending, not a dip). The current reel is re-centred each
  // frame (see useFrame), so at any moment the visible road is an upward slope.
  const { SEG, ROAD_Y, roadY, BEACON_POS, filmGeo, filmLen } = useMemo(() => {
    const SEG = R.seg, ROAD_Y = R.roadY
    const RISE = SEG * 0.26 // vertical climb per reel (~15° slope, bp-consistent)
    const SAG = SEG * 0.08  // gentle film droop between reels (< RISE/2 → still climbs)
    const roadY = (x) => {
      const seg = Math.min(N - 2, Math.max(0, Math.floor(x / SEG)))
      const t = (x - seg * SEG) / SEG
      const s = Math.sin(Math.PI * t)
      return seg * RISE + RISE * t - SAG * s * s
    }
    const BEACON_POS = ROLES.map((_, i) => [i * SEG, i * RISE, 0])
    // Film narrower than even the smallest (far, shrunk) reel so it always
    // threads INTO the reel rather than poking out past a small one.
    const { geometry: filmGeo, total: filmLen } = buildFilmRibbon(roadY, SEG, 3.6 * R.beacon)
    return { SEG, ROAD_Y, roadY, BEACON_POS, filmGeo, filmLen }
  }, [R.seg, R.roadY, R.beacon])

  const filmUniforms = useMemo(() => ({
    uTex: { value: filmTex },
    uProgress: { value: 0 },
    uScroll: { value: 0 },
    uRepeat: { value: 20 },
    uOpacity: { value: 1 },
  }), [filmTex])

  // Backdrop starfield — fills the tall portrait canvas (and adds night-sky
  // atmosphere on desktop). Positions span well beyond the widest halfH.
  const starsGeo = useMemo(() => {
    const n = R.stars
    const arr = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (Math.random() * 2 - 1) * 52
      arr[i * 3 + 1] = (Math.random() * 2 - 1) * 108
      arr[i * 3 + 2] = 0
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3))
    return g
  }, [R.stars])

  // Release GPU resources (mirrors ChapterPeel disposing its FBO). reelTex/
  // haloTex are stable (useMemo []) → disposed only on unmount. starsGeo is
  // rebuilt when the breakpoint's star count changes → dispose the OLD one on
  // change; keeping it in the same effect would wrongly dispose the textures too.
  useEffect(() => () => { reelTex.dispose(); haloTex.dispose(); filmTex.dispose() }, [reelTex, haloTex, filmTex])
  useEffect(() => () => starsGeo.dispose(), [starsGeo])
  useEffect(() => () => filmGeo.dispose(), [filmGeo])

  useFrame(({ camera, size, clock }) => {
    const sm = smoothed.current ?? 0
    // Rendered through the whole peel so the fading backing-mask reveals the
    // reel-road progressively (not a pop-in), then a clean cut to The Work at
    // CRAFTS_START - 0.01 (matches Crafts's own on-threshold → no overlap frame).
    const on = sm > PEEL_START - 0.02 && sm < CRAFTS_START - 0.01
    if (rootRef.current) rootRef.current.visible = on
    if (!on) return

    const aspect = size.width / size.height
    const h_vp = 2 * peelDist * Math.tan((camera.fov * DEG) / 2) * overscan
    const w_vp = h_vp * aspect
    const sf = w_vp / 100
    if (rootRef.current) rootRef.current.scale.setScalar(sf)

    // Anchor the HUD clusters to the live viewport edges (halfW ≈ 47.6 constant,
    // so x is baked into the JSX; only y moves with the window aspect). Clean
    // through 21:9; super-ultrawide converges the clusters (accepted limitation).
    const halfH = 50 / (overscan * aspect)
    if (topRef.current) topRef.current.position.y = halfH
    if (botRef.current) botRef.current.position.y = -halfH

    // ── fly the reel-road ──
    const rp = clamp01((sm - ROSTER_START) / (ROSTER_END - ROSTER_START))
    const camU = ease(rp)
    const camX = camU * (N - 1) * SEG
    if (roadRef.current) {
      roadRef.current.position.x = -camX
      // Re-centre the current reel each frame, so the climbing track always shows
      // as an upward slope — past reels fall below-left, future reels rise above-right.
      roadRef.current.position.y = ROAD_Y - roadY(camX)
    }

    // Film ribbon: the strip runs (texture scrolls along its length) and the
    // travelled portion lights up (uProgress), with a warm glow at the leading
    // edge where the film feeds out of the current reel toward the next.
    filmUniforms.uProgress.value = camU
    filmUniforms.uScroll.value = -clock.elapsedTime * 0.05
    filmUniforms.uRepeat.value = filmLen / FILM_CELL

    const segE = camU * (N - 1)
    const t = clock.elapsedTime
    for (let i = 0; i < N; i++) {
      const ad = Math.abs(segE - i)
      const prox = clamp01(1 - ad / 0.9)
      const sc = 0.7 + 0.45 * prox // far reels stay large enough to stay wider than the film
      const op = ad > 1.9 ? 0 : ad > 1.1 ? Math.max(0, 1 - (ad - 1.1) * 1.25) : 1
      const g = grp.current[i]; if (g) { g.scale.setScalar(sc); g.visible = op > 0.02 }
      if (reel.current[i]) { reel.current[i].material.opacity = op; reel.current[i].rotation.z = -t * 0.5 }
      if (num.current[i]) num.current[i].fillOpacity = op
      if (halo.current[i]) halo.current[i].material.opacity = op * (0.5 + 0.5 * prox)
      if (label.current[i]) label.current[i].fillOpacity = op * (ad < 0.55 ? 1 : 0)
    }
    const a = Math.max(0, Math.min(N - 1, Math.round(segE)))
    if (a !== active) setActive(a)

    // ── timeline scrubber ──
    if (indRef.current) {
      indRef.current.position.x = TL_X0 + camU * TL_W
      indRef.current.scale.setScalar((1 + 0.18 * Math.sin(t * 4)) * k)
    }
    if (fillRef.current) {
      const w = Math.max(0.001, camU * TL_W)
      fillRef.current.scale.x = w
      fillRef.current.position.x = TL_X0 + w / 2
    }

    // ── marquee (scroll left, seamless — width measured on sync) ──
    if (marqRef.current) {
      const W = marqWidthRef.current || 120
      marqRef.current.position.x = -48 - ((t * 7) % W)
    }
  })

  const a = ROLES[active]

  // ── Chyron layout — FIXED panel size (never resizes between cards). Content
  // flows from a fixed top; Elyts (3 bullets + links + skills) is the tallest,
  // shorter cards just leave empty space at the panel BOTTOM. Rows top → bottom:
  //   dates · title · company · bullets(1-3) · [links] · skills
  const bullets = [a.b1, a.b2, a.b3].filter(Boolean)
  const hasLinks = !!(a.links && a.links.length)
  const gap = 1.6 * k
  const datesY = 21.7 * k // whole card nudged up so its bottom clears the timeline
  const titleY = 20.3 * k
  const companyY = 16.9 * k
  const bulletY0 = companyY - 1.7 * k
  const bulletYs = bullets.map((_, i) => bulletY0 - i * gap)
  const lastBulletY = bulletYs[bulletYs.length - 1]
  const linksY = hasLinks ? lastBulletY - gap : null

  // panel sized for the MAX card (3 bullets + links + skills = 4 gaps below b1)
  // so it never resizes. Top HUGS the dates (so it stops covering the reel-road
  // that dips in from above); bottom clears the timeline (~5.4k).
  const maxSkillsY = bulletY0 - 4 * gap
  const skillsY = maxSkillsY // SKILLS sticks to this fixed bottom row on EVERY card
  const panelW = Math.min(94, 42 * k)
  const panelCX = -47.5 + panelW / 2
  const panelTop = datesY + 0.9 * k
  const panelBot = maxSkillsY - 1.3 * k
  const panelH = panelTop - panelBot
  const panelCY = (panelTop + panelBot) / 2
  const resumeX = -47.5 + panelW - 2 // résumé block right-aligned inside the panel

  return (
    <group ref={rootRef} visible={false}>
      {/* backdrop — night sky (z=0, painter-ordered; parked cam adds no shift) */}
      <mesh renderOrder={RO - 1}>
        <planeGeometry args={[400, 320]} />
        <meshBasicMaterial color={SKY} toneMapped={false} depthTest={false} />
      </mesh>
      <points geometry={starsGeo} renderOrder={RO - 0.5}>
        <pointsMaterial size={1.7} color={CREAM} transparent opacity={0.5} depthTest={false} sizeAttenuation={false} toneMapped={false} />
      </points>

      {/* ── reel-road (panned group) ── */}
      <group ref={roadRef}>
        {/* the "string" is a strip of film — a celluloid ribbon threading through
            every reel, running as you fly (see filmFrag) */}
        <mesh geometry={filmGeo} renderOrder={RO + 0.9}>
          <shaderMaterial
            vertexShader={filmVert}
            fragmentShader={filmFrag}
            uniforms={filmUniforms}
            transparent
            side={THREE.DoubleSide}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        {ROLES.map((r, i) => (
          <group key={i} ref={(el) => (grp.current[i] = el)} position={BEACON_POS[i]}>
            <mesh ref={(el) => (halo.current[i] = el)} renderOrder={RO + 1}>
              <planeGeometry args={[16 * bc, 16 * bc]} />
              <meshBasicMaterial map={haloTex} transparent depthTest={false} depthWrite={false} toneMapped={false} blending={THREE.AdditiveBlending} />
            </mesh>
            <mesh ref={(el) => (reel.current[i] = el)} renderOrder={RO + 2}>
              <planeGeometry args={[7 * bc, 7 * bc]} />
              <meshBasicMaterial map={reelTex} transparent depthTest={false} toneMapped={false} />
            </mesh>
            <Text ref={(el) => (num.current[i] = el)} font={FONTS.anton} fontSize={1.9 * bc} color="#0c1122" anchorX="center" anchorY="middle"
              position={[0, 0, 0.1]} renderOrder={RO + 3} material-depthTest={false}>{r.num}</Text>
            <Text ref={(el) => (label.current[i] = el)} font={FONTS.anton} fontSize={2.4 * bc} color={CREAM} anchorX="center" anchorY="bottom"
              letterSpacing={0.02} position={[0, 5.2 * bc, 0.1]} renderOrder={RO + 3}
              material-depthTest={false} material-depthWrite={false}>{r.company.toUpperCase()}</Text>
          </group>
        ))}
      </group>

      {/* ── TOP cluster (anchored to +halfH; local y NEGATIVE, ×k spacing) ── */}
      <group ref={topRef}>
        <Text font={FONTS.dmMono400} fontSize={0.9 * k} color={GOLD} fillOpacity={0.75} anchorX="left" anchorY="top" letterSpacing={0.28}
          position={[-46, -1.6 * k, 0]} renderOrder={RO + 4} material-depthTest={false}>◆ REEL Nº 03</Text>
        <Text font={FONTS.dmMono400} fontSize={0.92 * k} color={DIM} anchorX="left" anchorY="top" letterSpacing={0.42}
          position={[-46, -3.2 * k, 0]} renderOrder={RO + 4} material-depthTest={false}>PROFESSIONAL EXPERIENCE</Text>
       <Text font={FONTS.anton} fontSize={5.4 * k} color={CREAM} anchorX="left" anchorY="top" scale={[1, 1.12, 1]} maxWidth={92}
          position={[-46, -4.6 * k, 0]} renderOrder={RO + 4} material-depthTest={false}
          outlineWidth="2.5%" outlineBlur="10%" outlineColor={GOLD} outlineOpacity={0.35}>THE ROSTER</Text>
      </group>

      {/* ── BOTTOM cluster (anchored to -halfH; local y POSITIVE, ×k spacing) ── */}
      <group ref={botRef}>
        {/* chyron scrim sized to the block, pinned to the left edge */}
        <mesh position={[panelCX, panelCY, 0]} renderOrder={RO + 2}>
          <planeGeometry args={[panelW, panelH]} />
          <meshBasicMaterial color="#0b1018" transparent opacity={0.94} depthTest={false} />
        </mesh>
        <mesh position={[-46.8, panelCY, 0]} renderOrder={RO + 3}>
          <planeGeometry args={[0.4 * k, panelH]} />
          <meshBasicMaterial color={GOLD} toneMapped={false} depthTest={false} />
        </mesh>
        <Text font={FONTS.dmMono400} fontSize={0.9 * k} color={GOLD} anchorX="left" anchorY="top" letterSpacing={0.26}
          position={[-46, datesY, 0]} renderOrder={RO + 4} material-depthTest={false}>{a.dates}{active === N - 1 ? '   ● NOW' : ''}</Text>

        {/* résumé — doc icon + Preview / Download, where the beacon marker was.
            Group is right-anchored at the chyron's right edge (x=46, matching
            the "CHAPTER III..." line below); pieces flow right-to-left:
            Download (rightmost, ends at local x=0) ← / ← Preview ← [doc icon].
            Widths are estimated (monospace advance ≈ 0.56×fontSize) since троика
            hasn't measured them yet — good enough for a HUD label, not exact. */}
        <group position={[resumeX, datesY, 0]}>
          {(() => {
            // Right-to-left layout, right-aligned to the panel edge (so it clears
            // the left "dates ● NOW"). anchorX="right" ⇒ position.x IS the text's
            // right edge = the previous element's left edge minus a gap. Order,
            // left→right: [solid doc] Preview / Download Resume [↗].
            const fs = 0.85 * k
            const cw = fs * 0.7 // DM Mono advance (0.6) + letterSpacing (0.1)
            const gapR = fs * 0.7
            const isz = fs * 0.78 // ↗ arrow size
            const arrow = [[0, 0, 0], [isz, isz, 0], [isz, isz * 0.42, 0], [isz, isz, 0], [isz * 0.42, isz, 0]]
            const dw = fs * 0.78, dh = fs * 1.02, fold = fs * 0.3 // solid doc icon
            const exRight = 0 // the trailing ↗ is the rightmost element
            const dlRight = exRight - isz - gapR
            const dlLeft = dlRight - 'Download Resume'.length * cw
            const sepRight = dlLeft - gapR
            const sepLeft = sepRight - cw
            const pvRight = sepLeft - gapR
            const pvLeft = pvRight - 'Preview'.length * cw
            const docRight = pvLeft - gapR
            const docShape = new THREE.Shape() // rectangle with a folded top-right corner
            docShape.moveTo(0, 0); docShape.lineTo(dw - fold, 0); docShape.lineTo(dw, -fold)
            docShape.lineTo(dw, -dh); docShape.lineTo(0, -dh); docShape.closePath()
            const open = (url) => (e) => { e.stopPropagation(); window.open(url, '_blank', 'noopener,noreferrer') }
            const over = () => { document.body.style.cursor = 'pointer' }
            const out = () => { document.body.style.cursor = '' }
            return (
              <>
                {/* SOLID document icon (filled, so it actually reads at HUD size) */}
                <mesh position={[docRight - dw, fs * -.3, 0]} renderOrder={RO + 4}>
                  <shapeGeometry args={[docShape]} />
                  <meshBasicMaterial color={GOLD} transparent depthTest={false} depthWrite={false} toneMapped={false} />
                </mesh>
                <Text font={FONTS.dmMono400} fontSize={fs} color={GOLD} anchorX="right" anchorY="top" letterSpacing={0.1}
                  position={[pvRight, -.15, 0]} renderOrder={RO + 4} material-depthTest={false}
                  onClick={open('https://resume.whoisaadar.sh')} onPointerOver={over} onPointerOut={out}
                >Preview</Text>
                <Text font={FONTS.dmMono400} fontSize={fs} color={DIM} anchorX="right" anchorY="top" letterSpacing={0.1}
                  position={[sepRight, -.2, 0]} renderOrder={RO + 4} material-depthTest={false}>/</Text>
                <Text font={FONTS.dmMono400} fontSize={fs} color={GOLD} anchorX="right" anchorY="top" letterSpacing={0.1}
                  position={[dlRight, -.2, 0]} renderOrder={RO + 4} material-depthTest={false}
                  onClick={open('https://resume.whoisaadar.sh/download')} onPointerOver={over} onPointerOut={out}
                >Download Resume</Text>
                {/* trailing external-link arrow (↗) */}
                <mesh geometry={ARROW_GEO} scale={[isz, isz, 1]}
                  position={[exRight - isz, -fs * 1.25, 0]} renderOrder={RO + 4}>
                  <meshBasicMaterial color={GOLD} transparent depthTest={false} depthWrite={false} toneMapped={false} />
                </mesh>
              </>
            )
          })()}
        </group>
        <Text font={FONTS.anton} fontSize={2.5 * k} color={CREAM} anchorX="left" anchorY="top" maxWidth={52 * k}
          position={[-46, titleY, 0]} renderOrder={RO + 4} material-depthTest={false}>{a.title.toUpperCase()}</Text>
        <Text font={FONTS.dmMono400} fontSize={1.0 * k} color={GOLD} anchorX="left" anchorY="top" letterSpacing={0.24}
          position={[-46, companyY, 0]} renderOrder={RO + 4} material-depthTest={false}>{a.company.toUpperCase()}</Text>

        {/* loglines — dynamic count (2 or 3), kept ≤1 line each */}
        {bullets.map((b, i) => (
          <Text key={i} font={FONTS.cormorantItalic} fontSize={1.1 * k} color={i === 0 ? '#e7dcc0' : '#b7ad93'}
            anchorX="left" anchorY="top" maxWidth={40 * k}
            position={[-46, bulletYs[i], 0]} renderOrder={RO + 4} material-depthTest={false}>{'› ' + b}</Text>
        ))}

        {/* project links line (Elyts) — each link clickable, with an external ↗.
            Flat list of text runs + arrow icons, left-to-right, estimated widths. */}
        {hasLinks && (() => {
          const fs = 0.85 * k
          const cw = fs * 0.6 // ≈ mono advance
          const isz = fs * 0.95 // ↗ arrow size
          
          const els = []
          let x = -46
          const addText = (t, color, url) => { els.push({ kind: 't', t, color, url, x }); x += t.length * cw }
          const addIcon = () => { els.push({ kind: 'i', x: x + fs * 0.22 }); x += isz + fs * 0.6 }
          addText('› ', DIM)
          a.links.forEach((lk, i) => {
            if (i > 0) addText('  ·  ', DIM)
            addText(lk.t, GOLD, lk.url)
            addIcon()
          })
          const open = (url) => (e) => { e.stopPropagation(); window.open(url, '_blank', 'noopener,noreferrer') }
          const over = () => { document.body.style.cursor = 'pointer' }
          const out = () => { document.body.style.cursor = '' }
          return els.map((el, i) => el.kind === 't' ? (
            <Text key={i} font={FONTS.dmMono400} fontSize={fs} color={el.color} anchorX="left" anchorY="top" letterSpacing={0.02}
              position={[el.x, linksY, 0]} renderOrder={RO + 4} material-depthTest={false}
              onClick={el.url ? open(el.url) : undefined}
              onPointerOver={el.url ? over : undefined} onPointerOut={el.url ? out : undefined}>{el.t}</Text>
          ) : (
            <mesh key={i} geometry={ARROW_GEO} scale={[isz, isz, 0]}
              position={[el.x + .4, linksY - fs * 1.3, 0]} renderOrder={RO + 4}>
              <meshBasicMaterial color={GOLD} transparent depthTest={false} depthWrite={false} toneMapped={false} />
            </mesh>
          ))
        })()}

        {/* skills / tools — small so the longest stack fits one line */}
        {a.tools && (
          <Text font={FONTS.dmMono400} fontSize={0.72 * k} color={DIM} anchorX="left" anchorY="top" letterSpacing={0.08}
            position={[-46, skillsY, 0]} renderOrder={RO + 4} material-depthTest={false}>{'SKILLS · ' + a.tools}</Text>
        )}

        {/* timeline scrubber */}
        <mesh position={[0, 5.4 * k, 0]} renderOrder={RO + 3}>
          <planeGeometry args={[TL_W, 0.14 * k]} />
          <meshBasicMaterial color={GOLD} transparent opacity={0.32} depthTest={false} toneMapped={false} />
        </mesh>
        <mesh ref={fillRef} position={[TL_X0, 5.4 * k, 0]} renderOrder={RO + 3.1}>
          <planeGeometry args={[1, 0.16 * k]} />
          <meshBasicMaterial color={GOLD} depthTest={false} toneMapped={false} />
        </mesh>
        {ROLES.map((r, i) => (
          <group key={i}>
            <mesh position={[NOTCH_X[i], 5.4 * k, 0]} renderOrder={RO + 3.2}>
              <planeGeometry args={[0.28 * k, 1.5 * k]} />
              <meshBasicMaterial color={GOLD} transparent opacity={0.7} depthTest={false} toneMapped={false} />
            </mesh>
            <Text font={FONTS.dmMono400} fontSize={0.8 * k} color={i === active ? CREAM : DIM} anchorX="center" anchorY="top" letterSpacing={0.1}
              position={[NOTCH_X[i], 3.9 * k, 0]} renderOrder={RO + 4} material-depthTest={false}>{r.year}</Text>
          </group>
        ))}
        <mesh ref={indRef} position={[TL_X0, 5.4 * k, 0]} renderOrder={RO + 3.5}>
          <circleGeometry args={[0.75, 24]} />
          <meshBasicMaterial color="#fff2cf" depthTest={false} toneMapped={false} />
        </mesh>

        {/* marquee — HIGHLIGHT REEL, very bottom */}
        <mesh position={[0, 1.6 * k, 0]} renderOrder={RO + 2}>
          <planeGeometry args={[100, 2.7 * k]} />
          <meshBasicMaterial color="#090d1a" transparent opacity={0.85} depthTest={false} />
        </mesh>
        <Text
          ref={marqRef}
          font={FONTS.dmMono400}
          fontSize={1.05 * k}
          color={CREAM}
          anchorX="left"
          anchorY="middle"
          letterSpacing={0.12}
          position={[-48, 1.6 * k, 0]}
          renderOrder={RO + 4}
          material-depthTest={false}
          onSync={(tr) => {
            const bb = tr.textRenderInfo?.blockBounds
            if (bb) marqWidthRef.current = (bb[2] - bb[0]) / 2
          }}
        >{HIGHLIGHT + HIGHLIGHT}</Text>
      </group>
    </group>
  )
}
