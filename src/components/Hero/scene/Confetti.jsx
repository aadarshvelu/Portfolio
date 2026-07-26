/* eslint-disable react-hooks/immutability */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CELEB_START, CELEB_END } from '../config.js'
import { useLayout } from '../breakpoint.js'

// Celebration for the final Beat 1 line — "hired at eighteen, by a London
// startup". A small party-popper cone sits at the end of that line; gold
// foil flakes + tiny celluloid film frames pour out of its mouth, glowing
// white-hot at the burst, then tumble in 3D slow-motion — some rising like
// embers.
//
// Every piece is a pure function of scroll: scrub forward and it plays out,
// scroll back and it rewinds exactly. Fully additive.
const FOIL_COUNT = 150
const FILM_COUNT = 70
// celebration scroll window — CELEB_START/END imported from config
const SPAN = 5.5 // virtual trajectory length across the scroll window
const SCALE_IN = 0.05 // cp fraction over which a piece scales up from the cone
const HEAT_SPAN = 0.32 // cp range the burst stays glowing white-hot
const GLOW_SPAN = 0.35 // cp range of the soft gold bloom pulse
const SPRAY = 1.1 // spread of the spray fan around the popper's aim — wide
const CONE_READY = 0.05 // scroll span the popper rises into view (at rest) before it fires
const CONE_PUNCH = 0.07 // cp span of the recoil kick when it fires
const CONE_R = 7 // popper-cone mouth radius
const CONE_H = 18 // popper-cone length
const MOUTH_OFFX = 13.5 // cone sits just past the end of the line
const MOUTH_OFFY = 9
const DEG = Math.PI / 180
void DEG

const FOIL_PALETTE = ['#c8a157', '#d8be7e', '#f2e8d8', '#b5862f', '#e6d4a2']

const clamp01 = (x) => Math.min(1, Math.max(0, x))
const smoothstep = (x) => x * x * (3 - 2 * x)
const lerp = THREE.MathUtils.lerp
const rnd = () => Math.random() * 2 - 1

// fixed random params — set once so scrubbing replays identically
const makeParticle = () => {
  const ph = Math.random() * 6.283
  return {
    jitter: new THREE.Vector3(rnd() * SPRAY, rnd() * SPRAY, rnd() * SPRAY),
    speed: 30 + Math.random() * 120,
    vel: new THREE.Vector3(),
    accelY:
      Math.random() < 0.3 ? 5 + Math.random() * 9 : -(30 + Math.random() * 48),
    baseRot: new THREE.Euler(rnd() * 6, rnd() * 6, rnd() * 6),
    spin: new THREE.Vector3(rnd() * 4, rnd() * 4, rnd() * 4),
    size: 0.6 + Math.random() * 0.85,
    off: new THREE.Vector3(rnd() * 6, rnd() * 6, rnd() * 6),
    // sideways flutter as a piece travels — breaks up the clump organically
    flutAmp: 8 + Math.random() * 30,
    flutFreq: 0.5 + Math.random(),
    flutPhase: ph,
    flutBase: Math.sin(ph),
  }
}

