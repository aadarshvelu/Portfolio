/**
 * debugTransitionConfig.js — visual debugging switches for the room → Hero
 * portal transition. Flip these on while tuning the hand-off; keep them all
 * false for the finished, seamless experience.
 *
 *   showPortalBounds     — outline the CRT screen quad that reveals the Hero
 *   showTransitionProgress — print/overlay the live phase (0 → 1)
 */
export const DEBUG_TRANSITION = {
  showPortalBounds: false,
  showTransitionProgress: false,
};
