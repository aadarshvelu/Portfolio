import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text, Line } from '@react-three/drei'
import { DOLLY_END, BEAT1_END, TRANSITION_END } from '../config.js'
import { useLayout } from '../breakpoint.js'
import { FONTS } from '../../../fonts.js'

const GOLD = '#c8a157'
const CREAM = '#ede4d2'
const HR_GREEN = '#2ec866' // HackerRank brand green
const HR_URL = 'https://www.hackerrank.com/profile/Aadarshvelu'
const DSA_URL = 'https://dsavisually.netlify.app/'
const MYPASS_URL = 'https://github.com/aadarshvelu/MyPass'
const LISTENIFY_URL = 'https://github.com/aadarshvelu/Listenify'
const DATA_STRUCTURES_URL = 'https://github.com/aadarshvelu/Data-Structures'

// Chapter I — The Origin, Beat 1.
//
// Two line shapes:
//   simple line: { t, a, link?, deco?, base? } — one Text, `a` = accent ranges
//                [substring, colour], `link` makes the WHOLE line clickable.
//   run line:    { runs: [{ t, color?, link?, deco? }, ...] } — several Texts
//                laid out left-to-right on one row, so ONE sentence can carry
//                several independently-clickable words (e.g. "password
//                manager" and "music player" each link out on their own).
// `deco` (either shape) adds the dotted underline + external-link icon.
const LINES = [
  { t: 'At sixteen, I found Java.', a: [['Java', GOLD]] },
  { t: 'I taught myself, with determination.', a: [['determination', GOLD]] },
  {
    t: 'Every day, one more problem on HackerRank.',
    a: [['HackerRank', HR_GREEN]],
    link: HR_URL,
  },
  { t: 'By eighteen, coding felt natural.', a: [['eighteen', GOLD]] },
  {
    fontMul: 0.82, // these project-link rows read a touch smaller than the prose
    runs: [
      { t: 'I built real things too:' },
      { t: 'password manager', color: GOLD, link: MYPASS_URL, deco: true, space: true },
      { t: ',' },
      { t: 'music player', color: GOLD, link: LISTENIFY_URL, deco: true, space: true },
      { t: '.' },
    ],
  },
  {
    fontMul: 0.82,
    runs: [
      { t: 'I rebuilt every' },
      { t: 'data structure', color: GOLD, link: DATA_STRUCTURES_URL, deco: true, space: true },
      { t: 'by hand, in Java.', space: true },
    ],
  },
  { t: 'Then I found React.js, and everything changed.', a: [['React.js', GOLD]] },
  { t: 'So I built a tool to show how algorithms work.', a: [] },
  { t: 'DSA Visually', a: [], base: GOLD, link: DSA_URL, deco: true },
  {
    t: 'That got me hired at eighteen, by a startup from London.',
    a: [['eighteen', GOLD], ['London', GOLD]],
  },
]

// precompute troika colorRanges (paints the accent words) for SIMPLE lines.
// troika leaves characters before the first range key uncoloured (black), so
// the range must start explicitly at index 0 with the base colour. Run lines
// pass through untouched — each run carries its own colour instead.
const LINE_DATA = LINES.map((line) => {
  if (line.runs) return line
  const baseColor = line.base || CREAM
  const colorRanges = { 0: baseColor }
  for (const [sub, col] of line.a) {
    const i = line.t.indexOf(sub)
    if (i >= 0) {
      colorRanges[i] = col
      colorRanges[i + sub.length] = baseColor
    }
  }
  return { ...line, colorRanges }
})

