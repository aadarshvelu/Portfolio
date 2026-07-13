/**
 * debugTransitionConfig.js — visual debugging switches for the room → Hero
 * portal transition. Flip these on while tuning the hand-off; keep them all
 * false for the finished, seamless experience.
 *
 *   showPortalBounds     — outline the CRT screen quad that reveals the Hero
 *   showMask             — tint the punched-through portal region
 *   showTransitionProgress — print/overlay the live phase (0 → 1)
 *   showHeroRevealArea   — highlight where the Hero is becoming visible
 */
export const DEBUG_TRANSITION = {
  showPortalBounds: false,
  showMask: false,
  showTransitionProgress: false,
  showHeroRevealArea: false,
};
