export const enable_ix = false

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
// Runway = 1500vh. Act I marks rescaled ×0.443 (= 620/1400) from the original
// 720vh tuning so the same physical scroll distance triggers each event.

// Act I — The Origin
export const DOLLY_END = 0.062 // camera dolly into FIRST LIGHT completes
export const CELEB_START = 0.29 // confetti + carrier frame burst from the cone
export const BEAT1_END = 0.34 // Beat 1 drum finishes scrolling
export const CELEB_END = 0.355 // confetti settled
export const TRANSITION_END = 0.39 // carrier locks full-screen

// Act I.b — The Upgrade
export const UPGRADE_ENTER = 0.40 // carrier dissolves, camera transitions
export const UPGRADE_ZOOM = 0.41 // begin zoom into Kaggle polaroid
export const UPGRADE_KAGGLE = 0.448 // parked on Kaggle, V.O. card visible
export const UPGRADE_PAN_KZH = 0.460 // pan toward Kozhikode
export const UPGRADE_KZH = 0.476 // parked on Kozhikode
export const UPGRADE_PAN_AWS = 0.488 // pan toward AWS
export const UPGRADE_AWS = 0.504 // parked on AWS

// Act II — Page Peel: the Upgrade curls away to REVEAL Chapter III (The Roster).
export const PEEL_START = 0.515 // page peel begins (~1 scroll after AWS settles)
export const PEEL_END = 0.575 // page peel completes → reel-road behind it

// Chapter III — The Roster (reel-road "night flight", a WebGL scene rendered as
// a camera-aligned child of the page-peel, so it lives inside the CRT tube like
// every other chapter). The peel reveals it; it flies the 5 postings across
// ROSTER_START→ROSTER_END, then hands off to The Work at CRAFTS_START.
export const ROSTER_IN = 0.55 // (reserved) fade-in band as the peel finishes
export const ROSTER_START = 0.59 // fly begins (roster-local progress = 0)
export const ROSTER_END = 0.74 // fly ends (roster-local progress = 1)
export const ROSTER_OUT = 0.775 // (reserved) hand-off band into The Work

// The Work (Crafts newspaper) now begins AFTER the Roster instead of at the peel.
export const CRAFTS_START = 0.76

// Carousel "junction" → where each chapter lives on the one scroll runway,
// indexed in FRAMES order [Origin, Upgrade, Work, Contact]. FIRST LIGHT enters
// by scrolling into Act I (this is its smooth-scroll target); the others are
// reached by the PRESS PLAY button, which jumps here under the countdown cover.
export const CHAPTER_PROGRESS = [0.09, 0.45, 0.86, 0.97]

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
  nextChapter: 72,
  peelShadow: 79,
  peel: 80,
}
