/**
 * transitionConfig.js — the control panel for the room → television → Hero
 * hand-off. Every threshold and strength of the integration lives here so the
 * portal can be tuned without touching component code.
 *
 * `phase` runs 0 → 1 as the visitor scrolls through the intro (driven by the
 * ConceptIntro scroll container). These knobs remap that phase into the events
 * of the transition.
 */
export const TRANSITION_CONFIG = {
  // When the existing Hero begins to show THROUGH the CRT glass (a faint, distant
  // signal at first) and when it is fully visible inside the screen. Tuned to the
  // scroll model: ~0.90 the CRT nearly fills, ~0.95 the glass fills, 1.0 the Hero.
  heroRevealStart: 0.84,
  heroRevealEnd: 0.99,

  // When the surrounding room dissolves so the Hero takes the whole frame.
  // (The CRT bezel leaves frame and the room canvas fades to nothing.)
  roomFadeStart: 0.94,
  roomFadeEnd: 1.0,

  // Overall strengths (1 = as authored). Lets you dial the whole effect.
  crtGlowStrength: 1.0,
  crtDistortionStrength: 1.0,
  portalBlendStrength: 1.0,
};
