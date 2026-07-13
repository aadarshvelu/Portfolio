/**
 * cameraProfiles.js — one camera "setup" per device, filming the same room.
 *
 * Each profile is the full scroll-driven dolly: `path` runs from the opening
 * room shot (path[0]) to "inside the TV glass" (last entry). The transition is
 * reversible, so scrolling back rewinds the move.
 *
 *   position : where the camera is        [x, y, z]
 *   lookAt   : what it points at          [x, y, z]
 *   fovStart : lens at the opening (bigger = wider)
 *   fovEnd   : lens once we reach the TV  (smaller = tighter)
 *
 * Desktop = wide cinematic shot. Tablet = closer / tighter. Mobile = a low,
 * close PORTRAIT shot where the paper dominates and the TV reads above it.
 * Each path's last entries target THAT device's TV (see layoutProfiles.js).
 */
import { SCENE_CONFIG } from "./sceneConfig";

export const CAMERA_PROFILES = {
  // Desktop = the camera in sceneConfig.js (so editing it there still works).
  desktop: SCENE_CONFIG.camera,

  // Tablet uses the SAME portrait framing as mobile (incl. the stay-in-front-of-
  // the-glass rule above — never let position.z drop below the screen z ≈ 1.2).
  tablet: {
    fovStart: 60,
    fovEnd: 40,
    path: [
      { position: [0, 1.4, 4.5], lookAt: [0, 1.2, 0.9] }, // window top · TV · note on desk · desk to bottom
      { position: [0, 1.37, 3.7], lookAt: [0, 1.28, 1.05] }, // settle, gaze to TV
      { position: [0, 1.33, 2.9], lookAt: [-0.05, 1.3, 1.15] }, // move toward the TV
      { position: [-0.08, 1.31, 2.35], lookAt: [-0.146, 1.31, 1.2] }, // TV primary — aim at the screen
      { position: [-0.12, 1.31, 1.9], lookAt: [-0.146, 1.31, 1.2] }, // dolly in (still in FRONT of the glass)
      { position: [-0.146, 1.31, 1.62], lookAt: [-0.146, 1.31, 1.2] }, // into the glass — stops in front, never through
    ],
  },

  // Mobile films the room as a tall portrait: a partial WINDOW at the top, the
  // TV centred (y≈1.30), the note on the DESK in front of it, the desk filling
  // to the bottom of the frame. The dolly starts wide (sees the whole stack)
  // and pushes straight forward INTO the TV glass.
  // IMPORTANT: the CRT screen is at world z = tvPosition.z (0.8) + screen.z (0.4)
  // ≈ 1.2. Every camera `position.z` MUST stay ABOVE that — if the camera crosses
  // the screen plane it sees the glass's mirrored back-face (the "weird backwards
  // text" bug that only showed on mobile/tablet). So the dolly APPROACHES from the
  // front and stops just short of the glass, looking straight at it (z ≈ 1.2).
  // If you move tvPosition.z, move this endpoint with it.
  mobile: {
    fovStart: 60,
    fovEnd: 40,
    path: [
      { position: [0, 1.4, 4.5], lookAt: [0, 1.2, 0.9] }, // window top · TV · note on desk · desk to bottom
      { position: [0, 1.37, 3.7], lookAt: [0, 1.28, 1.05] }, // settle, gaze to TV
      { position: [0, 1.33, 2.9], lookAt: [-0.05, 1.3, 1.15] }, // move toward the TV
      { position: [-0.08, 1.31, 2.35], lookAt: [-0.146, 1.31, 1.2] }, // TV primary — aim at the screen
      { position: [-0.12, 1.31, 1.9], lookAt: [-0.146, 1.31, 1.2] }, // dolly in (still in FRONT of the glass)
      { position: [-0.146, 1.31, 1.62], lookAt: [-0.146, 1.31, 1.2] }, // into the glass — stops in front, never through
    ],
  },
};
