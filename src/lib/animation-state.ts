/**
 * Mutable animation state — GSAP writes to this, useFrame reads from it.
 * No React state involved, so zero re-renders.
 */
export const animState = {
  entranceProgress: 0,
  disperseProgress: 0,
  mouseX: 0,
  mouseY: 0,
  isEntranceDone: false,
  // Mouse hover interaction (world-space coords)
  pointerX: 0,
  pointerY: 0,
  pointerActive: false,
  // Hologram boot sequence
  hologramBoot: 0,
  hologramFlicker: 0,
  hologramBaseOpacity: 0,
  scanlineY: 0,
};