export default function Confetti({ smoothed, coneAnchor }) {
  const { originBeat, confetti } = useLayout()

  const foilRef = useRef()
  const filmRef = useRef()
  const coneRef = useRef()
  const glowRef = useRef()

  const foil = useMemo(() => Array.from({ length: FOIL_COUNT }, makeParticle), [])
  const film = useMemo(() => Array.from({ length: FILM_COUNT }, makeParticle), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const mouth = useMemo(() => new THREE.Vector3(), [])
  const lastActive = useRef(false)

  // popper aim — up and out into the open space, away from the text
  const aim = useMemo(
    () =>
      originBeat.anchorX === 'center'
        ? new THREE.Vector3(0.25, 1, 0.14).normalize()
        : new THREE.Vector3(0.5, 1, 0.12).normalize(),
    [originBeat.anchorX],
  )
  const coneQuat = useMemo(
    () =>
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, -1, 0),
        aim,
      ),
    [aim],
  )
  // bake each piece's velocity from the aim + its fixed jitter
  useMemo(() => {
    const apply = (p) => {
      p.vel
        .set(aim.x + p.jitter.x, aim.y + p.jitter.y, aim.z + p.jitter.z)
        .normalize()
        .multiplyScalar(p.speed)
    }
    foil.forEach(apply)
    film.forEach(apply)
  }, [aim, foil, film])

  // open-ended popper cone — mouth (wide base) translated to the local origin
  const coneGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(CONE_R, CONE_H, 18, 1, true)
    g.translate(0, CONE_H / 2, 0)
    return g
  }, [])

  // colour the foil instances from the gold palette
  useEffect(() => {
    const mesh = foilRef.current
    if (!mesh) return
    const c = new THREE.Color()
    for (let i = 0; i < FOIL_COUNT; i++) {
      c.set(FOIL_PALETTE[i % FOIL_PALETTE.length])
      mesh.setColorAt(i, c)
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [])

  // celluloid texture + soft glow sprite
  const filmTexture = useMemo(() => {
    const cv = document.createElement('canvas')
    cv.width = 48
    cv.height = 72
    const x = cv.getContext('2d')
    x.fillStyle = '#10131c'
    x.fillRect(0, 0, 48, 72)
    x.fillStyle = '#1b2440'
    x.fillRect(5, 15, 38, 42)
    x.fillStyle = '#070910'
    x.fillRect(0, 0, 48, 11)
    x.fillRect(0, 61, 48, 11)
    x.fillStyle = '#c8a157'
    for (let i = 5; i < 46; i += 11) {
      x.fillRect(i, 3, 5, 5)
      x.fillRect(i, 64, 5, 5)
    }
    return new THREE.CanvasTexture(cv)
  }, [])

  const glowTexture = useMemo(() => {
    const cv = document.createElement('canvas')
    cv.width = 128
    cv.height = 128
    const x = cv.getContext('2d')
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, 'rgba(230,200,140,0.98)')
    g.addColorStop(0.45, 'rgba(200,161,87,0.34)')
    g.addColorStop(1, 'rgba(200,161,87,0)')
    x.fillStyle = g
    x.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(cv)
  }, [])

  // striped party-popper texture — red + gold diagonals, tiled round the cone
  const coneTexture = useMemo(() => {
    const cv = document.createElement('canvas')
    cv.width = 64
    cv.height = 64
    const x = cv.getContext('2d')
    x.fillStyle = '#c8a157' // gold
    x.fillRect(0, 0, 64, 64)
    x.strokeStyle = '#bb3b30' // festive red
    x.lineWidth = 8
    x.lineCap = 'square'
    for (let i = -64; i < 128; i += 16) {
      x.beginPath()
      x.moveTo(i, 0)
      x.lineTo(i + 64, 64)
      x.stroke()
    }
    const tex = new THREE.CanvasTexture(cv)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(2, 1)
    return tex
  }, [])

  useFrame(() => {
    const sm = smoothed.current ?? 0
    const cp = clamp01((sm - CELEB_START) / (CELEB_END - CELEB_START))
    // The popper rises into view (at rest) over the CONE_READY window just before
    // the trigger, then fires at CELEB_START. `ready` = 0→1 over that window,
    // stays 1 through the burst.
    const ready = smoothstep(clamp01((sm - (CELEB_START - CONE_READY)) / CONE_READY))
    // idle only when fully before the ready window (one final settling write)
    const active = cp > 0 || ready > 0
    // Pieces exist only from the burst onward. Hide them otherwise so the
    // not-yet-placed instances don't sit at the world origin (screen centre) —
    // that was the stray dark "chip" visible in First Light before the pop.
    if (foilRef.current) foilRef.current.visible = cp > 0
    if (filmRef.current) filmRef.current.visible = cp > 0
    if (!active && !lastActive.current) return
    lastActive.current = active

    // breakpoint scale — the whole celebration grows on portrait so it stays
    // proportionate to the larger portrait text
    const S = confetti.scale

    // cone mouth — pinned just past the end of the "London startup" line
    mouth.copy(coneAnchor)
    mouth.x += MOUTH_OFFX * S
    mouth.y += MOUTH_OFFY * S

    // cp drives a virtual trajectory time — deterministic, fully reversible
    const tau = cp * SPAN
    const sIn = smoothstep(clamp01(cp / SCALE_IN))
    // white-hot only AT the burst — the ready popper sits at rest (striped)
    const heat = cp > 0 ? 1 - smoothstep(clamp01(cp / HEAT_SPAN)) : 0

    const place = (list, mesh) => {
      if (!mesh) return
      for (let i = 0; i < list.length; i++) {
        const p = list[i]
        const fl =
          p.flutAmp * (Math.sin(p.flutFreq * tau + p.flutPhase) - p.flutBase)
        dummy.position.set(
          mouth.x + (p.off.x + p.vel.x * tau + fl) * S,
          mouth.y + (p.off.y + p.vel.y * tau + 0.5 * p.accelY * tau * tau) * S,
          mouth.z + (p.off.z + p.vel.z * tau + fl * 0.4) * S,
        )
        dummy.rotation.set(
          p.baseRot.x + p.spin.x * tau,
          p.baseRot.y + p.spin.y * tau,
          p.baseRot.z + p.spin.z * tau,
        )
        dummy.scale.setScalar(p.size * sIn * S)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
    }
    place(foil, foilRef.current)
    place(film, filmRef.current)

    // glow-on-burst — pieces go white-hot at the moment they erupt
    const hr = lerp(1, 2.4, heat)
    const hg = lerp(1, 2.05, heat)
    const hb = lerp(1, 1.4, heat)
    if (foilRef.current) foilRef.current.material.color.setRGB(hr, hg, hb)
    if (filmRef.current) filmRef.current.material.color.setRGB(hr, hg, hb)

    // the popper cone — rises into view (ready) by "startup", recoil-kicks as it
    // fires, then holds while the confetti pours
    if (coneRef.current) {
      const punch =
        cp > 0 && cp < CONE_PUNCH ? Math.sin((cp / CONE_PUNCH) * Math.PI) * 0.28 : 0
      const cs = ready * (1 + punch) * S
      coneRef.current.visible = cs > 0.001
      coneRef.current.position.copy(mouth)
      coneRef.current.quaternion.copy(coneQuat)
      coneRef.current.scale.setScalar(cs)
      // striped at rest; white-hot at the burst
      coneRef.current.material.color.setRGB(
        lerp(1, 2.3, heat),
        lerp(1, 1.95, heat),
        lerp(1, 1.4, heat),
      )
    }

    // soft gold bloom flash at the cone mouth
    if (glowRef.current) {
      const pulse =
        cp > 0 && cp < GLOW_SPAN ? Math.sin((cp / GLOW_SPAN) * Math.PI) : 0
      if (pulse > 0.002) {
        glowRef.current.visible = true
        glowRef.current.position.copy(mouth)
        glowRef.current.scale.setScalar((55 + pulse * 150) * S)
        glowRef.current.material.opacity = pulse * 0.95
      } else {
        glowRef.current.visible = false
      }
    }
  })

  return (
    <group>
      <instancedMesh
        ref={foilRef}
        args={[undefined, undefined, FOIL_COUNT]}
        frustumCulled={false}
        visible={false}
      >
        <planeGeometry args={[8, 5]} />
        <meshBasicMaterial toneMapped={false} side={THREE.DoubleSide} />
      </instancedMesh>

      <instancedMesh
        ref={filmRef}
        args={[undefined, undefined, FILM_COUNT]}
        frustumCulled={false}
        visible={false}
      >
        <planeGeometry args={[7, 10.5]} />
        <meshBasicMaterial
          map={filmTexture}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      <mesh ref={coneRef} geometry={coneGeo} visible={false} renderOrder={31}>
        <meshBasicMaterial
          map={coneTexture}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={glowRef} visible={false} renderOrder={33}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={glowTexture}
          transparent
          depthTest={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
