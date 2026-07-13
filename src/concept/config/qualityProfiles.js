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

export function qualityFor(device) {
  return QUALITY_PROFILES[device] || QUALITY_PROFILES.desktop;
}
