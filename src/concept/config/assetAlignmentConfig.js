/**
 * assetAlignmentConfig.js — manual orientation correction for imported GLBs.
 * ---------------------------------------------------------------------------
 * Different GLBs are authored with different "forward" directions, pivots and
 * up-axes. This file lets you CORRECT a model's orientation independently of
 * where you place it in the room (placement lives in sceneConfig.js).
 *
 * Think of it as a small adjustment applied to the raw model BEFORE it is put
 * on the desk. Leave everything at the identity values (0 / 0 / 0 / 1) and the
 * model is used exactly as exported; nudge a value to fix a tilted or
 * back-to-front import.
 *
 * What each knob does:
 *
 *   rotationY  = turn LEFT / RIGHT      (spin in place, like a turntable)
 *   rotationX  = tilt FORWARD / BACK    (nod)
 *   rotationZ  = roll CLOCKWISE / CCW    (lean sideways)
 *
 *   positionX  = move LEFT (-) / RIGHT (+)
 *   positionY  = move DOWN (-) / UP (+)
 *   positionZ  = move BACK (-) / FORWARD toward camera (+)
 *
 *   scale      = multiply the model's size (1 = unchanged)
 *
 * Rotations are in RADIANS (Math.PI = 180 degrees, Math.PI / 2 = 90 degrees).
 * These corrections are applied on top of the GLB's native size, then the whole
 * thing is placed by sceneConfig.js — so use sceneConfig for "where it sits in
 * the room" and this file only for "the model itself imported crooked".
 */
export const ASSET_ALIGNMENT = {
  lamp: {
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    scale: 1,
  },

  tv: {
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    scale: 1,
  },

  pen: {
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    scale: 1,
  },
};

// Identity used when an asset has no entry above.
export const IDENTITY_ALIGNMENT = {
  positionX: 0,
  positionY: 0,
  positionZ: 0,
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
  scale: 1,
};
