// World units = design pixels. Origin at screen centre, +x right, +y up.
export const DESIGN_W = 1920
export const DESIGN_H = 1080

// Perspective camera distance (matches the prototype's CSS perspective).
export const CAMERA_Z = 1700

// Initial vertical fov — z=0 plane exactly DESIGN_H tall. The live fov is
// re-derived per viewport by coverFov().
export const CAMERA_FOV =
  (2 * Math.atan(DESIGN_H / 2 / CAMERA_Z) * 180) / Math.PI

// fov that makes the 1920x1080 design rect COVER a viewport of `aspect` —
// the design always fills the screen full-bleed, cropping the overflow on
// the longer axis. No letterbox bars.
export const coverFov = (aspect) => {
  const designAspect = DESIGN_W / DESIGN_H
  const visibleHeight = aspect > designAspect ? DESIGN_W / aspect : DESIGN_H
  return (2 * Math.atan(visibleHeight / 2 / CAMERA_Z) * 180) / Math.PI
}

// Painter-order for the flat 2D layers (all at z~0, depthTest off).
export const ORDER = {
  background: 0,
  stars: 1,
  moon: 2,
  title: 3,
  filmRoll: 10, // frames offset around this by depth
  vignette: 20,
  chrome: 30,
  scrollPrompt: 31,
  bootMask: 60,
  bootLine: 70,
}
