import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text, Line } from '@react-three/drei'
import { FONTS } from '../../../fonts.js'
import { PEEL_START, ROSTER_START, ROSTER_END, CRAFTS_START, ORDER } from '../config.js'
import { useLayout } from '../breakpoint.js'
import { LAYOUTS } from '../layouts.js'

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
const ROLES = [
  { num: '01', year: '2020', dates: 'JUN 2020 — FEB 2022', title: 'Junior Software Engineer', company: 'Pay Perform',
    b1: 'Stakeholder reporting UI — live activity + summaries.',
    b2: 'First production credit on the reel.' },
  { num: '02', year: '2022', dates: 'FEB 2022 — MAY 2023', title: 'Senior Full-Stack Engineer', company: 'SM Technology',
    b1: 'Reusable business-module packages for plug-in delivery.',
    b2: 'Cut project timelines; helped win new partners.' },
  { num: '03', year: '2024', dates: 'MAY 2024 — FEB 2025', title: 'IT Analyst · Full-Stack', company: 'Intellectyx',
    b1: 'Robust LMS — SCORM + Azure Entra ID single sign-on.',
    b2: 'Multi-region LMS across UK · USA · Europe.' },
  { num: '04', year: '2025', dates: 'MAR 2025 — OCT 2025', title: 'Full-Stack Engineer · AI', company: 'PieLabs Inc',
    b1: 'Optimised AI modules; built + ran the MLOps pipeline.',
    b2: 'Internal LLM log-observability — I/O + token capture.' },
  { num: '05', year: 'NOW', dates: 'NOV 2025 — PRESENT', title: 'Lead Technical Architect', company: 'Elyts',
    b1: 'End-to-end system design, infra & payments.',
    b2: 'Internal AI (Hourglass · HireHouse) — hiring noise ~80%.' },
]
// The inter-copy gap is placed as LEADING whitespace (and the string ENDS in a
// visible glyph, ✦). troika's blockBounds trims TRAILING whitespace only, so a
// trailing-gap string would measure short and the two-copy marquee would hiccup
// at every wrap. Leading gap → measured width = exactly 2× one copy → seamless.
const HIGHLIGHT = '      ★ ~80% HIRING NOISE REMOVED   ✦   INTERNAL AI SYSTEMS ADOPTED COMPANY-WIDE   ✦   MULTI-REGION LMS · UK · USA · EUROPE   ✦   REUSABLE MODULES THAT WON PARTNERS   ✦   END-TO-END SYSTEM DESIGN & PAYMENTS   ✦'

const N = ROLES.length
const TL_X0 = -40 // timeline rail extent (fixed — halfW is constant across bp)
const TL_W = 80
const NOTCH_X = ROLES.map((_, i) => TL_X0 + (i / (N - 1)) * TL_W)

const CREAM = '#f6ecd2', GOLD = '#c8a157', DIM = '#9b9789', SKY = '#0a1024'
const RO = ORDER.nextChapter

