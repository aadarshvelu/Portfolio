/**
 * qualityProfiles.js — per-device render quality for The Room.
 *
 * Same scene, three fidelity tiers. Mobile GPUs are far weaker, so we scale the
 * expensive knobs down rather than shipping the desktop scene to a phone. These
 * are attached to the merged layout (see buildLayout in layoutContext.js) as
 * `layout.quality`, so in-Canvas components read them via useLayout(); the
 * Canvas-level ones (dpr / shadows / antialias) are read straight from the
 * device in ConceptIntro.
 *
 *   dpr            : Canvas device-pixel-ratio clamp [min, max]
 *   shadows        : R3F <Canvas shadows> — "soft" (PCFSoft) | "basic" (cheap)
 *   antialias      : GL MSAA (context attribute; set at Canvas creation)
 *   lampShadowMap  : the lamp spotlight's shadow-map resolution (heaviest knob)
 *   envResolution  : procedural <Environment> cubemap resolution
 *   dustCount      : number of dust motes (InstancedMesh)
 */
export const QUALITY_PROFILES = {
  desktop: {
    dpr: [1, 2],
    shadows: "soft",
    antialias: true,
    lampShadowMap: 2048,
    envResolution: 64,
    dustCount: 36,
  },
  tablet: {
    dpr: [1, 1.75],
    shadows: "soft",
    antialias: true,
    lampShadowMap: 1024,
    envResolution: 48,
    dustCount: 28,
  },
  mobile: {
    dpr: [1, 1.5],
    shadows: "basic",
    antialias: false,
    lampShadowMap: 512,
    envResolution: 32,
    dustCount: 18,
  },
};

/**
 * Capability probe — the device TIER above is chosen purely by viewport width,
 * which says nothing about GPU power: a cheap 1366×768 laptop reports "desktop"
 * and gets 2048px shadow maps + MSAA + dpr 2, then crawls. This downgrades the
 * tier by one step when the hardware self-reports as weak.
 *
 * Signals (all advisory, all widely supported enough to be useful):
 *   hardwareConcurrency <= 4  — low core count tracks low-end silicon
 *   deviceMemory <= 4         — Chromium-only; absent elsewhere, so never trusted alone
 *   prefers-reduced-motion    — an explicit "keep it cheap" from the user
 *
 * Cached: these never change during a session, and this runs on every resize.
 */
let _weakCache;
export function isWeakDevice() {
  if (_weakCache !== undefined) return _weakCache;
  if (typeof window === "undefined" || typeof navigator === "undefined") return (_weakCache = false);
  const cores = navigator.hardwareConcurrency ?? 8;
  const mem = navigator.deviceMemory; // undefined on Safari/Firefox
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  return (_weakCache = cores <= 4 || (mem !== undefined && mem <= 4) || reduced);
}

// One step down the ladder — a weak "desktop" renders the tablet scene, a weak
// tablet renders the mobile scene. Mobile is already the cheapest tier.
const DOWNGRADE = { desktop: "tablet", tablet: "mobile", mobile: "mobile" };

export function qualityFor(device) {
  const tier = isWeakDevice() ? DOWNGRADE[device] || device : device;
  return QUALITY_PROFILES[tier] || QUALITY_PROFILES.desktop;
}
