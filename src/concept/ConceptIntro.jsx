import React, { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import Scene from "./Scene";
import { ASSET_URLS } from "./config/sceneConfig";
import { CAMERA_PROFILES } from "./config/cameraProfiles";
import { qualityFor } from "./config/qualityProfiles";
import { useDeviceType } from "./config/deviceUtils";
import { TRANSITION_CONFIG } from "./config/transitionConfig";
import { DEBUG_TRANSITION } from "./config/debugTransitionConfig";
import { useAdaptiveDpr, AdaptiveDprMonitor } from "../perf/AdaptiveDpr.jsx";
import "./styles.css";

useGLTF.preload(ASSET_URLS.lamp);
useGLTF.preload(ASSET_URLS.tv);
useGLTF.preload(ASSET_URLS.pen);

const smooth = (x, a, b) => THREE.MathUtils.smoothstep(x, a, b);

/**
 * ConceptIntro — the room layer that sits ABOVE the live <App/> and reveals it
 * as the camera physically enters the television.
 *
 * It is driven ENTIRELY by window scroll and is fully reversible:
 *   - phase = scrollY / introPx, 0 → 1
 *   - the camera dollies into the CRT, the screen punches a portal to the Hero
 *     beneath, and the room fades — all as pure functions of phase
 *   - scroll back up and every step rewinds; nothing is latched or unmounted
 *
 * The layer never captures scroll (pointer-events: none) so the page scroll and
 * the Hero underneath stay fully interactive. It stays mounted the whole time.
 */
/**
 * ReadySignal — an in-Canvas child that flips `readyRef.current` true on the
 * first useFrame tick. That tick only fires AFTER the R3F Canvas has compiled
 * its shaders, resolved Suspense (i.e. GLBs parsed + troika text laid out), and
 * queued its first render — so it's the earliest moment at which the room has
 * an actual pixel to show. The DOM overlays key their fade-in off this so we
 * never flash the grain/vignette/"scroll" hint over an empty canvas.
 */
function ReadySignal({ readyRef }) {
  useFrame(() => {
    if (!readyRef.current) readyRef.current = true;
  });
  return null;
}

const READY_FADE_MS = 500;

// The film's opening line — played over the black splash before the Room
// reveals (moved here from the Hero's boot). The splash is held for BOOT_HOLD_MS
// so the line reads, then the reveal lifts it.
const BOOT_TEXT = "Life is a film. This is my story.";
const BOOT_TYPE_MS = 52; // per character
const BOOT_START_MS = 400; // pause on black before the line starts typing
const BOOT_READ_MS = 1000; // linger after the line finishes, before the reveal
const BOOT_MAX_MS = 7000; // absolute cap so the splash can never stick on black

export default function ConceptIntro({ introPx }) {
  const device = useDeviceType();
  const quality = qualityFor(device);
  // Tier = ceiling; measured frame rate walks the resolution under it.
  const { dpr, onDecline, onIncline } = useAdaptiveDpr(quality.dpr);
  const progress = useRef(0);
  const phaseOut = useRef(0);
  const canvasWrap = useRef(null);
  const fxRef = useRef(null);
  const hintRef = useRef(null);
  const splashRef = useRef(null);
  const blockRef = useRef(null); // blocks Hero clicks while the room covers it
  const dbgRef = useRef(null);
  const introPxRef = useRef(introPx);
  introPxRef.current = introPx;
  const readyRef = useRef(false);
  const readyAtRef = useRef(0);
  const introRef = useRef(null); // the opening-line DOM element
  const firstTickRef = useRef(0); // mount time, for the boot cap
  const typeRef = useRef(0); // typewriter interval id
  const typedDoneAtRef = useRef(0); // when the line finished typing (real time)

  // Failsafe: the black splash only lifts once the room's first useFrame fires
  // (readyRef). If that never happens — a 0-size canvas at some viewport, a lost
  // context — the screen would stay pure black forever. Force-ready after a
  // timeout so we can never get stuck on black.
  useEffect(() => {
    const id = setTimeout(() => {
      readyRef.current = true;
    }, 1500);
    return () => clearTimeout(id);
  }, []);

  // Type the opening line onto the black splash (direct DOM — no re-render).
  useEffect(() => {
    const el = introRef.current;
    if (!el) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      el.textContent = BOOT_TEXT;
      typedDoneAtRef.current = performance.now();
      return;
    }
    // Time-based on rAF rather than setInterval. This is the boot screen's most
    // visible stutter: a 52ms interval competing with GLB parsing and shader
    // compilation fires late and compounds, so the line types in lurches. Here
    // the character count is derived from ELAPSED time, so a long frame is
    // absorbed (the next tick simply reveals the characters it owes) instead of
    // pushing the whole line further behind.
    const t0 = performance.now();
    let shown = -1;
    const tick = () => {
      const elapsed = performance.now() - t0 - BOOT_START_MS;
      const i = Math.max(0, Math.min(BOOT_TEXT.length, Math.floor(elapsed / BOOT_TYPE_MS)));
      if (i !== shown) {
        shown = i;
        el.textContent = BOOT_TEXT.slice(0, i);
      }
      if (i >= BOOT_TEXT.length) {
        // Record real completion so the reveal waits for the whole line.
        if (typedDoneAtRef.current === 0) typedDoneAtRef.current = performance.now();
        return; // stop the loop — the line is fully typed
      }
      typeRef.current = requestAnimationFrame(tick);
    };
    typeRef.current = requestAnimationFrame(tick);
    return () => {
      if (typeRef.current) cancelAnimationFrame(typeRef.current);
    };
  }, []);

  // Window scroll → intro phase (0 → 1). Reversible by construction.
  useEffect(() => {
    const onScroll = () => {
      const px = introPxRef.current || 1;
      progress.current = Math.min(1, Math.max(0, window.scrollY / px));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // Re-run when introPx changes (a real resize) so progress is recomputed
    // against the NEW runway immediately — not left stale until the next
    // scroll. introPxRef is already refreshed during render, so onScroll()
    // here reads the fresh value. Mirrors Hero.jsx's [introPx]-dep scroll effect.
  }, [introPx]);

  // Drive the room fade from the smoothed phase, in lockstep with the camera.
  // Multiplies by a `reveal` factor that ramps 0→1 over 500ms once the R3F
  // Canvas has rendered its first frame — so the DOM overlays (grain, vignette,
  // "scroll" hint) don't paint before the underlying scene has a pixel to show.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = phaseOut.current || 0;
      const rf = smooth(p, TRANSITION_CONFIG.roomFadeStart, TRANSITION_CONFIG.roomFadeEnd);
      const vis = 1 - rf;

      // Hold the black splash until the room is ready AND the opening line has
      // FINISHED typing (+ a read pause) — not a guessed duration, since the
      // typewriter lags while GLBs parse. A hard cap guarantees it never sticks.
      const now = performance.now();
      if (firstTickRef.current === 0) firstTickRef.current = now;
      const typedDone =
        typedDoneAtRef.current > 0 && now - typedDoneAtRef.current >= BOOT_READ_MS;
      const capped = now - firstTickRef.current >= BOOT_MAX_MS;
      let reveal = 0;
      if (readyRef.current && (typedDone || capped)) {
        if (readyAtRef.current === 0) readyAtRef.current = now;
        const t = (now - readyAtRef.current) / READY_FADE_MS;
        reveal = Math.min(1, Math.max(0, t));
      }

      // Block pointer events only while the room SUBSTANTIALLY covers the Hero
      // (vis > 0.5 — includes the boot splash at vis 1). The room fades over a
      // narrow scroll band, so a tight threshold would keep blocking the reel
      // when it already looks fully revealed (room only a few % left). Releasing
      // at half-cover lets the Hero's 3D carousel controls work as soon as the
      // reel is mostly visible, while the room-proper still swallows bleed.
      if (blockRef.current)
        blockRef.current.style.pointerEvents = vis > 0.5 ? "auto" : "none";

      const eff = vis * reveal;
      if (canvasWrap.current) canvasWrap.current.style.opacity = String(eff);
      if (fxRef.current) fxRef.current.style.opacity = String(eff);
      if (hintRef.current)
        hintRef.current.style.opacity = String(Math.max(0, 0.9 - p * 6) * reveal);
      // Black splash covers everything (Hero's dark-blue night sky included)
      // until the room signals ready, then fades in inverse of `reveal`.
      if (splashRef.current) {
        const splash = 1 - reveal;
        splashRef.current.style.opacity = String(splash);
        if (splash <= 0.001) splashRef.current.style.display = "none";
      }
      // The opening line fades out ahead of the splash (gone by reveal ~0.4) so
      // it doesn't ghost over the room as the black lifts.
      if (introRef.current) {
        introRef.current.style.opacity = String(Math.max(0, 1 - reveal * 2.5));
        if (reveal >= 1) introRef.current.style.display = "none";
      }
      if (DEBUG_TRANSITION.showTransitionProgress && dbgRef.current) {
        dbgRef.current.textContent = `phase ${p.toFixed(3)}`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="concept-intro"
      style={{ position: "fixed", inset: 0, zIndex: 10, pointerEvents: "none" }}
    >
      <div ref={canvasWrap} className="concept-canvas" style={{ opacity: 0 }}>
        {/* NOTE: intentionally NOT keyed on `device`. Keying would remount the
            whole Canvas on a breakpoint crossing (e.g. phone rotation), which
            resets Scene's smoothed camera phase to 0 → the dolly snaps back to
            the room-start shot mid-scroll, and the anti-flash splash can't
            re-arm. dpr / shadows type / camera path / env / dust all update
            LIVE via props; only gl.antialias and the shadow-map size are fixed
            at first mount — an acceptable quality nit on a rare mid-session
            device change, in exchange for no remount lurch. */}
        <Canvas
          dpr={dpr}
          gl={{ antialias: quality.antialias, alpha: true, powerPreference: "high-performance" }}
          camera={{
            fov: (CAMERA_PROFILES[device] || CAMERA_PROFILES.desktop).fovStart,
            near: 0.1,
            far: 100,
            position: (CAMERA_PROFILES[device] || CAMERA_PROFILES.desktop).path[0].position,
          }}
          shadows={quality.shadows}
          // pointerEvents:none so clicks fall THROUGH the room canvas to the
          // Hero canvas below (its 3D carousel arrows need the raycaster). The
          // room is scroll-driven only — it never needs pointer input.
          style={{ width: "100%", height: "100%", display: "block", pointerEvents: "none" }}
        >
          {/* This Canvas always renders (frameloop "always"), so the monitor can
              stay armed for the whole session. */}
          <AdaptiveDprMonitor onDecline={onDecline} onIncline={onIncline} />
          <Suspense fallback={null}>
            <Scene progress={progress} phaseOut={phaseOut} device={device} />
            <ReadySignal readyRef={readyRef} />
          </Suspense>
        </Canvas>
      </div>

      <div ref={fxRef} style={{ opacity: 0 }}>
        <div className="concept-grain" />
      </div>

      {/* Invisible pointer-events blocker: swallows clicks/hover while the room
          covers the Hero, so the Hero's 3D buttons don't fire through the
          pointer-events:none room canvas. Released (none) once the room fades.
          Scroll still works — pointer-events doesn't capture wheel/touch. */}
      <div
        ref={blockRef}
        aria-hidden="true"
        style={{ position: "fixed", inset: 0, zIndex: 6, pointerEvents: "auto" }}
      />

      {/* Scroll cue — a word + a downward manicule glyph (U+261F forced to text
          presentation with U+FE0E so it renders as a typographic hand, not a
          colour emoji). Opacity driven per-frame by the rAF loop above. */}
      <div ref={hintRef} className="concept-hint" style={{ opacity: 0 }}>
        <span className="concept-hint__word">scroll down</span>
        <span className="concept-hint__sub">to enter the world</span>
        <span className="concept-hint__hand" aria-hidden="true">
          {"☟︎"}
        </span>
      </div>

      {/* Black splash covers everything (including the Hero's dark-blue night
          sky underneath) until the Room canvas signals ready. Fades inverse
          of `reveal` (500ms), then removes itself from paint via display:none
          so it can't intercept anything downstream. */}
      <div
        ref={splashRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 20,
          background: "#000",
          opacity: 1,
          pointerEvents: "none",
        }}
      >
        <div className="concept-boot-grain" />
      </div>

      {/* The film's opening line, over the black splash. Typed in on load, faded
          out just ahead of the splash lift. */}
      <div ref={introRef} className="concept-boot-line" aria-hidden="true" style={{ opacity: 1 }} />

      {DEBUG_TRANSITION.showTransitionProgress && (
        <div
          ref={dbgRef}
          style={{ position: "fixed", top: 12, left: 12, color: "#0f8", font: "12px monospace", zIndex: 30 }}
        />
      )}
      {DEBUG_TRANSITION.showPortalBounds && (
        <div style={{ position: "fixed", inset: 0, border: "2px solid #00ff88", zIndex: 30 }} />
      )}
    </div>
  );
}