// Lay out a run line's segments left-to-right, WRAPPING at maxW (so a long
// sentence with inline links flows onto extra rows just like the simple lines).
// Word gaps are added explicitly (`space:true`) because troika trims the edge
// spaces off each run's measured width. Returns per-run { x, y } (y = the row
// offset, whole block vertically centred) plus the row count.
function layoutRun(runs, rts, maxW, fs, lineHW, spaceW, centered) {
  const iconReserve = fs * 1.05 // deco'd runs reserve room for the trailing arrow,
  // so the NEXT run (e.g. the comma) lands after the icon, not before it.
  const rowOf = [], xOf = [], ewOf = []
  let cx = 0, row = 0
  for (let j = 0; j < runs.length; j++) {
    const info = rts[j]?.textRenderInfo
    const w = info ? info.blockBounds[2] - info.blockBounds[0] : runs[j].t.length * fs * 0.5
    const ew = w + (runs[j].deco ? iconReserve : 0) // effective advance incl. arrow
    ewOf[j] = ew
    const gap = runs[j].space ? spaceW : 0
    if (cx > 0 && cx + gap + ew > maxW) { row++; cx = 0 } // wrap (never leave a gap at row start)
    else if (cx > 0) cx += gap
    rowOf[j] = row; xOf[j] = cx
    cx += ew
  }
  const rows = row + 1
  const rowW = new Array(rows).fill(0)
  for (let j = 0; j < runs.length; j++) {
    const r = rowOf[j]
    rowW[r] = Math.max(rowW[r], xOf[j] + ewOf[j])
  }
  const topY = ((rows - 1) / 2) * lineHW
  const placements = runs.map((_, j) => ({
    x: xOf[j] - (centered ? rowW[rowOf[j]] / 2 : 0),
    y: topY - rowOf[j] * lineHW,
  }))
  return { placements, rows }
}

const DEG = Math.PI / 180
const clamp01 = (x) => Math.min(1, Math.max(0, x))
const smoothstep = (x) => {
  x = clamp01(x)
  return x * x * (3 - 2 * x)
}

// the lines ride a horizontal cylinder — an Apple-picker style convex drum
const DRUM_RADIUS = 0.55
const MAX_ANGLE = 1.5
// lines stay full opacity across the readable arc; EDGE_FADE is the fraction
// of the arc (at each edge) over which a line fades out as it exits
const EDGE_FADE = 1
const DOT_COUNT = 32 // dotted underline beneath the DSA Visually link
const CLICK_MIN_OPACITY = 0.5 // a line only acts as a link while readable
// How far toward the right edge the story column fills, as a fraction of the
// viewport half-width. The fit shrink (see useFrame) lands the column's right
// edge exactly here, so this reads directly as "fill %": higher = closer to the
// edge (less right-hand whitespace), lower = more margin. Wide screens where the
// column already fits inside this keep their natural size (fit = 1).
const COLUMN_FILL = 1.35