function makeReelTex() {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128
  const x = cv.getContext('2d')
  const g = x.createRadialGradient(52, 44, 4, 64, 64, 62)
  g.addColorStop(0, '#f8efd6'); g.addColorStop(0.52, '#e2cf9f'); g.addColorStop(1, '#c8a157')
  x.fillStyle = g; x.beginPath(); x.arc(64, 64, 60, 0, 7); x.fill()
  x.lineWidth = 4; x.strokeStyle = '#f2e2b4'; x.stroke()
  x.fillStyle = '#0c1426'
  for (const [hx, hy] of [[64, 26], [97, 52], [84, 92], [44, 92], [31, 52]]) { x.beginPath(); x.arc(hx, hy, 8.5, 0, 7); x.fill() }
  const hg = x.createRadialGradient(58, 58, 2, 64, 64, 21); hg.addColorStop(0, '#f8efd6'); hg.addColorStop(1, '#e6d3a4')
  x.fillStyle = hg; x.beginPath(); x.arc(64, 64, 21, 0, 7); x.fill()
  x.lineWidth = 2; x.strokeStyle = '#b9933f'; x.stroke()
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
  const trailRef = useRef() // bright fill trail (draws with progress)
  const trailGlowRef = useRef() // wider dim glow under the trail
  const grp = useRef([]), reel = useRef([]), num = useRef([]), halo = useRef([]), label = useRef([])
  const indRef = useRef() // timeline indicator
  const fillRef = useRef() // timeline progress fill
  const marqRef = useRef()
  const marqWidthRef = useRef(0)
  const [active, setActive] = useState(0)

  const reelTex = useMemo(makeReelTex, [])
  const haloTex = useMemo(makeHaloTex, [])

  // Reel-road geometry from the per-bp config (deeper wave + wider spacing on
  // portrait). Beacon i alternates ±amp; the road samples the same sine.
  const { SEG, AMP, ROAD_Y, roadY, ROAD_PTS, BEACON_POS } = useMemo(() => {
    const SEG = R.seg, AMP = R.amp, ROAD_Y = R.roadY
    const roadY = (x) => AMP * Math.cos((x / SEG) * Math.PI)
    const end = (N - 1) * SEG
    const pts = []
    for (let x = 0; x <= end; x += 2) pts.push([x, roadY(x), 0])
    if (pts[pts.length - 1][0] !== end) pts.push([end, roadY(end), 0])
    const BEACON_POS = ROLES.map((_, i) => [i * SEG, AMP * Math.cos(i * Math.PI), 0])
    return { SEG, AMP, ROAD_Y, roadY, ROAD_PTS: pts, BEACON_POS }
  }, [R.seg, R.amp, R.roadY])

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
  useEffect(() => () => { reelTex.dispose(); haloTex.dispose() }, [reelTex, haloTex])
  useEffect(() => () => starsGeo.dispose(), [starsGeo])

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
      roadRef.current.position.y = ROAD_Y - roadY(camX)
    }

    // Fill trail: reveal only the road segments already travelled (beacon 01 →
    // current fly point). Line2 draws each segment as an instance, so capping
    // instanceCount draws the road progressively — the design's stroke-dashoffset.
    const drawn = Math.max(0, Math.round(camU * (ROAD_PTS.length - 1)))
    if (trailRef.current) trailRef.current.geometry.instanceCount = drawn
    if (trailGlowRef.current) trailGlowRef.current.geometry.instanceCount = drawn

    const segE = camU * (N - 1)
    const t = clock.elapsedTime
    for (let i = 0; i < N; i++) {
      const ad = Math.abs(segE - i)
      const prox = clamp01(1 - ad / 0.9)
      const sc = 0.55 + 0.6 * prox
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
  // chyron scrim sized to the k-scaled block, pinned to the left edge
  const panelW = Math.min(94, 42 * k)
  const panelCX = -47.5 + panelW / 2
  const panelH = 13.6 * k
  const panelCY = 14.8 * k

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
        {/* untravelled road — dim base */}
        <Line points={ROAD_PTS} color={GOLD} lineWidth={2.2} transparent opacity={0.4} renderOrder={RO + 0.9} />
        {/* fill trail (draws from beacon 01 to the current fly point): a gold
            glow under a bright cream stroke, both capped by instanceCount */}
        <Line ref={trailGlowRef} points={ROAD_PTS} color={GOLD} lineWidth={6} transparent opacity={0.4} renderOrder={RO + 1.1} />
        <Line ref={trailRef} points={ROAD_PTS} color="#f2e2b4" lineWidth={3} transparent opacity={0.95} renderOrder={RO + 1.3} />
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
            <Text ref={(el) => (label.current[i] = el)} font={FONTS.anton} fontSize={2.4 * bc} color={CREAM} anchorX="left" anchorY="middle"
              letterSpacing={0.02} position={[5.5 * bc, 0, 0.1]} renderOrder={RO + 3}
              material-depthTest={false} material-depthWrite={false}>{r.company.toUpperCase()}</Text>
          </group>
        ))}
      </group>

      {/* ── TOP cluster (anchored to +halfH; local y NEGATIVE, ×k spacing) ── */}
      <group ref={topRef}>
        <Text font={FONTS.dmMono400} fontSize={0.9 * k} color={GOLD} fillOpacity={0.75} anchorX="left" anchorY="top" letterSpacing={0.28}
          position={[-46, -1.4 * k, 0]} renderOrder={RO + 4} material-depthTest={false}>◆ REEL Nº 03</Text>
        <Text font={FONTS.dmMono400} fontSize={0.92 * k} color={DIM} anchorX="left" anchorY="top" letterSpacing={0.42}
          position={[-46, -3.2 * k, 0]} renderOrder={RO + 4} material-depthTest={false}>PROFESSIONAL EXPERIENCE</Text>
        {/* Tagline above the title (below it the italic overprinted the baseline). */}
        <Text font={FONTS.cormorantItalic} fontSize={1.5 * k} color={GOLD} anchorX="left" anchorY="top" maxWidth={90}
          position={[-46, -5.0 * k, 0]} renderOrder={RO + 4} material-depthTest={false}>Ride the reel-road — every studio a beacon.</Text>
        <Text font={FONTS.anton} fontSize={5.4 * k} color={CREAM} anchorX="left" anchorY="top" scale={[1, 1.12, 1]} maxWidth={92}
          position={[-46, -7.6 * k, 0]} renderOrder={RO + 4} material-depthTest={false}
          outlineWidth="2.5%" outlineBlur="10%" outlineColor={GOLD} outlineOpacity={0.35}>THE ROSTER</Text>
      </group>

      {/* ── BOTTOM cluster (anchored to -halfH; local y POSITIVE, ×k spacing) ── */}
      <group ref={botRef}>
        {/* chyron scrim sized to the block, pinned to the left edge */}
        <mesh position={[panelCX, panelCY, 0]} renderOrder={RO + 2}>
          <planeGeometry args={[panelW, panelH]} />
          <meshBasicMaterial color="#0b1018" transparent opacity={0.82} depthTest={false} />
        </mesh>
        <mesh position={[-46.8, panelCY, 0]} renderOrder={RO + 3}>
          <planeGeometry args={[0.4 * k, panelH]} />
          <meshBasicMaterial color={GOLD} toneMapped={false} depthTest={false} />
        </mesh>
        <Text font={FONTS.dmMono400} fontSize={0.9 * k} color={GOLD} anchorX="left" anchorY="top" letterSpacing={0.26}
          position={[-46, 20.2 * k, 0]} renderOrder={RO + 4} material-depthTest={false}>{a.dates}{'   ◆   BEACON '}{a.num}{' / 05'}{active === N - 1 ? '   ● NOW' : ''}</Text>
        <Text font={FONTS.anton} fontSize={3.5 * k} color={CREAM} anchorX="left" anchorY="top" maxWidth={44 * k}
          position={[-46, 18.4 * k, 0]} renderOrder={RO + 4} material-depthTest={false}>{a.title.toUpperCase()}</Text>
        <Text font={FONTS.dmMono400} fontSize={1.0 * k} color={GOLD} anchorX="left" anchorY="top" letterSpacing={0.24}
          position={[-46, 13.9 * k, 0]} renderOrder={RO + 4} material-depthTest={false}>{a.company.toUpperCase()}</Text>
        <Text font={FONTS.cormorantItalic} fontSize={1.1 * k} color="#e7dcc0" anchorX="left" anchorY="top" maxWidth={40 * k}
          position={[-46, 12.1 * k, 0]} renderOrder={RO + 4} material-depthTest={false}>{'› ' + a.b1}</Text>
        <Text font={FONTS.cormorantItalic} fontSize={1.1 * k} color="#b7ad93" anchorX="left" anchorY="top" maxWidth={40 * k}
          position={[-46, 10.1 * k, 0]} renderOrder={RO + 4} material-depthTest={false}>{'› ' + a.b2}</Text>

        {/* bottom-right chrome */}
        <Text font={FONTS.dmMono400} fontSize={0.85 * k} color={DIM} anchorX="right" anchorY="top" letterSpacing={0.26}
          position={[46, 7.6 * k, 0]} renderOrder={RO + 4} material-depthTest={false}>CHAPTER III · NIGHT FLIGHT · ASA 400</Text>

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
