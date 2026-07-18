// ─────────────────────────────────────────────────────────────────────────────
// Scroll-cue placement — the ONE place to position the "SCROLL · <chapter>"
// stamp. Values are plain CSS, applied as inline styles, so tweak freely and
// live-reload. One entry per breakpoint × section.
//
// Breakpoints (match the hero scene, from hooks/useBreakpoint.js):
//   mobile  : width < 768  (any orientation)
//   tablet  : width < 1280 AND portrait
//   desktop : everything else
//
// Sections (which chapter the visitor is in):
//   enter   → the room / CRT portal (before the Hero)
//   origin  → First Light  (Chapter I)
//   upgrade → The Upgrade
//   roster  → The Roster   (reel-road)
//   work    → The Work / newspaper (Chapter IV)
//
// Each entry is a position object. Only set what you need; anything omitted is
// `auto`:
//   left / right / top / bottom : CSS length or % (e.g. '50%', '22%', '9%')
//   translate : the translate() part of the transform — use '-50%, 0' to centre
//               horizontally on left:'50%', '0, -50%' to centre vertically on
//               top:'50%'. Omit for none.
//   rotate    : tilt in degrees; the ticket sits slightly "up" at -4.
//   vertical  : true → label runs vertically (upright).
// ─────────────────────────────────────────────────────────────────────────────

// Centred at the bottom — the default resting spot for most sections.
const BOTTOM_CENTER = { left: '50%', bottom: '6%', translate: '-50%, 0', rotate: -4 }

export const SCROLL_CUE = {
  mobile: {
    enter:   { ...BOTTOM_CENTER, bottom: '13%' },
    origin:  { ...BOTTOM_CENTER, bottom: '6%' },
    upgrade: { ...BOTTOM_CENTER, bottom: '12%' },
    roster:  { ...BOTTOM_CENTER, bottom: '30%' },
    work:    { ...BOTTOM_CENTER },
  },

  tablet: {
    enter:   { ...BOTTOM_CENTER, bottom: '10%' },
    origin:  { ...BOTTOM_CENTER, bottom: '5%' },
    upgrade: { ...BOTTOM_CENTER, bottom: '13%' },
    roster:  { ...BOTTOM_CENTER, left: '75%', bottom: '35%' },
    work:    { ...BOTTOM_CENTER },
  },

  desktop: {
    enter:   { ...BOTTOM_CENTER },
    origin:  { ...BOTTOM_CENTER },
    upgrade: { ...BOTTOM_CENTER },
    // Roster: tuck into the empty right-middle space (clear of the marquee).
    roster:  { right: '9%', top: '44%', translate: '0, -50%', rotate: -4 },
    work:    { left: '-100%', top: '30%', translate: '0, -50%', rotate: -0 },
  },
}

// Fallback if a breakpoint/section lookup ever misses.
export const SCROLL_CUE_FALLBACK = BOTTOM_CENTER