export default function OriginBeat({ smoothed, frameMarker, coneAnchor }) {
  const { originBeat } = useLayout()
  const {
    x: baseX,
    gap: baseGap,
    laneTop,
    laneBot,
    fontSize: baseFont,
    maxWidth: baseMaxWidth,
    anchorX,
  } = originBeat

  // The column is laid out in fixed world units, but the visible width changes
  // with the viewport aspect (parked visH is constant, so visW = visH·aspect) and
  // the CRT vignette eats the edges. `fit` shrinks the whole column uniformly so
  // it never runs off the right edge — wrapping is preserved because fontSize and
  // maxWidth scale together. Recomputed live in useFrame from the parked view.
  const [fit, setFit] = useState(1)
  const fitRef = useRef(1)
  const fontSize = baseFont * fit
  const gap = baseGap * fit
  const x = baseX * fit
  const maxWidth = baseMaxWidth * fit

  const outer = useRef()
  const groups = useRef([])
  const texts = useRef([]) // simple lines only: texts.current[lineIndex]
  // Per-line deco decorations (dotted underline + arrow icon) for SIMPLE deco
  // lines (currently just "DSA Visually") — keyed by line index.
  const dots = useRef([]) // dots.current[lineIndex] = [dotRef, dotRef, ...]
  const icons = useRef([]) // icons.current[lineIndex] = iconRef

  // Run lines (several clickable words on one row) — keyed [lineIndex][runIndex].
  // Run links show ONLY the external-link arrow (no dotted underline — that's
  // reserved for the standalone DSA Visually line).
  const runTexts = useRef([]) // runTexts.current[i][j] = Text ref for run j of line i
  const runIcons = useRef([]) // runIcons.current[i][j] = icon Line ref (deco'd runs only)

  const opacities = useRef([])
  const worldPos = useMemo(() => new THREE.Vector3(), [])

  // external-link arrow — a small polyline drawn just past the link word
  const iconPts = useMemo(() => {
    const s = fontSize * 0.6
    const b = s * 0.42
    return [
      [0, 0, 0],
      [s, s, 0],
      [s, b, 0],
      [s, s, 0],
      [b, s, 0],
    ]
  }, [fontSize])

  // `i` gates on that LINE's current readability (shared by every run on the
  // row); `url` is whichever run/line was actually clicked.
  const openLink = (i, url) => {
    if ((opacities.current[i] || 0) > CLICK_MIN_OPACITY) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }
  const hover = (i) => {
    if ((opacities.current[i] || 0) > CLICK_MIN_OPACITY) {
      document.body.style.cursor = 'pointer'
    }
  }
  const unhover = () => {
    document.body.style.cursor = ''
  }

  useFrame((state) => {
    const marker = frameMarker.current
    if (!outer.current || !marker) return

    // Visibility gate — OriginBeat's prose only exists in Chapter I (the drum
    // rotates DOLLY_END→BEAT1_END, then fades as the carrier locks full-screen at
    // TRANSITION_END). Outside that window it is fully occluded by the Upgrade /
    // Roster / Work chapters, so skip the whole layout + drum pass instead of
    // paying it on every frame of the entire scroll timeline. Margins keep it
    // running a hair before it appears and after it clears so there is no pop.
    const sm = smoothed.current ?? 0
    const active = sm > DOLLY_END - 0.03 && sm < TRANSITION_END + 0.04
    outer.current.visible = active
    if (!active) return

    marker.getWorldPosition(worldPos)
    outer.current.position.copy(worldPos)

    // viewport extents at the frame plane (camera is parked = frozen here)
    const cam = state.camera
    const dist = Math.abs(cam.position.z - worldPos.z)
    const visH = 2 * dist * Math.tan((cam.fov * DEG) / 2)
    const camTop = cam.position.y + visH / 2
    const laneTopY = camTop - laneTop * visH
    const laneBotY = camTop - laneBot * visH
    const laneH = laneTopY - laneBotY
    const laneMidY = (laneTopY + laneBotY) / 2
    const R = laneH * DRUM_RADIUS

    // Fit the column to the visible width. Only while parked (smoothed ≥ DOLLY_END)
    // — there visH is constant, so this settles in one frame and re-fits only on
    // resize; during the dolly the lines are invisible so we skip it (no relayout
    // churn). `extent` is the column's farthest edge from centre (anchor-aware).
    if (smoothed.current >= DOLLY_END) {
      const aspect = state.size.width / state.size.height
      const halfVisW = (visH * aspect) / 2
      const half = anchorX === 'center' ? baseMaxWidth / 2 : baseMaxWidth
      const extent = Math.max(Math.abs(baseX + half), Math.abs(baseX - half)) || 1
      const target = Math.max(0.5, Math.min(1, (halfVisW * COLUMN_FILL) / extent))
      if (Math.abs(target - fitRef.current) > 0.01) {
        fitRef.current = target
        setFit(target)
      }
    }

    // measure each line box -> centre offsets down the column. Run lines have
    // no single `texts.current[i]`; every run shares the same fontSize/line-
    // height (single row, no wrap), so the first run's box stands in for the
    // whole line.
    const centered = anchorX === 'center'
    const heights = []
    const midOff = []
    let acc = 0
    for (let i = 0; i < LINES.length; i++) {
      let h
      if (LINE_DATA[i].runs) {
        const rfs = fontSize * (LINE_DATA[i].fontMul || 1)
        const { rows } = layoutRun(LINE_DATA[i].runs, runTexts.current[i] || [], maxWidth, rfs, rfs * 1.15, rfs * 0.26, centered)
        h = rows * rfs * 1.15
      } else {
        const info = texts.current[i]?.textRenderInfo
        h = info ? info.blockBounds[3] - info.blockBounds[1] : 20
      }
      heights.push(h)
      midOff.push(acc + h / 2)
      acc += h + gap
    }

    // Phase B rotates the drum — line 0 enters low, the last line exits high
    const pB = clamp01((smoothed.current - DOLLY_END) / (BEAT1_END - DOLLY_END))
    const topY0 = laneMidY - MAX_ANGLE * R + (heights[0] || 0) / 2
    const topY1 = laneMidY + MAX_ANGLE * R + midOff[LINES.length - 1]
    const topY = topY0 + pB * (topY1 - topY0)

    for (let i = 0; i < LINES.length; i++) {
      const grp = groups.current[i]
      const isRunLine = !!LINE_DATA[i].runs
      const text = isRunLine ? null : texts.current[i]
      const primary = isRunLine ? runTexts.current[i]?.[0] : text
      if (!grp || !primary) continue
      // linear column position -> angle on the cylinder
      const theta = (topY - midOff[i] - laneMidY) / R
      grp.position.set(
        x,
        laneMidY + R * Math.sin(theta) - worldPos.y,
        R * (Math.cos(theta) - 1), // convex — centre toward camera
      )
      grp.rotation.x = -theta
      // full opacity across the readable arc; fade only near the exit edges
      const op = smoothstep(
        (MAX_ANGLE - Math.abs(theta)) / (MAX_ANGLE * EDGE_FADE),
      )
      opacities.current[i] = op

      if (!isRunLine) {
        text.fillOpacity = op

        // deco'd link (currently just "DSA Visually") — dotted underline +
        // external-link icon.
        if (LINE_DATA[i].deco) {
          const info = text.textRenderInfo
          if (info) {
            const bb = info.blockBounds // [minX, minY, maxX, maxY]
            const w = bb[2] - bb[0]
            const uy = bb[1] - fontSize * 0.34
            const lineDots = dots.current[i]
            if (lineDots) {
              for (let d = 0; d < DOT_COUNT; d++) {
                const dot = lineDots[d]
                if (!dot) continue
                dot.position.set(bb[0] + (w * d) / (DOT_COUNT - 1), uy, 0.5)
                dot.material.opacity = op
              }
            }
            const lineIcon = icons.current[i]
            if (lineIcon) {
              lineIcon.position.set(
                bb[2] + fontSize * 0.42,
                (bb[1] + bb[3]) / 2 - fontSize * 0.3,
                0.5,
              )
              lineIcon.material.transparent = true
              lineIcon.material.opacity = op
            }
          }
        }
      } else {
        // Run line — several Texts on a row that WRAPS at maxWidth. layoutRun
        // gives each run its {x, y}; fade + decorate each individually.
        const runs = LINE_DATA[i].runs
        const rts = runTexts.current[i] || []
        const rmul = LINE_DATA[i].fontMul || 1
        const rfs = fontSize * rmul
        const { placements } = layoutRun(runs, rts, maxWidth, rfs, rfs * 1.15, rfs * 0.26, anchorX === 'center')
        for (let j = 0; j < runs.length; j++) {
          const rt = rts[j]
          const pl = placements[j]
          if (rt && pl) {
            rt.position.x = pl.x
            rt.position.y = pl.y
            rt.fillOpacity = op
          }
          // run links: external-link arrow only (no dotted underline)
          if (runs[j].deco && rt && pl) {
            const info = rt.textRenderInfo
            const rIcon = runIcons.current[i]?.[j]
            if (info && rIcon) {
              const bb = info.blockBounds
              rIcon.position.set(
                pl.x + bb[2] + rfs * 0.42,
                pl.y + (bb[1] + bb[3]) / 2 - rfs * 0.3,
                0.5,
              )
              rIcon.scale.setScalar(rmul)
              rIcon.material.transparent = true
              rIcon.material.opacity = op
            }
          }
        }
      }

      // expose the end of the final line so the confetti cone can pin to it
      if (coneAnchor && i === LINES.length - 1 && !isRunLine) {
        const info = text.textRenderInfo
        const gb = info?.glyphBounds
        if (gb && gb.length >= 4) {
          const n = gb.length
          grp.updateWorldMatrix(true, false)
          coneAnchor.set(gb[n - 2], (gb[n - 3] + gb[n - 1]) / 2, 0)
          grp.localToWorld(coneAnchor)
        }
      }
    }
  })

  return (
    <group ref={outer}>
      {LINE_DATA.map((line, i) =>
        line.runs ? (
          // ── Run line — several independently-clickable words on one row ──
          <group key={i} ref={(el) => (groups.current[i] = el)}>
            {line.runs.map((run, j) => (
              <group key={j}>
                <Text
                  ref={(el) => {
                    if (!runTexts.current[i]) runTexts.current[i] = []
                    runTexts.current[i][j] = el
                  }}
                  font={FONTS.cormorantItalic500}
                  fontSize={fontSize * (line.fontMul || 1)}
                  color={run.color || CREAM}
                  anchorX="left"
                  anchorY="middle"
                  lineHeight={1.15}
                  renderOrder={32}
                  fillOpacity={0}
                  depthOffset={-1}
                  material-depthTest={false}
                  material-depthWrite={false}
                  onClick={
                    run.link
                      ? (e) => {
                          e.stopPropagation()
                          openLink(i, run.link)
                        }
                      : undefined
                  }
                  onPointerOver={run.link ? (e) => { e.stopPropagation(); hover(i) } : undefined}
                  onPointerOut={run.link ? (e) => { e.stopPropagation(); unhover() } : undefined}
                >
                  {run.t}
                </Text>

                {run.deco && (
                  <Line
                    ref={(el) => {
                      if (!runIcons.current[i]) runIcons.current[i] = []
                      runIcons.current[i][j] = el
                    }}
                    points={iconPts}
                    color={GOLD}
                    lineWidth={2}
                    transparent
                    opacity={0}
                    renderOrder={32}
                  />
                )}
              </group>
            ))}
          </group>
        ) : (
          // ── Simple line — one Text, optionally the whole line is a link ──
          <group
            key={i}
            ref={(el) => (groups.current[i] = el)}
            onClick={
              line.link
                ? (e) => {
                    e.stopPropagation()
                    openLink(i, line.link)
                  }
                : undefined
            }
            onPointerOver={line.link ? () => hover(i) : undefined}
            onPointerOut={line.link ? unhover : undefined}
          >
            <Text
              ref={(el) => (texts.current[i] = el)}
              font={FONTS.cormorantItalic500}
              fontSize={fontSize}
              color={line.base || CREAM}
              colorRanges={line.colorRanges}
              anchorX={anchorX}
              anchorY="middle"
              maxWidth={maxWidth}
              lineHeight={1.15}
              textAlign={anchorX === 'center' ? 'center' : 'left'}
              renderOrder={32}
              fillOpacity={0}
              depthOffset={-1}
              material-depthTest={false}
              material-depthWrite={false}
            >
              {line.t}
            </Text>

            {line.deco && (
              <>
                {Array.from({ length: DOT_COUNT }, (_, d) => (
                  <mesh
                    key={d}
                    ref={(el) => {
                      if (!dots.current[i]) dots.current[i] = []
                      dots.current[i][d] = el
                    }}
                    renderOrder={32}
                  >
                    <circleGeometry args={[fontSize * 0.06, 12]} />
                    <meshBasicMaterial
                      color={GOLD}
                      transparent
                      opacity={0}
                      depthTest={false}
                      toneMapped={false}
                    />
                  </mesh>
                ))}
                <Line
                  ref={(el) => (icons.current[i] = el)}
                  points={iconPts}
                  color={GOLD}
                  lineWidth={2}
                  transparent
                  opacity={0}
                  renderOrder={32}
                />
              </>
            )}
          </group>
        ),
      )}
    </group>
  )
}
