/**
 * sceneConfig.js — THE control panel for the whole scene.
 * ---------------------------------------------------------------------------
 * Every position, rotation, scale and camera value lives here. You can move
 * the lamp, the TV, the paper and the camera WITHOUT opening any component
 * file. See README_PLACEMENT.md for a plain-English "which knob does what".
 *
 * Conventions (right-handed, the three.js standard):
 *   position: [x, y, z]   x = left(−)/right(+)
 *                         y = down(−)/up(+)
 *                         z = far/back(−)/near/toward-camera(+)
 *   rotation: [x, y, z]   in RADIANS. Use Math.PI for 180°, Math.PI/2 for 90°.
 *   scale:    a single number (1 = original GLB size, 2 = twice as big).
 *
 * The desk surface sits at y = 1.08. Anything resting "on the desk" uses a
 * y close to that value.
 */

const DESK_SURFACE_Y = .75;

export const SCENE_CONFIG = {
  // ---- The wooden desk everything sits on (procedural, not a GLB) ----
  desk: {
    position: [0, 0, 0.4],
    rotation: [0, 0, 0],
    scale: 1,
    surfaceY: DESK_SURFACE_Y, // height of the desktop surface (read by others)
  },

  // ---- The note / letter — the focal point ----
  // It rests on the desk but tilts UP toward the viewer so it reads instantly.
  //   rotation[0] = tilt toward you  (0 = lying flat, bigger = more upright/readable)
  //   rotation[1] = yaw (turn the note left/right on the desk)
  //   rotation[2] = natural skew (a few degrees so it isn't perfectly square)
  paper: {
    position: [.15, DESK_SURFACE_Y + 0.035, 1.95], // near edge resting on the desk
    rotation: [0.30, 0.0, 0.25],
    scale: .55, // ~25% larger — the note is the story hook
    wall: false, // desktop/tablet: the note lies flat on the desk
    lit: false, // desktop/tablet: the lamp lights the note. Mobile sets true to
    //            give the note its OWN spotlight (the lamp is dropped there).
    // Picture frame + spotlight used ONLY when wall:true (mobile portrait shot).
    // In wall mode the note hangs vertical, framed, lit like gallery art. All
    // sizes are in the paper's LOCAL units (sheet is 1.5 wide x 2.0 tall before
    // `scale`); the spot offset is in WORLD units from the paper's position.
    frame: {
      color: "#241a11", // dark walnut frame
      borderW: 0.13, // frame rail thickness
      depth: 0.09, // how far the frame stands off the sheet
      spot: {
        color: "#ffe8c2",
        intensity: 60,
        angle: 0.55,
        penumbra: 0.9,
        distance: 7,
        offset: [0.0, 1.35, 1.9], // world offset of the light from the paper
      },
    },
  },

  // ---- PEN (pen.glb) — left resting across the lower-right of the note ----
  // The pen lies ON TOP of the paper, so it shares the paper's tilt. Tune
  // rotation.z to change the diagonal angle it lies at (the usual adjustment).
  pen: {
    position: [0.36, DESK_SURFACE_Y + 0.155, 1.6], // x right, y height, z front/back
    rotation: [1.5, .5, 0.8], // [match paper tilt, yaw, angle across paper]
    scale: 0.05,
  },

  // ---- LAMP (lamp.glb) ----
  lamp: {
    // lamp.glb is modelled at ~79 units tall, pivot offset from its base.
    position: [-1.35, DESK_SURFACE_Y, 0.35],
    rotation: [0, Math.PI, 0],
    scale: 0.016,

    // The warm tungsten light the lamp casts. Positioned in world space so it
    // stays put no matter how the lamp MODEL is scaled. Aim it at the paper.
    light: {
      position: [-0.55, 1.95, 1.25], // roughly where the bulb/shade is
      target: [0.1, DESK_SURFACE_Y, 1.1], // what it points at (the paper)
      color: "#ffb45a",
      intensity: 95,
      angle: 0.85, // cone width (radians)
      penumbra: 0.95, // softness of the cone edge (0–1)
      distance: 8,
    },
    // Tiny soft glow so the bulb reads as the actual source.
    glow: {
      position: [-0.55, 1.85, 1.25],
      color: "#ffca7a",
      intensity: 6,
      distance: 3.2,
    },
  },

  // ---- TELEVISION (tv.glb) ----
  tv: {
    // tv.glb is modelled tiny (~0.017 units wide), centered on its origin.
    position: [2.05, DESK_SURFACE_Y + 0.55, 0.15],
    rotation: [0, -0.4, 0], // turn the set slightly toward the camera
    scale: 95,

    // The CRT screen overlay (procedural shader: static → blue glow + text).
    // Offsets are relative to tv.position/rotation, so they rotate WITH the
    // set. Nudge these so the glowing screen lands on the TV's glass.
    screen: {
      position: [-0.146, 0.03, 0.4], // x: left/right, y: up/down, z: in front of glass
      rotation: [0, 0, 0],
      size: [0.989, 0.745], // [width, height] of the glowing screen
      curve: 0.11, // how far the CRT glass bulges toward you (0 = flat)
    },
    // CRT end-of-sequence text.
    text: {
      // z must sit IN FRONT of the bulged glass (screen z + curve) or it hides.
      title: { position: [-0.146, 0.07, 0.58], fontSize: 0.082 },
      sub: { position: [-0.146, -0.11, 0.58], fontSize: 0.04 },
    },
    // Cold light the screen throws into the room as it wakes.
    glow: {
      position: [-0.13, -0.02, 0.7],
      color: "#3b6dff",
      intensity: 14,
      distance: 5,
    },
    // Subtle cool rim light to catch the edges of the set in the dark.
    rim: {
      position: [3.7, 1.9, 0.5],
      color: "#2f5bff",
      intensity: 5,
      distance: 6,
    },
  },

  // ---- ATMOSPHERIC DUST ----
  // Fine motes that only show where the lamp beam catches them. They should be
  // almost subliminal — you feel the air, you don't notice "particles".
  //   count   — how many motes exist (keep it low; most are invisible anyway)
  //   speed   — drift speed (very small = nearly still air)
  //   opacity — peak brightness of a mote sitting dead-centre in the beam
  //   spread  — [x, y, z] size of the dust volume around the lamp/paper
  //   size    — base mote size (most motes are scaled far below this)
  dust: {
    count: 36,
    speed: 0.02,
    opacity: 0.2,
    spread: [1.7, 1.5, 1.6],
    size: 0.005,
    center: [-0.1, 1.25, 1.25], // sits over the paper / lamp beam
  },

  // ---- SIGNS OF LIFE (procedural; every one supports the story) ----

  // Window on the back wall (night sky + frame). The curtain hangs in front.
  window: {
    position: [-3.6, 3.5, -4.54], // on the back wall (wall sits at z = -4.6)
    paneSize: [2.6, 3.0], // [width, height] of the night-sky pane
  },

  // Window curtain — thin sheer fabric, barely breathing in still night air.
  curtain: {
    position: [-3.6, 3.45, -4.42], // just in front of the window pane
    size: [2.75, 3.15], // [width, height], covers the opening
    opacity: 0.5, // sheer — moonlight reads through it
    color: "#39476a",
    sway: 0.035, // movement amplitude (tiny)
    speed: 0.45, // movement speed (slow)
  },

  // Retro flip desk clock — sits ON the desk beside the TV, like a newsroom /
  // editing-suite station clock. Real local time; the minute card flips. Small
  // and discovered, never the hero.
  clock: {
    position: [-.65, DESK_SURFACE_Y + .30, 0.45], // on the desk, in front-left of the TV
    rotation: [0, 0.35, 0], // angled to face the camera
    width: 0.30, // ~22cm wide
    bodyColor: "#100f0f", // matte black bakelite
    cardColor: "#cdbf9f", // cream flip cards
    digitColor: "#1b1712", // dark charcoal digits
    accent: "#ff8a3d", // warm amber status light
  },

  // ---- CAMERA dolly ----
  // The camera is animated along this path as the user scrolls (0 → 1).
  // path[0] is the opening frame; the last entry is "inside the TV screen".
  // Each stop has a position (where the camera is) and a lookAt (what it
  // points at). Edit path[0] to change the very first thing the viewer sees.
  camera: {
    fovStart: 38, // lens at the start (bigger = wider view)
    fovEnd: 30, // lens once we reach the TV (smaller = tighter/closer)
    path: [
      { position: [0.05, 2.05, 4.35], lookAt: [0.5, 1.28, 1.05] }, // 0%  raised, looking down at the note
      { position: [0.0, 1.96, 3.75], lookAt: [0.2, 1.32, 1.15] }, // lean onto the paper
      { position: [0.6, 1.7, 3.3], lookAt: [1.6, 1.45, 0.5] }, // 50% drift toward the TV
      { position: [1.15, 1.5, 2.35], lookAt: [1.72, 1.36, 0.55] }, // 75% TV becomes primary
      { position: [1.35, 1.4, 1.7], lookAt: [1.72, 1.35, 0.56] }, // dollying in
      { position: [1.5, 1.36, 1.18], lookAt: [1.72, 1.34, 0.56] }, // 100% pushed into the glass
    ],
  },
};

// Where the GLB files live (served from /public).
export const ASSET_URLS = {
  lamp: "/assets/3d/lamp.glb",
  tv: "/assets/3d/tv.glb",
  pen: "/assets/3d/pen.glb",
};
