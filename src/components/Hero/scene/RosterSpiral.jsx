import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { FONTS } from '../../../fonts.js'
import { PEEL_START, ROSTER_START, ROSTER_END, CRAFTS_START, ORDER } from '../config.js'
import { useLayout } from '../breakpoint.js'

/**
 * Chapter III — The Roster, PROTOTYPE "portrait + reel spiral" take (the movie
 * poster idea: a centred portrait ringed by a coiling strip of film, companies
 * cycling below, ending on NOW). Portrait is a PLACEHOLDER for now; the scroll-
 * driven face-turn comes once real multi-angle photos exist. Camera-aligned
 * peel-child like the reel-road, so it inherits the CRT tube.
 */

const DEG = Math.PI / 180
const clamp01 = (x) => Math.min(1, Math.max(0, x))
const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2)

const ROLES = [
  { num: '01', year: '2020', dates: 'JUN 2020 — FEB 2022', title: 'Junior Software Engineer', company: 'Pay Perform' },
  { num: '02', year: '2022', dates: 'FEB 2022 — MAY 2023', title: 'Senior Full-Stack Engineer', company: 'SM Technology' },
  { num: '03', year: '2024', dates: 'MAY 2024 — FEB 2025', title: 'IT Analyst · Full-Stack', company: 'Intellectyx' },
  { num: '04', year: '2025', dates: 'MAR 2025 — OCT 2025', title: 'Full-Stack Engineer · AI', company: 'PieLabs Inc' },
  { num: '05', year: 'NOW', dates: 'NOV 2025 — PRESENT', title: 'Lead Technical Architect', company: 'Elyts' },
]
const N = ROLES.length
const CELL = 3.4
const CREAM = '#f6ecd2', GOLD = '#c8a157', DIM = '#9b9789', SKY = '#0a1024'
const RO = ORDER.nextChapter

function makeFilmTex() {
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 96
  const x = cv.getContext('2d')
  x.fillStyle = '#0e0b06'; x.fillRect(0, 0, 64, 96)
  x.fillStyle = '#241a0e'; x.fillRect(5, 22, 54, 52)
  x.strokeStyle = 'rgba(200,161,87,0.30)'; x.lineWidth = 1.4; x.strokeRect(5, 22, 54, 52)
  x.fillStyle = '#050403'; x.fillRect(0, 0, 3, 96); x.fillRect(61, 0, 3, 96)
  x.fillStyle = '#eaddbb'
  const perf = (cx, cy) => {
    const w = 16, h = 9, r = 3, px = cx - w / 2, py = cy - h / 2
    x.beginPath(); x.moveTo(px + r, py)
    x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r)
    x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); x.fill()
  }
  perf(32, 11); perf(32, 85)
  const t = new THREE.CanvasTexture(cv)
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.anisotropy = 4
  return t
}

// Placeholder portrait — a silhouette + frame + "YOUR PHOTO" so it's obvious it
// stands in for a real 3D/multi-angle photo later.
function makePortraitTex() {
  const cv = document.createElement('canvas'); cv.width = 300; cv.height = 380
  const x = cv.getContext('2d')
  const g = x.createLinearGradient(0, 0, 0, 380)
  g.addColorStop(0, '#1b2640'); g.addColorStop(1, '#080c18')
  x.fillStyle = g; x.fillRect(0, 0, 300, 380)
  x.fillStyle = 'rgba(200,161,87,0.22)'
  x.beginPath(); x.arc(150, 150, 62, 0, 7); x.fill()
  x.beginPath(); x.moveTo(40, 380); x.quadraticCurveTo(150, 232, 260, 380); x.closePath(); x.fill()
  x.strokeStyle = 'rgba(200,161,87,0.55)'; x.lineWidth = 4; x.strokeRect(7, 7, 286, 366)
  x.fillStyle = 'rgba(246,236,210,0.6)'; x.font = '400 17px "DM Mono", monospace'
  x.textAlign = 'center'; x.letterSpacing = '3px'
  x.fillText('YOUR PHOTO', 150, 352)
  const t = new THREE.CanvasTexture(cv); t.anisotropy = 4
  return t
}

