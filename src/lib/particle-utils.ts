/**
 * Utility functions for particle animation calculations.
 */

export type EntranceMode = "rain" | "spiral" | "explode" | "draw" | "wave";

/** Generate starting positions based on entrance mode. */
export function generateStartPositions(
  count: number,
  mode: EntranceMode,
  targetPositions: Float32Array,
): Float32Array {
  const positions = new Float32Array(count * 3);

  switch (mode) {
    case "rain":
      for (let i = 0; i < count; i++) {
        const tx = targetPositions[i * 3];
        positions[i * 3] = tx + (Math.random() - 0.5) * 3;
        positions[i * 3 + 1] = 20 + Math.random() * 8;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
      }
      break;

    case "spiral":
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 8 + Math.random() * 0.5;
        const radius = 12 + Math.random() * 4;
        const ty = targetPositions[i * 3 + 1];
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = ty + (Math.random() - 0.5) * 3;
        positions[i * 3 + 2] = Math.sin(angle) * radius;
      }
      break;

    case "explode":
      // Start at center, particles are already at the portrait center
      for (let i = 0; i < count; i++) {
        const tx = targetPositions[i * 3];
        const ty = targetPositions[i * 3 + 1];
        // Start at portrait center
        positions[i * 3] = 0 + (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 1] = 6.4 + (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      }
      break;

    case "draw":
      // Start at each particle's target but invisible (scale 0), no spatial offset
      for (let i = 0; i < count; i++) {
        positions[i * 3] = targetPositions[i * 3];
        positions[i * 3 + 1] = targetPositions[i * 3 + 1];
        positions[i * 3 + 2] = targetPositions[i * 3 + 2];
      }
      break;

    case "wave":
      // Start slightly below target, will pop up as wave passes
      for (let i = 0; i < count; i++) {
        positions[i * 3] = targetPositions[i * 3];
        positions[i * 3 + 1] = targetPositions[i * 3 + 1] - 2 - Math.random() * 2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      }
      break;
  }

  return positions;
}

/** Compute per-particle stagger offsets based on entrance mode. */
export function computeStaggerOffsets(
  targetPositions: Float32Array,
  count: number,
  mode: EntranceMode,
): Float32Array {
  const offsets = new Float32Array(count);

  let xMin = Infinity, xMax = -Infinity;
  let yMin = Infinity, yMax = -Infinity;
  for (let i = 0; i < count; i++) {
    const x = targetPositions[i * 3];
    const y = targetPositions[i * 3 + 1];
    if (x < xMin) xMin = x;
    if (x > xMax) xMax = x;
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
  }
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  for (let i = 0; i < count; i++) {
    const x = targetPositions[i * 3];
    const y = targetPositions[i * 3 + 1];
    const nx = (x - xMin) / xRange;
    const ny = (y - yMin) / yRange;

    switch (mode) {
      case "rain":
        // Top lands first, cascading down
        offsets[i] = (1 - ny) * 0.5 + Math.random() * 0.1;
        break;
      case "spiral":
        // Outer spiral lands first, tightening inward
        offsets[i] = (i / count) * 0.6 + Math.random() * 0.05;
        break;
      case "explode":
        // Particles closest to center arrive first
        const dx = nx - 0.5;
        const dy = ny - 0.5;
        offsets[i] = Math.sqrt(dx * dx + dy * dy) * 0.7 + Math.random() * 0.05;
        break;
      case "draw":
        // Top-to-bottom, left-to-right like pen drawing
        offsets[i] = (1 - ny) * 0.6 + nx * 0.2 + Math.random() * 0.02;
        break;
      case "wave":
        // Left-to-right sweep
        offsets[i] = nx * 0.7 + Math.random() * 0.05;
        break;
    }
  }
  return offsets;
}

/** Generate random dispersion directions (unit vectors). */
export function generateDisperseDirections(count: number): Float32Array {
  const dirs = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    dirs[i * 3] = Math.sin(phi) * Math.cos(theta);
    dirs[i * 3 + 1] = Math.sin(phi) * Math.sin(theta);
    dirs[i * 3 + 2] = Math.cos(phi);
  }
  return dirs;
}

/** Clamp value between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
