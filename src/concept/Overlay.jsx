import React from "react";

/**
 * Overlay — DOM-based post layer: animated film grain painted over the canvas.
 * Kept in CSS so it costs nothing on the GPU render budget. Radial vignette
 * removed (read as a dark ellipse on top of the room).
 */
export default function Overlay() {
  return <div className="concept-grain" />;
}
