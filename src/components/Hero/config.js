// Perspective camera distance (matches the prototype's CSS perspective).
export const CAMERA_Z = 1700

// Initial vertical fov for the desktop design height — re-derived live by
// coverFov() once the viewport + active layout are known.
export const CAMERA_FOV = (2 * Math.atan(1080 / 2 / CAMERA_Z) * 180) / Math.PI

// fov that makes the active design rect COVER the viewport full-bleed —
// crops the overflow on the longer axis, never letterboxes.
export const coverFov = (viewportAspect, design) => {
  const designAspect = design.w / design.h
  const visibleHeight =
    viewportAspect > designAspect ? design.w / viewportAspect : design.h
  return (2 * Math.atan(visibleHeight / 2 / CAMERA_Z) * 180) / Math.PI
}

// Scroll timeline — normalised marks across the runway (smoothed 0..1).
export const DOLLY_END = 0.14 // camera dolly into FIRST LIGHT completes
export const BEAT1_END = 0.76 // Beat 1 drum finishes scrolling
export const CELEB_START = 0.66 // confetti + carrier frame burst from the cone
export const CELEB_END = 0.8 // confetti settled
export const TRANSITION_END = 0.88 // carrier locks full-screen — new screen ready

// The night-sky Background + Starfield planes are built this many times the
// design size, so a dollied, parked camera never pans past their edge. The
// shader remaps UVs so the central design-sized region is unchanged.
export const SKY_SCALE = 2

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
