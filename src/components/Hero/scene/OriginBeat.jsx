import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text, Line } from '@react-three/drei'
import { DOLLY_END, BEAT1_END } from '../config.js'
import { useLayout } from '../breakpoint.js'
import { FONTS } from '../../../fonts.js'

const GOLD = '#c8a157'
const CREAM = '#ede4d2'
const HR_GREEN = '#2ec866' // HackerRank brand green
const HR_URL = 'https://www.hackerrank.com/profile/Aadarshvelu'
const DSA_URL = 'https://dsavisually.netlify.app/'

// Chapter I — The Origin, Beat 1. `a` = accent ranges [substring, colour].
// `link` makes the whole line clickable; `deco` adds the underline + icon.
const LINES = [
  { t: 'At sixteen, programming caught me.', a: [['caught me', GOLD]] },
  { t: "The compiler didn't care how old I was.", a: [['compiler', GOLD]] },
  {
    t: 'Every night — one more problem on HackerRank.',
    a: [['HackerRank', HR_GREEN]],
    link: HR_URL,
  },
  { t: 'By eighteen, I could think in code.', a: [] },
  { t: 'I built things that ran: a password manager, a music player.', a: [] },
  { t: 'I rebuilt every data structure by hand. Java. From scratch.', a: [['From scratch', GOLD]] },
  { t: 'Then came React.', a: [['React', GOLD]] },
  { t: 'So I built a visualizer — algorithms you could watch run.', a: [] },
  { t: 'DSA Visually', a: [], base: GOLD, link: DSA_URL, deco: true },
  {
    t: 'It was never homework — it got me hired at eighteen, by a London startup.',
    a: [['eighteen', GOLD], ['London', GOLD]],
  },
]

// precompute troika colorRanges (paints the accent words). troika leaves
// characters before the first range key uncoloured (black), so the range
// must start explicitly at index 0 with the base colour.
const LINE_DATA = LINES.map((line) => {
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

const DEG = Math.PI / 180
const clamp01 = (x) => Math.min(1, Math.max(0, x))
const smoothstep = (x) => {
  x = clamp01(x)
  return x * x * (3 - 2 * x)
}

// the lines ride a horizontal cylinder — an Apple-picker style convex drum
const DRUM_RADIUS = 0.55
const MAX_ANGLE = 1.2
// lines stay full opacity across the readable arc; EDGE_FADE is the fraction
// of the arc (at each edge) over which a line fades out as it exits
const EDGE_FADE = 0.25
const DOT_COUNT = 14 // dotted underline beneath the DSA Visually link
const CLICK_MIN_OPACITY = 0.5 // a line only acts as a link while readable

export default function OriginBeat({ smoothed, frameMarker, coneAnchor }) {
  const { originBeat } = useLayout()
  const { x, gap, laneTop, laneBot, fontSize } = originBeat

  const outer = useRef()
  const groups = useRef([])
  const texts = useRef([])
  const dots = useRef([])
  const icon = useRef()

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

    // measure each line box -> centre offsets down the column
    const heights = []
    const midOff = []
    let acc = 0
    for (let i = 0; i < LINES.length; i++) {
      const info = texts.current[i]?.textRenderInfo
      const h = info ? info.blockBounds[3] - info.blockBounds[1] : 20
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
      const text = texts.current[i]
      if (!grp || !text) continue
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
      text.fillOpacity = op
      opacities.current[i] = op

      // the DSA Visually link — dotted underline + external-link icon
      if (LINE_DATA[i].deco) {
        const info = text.textRenderInfo
        if (info) {
          const bb = info.blockBounds // [minX, minY, maxX, maxY]
          const w = bb[2] - bb[0]
          const uy = bb[1] - fontSize * 0.34
          for (let d = 0; d < DOT_COUNT; d++) {
            const dot = dots.current[d]
            if (!dot) continue
            dot.position.set(bb[0] + (w * d) / (DOT_COUNT - 1), uy, 0.5)
            dot.material.opacity = op
          }
          if (icon.current) {
            icon.current.position.set(
              bb[2] + fontSize * 0.42,
              (bb[1] + bb[3]) / 2 - fontSize * 0.3,
              0.5,
            )
            icon.current.material.transparent = true
            icon.current.material.opacity = op
          }
        }
      }


      // expose the end of the final line so the confetti cone can pin to it
      if (coneAnchor && i === LINES.length - 1) {
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
      {LINE_DATA.map((line, i) => (
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
            anchorX={originBeat.anchorX}
            anchorY="middle"
            maxWidth={originBeat.maxWidth}
            lineHeight={1.15}
            textAlign={originBeat.anchorX === 'center' ? 'center' : 'left'}
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
                  ref={(el) => (dots.current[d] = el)}
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
                ref={icon}
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
      ))}
    </group>
  )
}
