// Per-breakpoint hero layout. World units = design pixels of the active
// breakpoint; origin at screen centre, +x right, +y up.
//
// `desktop` values are the live, hand-tuned production layout — do not change
// them without intent. `tablet` / `mobile` are portrait layouts; their values
// are starting points, tune on a device.

export const LAYOUTS = {
  desktop: {
    design: { w: 1920, h: 1080 },
    starfield: { count: 180 },
    shootingStar: { count: 7, len: 120, thick: 2.4 },
    moon: { x: 550, y: 333.6, w: 560 },
    clouds: { x: 390, y: 235, scale: 1 },
    title: { x: 0, y: 101.3, w: 1497.6 },
    filmRoll: { y: -216, scale: 1, rise: 700, spread: 16, visibleFrames: 5 },
    chrome: {
      cornerX: 900,
      topY: 412,
      bottomY: -384,
      regX: 928,
      regY: 404,
      fontScale: 1,
      shortMeta: false,
    },
    scrollPrompt: { y: -486 },
    bootLine: { fontSize: 14 },
    // Phase A — camera parks the FIRST LIGHT frame. Scene computes the exact
    // dolly target from the live viewport so the frame can never overshoot
    // off-screen. 'left' = frame pinned left at heightFrac of viewport height,
    // its content sideMargin in from the left edge.
    park: { mode: 'left', heightFrac: 0.78, sideMargin: 0.055 },
    // Phase B — Beat 1 text column scrolls up the right lane. lane{Top,Bot}
    // are viewport-height fractions (0 = top edge); full height on desktop.
    originBeat: {
      x: 143,
      fontSize: 15,
      gap: 22,
      maxWidth: 195,
      anchorX: 'left',
      laneTop: 0.05,
      laneBot: 0.95,
    },
    // Confetti celebration scale (relative to desktop) + reel-transition card.
    confetti: { scale: 1 },
    reel: { titleSize: 17, emSize: 8.5, labelSize: 4.6, mode: 'corners' },
    // Act I.b — The Upgrade
    upgrade: {
      design: { w: 1920, h: 1080 },
      starCount: 60,
      // title slate
      aboveSize: 11, titleSize: 120, subSize: 30, cornerSize: 10,
      // clapperboard
      clapX: -680, clapY: 240, clapScale: 1,
      // polaroid positions (world units from Upgrade scene centre)
      shootingStar: { count: 5, len: 100, thick: 2.0 },
      polaroidW: 140, photoAspect: 1,
      kaggle:    { x: 480, y: -260, rot: -4 },
      kozhikode: { x: 660, y: -180, rot: 6 },
      aws:       { x: 540, y: -50, rot: 6, scale: 0.78 },
      // camera park per polaroid — fillFrac = how much of viewport height
      // the polaroid fills when the camera is parked on it
      kagglePark:    { fillFrac: 0.7 },
      kozhikodePark: { fillFrac: 0.7 },
      awsPark:       { fillFrac: 0.6 },
      // chrome
      chrome: {
        cornerX: 900, topY: 412, bottomY: -384,
        regX: 928, regY: 404, fontScale: 1,
      },
    },
  },

  tablet: {
    design: { w: 820, h: 1180 },
    starfield: { count: 130 },
    shootingStar: { count: 5, len: 70, thick: 2.0 },
    moon: { x: 350, y: 250, w: 560 },
    clouds: { x: 200, y: 200, scale: 0.6 },
    title: { x: 10, y: 35, w: 820 },
    filmRoll: { y: -200, scale: 0.92, rise: 520, spread: 16, visibleFrames: 5 },
    chrome: {
      cornerX: 352,
      topY: 540,
      bottomY: -500,
      regX: 388,
      regY: 530,
      fontScale: 0.92,
      shortMeta: false,
    },
    scrollPrompt: { y: -420 },
    bootLine: { fontSize: 16 },
    // Portrait — 'top' pins the frame to the top at widthFrac of viewport
    // width, topMargin in from the top edge; Beat 1 scrolls up the lower band.
    park: { mode: 'top', widthFrac: 0.84, topMargin: 0.05 },
    originBeat: {
      x: 0,
      fontSize: 28,
      gap: 24,
      maxWidth: 250,
      anchorX: 'center',
      laneTop: 0.54,
      laneBot: 0.97,
    },
    confetti: { scale: 1.8 },
    reel: { titleSize: 9, emSize: 6, labelSize: 4, mode: 'stack' },
    upgrade: {
      design: { w: 820, h: 1180 },
      starCount: 40,
      aboveSize: 10, titleSize: 80, subSize: 24, cornerSize: 9,
      titleX: 5, titleY: 250,
      clapX: -270, clapY: 140, clapScale: 0.8,
      shootingStar: { count: 4, len: 60, thick: 1.6 },
      polaroidW: 120, photoAspect: 1,
      kaggle:    { x: 20,  y: 10,  rot: -5 },
      kozhikode: { x: -120, y: -160, rot: 6 },
      aws:       { x: 50,  y: -150, rot: -3, scale: 0.78 },
      kagglePark:    { fillFrac: 0.55 },
      kozhikodePark: { fillFrac: 0.55 },
      awsPark:       { fillFrac: 0.48 },
      chrome: {
        cornerX: 370, topY: 550, bottomY: -540,
        regX: 390, regY: 540, fontScale: 0.92,
      },
    },
  },

  mobile: {
    design: { w: 430, h: 930 },
    starfield: { count: 85 },
    shootingStar: { count: 4, len: 44, thick: 1.8 },
    moon: { x: 185, y: 150, w: 532 },
    clouds: { x: 20, y: 90, scale: 0.3 },
    title: { x: 5, y: 12, w: 435 },
    filmRoll: { y: -180, scale: 0.75, rise: 420, spread: 6, visibleFrames: 3 },
    chrome: {
      cornerX: 188,
      topY: 422,
      bottomY: -388,
      regX: 205,
      regY: 410,
      fontScale: 0.78,
      shortMeta: true,
    },
    scrollPrompt: { y: -320 },
    bootLine: { fontSize: 11 },
    // Portrait — 'top' pins the frame to the top at widthFrac of viewport
    // width, topMargin in from the top edge; Beat 1 scrolls up the lower band.
    park: { mode: 'top', widthFrac: 0.9, topMargin: 0.04 },
    originBeat: {
      x: 0,
      fontSize: 26,
      gap: 22,
      maxWidth: 195,
      anchorX: 'center',
      laneTop: 0.4,
      laneBot: 0.97,
    },
    confetti: { scale: 1.8 },
    reel: { titleSize: 6, emSize: 4, labelSize: 2.8, mode: 'stack' },
    upgrade: {
      design: { w: 430, h: 930 },
      starCount: 30,
      aboveSize: 9, titleSize: 56, subSize: 20, cornerSize: 8,
      titleX: 5, titleY: 125,
      clapX: -120, clapY: 130, clapScale: 0.4,
      shootingStar: { count: 3, len: 36, thick: 1.4 },
      polaroidW: 100, photoAspect: 1,
      kaggle:    { x: 80,  y: -30,   rot: -14 },
      kozhikode: { x: -80, y: -100, rot: 5 },
      aws:       { x: 40,  y: -160, rot: -3, scale: 0.78 },
      kagglePark:    { fillFrac: 0.5 },
      kozhikodePark: { fillFrac: 0.5 },
      awsPark:       { fillFrac: 0.44 },
      chrome: {
        cornerX: 195, topY: 440, bottomY: -420,
        regX: 208, regY: 430, fontScale: 0.78,
      },
    },
  },
}
