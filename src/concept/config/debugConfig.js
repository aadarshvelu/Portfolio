/**
 * debugConfig.js — visual debugging switches for asset placement.
 *
 * Flip these to `true` while you are tuning positions in sceneConfig.js, then
 * set them back to `false` for the finished, cinematic look.
 *
 *   showAxes          — draw a red/green/blue axis cross on the lamp and TV
 *                       (red = X / right, green = Y / up, blue = Z / forward).
 *                       Use this to understand which way a GLB is facing.
 *
 *   showBoundingBoxes — draw a wireframe box around each model so you can see
 *                       its real size and where its origin (pivot) sits.
 *
 *   showHelpers       — master switch. When false, NO debug visuals are drawn
 *                       regardless of the two flags above.
 *
 *   logModelInfo      — print each model's width / height / depth / center to
 *                       the browser console once when it loads.
 */
export const DEBUG = {
  showAxes: false,
  showBoundingBoxes: false,
  showHelpers: false,
  logModelInfo: true,
};
