// Shared reel geometry + edge-fade math for the film carousel. Kept in one
// place so FilmRoll (which positions the ring) and FilmFrame (which fades each
// frame by its LIVE rotated position, not its resting slot) agree exactly.

export const DEG = Math.PI / 180
export const SPREAD = 16 * DEG // per-frame fan angle
export const DEPTH = 920 // cylinder radius
export const TILT = -7 * DEG // roll tilt
export const MARGIN = 5 // slots rendered on each side of centre

// Edge fade: frames stay full out to EDGE_FULL slots from centre, then fade to
// invisible by EDGE_FULL+EDGE_FADE. Applied to the frame's LIVE angular distance
// so a frame swinging toward the edge during a paginate fades as it goes —
// otherwise a still-bright frame glows at the strip edge mid-rotation.
export const EDGE_FULL = 2
export const EDGE_FADE = 2

export const clamp01 = (x) => Math.min(1, Math.max(0, x))
export const wrap = (n, m) => ((n % m) + m) % m
export const edgeFor = (dist) => clamp01(1 - (dist - EDGE_FULL) / EDGE_FADE)
