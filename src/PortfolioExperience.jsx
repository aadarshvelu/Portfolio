import React, { useEffect, useMemo, useState } from "react";
import App from "./App.jsx";
import ConceptIntro from "./concept/ConceptIntro.jsx";
import { IntroFreezeContext } from "./concept/IntroFreeze.js";
import ScrollCue from "./components/ScrollCue.jsx";
import SoundControl from "./audio/SoundControl.jsx";

// How many viewport-heights of scroll the room intro occupies before the Hero
// takes over. The whole thing is one continuous, reversible scroll. The camera
// profile splits this in half: phase 0→0.5 (first screen) dollies in on the
// paper, 0.5→1 (second screen) dives into the CRT — so 2 = ~one scroll to the
// note, one into the TV.
const INTRO_SCREENS = 2;

// Read the stable locked viewport height App.jsx measures into --app-h. Using
// this instead of live window.innerHeight keeps introPx (and therefore the
// scroll→phase mapping) from shifting when a mobile URL bar shows/hides — which
// would otherwise lurch the room dolly mid-scroll. --app-h only changes on a
// real resize (orientation / window), so reading it on resize stays stable.
function readAppH() {
  if (typeof window === "undefined") return 800;
  const v = getComputedStyle(document.documentElement).getPropertyValue("--app-h");
  const px = parseFloat(v);
  return Number.isFinite(px) && px > 0 ? px : window.innerHeight;
}

/**
 * PortfolioExperience — the integration root.
 *
 *   Layer 1 (bottom): the real <App/> + <Hero/>, mounted from frame zero and
 *                     never recreated. It offsets its scroll by the intro length
 *                     so it sits at its opening until the visitor enters the TV.
 *   Layer 2/3 (top):  <ConceptIntro/> — the room + CRT, a pointer-events-none
 *                     overlay driven purely by window scroll.
 *
 * One scroll timeline: [0 .. introPx] enters the television (room → portal),
 * [introPx .. end] drives the Hero. Scroll up and it all rewinds. No lock, no
 * unmount, no scene swap.
 */
export default function PortfolioExperience() {
  const [appH, setAppH] = useState(readAppH);

  useEffect(() => {
    // App.jsx's effect (a child, so it runs first) sets --app-h before this
    // fires — re-read it here so the first introPx uses the locked value.
    setAppH(readAppH());
    const onResize = () => setAppH(readAppH());
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  const introPx = useMemo(() => appH * INTRO_SCREENS, [appH]);

  return (
    <IntroFreezeContext.Provider value={{ introPx }}>
      {/* Hero is always here, underneath. */}
      <App />

      {/* Extra scroll runway for the room-entry portion (before the Hero's own).
          Sized in px from the same locked height as introPx so the room phase
          reaches 1 exactly at the runway's end — no vh-vs-app-h drift. */}
      <div style={{ height: `${introPx}px` }} aria-hidden="true" />

      {/* The room overlays it and reveals it — always mounted, scroll-driven. */}
      <ConceptIntro introPx={introPx} />

      {/* Persistent "scroll · <section>" cue for the whole journey, all
          breakpoints (fades out at the end). */}
      <ScrollCue introPx={introPx} />

      {/* Minimal audio (reel tick + polaroid woff), on by default + mute. */}
      <SoundControl introPx={introPx} />
    </IntroFreezeContext.Provider>
  );
}
