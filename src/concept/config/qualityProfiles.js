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
  // Floor tier for mid-range mobile GPUs (Mali / lower Adreno). These parts have
  // plenty of RAM and cores but low fill-rate, and their drivers compile shaders
  // far slower than Apple's — which is what makes the boot leader sit on "1"
  // while the room's first frame waits on compilation. dpr is the single biggest
  // lever here: the scene is fragment-bound (full-screen CRT post-process, many
  // stacked transparent layers), so pixels cost more than geometry.
  low: {
    dpr: [1, 1.25],
    shadows: "basic",
    antialias: false,
    lampShadowMap: 256,
    envResolution: 16,
    dustCount: 10,
  },
  // Absolute floor. Renders BELOW CSS resolution (dpr 0.85) and drops the shadow
  // map entirely — roughly 2x fewer fragments than `low`. Note the dpr pair must
  // have its CEILING below 1 to actually undersample: R3F clamps as
  // min(max(dpr[0], devicePixelRatio), dpr[1]), so a [0.7, 1] pair still lands
  // on exactly 1 for every real device. Shadows cost nothing visually here — the
  // mobile/tablet room is already `bare` (no lamp, pen or clock to cast one).
  // Expect softer type; this is the "is it fill-rate?" probe.
  floor: {
    dpr: [0.7, 0.85],
    shadows: false,
    antialias: false,
    lampShadowMap: 256,
    envResolution: 8,
    dustCount: 0,
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

/**
 * Android probe — deliberately separate from isWeakDevice().
 *
 * The signals above describe the CPU and RAM, which say NOTHING about mobile GPU
 * capability: a mid-range Android with 8 cores and 8GB reports "strong" and was
 * being handed the tablet profile (dpr 1.75 + MSAA + soft PCF shadows), then
 * crawled — while an iPhone with fewer cores ran the same scene smoothly. The
 * split isn't power, it's the GPU and its driver:
 *
 *   • Mali / lower Adreno parts have low fill-rate, and this scene is
 *     fragment-bound (full-screen CRT post-process over stacked transparent,
 *     depth-test-off layers). Pixels cost far more than geometry here.
 *   • Their shader compilers are slow. Apple and desktop drivers compile the
 *     same programs in a fraction of the time, which is why the boot leader
 *     sits on "1" on Android and nowhere else.
 *
 * These devices play native games fine — those are hand-tuned for the exact GPU.
 * A WebGL scene gets no such tuning, so we step the tier down instead.
 *
 * Detection order:
 *   1. User-Agent Client Hints (navigator.userAgentData.platform). This is the
 *      sanctioned API and it survives the UA-string reduction Chromium has been
 *      rolling out — the legacy string keeps losing entropy, this does not.
 *      Chromium covers essentially all of Android (Chrome, Edge, Samsung
 *      Internet, Brave). An empty platform falls through rather than lying.
 *   2. The UA string, for Firefox Android, which has no Client Hints.
 *
 * Known gap: "Request desktop site" makes Android report Linux in BOTH, so such
 * a session keeps the desktop tier. Rare, and it fails toward looking good
 * rather than breaking — use window.__forceTier (below) to check it by hand.
 *
 * Not using WEBGL_debug_renderer_info, which would name the actual GPU: it needs
 * a throwaway GL context on the very boot path we're unblocking, and browsers
 * are restricting it for fingerprinting.
 */
let _androidCache;
export function isAndroidGpu() {
  if (_androidCache !== undefined) return _androidCache;
  if (typeof navigator === "undefined") return (_androidCache = false);
  const platform = navigator.userAgentData?.platform;
  if (platform) return (_androidCache = platform === "Android");
  return (_androidCache = /android/i.test(navigator.userAgent || ""));
}

// One step down the ladder — a weak "desktop" renders the tablet scene, a weak
// tablet renders the mobile scene, a weak phone drops to `low`, and `floor` is
// the bottom (it maps to itself, so extra steps are harmless no-ops).
const DOWNGRADE = { desktop: "tablet", tablet: "mobile", mobile: "low", low: "floor", floor: "floor" };
const step = (tier) => DOWNGRADE[tier] || tier;

// How many steps Android gives up. Bumped to 2 while we find the threshold on
// real mid-range hardware: at 1 the tablet was better but still not clean. Drop
// back to 1 if `low`/`floor` look too soft for what they buy.
const ANDROID_STEPS = 2;

export function qualityFor(device) {
  // Debug/testing override: window.__forceTier = 'low' | 'mobile' | 'tablet' |
  // 'desktop'. Set it before load (or set it and reload) to feel any tier on any
  // machine — the only practical way to A/B this on a real phone, since the
  // detection above is what we're trying to verify.
  if (typeof window !== "undefined" && window.__forceTier) {
    return QUALITY_PROFILES[window.__forceTier] || QUALITY_PROFILES.desktop;
  }
  let tier = device;
  // The signals STACK: an Android phone lands on `floor`, an Android tablet on
  // `low`, and a device that ALSO trips isWeakDevice() goes one further still.
  if (isWeakDevice()) tier = step(tier);
  if (isAndroidGpu()) for (let i = 0; i < ANDROID_STEPS; i++) tier = step(tier);
  return QUALITY_PROFILES[tier] || QUALITY_PROFILES.desktop;
}
