/**
 * layoutProfiles.js — per-device framing DELTAS for the props in the room.
 *
 * Anything a profile does NOT specify falls back to sceneConfig.js (see
 * buildLayout in layoutContext.js). So:
 *   - DESKTOP keeps the existing composition exactly (sceneConfig is the source).
 *   - TABLET / MOBILE only override what needs to change for that shot.
 *
 * This keeps sceneConfig.js as the single place to tune the room, while still
 * giving each device its own intentional composition. Components read ONLY the
 * merged result — never hardcoded transforms.
 *
 * Available keys (all optional):
 *   lampPosition/Rotation/Scale, lampLight
 *   paperPosition/Rotation/Scale
 *   penPosition/Rotation/Scale
 *   tvPosition/Rotation/Scale
 *   clockPosition/Rotation/Scale
 *   windowPosition/Scale
 */
const DESK = 0.75;

export const LAYOUT_PROFILES = {
  // Wide cinematic shot — use sceneConfig as-is.
  desktop: {},

  // Tablet uses the SAME portrait composition as mobile (see below).
  tablet: {
    paperWall: false,
    paperLit: true,
    paperPosition: [0.08, DESK + 0.05, 3.55],
    paperRotation: [0.3, 0, 0.3],
    paperScale: 0.4,
    tvPosition: [0.0, 1.28, 0.8],
    tvRotation: [0, 0, 0],
    windowPosition: [-2.5, 3.5, -1.2],
    deskPosition: [0.0, 0.0, 2],
  },

  // Portrait view of the actual room, stacked vertically: a partial WINDOW peeks
  // at the top, the TV sits centred below it, and the note lies on the DESK in
  // front of the TV. The lamp/clock/pen are dropped (see Scene.jsx), so the note
  // carries its OWN spotlight (paperLit) to keep its glow. The desk fills to the
  // bottom of the frame; the camera dollies forward into the TV.
  mobile: {
    paperWall: false, // note lies flat on the desk (not framed on a wall)
    paperLit: true, // its own spotlight (the lamp is absent on mobile)
    paperPosition: [0.08, DESK + 0.05, 3.55], // on the desk, in front of the TV
    paperRotation: [0.3, 0, .3], // tilt up toward camera, no sideways skew
    paperScale: 0.4,
    tvPosition: [0.0, 1.28, 0.8], // TV centred, sitting on the desk
    tvRotation: [0, 0, 0], // face the camera head-on
    windowPosition: [-2.5, 3.5, -1.2], // up + left → partial in the TOP-LEFT corner
    deskPosition: [0.0, 0.0, 2], // pushed toward the camera so the table front
    //                                reaches the bottom of the portrait frame
  },
};
