import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, useTexture } from '@react-three/drei'
import { FONTS } from '../../../fonts.js'
import { CRAFTS_START, ORDER } from '../config.js'
import { useLayout, useBp } from '../breakpoint.js'
import ExitNoticeChapter, { ExitNoticeBackdrop } from './ExitNoticeChapter.jsx'

const DEG = Math.PI / 180
const clamp01 = (x) => Math.min(1, Math.max(0, x))

function ease(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// ════════════════════════════════════════════════════════════════════════════
// GOLD-INK ART DIRECTION — single source of truth for the emphasis layer.
//
// Every visual knob for the "ONE FEED" / "RAN" / "50,000 RÉSUMÉS." style
// gold overprints lives here. Tune values, save, ship — no other code edits
// needed. Each parameter is documented inline; presets at the bottom.
// ════════════════════════════════════════════════════════════════════════════
const GOLD_TREATMENT = {

  // ── Position offset (global) ─────────────────────────────────────────────
  // Global offset applied to ALL story gold overlays. Units: du.
  // Per-story headline overrides (s1/s2/s3) add on top of this.
  offsetX: 8,
  offsetY: 0,

  // ── Per-story headline offsets ───────────────────────────────────────────
  // Added to the global offsetX/offsetY above for each story's headline gold.
  // Body + pull gold always use the global offset only.
  s1: { offsetX: 0, offsetY: 0 },   // Story 01 · "ONE FEED."
  s2: { offsetX: 0, offsetY: 0 },   // Story 02 · "RAN"
  s3: { offsetX: 0, offsetY: 0 },   // Story 03 · "50,000 RÉSUMÉS."

  // ── Scale ────────────────────────────────────────────────────────────────
  // Size multiplier applied to the gold mesh (base headline stays at 1.0).
  // Range: 0.85 to 1.15. Beyond this it visibly mis-aligns with the base.
  // Current: 1.0 (matches base headline letterform exactly).
  // Increase  → gold dominates the base ink, magazine-cover assertion.
  // Decrease  → gold becomes a recessive inset inside the black headline.
  scale: 1.0,

  // ── Peak opacity ─────────────────────────────────────────────────────────
  // Final fillOpacity once the overlay has fully revealed.
  // Range: 0 (invisible) to 1 (fully replaces underlying black).
  // Current: 0.75 (balanced editorial accent — gold visible but base ink
  //                still reads through, avoiding doubled-glyph bolding).
  // Increase  → stronger emphasis, more visual weight.
  // Decrease  → softer accent, less competition with the headline.
  opacity: 0.75,

  // ── Color ────────────────────────────────────────────────────────────────
  // Hex color of the gold ink. Reads against cream paper (#f1e6cf).
  // Current: '#8e6c28' (warm bronze).
  //
  // Palette ladder — lower = more archival, higher = more magazine:
  //   '#7a5520'  deep burnt amber — low contrast, century-old print feel
  //   '#8e6c28'  warm bronze (current) — balanced editorial weight
  //   '#a37e2f'  brass — brighter, draws the eye, original first-pass tone
  //   '#b58b39'  golden ochre — saturated, foil-stamp feel
  //   '#c79a3d'  bright gold — highest contrast, near gold-leaf
  color: '#8e6c28',

  // ── Ink strength ─────────────────────────────────────────────────────────
  // Multiplier on peak opacity controlling perceived ink density.
  // effectiveOpacity = clamp(opacity * inkStrength, 0, 1)
  // Range: 0.4 to 1.6.
  // Current: 1.0 (native — no strength modifier).
  // Increase  → richer, metallic, "second-plate gold print" feel.
  // Decrease  → faded, washed, archival-reprint feel.
  inkStrength: 1.0,

  // ── Depth / shadow ───────────────────────────────────────────────────────
  // Adds a darker stamped shadow BEHIND each headline gold overlay,
  // offset by (-0.15·depth, -0.15·depth) du with opacity 0.4·depth·peak.
  // Range: 0 to 2.
  // Current: 0 (single flat ink layer, no shadow).
  // Increase  → stronger layered/embossed feel, magazine-cover print.
  // Decrease  → flatter editorial print, single-pass plate look.
  // Shadow color is fixed at '#3a2810' (dark burnt umber, behind the gold).
  depth: 0,

  // ── Rotation ─────────────────────────────────────────────────────────────
  // Z-axis rotation of the gold overlay in radians.
  // Range: -0.05 to +0.05 (≈ ±2.9°). Beyond this it reads as a mistake.
  // Current: 0 (aligned with baseline — cleanest editorial print).
  // Increase  → expressive editorial tilt, zine / poster styling.
  // Decrease (negative)  → counter-tilt, broadside-poster feel.
  rotation: 0,

  // ── Reveal ease ──────────────────────────────────────────────────────────
  // Per-frame exponential lerp factor used to ramp toward target opacity
  // (both reveal-in and fade-out as scroll crosses each threshold).
  // Range: 0.01 to 0.30.
  // Current: 0.18 (~8 frames / ~0.13 s @ 60 fps to reach 95% of target —
  //                snappy but not instant; reads as a press-plate reveal).
  // Increase  → snaps in sharply, almost instant ink-flash.
  // Decrease  → drifts in slowly, candle-lit reveal.
  revealEase: 0.18,
}

// ──────────────────────────────────────────────────────────────────────────
// Per-emphasis reveal thresholds — chapter-local progress p ∈ [0, 1] where
// p=0 corresponds to PEEL_END (chapter start) and p=1 to end of scroll
// runway. Each gold accent ignites when scroll progress crosses its value.
// Lower the number to ignite earlier in the story; raise to delay.
//
// Threshold math: PEEL_END=0.608, runway=0.392.
// 1 mouse-wheel click ≈ 100px on a ~8000px page → ~0.013 global → p≈0.033.
// s1.headline=0.05 → ignites after ~1.5 clicks from chapter start.
// ──────────────────────────────────────────────────────────────────────────
const GOLD_THRESHOLDS = {
  s1: { headline: 0.05, body: 0.10, pull: 0.16 },  // Story 01 · Syndicate
  s2: { headline: 0.38, body: 0.44, pull: 0.49 },  // Story 02 · Hourglass
  s3: { headline: 0.68, body: 0.74, pull: 0.79 },  // Story 03 · Hirehouse
}

// ──────────────────────────────────────────────────────────────────────────
// PRESETS — copy any block into GOLD_TREATMENT above to swap art direction.
//
//   Subtle editorial accent — gold whispers, base ink leads:
//     offsetX: 0, offsetY: 0, scale: 1.0,
//     opacity: 0.45, color: '#8e6c28', inkStrength: 0.7,
//     depth: 0, rotation: 0
//
//   Current production — balanced editorial weight (default):
//     offsetX: 0, offsetY: 0, scale: 1.0,
//     opacity: 0.75, color: '#8e6c28', inkStrength: 1.0,
//     depth: 0, rotation: 0
//
//   Bold magazine cover — gold dominates, layered stamp:
//     offsetX: 0.4, offsetY: -0.2, scale: 1.08,
//     opacity: 0.9, color: '#b58b39', inkStrength: 1.25,
//     depth: 1.2, rotation: -0.015
//
//   Faded archival print — second-edition reprint feel:
//     offsetX: 0, offsetY: 0, scale: 1.0,
//     opacity: 0.5, color: '#7a5520', inkStrength: 0.5,
//     depth: 0, rotation: 0
//
//   Zine / poster — expressive tilt and stamp shadow:
//     offsetX: 0.3, offsetY: 0, scale: 1.05,
//     opacity: 0.85, color: '#a37e2f', inkStrength: 1.1,
//     depth: 0.8, rotation: 0.025
// ──────────────────────────────────────────────────────────────────────────

// ════════════════════════════════════════════════════════════════════════════
// LAYOUT CONFIG — per-breakpoint, per-story fine-tune offsets.
//
// All values are additive deltas on top of the base positions in layouts.js
// (which hold the structural grid). These offsets represent intentional
// compositional adjustments — things the base grid can't express cleanly.
//
// Keys:
//   dx / dy      — world-unit offset added to the base position (du)
//   maxWAdj      — added to the base maxWidth from layouts.js (du)
//   x            — absolute X position (replaces layout base for that axis)
//
// Tune one story without affecting the others. Tune one breakpoint without
// affecting the others. Nothing else in the component changes.
// ════════════════════════════════════════════════════════════════════════════

// Default slot — all stories on all breakpoints start here.
// Copy any key into a story slot below to override just that element.
function _slot(o = {}) {
  return {
    kicker:   { dx:  0,     dy:  0,    ...o.kicker   },
    headline: { dx:  0,     dy:  0,    fontSizeAdj: 0,    ...o.headline  },
    goldenHeadline: { dx:  0,     dy:  0,    fontSizeAdj: 0,    ...o.goldenHeadline  },
    deck:     { dx:  0,     dy: -1,    maxWAdj: -25,  ...o.deck     },
    figure:   { dx:  0,     dy: -3.5,  wAdj: 9.5, hAdj: 3,  ...o.figure   },
    figLabel: { dx:  0,     dy:  0,    ...o.figLabel  },
    body:     { dx: -2,     dy: -6,    maxWAdj: -10, fontSizeAdj: 0,  ...o.body     },
    goldBody: { dx:  19.33, dy:  4.17, maxWAdj: -10, fontSizeAdj: 0, off: false,  ...o.goldBody },
    pull:     { dx:  6,     dy:  3.5,  fontSizeAdj: 0, ...o.pull     },
    goldPull: { dx:  6,     dy:  3.5,  fontSizeAdj: 0, ...o.goldPull },
    outcome:  { x:   20,    dy:  6,    maxWAdj: 0,    fontSizeAdj: 0,    ...o.outcome  },
    staff:    { x:   20,    dy:  6.5,    maxWAdj: 0,    fontSizeAdj: 0,    ...o.staff    },
  }
}

const LAYOUT_CONFIG = {
  // ── Desktop (landscape 2-column layout) ────────────────────────────────
  desktop: {
    s1: _slot(),  // Story 01 · Syndicate ("ONE FEED.")  — tuned
    s2: _slot({
      kicker: { dx: 0, dy: -2 },
      deck: { dx: 6, dy: -1.2 },
      figure: { hAdj: 3, wAdj: 7, dy: -4 },
      goldenHeadline: { dx: -15.2, dy: 0},
      goldBody: { dx: 28, dy: -1.71 },
      pull: { dx: 2.5, dy: -1 },
      goldPull: { dx: 2.5, dy: -1 },
      outcome: { dy: 1.5 },
      staff: { dy: 2 }
    }),  // Story 02 · Hourglass ("RAN")        — tune next
    s3: _slot({
      kicker: { dx: 0, dy: -2 },
      headline: { dx: 0, dy: -2, fontSizeAdj: -2 },
      goldenHeadline: { dx: -8.6, dy: -2, fontSizeAdj: -2 },
      deck: { dx: 4, dy: -2 },
      figure: { hAdj: 3, wAdj: 6, dy: -5 },
      body: { dy: -5 },
      goldBody: { dx: 25.1, dy: .6 },
      pull: { dx: .5, dy: 1 },
      goldPull: { dx: .5, dy: 1 },
      outcome: { x: 19, dy: 4 },
      staff: { dx: 20, dy: 4.5 }
    }),  // Story 03 · Hirehouse ("50,000 RÉSUMÉS.") — tune next
  },
  // ── Tablet portrait (stacked layout) ──────────────────────────────────
  tablet: {
    s1: _slot({
      headline: { dy: 1 },
      goldenHeadline: { dx: -8, dy: 1, fontSizeAdj: 0 },
      deck: { dx: 1, dy: 6.5 },
      figure: { wAdj: -2, hAdj: 4, dy: 4 },
      body: { dx: 1, dy: 6, maxWAdj: -30 },
      goldBody: { dx: 11.35, dy: 2.9 },
      pull: { dx: .5, dy: 6 },
      goldPull: { dx: .5, dy: 6 },
      outcome: { x: 1, dy: 7, maxWAdj: -10, fontSizeAdj: -0.25  },
      staff: { x: .3, dy: 7.5, maxWAdj: 0, fontSizeAdj: -0.25  }
    }),
    s2: _slot({
      headline: { dy: -1, maxWAdj: -10, fontSizeAdj: -1.5 },
      goldenHeadline: { dx: -8, dy: -1, fontSizeAdj: -1.5 },
      deck: { dx: 1, dy: 4.5 },
      figure: { wAdj: -2, hAdj: 1, dy: 3 },
      body: {  maxWAdj: -30, dx: 1, dy: 5 },
      goldBody: { dx: 11.35, dy: 4.9, off: true },
      pull: { dx: .5, dy: 2 },
      goldPull: { dx: .5, dy: 2 },
      outcome: { x: 1, dy: 3.5, maxWAdj: -10, fontSizeAdj: -0.25  },
      staff: { x: .3, dy: 3.5, maxWAdj: 0, fontSizeAdj: -0.25  }
    }),
    s3: _slot({
      headline: { dy: 3, maxWAdj: -10, fontSizeAdj: -1.5 },
      goldenHeadline: { dx: -8, dy: 3, fontSizeAdj: -1.5 },
      deck: { dx: 1, dy: 9 },
      figure: { wAdj: -2, hAdj: 1, dy: 7.5 },
      body: {  maxWAdj: -32, dx: 1, dy: 8.5, fontSizeAdj: -0.25 },
      goldBody: { dx: 10.5, dy: 3.98, fontSizeAdj: -0.25 },
      pull: { dx: .5, dy: 7.5 },
      goldPull: { dx: .5, dy: 7.5 },
      outcome: { x: 1, dy: 9, maxWAdj: -10, fontSizeAdj: -0.25  },
      staff: { x: .3, dy: 9.5, maxWAdj: 0, fontSizeAdj: -0.25  }
    }),
  },
  // ── Mobile portrait (stacked layout) ──────────────────────────────────
  mobile: {
    s1: _slot({
      kicker: { dy: 5 },
      headline: { dy: 6 },
      goldenHeadline: { dx: -8, dy: 6 },
      deck: { dx: 1.5, dy: 11, maxWAdj: 1.8 },
      figure: { dy: 10, hAdj: 4 },
      body: { dy: 12 },
      goldBody: { dx: -9.2, dy: 0.52 },
      pull: { dx: 0, dy: 2 },
      goldPull: { dx: 0, dy: 2 },
      outcome: { x: 0, dy: 3, maxWAdj: -10, fontSizeAdj: -0.40  },
      staff: { x: .3, dy: 3.5, maxWAdj: 0, fontSizeAdj: -0.40  }
    }),
    s2: _slot({
      headline: { dx: 1, dy: -.3, maxWAdj: -0, fontSizeAdj: -1.5 },
      goldenHeadline: { dx: -7, dy: -.3, fontSizeAdj: -1.5 },
      deck: { dx: 1.5, dy: 7, maxWAdj: 1.8 },
      figure: { dy: 6.5, hAdj: 1 },
      body: { dx: 0, dy: 10, fontSizeAdj: -0.25, maxWAdj: -6 },
      goldBody: { dx: -9.5, dy: 1.4 },
      pull: { dx: 0, dy: 3 },
      goldPull: { dx: 0, dy: 3 },
      outcome: { x: 0, dy: 3, maxWAdj: -10, fontSizeAdj: -0.40  },
      staff: { x: .3, dy: 3.5, maxWAdj: 0, fontSizeAdj: -0.40  }
    }),
    s3: _slot({
      kicker: { dy: 2.5 },
      headline: { dx: 1, dy: 3, maxWAdj: -0, fontSizeAdj: -1.5 },
      goldenHeadline: { dx: -7, dy: 3, fontSizeAdj: -1.5 },
      deck: { dx: 1.5, dy: 9, maxWAdj: 1.8 },
      figure: { dy: 8.5, hAdj: 2 },
      body: { dx: 0, dy: 12, fontSizeAdj: -0.25, maxWAdj: -6 },
      goldBody: { dx: -12.2, dy: 3.5, fontSizeAdj: -0.25 },
      pull: { dx: 0, dy: 6, fontSizeAdj: -0.40 },
      goldPull: { dx: 0, dy: 6, fontSizeAdj: -0.40 },
      outcome: { x: 0, dy: 7, maxWAdj: -10, fontSizeAdj: -0.40  },
      staff: { x: .3, dy: 7.5, maxWAdj: 0, fontSizeAdj: -0.40  }
    }),
  },
}

// Build the camera keyframe table from the active breakpoint config.
// Portrait breakpoints need much higher `s` at the park beats so a
// single article fills the viewport (taller paper-vs-screen ratio).
function buildKeys(c) {
  return [
    { p: 0.000, cy: 18,              s: c.s.wide     },
    { p: 0.060, cy: 18,              s: c.s.open     },
    { p: 0.140, cy: c.cy.story1,     s: c.s.park     },
    { p: 0.300, cy: c.cy.story1,     s: c.s.park     },
    { p: 0.380, cy: c.cy.turn12,     s: c.s.turn     },
    { p: 0.460, cy: c.cy.story2,     s: c.s.park     },
    { p: 0.600, cy: c.cy.story2,     s: c.s.park     },
    { p: 0.680, cy: c.cy.turn23,     s: c.s.turn     },
    { p: 0.760, cy: c.cy.story3,     s: c.s.park     },
    { p: 0.835, cy: c.cy.story3,     s: c.s.park     },
    { p: 0.900, cy: c.cy.postcard,   s: c.s.postcard },
    { p: 1.000, cy: c.cy.postcard,   s: c.s.postcard },
  ]
}

function interpolateCam(KEYS, p) {
  p = clamp01(p)
  let a = KEYS[0], b = KEYS[KEYS.length - 1]
  for (let i = 0; i < KEYS.length - 1; i++) {
    if (p >= KEYS[i].p && p <= KEYS[i + 1].p) { a = KEYS[i]; b = KEYS[i + 1]; break }
  }
  const span = b.p - a.p
  const t = span > 0 ? ease((p - a.p) / span) : 0
  return { cy: a.cy + (b.cy - a.cy) * t, s: a.s + (b.s - a.s) * t }
}

function stationFromP(p) {
  if (p < 0.08) return 0
  if (p < 0.38) return 1
  if (p < 0.68) return 2
  if (p < 0.84) return 3
  return 0
}

// ── Shaders ────────────────────────────────────────────────────────────────

const paperVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const paperFrag = /* glsl */ `
varying vec2 vUv;
float hash21(vec2 p) {
  p = fract(p * vec2(233.34, 851.74));
  p += dot(p, p + 23.45);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i+vec2(1,0)), f.x),
             mix(hash21(i+vec2(0,1)), hash21(i+vec2(1,1)), f.x), f.y);
}
void main() {
  float d = length(vUv - 0.5) * 1.8;
  vec3 paper = mix(vec3(0.945,0.902,0.812), vec3(0.867,0.788,0.639), clamp(d,0.0,1.0));
  float g = noise(vUv * 180.0) * 0.06 + noise(vUv * 360.0) * 0.03;
  paper += g - 0.045;
  vec2 c = abs(vUv - 0.5);
  paper -= length(max(c - 0.38, 0.0)) * 0.15;
  gl_FragColor = vec4(clamp(paper, 0.0, 1.0), 1.0);
}
`

const dimVert = /* glsl */ `void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`
const dimFrag = /* glsl */ `
uniform float uAlpha;
void main() { gl_FragColor = vec4(0.945, 0.902, 0.812, uAlpha); }
`

// ── Helpers ────────────────────────────────────────────────────────────────

function Rule({ y, w = 96, thick = 0.18, opacity = 0.25, order }) {
  return (
    <mesh position={[0, y, 0]} renderOrder={order}>
      <planeGeometry args={[w, thick]} />
      <meshBasicMaterial color="#1a1612" transparent depthTest={false} depthWrite={false} opacity={opacity} />
    </mesh>
  )
}

function DoubleRule({ y, order }) {
  return <><Rule y={y + 0.3} order={order} /><Rule y={y - 0.3} order={order} /></>
}

function SectionRule({ y, label, order, fontSize }) {
  return (
    <group position={[0, y, 0]}>
      <Rule y={0} order={order} opacity={0.28} />
      <Text font={FONTS.dmMono400} fontSize={fontSize} color="#8e6c28" anchorX="center" anchorY="middle"
        letterSpacing={0.3} renderOrder={order + 1} position={[0, 0, 0.01]} fillOpacity={0.95}>
        {label}
      </Text>
    </group>
  )
}

function DimOverlay({ h, y, uniforms, order }) {
  return (
    <mesh position={[0, y, 0.02]} renderOrder={order}>
      <planeGeometry args={[98, h]} />
      <shaderMaterial vertexShader={dimVert} fragmentShader={dimFrag} uniforms={uniforms}
        transparent depthTest={false} depthWrite={false} />
    </mesh>
  )
}

// ── Story content (text only — positions come from layout config) ──────────

// Story content. `body` is the full 3-paragraph desktop body. `bodyStacked`
// is the compact single-paragraph version used on portrait, where stacked
// layout + narrower column would otherwise produce a 40+du tall body block
// that overflows the article. Narrative arc (hook → outcome) preserved.
const STORIES = [
  {
    kicker:   'STORY Nº 01  ·  Filed · Late Night  ·  The Workbench · 2024',
    headline: 'ONE FEED. MINE.',
    headlineGold: 'ONE FEED.',
    deck:     'Five newsletters kept sending me the same AI news every day. So I built one feed that reads them all, drops the repeats, and emails me a single summary each morning.',
    body:     'Five sources. Same story. Five times a day.\n\nEvery AI update was repeated across five newsletters, two blogs, and a Twitter feed — so I kept reading the same thing over and over.\n\nI built a small program that pulls every source overnight, removes the duplicates, and writes one short summary. It runs on my own laptop while I sleep. No cloud, no cost.',
    bodyStacked: 'Five sources, same story, five times a day. I built a small program that pulls them all overnight, removes the duplicates, and writes one summary. Runs on my laptop. No cloud, no cost.',
    bodyGold: 'removes the duplicates',
    pull:     '"Five sources in. One summary out."',
    outcome:  'OUTCOME — I read it every morning  ·  zero cloud bill  ·  runs on my laptop',
    staff:    'BUILT WITH — Python · DSPy · Ollama · Gemma · Qwen · PWA',
    figLabel: 'FIG. 01 · SYNDICATE',
    fig: '/assets/fig_1.png',
  },
  {
    kicker:   'STORY Nº 02  ·  Filed · Ops Desk  ·  The Workbench · 2022 — present',
    headline: 'THE TOOL THAT RAN THE TEAM.',
    headlineGold: 'RAN',
    deck:     'Twelve people, daily standups dragging on for an hour, tasks slipping through the cracks. So I built one tool to track everything — and it ended up running the meetings too.',
    body:     "It started as a timesheet. By the time the team had doubled, it was running the standup.\n\nWe grew to twice the size, and spreadsheets weren't enough. Standups stretched to an hour, and things kept getting missed.\n\nSo I built Hourglass. It tracked work, leave, and expenses in one place. Then it joined our calls, wrote down what was said, and reminded everyone in the next standup what they'd forgotten.",
    bodyStacked: "It started as a timesheet. By the time the team had doubled, it had joined our calls and was reminding everyone in the next standup what they'd forgotten.",
    bodyGold: "joined our calls",
    pull:     '"Started as a spreadsheet. Ended up running the team."',
    outcome:  'OUTCOME — 10× the work, same team  ·  nothing falls through anymore',
    staff:    'BUILT WITH — React · Node.js · MS Teams · AI · Azure',
    figLabel: 'FIG. 02 · HOURGLASS',
    fig: '/assets/fig_2.png',
  },
  {
    kicker:   'STORY Nº 03  ·  Filed · Casting Desk  ·  The Workbench · 2023',
    headline: '50,000 RÉSUMÉS. ONE DECISION.',
    headlineGold: '50,000 RÉSUMÉS.',
    deck:     'My manager spent three hours a day on hiring calls — most with the wrong people. So I built a way to find the best candidates automatically, and left the final call to him.',
    body:     "My manager wasn't dodging meetings. He was three hours deep in candidate calls every day.\n\nMost of those calls were with people who should never have made it past the résumé. So I built the filter he needed — without taking the human out of the final decision.\n\nDrop in a résumé — no form, no questions. The AI reads it and ranks it against the rest, like a tournament. The top ones get a video interview. The best rise to the top, and a human still picks.",
    bodyStacked: "My manager was three hours deep in candidate calls every day. So I built the filter: the AI ranks résumés, the best rise to the top, and a human still picks.",
    bodyGold: 'ranks it against',
    pull:     '"Résumés compete. Videos compete. The best rise. You decide."',
    outcome:  'OUTCOME — 50,000+ résumés processed  ·  costs next to nothing',
    staff:    'BUILT WITH — React · Node.js · AI / LLM · Video',
    figLabel: 'FIG. 03 · HIREHOUSE',
    fig: '/assets/fig_3.png',
  },
]

// ── StorySection — one article rendered from content + position config ─────

function StorySection({ pos, size, story, gRefs, order, stacked, storyKey }) {
  const bp = useBp()
  const adj = LAYOUT_CONFIG[bp][storyKey]
  const figTex = useTexture(story.fig)

  // Per-story gold headline offset (GOLD_TREATMENT global + per-story override)
  const storyOff = GOLD_TREATMENT[storyKey] ?? { offsetX: 0, offsetY: 0 }
  const gx = GOLD_TREATMENT.offsetX + storyOff.offsetX
  const gy = GOLD_TREATMENT.offsetY + storyOff.offsetY

  const headlineGoldText = stacked ? story.headline : story.headlineGold
  const bodyText = story.body
  const bodyAnchorX = stacked ? 'center' : 'left'
  const bodyAnchorY = 'top'
  const pullAnchorX = stacked ? 'center' : 'left'

  return (
    <>
      <Text font={FONTS.dmMono400} fontSize={size.kicker} color="#8e6c28" anchorX="center" anchorY="middle"
        letterSpacing={0.3} renderOrder={order + 2}
        position={[adj.kicker.dx, pos.kickerY + adj.kicker.dy, 0]} fillOpacity={0.95}>
        {story.kicker}
      </Text>

      {/* Headline base — black ink */}
      <Text font={FONTS.anton} fontSize={size.headline + adj?.headline?.fontSizeAdj} color="#1a1612" anchorX="center" anchorY="middle"
        letterSpacing={-0.012} maxWidth={size.headlineMaxW + adj?.headline?.maxWAdj}
        renderOrder={order + 2}
        position={[adj.headline.dx, pos.headlineY + adj.headline.dy, 0]} fillOpacity={0.95}>
        {story.headline}
      </Text>
      {/* Headline shadow (only visible when GOLD_TREATMENT.depth > 0) */}
      <Text font={FONTS.anton} fontSize={size.headlinej} color="#3a2810" anchorX="center" anchorY="middle"
        letterSpacing={-0.012} maxWidth={size.headlineMaxW}
        renderOrder={order + 2.5}
        position={[
          pos.goldHeadlineX + gx - 0.15 * GOLD_TREATMENT.depth,
          pos.headlineY    + gy - 0.15 * GOLD_TREATMENT.depth,
          0.005
        ]}
        rotation={[0, 0, GOLD_TREATMENT.rotation]}
        scale={GOLD_TREATMENT.scale}
        fillOpacity={0} ref={gRefs.headlineShadow}>
        {headlineGoldText}
      </Text>
      {/* Headline gold overprint */}
      <Text font={FONTS.anton} fontSize={size.headline + adj?.goldenHeadline?.fontSizeAdj} color={GOLD_TREATMENT.color} anchorX="center" anchorY="middle"
        letterSpacing={-0.012} maxWidth={size.headlineMaxW}
        renderOrder={order + 3}
        position={[
          pos.goldHeadlineX + gx + adj.goldenHeadline.dx,
          pos.headlineY    + gy + adj.goldenHeadline.dy,
          0.01
        ]}
        rotation={[0, 0, GOLD_TREATMENT.rotation]}
        scale={GOLD_TREATMENT.scale}
        fillOpacity={0} ref={gRefs.headline}>
        {headlineGoldText}
      </Text>

      <Text font={FONTS.cormorantItalic500} fontSize={size.deck} color="#241d17" anchorX="center" anchorY="top"
        maxWidth={size.deckMaxW + adj.deck.maxWAdj} renderOrder={order + 2}
        position={[adj.deck.dx, pos.deckY + adj.deck.dy, 0]} fillOpacity={1}>
        {story.deck}
      </Text>

      {/* Figure */}
      <mesh renderOrder={order + 3} position={[pos.figureX + adj.figure.dx, pos.figureY + adj.figure.dy, 0]}>
        <planeGeometry args={[pos.figureW + adj.figure.wAdj, pos.figureH + adj.figure.hAdj]} />
        <meshBasicMaterial map={figTex} transparent depthTest={false} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* Body + body gold */}
      <Text font={FONTS.cormorant} fontSize={size.body + adj.body.fontSizeAdj} color="#1a1410" anchorX={bodyAnchorX} anchorY={bodyAnchorY}
        maxWidth={size.bodyMaxW + adj.body.maxWAdj} lineHeight={1.5} renderOrder={order + 2}
        position={[pos.bodyX + adj.body.dx, pos.bodyY + adj.body.dy, 0]} fillOpacity={0.97}>
        {bodyText}
      </Text>
      {!adj.goldBody.off && <Text font={FONTS.cormorant} fontSize={size.body + adj.body.fontSizeAdj} color={GOLD_TREATMENT.color}
        anchorX={bodyAnchorX} anchorY={bodyAnchorY}
        maxWidth={size.bodyMaxW + adj.goldBody.maxWAdj} lineHeight={1.5} renderOrder={order + 3}
        position={[
          pos.bodyX     + adj.goldBody.dx,
          pos.goldBodyY + adj.goldBody.dy,
          0.01
        ]}
        rotation={[0, 0, GOLD_TREATMENT.rotation]}
        scale={GOLD_TREATMENT.scale}
        fillOpacity={0} ref={gRefs.body}>
        {story.bodyGold}
      </Text>}

      {/* Pull quote + gold */}
      <Text font={FONTS.cormorantItalic500} fontSize={size.pull + adj.pull.fontSizeAdj} color="#0f0b08" anchorX={pullAnchorX} anchorY="middle"
        maxWidth={size.pullMaxW} renderOrder={order + 2}
        position={[pos.pullX + adj.pull.dx, pos.pullY + adj.pull.dy, 0]} fillOpacity={1.0}>
        {story.pull}
      </Text>
      <Text font={FONTS.cormorantItalic500} fontSize={size.pull + adj.goldPull.fontSizeAdj} color={GOLD_TREATMENT.color}
        anchorX={pullAnchorX} anchorY="middle"
        maxWidth={size.pullMaxW} renderOrder={order + 3}
        position={[
          pos.pullX + adj.goldPull.dx,
          pos.pullY + adj.goldPull.dy,
          0.01
        ]}
        rotation={[0, 0, GOLD_TREATMENT.rotation]}
        scale={GOLD_TREATMENT.scale}
        fillOpacity={0} ref={gRefs.pull}>
        {story.pull}
      </Text>

      <Text font={FONTS.dmMono400} fontSize={size.meta + adj.outcome.fontSizeAdj} color="#1a1410" anchorX="center" anchorY="middle"
        letterSpacing={0.18} renderOrder={order + 2}
        maxWidth={size.outcomeMaxW + adj.outcome.maxWAdj}
        position={[adj.outcome.x , pos.outcomeY + adj.outcome.dy, 0]} fillOpacity={0.92}>
        {story.outcome}
      </Text>
      <Text font={FONTS.dmMono400} fontSize={size.meta + adj.staff.fontSizeAdj} color="#4a4030" anchorX="center" anchorY="middle"
        letterSpacing={0.2} renderOrder={order + 2}
        maxWidth={size.staffMaxW + adj.staff.maxWAdj}
        position={[adj.staff.x, pos.staffY + adj.staff.dy, 0]} fillOpacity={0.88}>
        {story.staff}
      </Text>
    </>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function CraftsChapter({ smoothed }) {
  const { peel: peelLayout } = useLayout()
  const { peelDist, overscan, crafts: c } = peelLayout

  const paperGroupRef = useRef()
  const pRef = useRef(0)

  const dimU = useMemo(() => [
    { uAlpha: { value: 0.38 } },
    { uAlpha: { value: 0.38 } },
    { uAlpha: { value: 0.38 } },
  ], [])

  // 9 gold-overlay refs (headline / body / pull × 3 stories) + 3 headline
  // shadow refs for the depth/stamp effect. Declared top-level to comply
  // with the rules of hooks.
  const g1h = useRef(), g1b = useRef(), g1p = useRef(), g1hSh = useRef()
  const g2h = useRef(), g2b = useRef(), g2p = useRef(), g2hSh = useRef()
  const g3h = useRef(), g3b = useRef(), g3p = useRef(), g3hSh = useRef()

  const GOLD = useMemo(() => [
    [g1h, GOLD_THRESHOLDS.s1.headline],
    [g1b, GOLD_THRESHOLDS.s1.body],
    [g1p, GOLD_THRESHOLDS.s1.pull],
    [g2h, GOLD_THRESHOLDS.s2.headline],
    [g2b, GOLD_THRESHOLDS.s2.body],
    [g2p, GOLD_THRESHOLDS.s2.pull],
    [g3h, GOLD_THRESHOLDS.s3.headline],
    [g3b, GOLD_THRESHOLDS.s3.body],
    [g3p, GOLD_THRESHOLDS.s3.pull],
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [])

  const HEADLINE_SHADOWS = useMemo(() => [
    [g1hSh, GOLD_THRESHOLDS.s1.headline],
    [g2hSh, GOLD_THRESHOLDS.s2.headline],
    [g3hSh, GOLD_THRESHOLDS.s3.headline],
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [])

  const KEYS = useMemo(() => buildKeys(c), [c])

  useFrame(({ camera, size }) => {
    const sm = smoothed.current ?? 0

    // ── Scroll normalization ─────────────────────────────────────────────────
    // The 1500vh spacer makes total scroll length ∝ vpH, so a fixed physical
    // scroll gesture produces less progress on taller viewports (tablet/mobile).
    // Chrome DevTools touch simulation additionally divides scroll deltas by the
    // device pixel ratio, compounding the effect.
    //
    // Correct both factors relative to the desktop reference (1080px, DPR=1)
    // so camera choreography and gold reveals are physically consistent across
    // all breakpoints. Cap at 2.5 so real-device momentum scroll stays sane.
    //
    // Reference: 1080px @ DPR=1 = 1.0× (desktop baseline, unchanged).
    // Typical: iPad (1180px, DPR=2) ≈ 2.19×; iPhone (932px, DPR=3) ≈ 2.59×.
    const REF_VPH = 1080
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio ?? 1))
    // Floor at 1.0 so desktop viewports shorter than 1080 (e.g. 1920×900 after
    // browser chrome) still reach p=1.0 at end of scroll — otherwise the
    // postcard dolly (which arrives at p≈0.94) is unreachable.
    const scrollNorm = Math.max(1.0, Math.min(2.5, dpr * size.height / REF_VPH))
    const p = clamp01((sm - CRAFTS_START) * scrollNorm / (1.0 - CRAFTS_START))
    pRef.current = p
    // The Roster (Chapter III) owns the scroll band before CRAFTS_START — hide
    // the newspaper there so the peel reveals the reel-road, not this paper.
    if (paperGroupRef.current) paperGroupRef.current.visible = sm > CRAFTS_START - 0.01

    const h_vp = 2 * peelDist * Math.tan(camera.fov * DEG / 2) * overscan
    const w_vp = h_vp * size.width / size.height
    const { cy, s } = interpolateCam(KEYS, p)
    const sf = w_vp / 100

    const pg = paperGroupRef.current
    if (pg) {
      pg.scale.setScalar(sf * s)
      // Per-bp paper height: cy is paper-y from top (0..paperH). Position the
      // group so paper-row `cy` lands at screen centre after the s-scale.
      const ph = c.paperH
      pg.position.y = sf * s * ph * (cy / ph - 0.5)
      pg.position.x = 0
    }

    const station = stationFromP(p)
    const targets = [
      station === 1 ? 0.0 : 0.36,
      station === 2 ? 0.0 : 0.36,
      station === 3 ? 0.0 : 0.36,
    ]
    for (let i = 0; i < 3; i++) {
      dimU[i].uAlpha.value += (targets[i] - dimU[i].uAlpha.value) * 0.06
    }

    // Drive all gold overlays + (optional) headline shadows from the
    // GOLD_TREATMENT block. effectiveOpacity caps at 1; shadowOp falls to 0
    // when depth=0 (shadow Text still mounted but invisible).
    const peakOp = Math.min(GOLD_TREATMENT.opacity * GOLD_TREATMENT.inkStrength, 1)
    const shadowOp = peakOp * 0.4 * GOLD_TREATMENT.depth
    const lerp = GOLD_TREATMENT.revealEase

    for (const [ref, th] of GOLD) {
      if (ref.current) {
        const target = p >= th ? peakOp : 0
        ref.current.fillOpacity += (target - ref.current.fillOpacity) * lerp
      }
    }
    for (const [ref, th] of HEADLINE_SHADOWS) {
      if (ref.current) {
        const target = p >= th ? shadowOp : 0
        ref.current.fillOpacity += (target - ref.current.fillOpacity) * lerp
      }
    }
  })

  const RO = ORDER.nextChapter
  const ROT = ORDER.nextChapter + 1
  const sz = c.size
  // Masthead positions are fixed offsets from paper top so the chrome lands
  // at the same place on every breakpoint, regardless of paperH.
  const top = c.paperH / 2
  const skylineY    = top - 4
  const strapY      = top - 7.5
  const ruleStrapY  = top - 8.8
  const titleY      = top - 18.5
  const taglineY    = top - 26.5
  const editorialY  = top - 30
  const doubleRuleY = top - 33

  return (
    <>
    {/* Chapter-isolation backdrop — viewport-aligned, masks newspaper during
        postcard phase. Sibling of paperGroup so it doesn't inherit paper
        transforms. RenderOrder sits between newspaper layers and cardstock. */}
    <ExitNoticeBackdrop pRef={pRef} />

    <group ref={paperGroupRef}>

      {/* Paper background — per-bp height (260 desktop, 300 portrait) */}
      <mesh renderOrder={RO} position={[0, 0, -0.1]}>
        <planeGeometry args={[100, c.paperH]} />
        <shaderMaterial vertexShader={paperVert} fragmentShader={paperFrag}
          depthTest={false} depthWrite={false} transparent />
      </mesh>

      {/* ── Skyline strap ──────────────────────────────────── */}
      <Text font={FONTS.dmMono400} fontSize={sz.mastheadStrap} color="#3d3525" anchorX="center" anchorY="middle"
        letterSpacing={0.28} renderOrder={ROT} position={[0, skylineY, 0]} fillOpacity={0.9}>
        {'VOL II · NO. 03     ★ ★ ★     LATE EDITION · NIGHT FILE     ★ ★ ★     SIX PAGES · ₹0'}
      </Text>

      {/* ── Masthead ───────────────────────────────────────── */}
      <Rule y={top - 5.5} order={ROT} opacity={0.45} />
      <Text font={FONTS.dmMono400} fontSize={sz.mastheadStrap} color="#3d3525" anchorX="center" anchorY="middle"
        letterSpacing={0.22} renderOrder={ROT} position={[0, strapY, 0]} fillOpacity={0.9}>
        {'FILED · 03:42 AM               EDITOR · A. VELU               TUE · MAY 2026'}
      </Text>
      <Rule y={ruleStrapY} order={ROT} opacity={0.28} />

      <Text font={FONTS.anton} fontSize={sz.title} color="#0d0a07" anchorX="center" anchorY="middle"
        letterSpacing={-0.012} renderOrder={ROT} position={[0, titleY, 0]}>
        {'THE CUTTING·ROOM'}
      </Text>

      <Text font={FONTS.cormorantItalic500} fontSize={sz.tagline} color="#241d17" anchorX="center" anchorY="middle"
        renderOrder={ROT} position={[0, taglineY, 0]} fillOpacity={0.96}>
        {'all the news the workbench saw fit to file'}
      </Text>

      <Text font={FONTS.dmMono400} fontSize={sz.mastheadStrap} color="#3d3525" anchorX="center" anchorY="middle"
        letterSpacing={0.28} renderOrder={ROT} position={[0, editorialY, 0]} fillOpacity={0.92}>
        {'REEL Nº 02  ·  CHAPTER II  ·  THE CRAFTS  ·  2022 — PRESENT'}
      </Text>

      <DoubleRule y={doubleRuleY} order={ROT} />

      {/* ── Story 01 ────────────────────────────────────────── */}
      <DimOverlay h={c.dim[0].h} y={c.dim[0].y} uniforms={dimU[0]} order={ROT + 1} />
      <StorySection pos={c.stories[0]} size={sz} story={STORIES[0]}
        gRefs={{ headline: g1h, headlineShadow: g1hSh, body: g1b, pull: g1p }} order={ROT} stacked={c.stacked} storyKey="s1" />

      <Rule y={c.ruleY.r12 + 2} order={ROT} opacity={0.18} />

      {/* ── Story 02 ────────────────────────────────────────── */}
      <DimOverlay h={c.dim[1].h} y={c.dim[1].y} uniforms={dimU[1]} order={ROT + 1} />
      <StorySection pos={c.stories[1]} size={sz} story={STORIES[1]}
        gRefs={{ headline: g2h, headlineShadow: g2hSh, body: g2b, pull: g2p }} order={ROT} stacked={c.stacked} storyKey="s2" />

      <Rule y={c.ruleY.r23 + 2} order={ROT} opacity={0.18} />

      {/* ── Story 03 ────────────────────────────────────────── */}
      <DimOverlay h={c.dim[2].h} y={c.dim[2].y} uniforms={dimU[2]} order={ROT + 1} />
      <StorySection pos={c.stories[2]} size={sz} story={STORIES[2]}
        gRefs={{ headline: g3h, headlineShadow: g3hSh, body: g3b, pull: g3p }} order={ROT} stacked={c.stacked} storyKey="s3" />

      {/* ── Colophon ───────────────────────────────────────── */}
      <DoubleRule y={c.colophonY + 3} order={ROT} />
      <Text font={FONTS.dmMono400} fontSize={sz.colophon} color="#3d3525" anchorX="center" anchorY="middle"
        letterSpacing={0.24} renderOrder={ROT} position={[0, c.colophonY, 0]} fillOpacity={0.92}>
        {'PAGE 22 · OF 22     — end of reel · continued in CHAPTER III · THE RECORD —     REEL Nº 02 · 2026'}
      </Text>

    </group>

    {/* Exit Notice postcard — viewport-aligned (sibling of paperGroup, not
        child). Its size and position derive from the live camera frustum,
        not from paper coordinates, so per-bp recomposition is clean. */}
    <ExitNoticeChapter pRef={pRef} />
    </>
  )
}
