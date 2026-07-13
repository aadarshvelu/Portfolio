import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Canvas, useThree } from '@react-three/fiber'
import { CAMERA_Z, CAMERA_FOV, coverFov, CHAPTER_PROGRESS } from './config.js'
import { useBreakpoint } from '../../hooks/useBreakpoint.js'
import { BreakpointContext } from './breakpoint.js'
import { LAYOUTS } from './layouts.js'
import Scene from './Scene.jsx'
import { FRAMES } from './scene/FilmFrame.jsx'
import CountdownOverlay from './CountdownOverlay.jsx'
import { useIntroFreeze } from '../../concept/IntroFreeze.js'

// Re-derives the camera fov so the active design rect always covers the
// viewport full-bleed (no letterbox bars).
function CoverCamera({ design }) {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  useLayoutEffect(() => {
    camera.fov = coverFov(size.width / size.height, design)
    camera.updateProjectionMatrix()
  }, [camera, size, design])
  return null
}

// The hero is a WebGL scene. World units = design pixels of the active
// breakpoint (desktop / tablet / mobile).
export default function Hero() {
  const bp = useBreakpoint()
  const ctx = useMemo(() => ({ bp, layout: LAYOUTS[bp] }), [bp])

  // The room intro (ConceptIntro) occupies the first `introPx` of window scroll.
  // Offset progress by it so the Hero sits at its opening (progress 0) while the
  // room is on screen, and scrolling back into the room rewinds it — fully
  // reversible. This is the concept-room integration preserved across the revert.
  const { introPx } = useIntroFreeze()

  // Carousel selection (which chapter sits at centre) + whether we're browsing
  // at the top of the reel.
  const [carouselOffset, setCarouselOffset] = useState(0)
  const [atTop, setAtTop] = useState(true)
  const carouselOffsetRef = useRef(0)
  carouselOffsetRef.current = carouselOffset

  // Scrolling always enters FIRST LIGHT's Act I. If you scroll off the top while
  // parked on another chapter, we "retune, then enter": hold the page at the
  // browse view, spin the reel back to FIRST LIGHT, and release once it settles.
  const retuningRef = useRef(false) // reel is retuning; page is held
  const jumpingRef = useRef(false) // a countdown jump is scrolling us — don't retune
  const atTopRef = useRef(true) // previous atTop, to detect the browse→scroll edge

  const unlockScroll = useCallback(() => {
    retuningRef.current = false
    document.documentElement.style.overflowY = ''
  }, [])
  // Released by FilmRoll the instant the reel finishes retuning.
  const onReelSettled = useCallback(() => {
    if (retuningRef.current) unlockScroll()
  }, [unlockScroll])

  // page scroll -> camera transition. A plain ref the scroll listener
  // mutates and the render loop reads — no React re-render per scroll event.
  const progressRef = useRef(0)
  useEffect(() => {
    const onScroll = () => {
      const off = introPx || 0
      // While retuning the page is pinned at the browse view.
      if (retuningRef.current) {
        if (window.scrollY !== off) window.scrollTo(0, off)
        progressRef.current = 0
        return
      }
      const max =
        document.documentElement.scrollHeight - window.innerHeight - off || 1
      const p = Math.min(1, Math.max(0, (window.scrollY - off) / max))
      const nowTop = p < 0.02
      // The reel is infinite/tiled, so FIRST LIGHT recurs every FRAMES.length
      // steps. Work in modular space: if we're already sitting on a FIRST LIGHT
      // tile (offset 0, 4, 8…) no retune is needed; otherwise spin the MINIMAL
      // distance to the nearest FIRST LIGHT — not all the way back to offset 0.
      const N = FRAMES.length
      const cur = carouselOffsetRef.current
      const onFirstLight = (((cur % N) + N) % N) === 0
      if (
        !jumpingRef.current &&
        atTopRef.current &&
        !nowTop &&
        !onFirstLight
      ) {
        retuningRef.current = true
        setCarouselOffset(Math.round(cur / N) * N)
        window.scrollTo(0, off)
        document.documentElement.style.overflowY = 'hidden'
        progressRef.current = 0
        atTopRef.current = true
        setAtTop(true)
        setTimeout(() => {
          if (retuningRef.current) unlockScroll()
        }, 1200)
        return
      }
      progressRef.current = p
      atTopRef.current = nowTop
      setAtTop(nowTop)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [introPx, unlockScroll])

  const onPrev = useCallback(() => setCarouselOffset((o) => o - 1), [])
  const onNext = useCallback(() => setCarouselOffset((o) => o + 1), [])

  // Academy-countdown overlay: { chapterIdx } while playing, else null.
  const [countdown, setCountdown] = useState(null)
  // Stable so the overlay's self-timer isn't reset by Hero re-renders during the
  // jump; also clears the "jumping" guard so scrolling works again afterwards.
  const onCountdownDone = useCallback(() => {
    setCountdown(null)
    jumpingRef.current = false
  }, [])

  // Scroll the page to a chapter's spot on the one runway.
  const jumpTo = useCallback(
    (progress, smooth) => {
      const off = introPx || 0
      const max =
        document.documentElement.scrollHeight - window.innerHeight - off || 1
      window.scrollTo({ top: off + progress * max, behavior: smooth ? 'smooth' : 'auto' })
    },
    [introPx],
  )

  // CTA pressed on the focal frame. FIRST LIGHT (index 0) eases straight down
  // into Act I; every other chapter plays the countdown, which covers an instant
  // jump so the scene settles behind the leader and is revealed on the flash.
  const onEnter = useCallback(() => {
    const idx =
      ((carouselOffsetRef.current % FRAMES.length) + FRAMES.length) % FRAMES.length
    const progress = CHAPTER_PROGRESS[idx] ?? 0.1
    if (idx === 0) {
      jumpTo(progress, true)
    } else {
      jumpingRef.current = true // this scroll is a jump — don't retune
      setCountdown({ chapterIdx: idx })
      // let the leader cover the screen before the scene starts moving
      setTimeout(() => jumpTo(progress, false), 200)
    }
  }, [jumpTo])

  return (
    <>
      <Canvas
        flat
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        camera={{ position: [0, 0, CAMERA_Z], fov: CAMERA_FOV, near: 1, far: 6000 }}
        resize={{ scroll: false }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        {/* clear colour = the Background's deep-edge tone, so when the parked
            camera pans past the night-sky plane the gap stays seamless */}
        <color attach="background" args={['#1b2530']} />
        <BreakpointContext.Provider value={ctx}>
          <CoverCamera design={ctx.layout.design} />
          <Suspense fallback={null}>
            <Scene
              progressRef={progressRef}
              carouselOffset={carouselOffset}
              onPrev={onPrev}
              onNext={onNext}
              onEnter={onEnter}
              onReelSettled={onReelSettled}
            />
          </Suspense>
        </BreakpointContext.Provider>
      </Canvas>

      {countdown &&
        createPortal(
          <CountdownOverlay
            chapter={FRAMES[countdown.chapterIdx]}
            onDone={onCountdownDone}
          />,
          document.body,
        )}
    </>
  )
}
