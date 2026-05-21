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
  },
}