// Film ribbon along a LOGARITHMIC SPIRAL (r = r0 · e^{kθ}), coiling outward.
function buildSpiral(width) {
  const turns = 2.6, r0 = 13, rEnd = 47
  const thetaEnd = turns * 2 * Math.PI
  const k = Math.log(rEnd / r0) / thetaEnd
  const steps = 420, half = width / 2
  const P = []
  let acc = 0, px = 0, py = 0
  for (let i = 0; i <= steps; i++) {
    const th = (i / steps) * thetaEnd
    const r = r0 * Math.exp(k * th)
    const X = Math.cos(th) * r, Y = Math.sin(th) * r
    if (i > 0) acc += Math.hypot(X - px, Y - py)
    P.push([X, Y, acc]); px = X; py = Y
  }
  const total = acc || 1
  const pos = new Float32Array((steps + 1) * 2 * 3)
  const uv = new Float32Array((steps + 1) * 2 * 2)
  const idx = []
  for (let i = 0; i <= steps; i++) {
    const [X, Y, len] = P[i]
    const a = P[Math.max(0, i - 1)], b = P[Math.min(steps, i + 1)]
    let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl
    const nx = -ty, ny = tx, uu = len / total, o = i * 2
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
  uniform float uScroll, uRepeat, uProgress;
  varying vec2 vUv;
  void main() {
    vec4 tex = texture2D(uTex, vec2(vUv.x * uRepeat + uScroll, vUv.y));
    // the travelled inner coils read brighter; the outer coils recede
    float lit = smoothstep(uProgress + 0.15, uProgress - 0.05, vUv.x);
    gl_FragColor = vec4(tex.rgb * mix(0.5, 1.05, lit), tex.a);
  }
`

export default function RosterSpiral({ smoothed }) {
  const { peel } = useLayout()
  const { peelDist, overscan } = peel

  const rootRef = useRef()
  const spiralRef = useRef()
  const portraitRef = useRef()
  const botRef = useRef()
  const [active, setActive] = useState(0)

  const filmTex = useMemo(makeFilmTex, [])
  const portraitTex = useMemo(makePortraitTex, [])
  const { geometry: spiralGeo, total: spiralLen } = useMemo(() => buildSpiral(5.2), [])
  const filmUniforms = useMemo(() => ({
    uTex: { value: filmTex },
    uScroll: { value: 0 },
    uRepeat: { value: spiralLen / CELL },
    uProgress: { value: 0 },
  }), [filmTex, spiralLen])

  useEffect(() => () => { filmTex.dispose(); portraitTex.dispose(); spiralGeo.dispose() },
    [filmTex, portraitTex, spiralGeo])

  useFrame(({ camera, size, clock }) => {
    const sm = smoothed.current ?? 0
    const on = sm > PEEL_START - 0.02 && sm < CRAFTS_START - 0.01
    if (rootRef.current) rootRef.current.visible = on
    if (!on) return

    const aspect = size.width / size.height
    const h_vp = 2 * peelDist * Math.tan((camera.fov * DEG) / 2) * overscan
    const w_vp = h_vp * aspect
    const sf = w_vp / 100
    if (rootRef.current) rootRef.current.scale.setScalar(sf)
    const halfH = 50 / (overscan * aspect)
    if (botRef.current) botRef.current.position.y = -halfH

    const rp = clamp01((sm - ROSTER_START) / (ROSTER_END - ROSTER_START))
    const camU = ease(rp)
    const t = clock.elapsedTime

    // the reel coils in as you fly (unwinds on scroll-up — fully reversible)
    if (spiralRef.current) spiralRef.current.rotation.z = -0.5 - camU * 2.3
    filmUniforms.uScroll.value = -t * 0.04
    filmUniforms.uProgress.value = camU
    // portrait breathes in toward centre (placeholder for the real face-turn)
    if (portraitRef.current) portraitRef.current.scale.setScalar(0.88 + 0.14 * camU)

    const a = Math.max(0, Math.min(N - 1, Math.round(camU * (N - 1))))
    if (a !== active) setActive(a)
  })

  const a = ROLES[active]

  return (
    <group ref={rootRef} visible={false}>
      {/* backdrop */}
      <mesh renderOrder={RO - 1}>
        <planeGeometry args={[400, 320]} />
        <meshBasicMaterial color={SKY} toneMapped={false} depthTest={false} />
      </mesh>

      {/* film-reel spiral (coils around the portrait) */}
      <group ref={spiralRef} position={[0, 3, 0]}>
        <mesh geometry={spiralGeo} renderOrder={RO + 1}>
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
      </group>

      {/* portrait halo + placeholder portrait (centre) */}
      <mesh renderOrder={RO + 2} position={[0, 3, 0]}>
        <circleGeometry args={[17, 48]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.14} depthTest={false} toneMapped={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={portraitRef} renderOrder={RO + 3} position={[0, 3, 0]}>
        <planeGeometry args={[19, 24]} />
        <meshBasicMaterial map={portraitTex} transparent depthTest={false} toneMapped={false} />
      </mesh>

      {/* title (top) */}
      <Text font={FONTS.dmMono400} fontSize={0.95} color={DIM} anchorX="center" anchorY="top" letterSpacing={0.42}
        position={[0, 27, 0]} renderOrder={RO + 4} material-depthTest={false}>PROFESSIONAL EXPERIENCE</Text>
      <Text font={FONTS.anton} fontSize={4.6} color={CREAM} anchorX="center" anchorY="top" scale={[1, 1.12, 1]}
        position={[0, 25, 0]} renderOrder={RO + 4} material-depthTest={false}
        outlineWidth="2.5%" outlineBlur="10%" outlineColor={GOLD} outlineOpacity={0.35}>THE ROSTER</Text>

      {/* chyron (active company, cycles as you scroll) — bottom */}
      <group ref={botRef}>
        <mesh position={[0, 6.4, 0]} renderOrder={RO + 2}>
          <planeGeometry args={[100, 12] } />
          <meshBasicMaterial color="#090d1a" transparent opacity={0.72} depthTest={false} />
        </mesh>
        <Text font={FONTS.dmMono400} fontSize={0.9} color={GOLD} anchorX="center" anchorY="top" letterSpacing={0.28}
          position={[0, 10, 0]} renderOrder={RO + 4} material-depthTest={false}>{a.dates}{'   ◆   '}{a.num}{' / 05'}{active === N - 1 ? '   ● NOW' : ''}</Text>
        <Text font={FONTS.anton} fontSize={3.4} color={CREAM} anchorX="center" anchorY="top"
          position={[0, 8.4, 0]} renderOrder={RO + 4} material-depthTest={false}>{a.title.toUpperCase()}</Text>
        <Text font={FONTS.dmMono400} fontSize={1.05} color={GOLD} anchorX="center" anchorY="top" letterSpacing={0.24}
          position={[0, 4.2, 0]} renderOrder={RO + 4} material-depthTest={false}>{a.company.toUpperCase()}</Text>
      </group>
    </group>
  )
}
