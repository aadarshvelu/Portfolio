export const hologramBaseVertex = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const hologramBaseFragment = /* glsl */ `
  #define PI 3.14159265359
  #define TAU 6.28318530718

  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uColorPrimary;
  uniform vec3 uColorSecondary;

  varying vec2 vUv;

  // ---- helpers ----
  float ring(float dist, float radius, float thickness) {
    return 1.0 - smoothstep(0.0, thickness, abs(dist - radius));
  }

  float arc(float angle, float dist, float radius, float thickness, float arcStart, float arcLen) {
    float r = ring(dist, radius, thickness);
    // Normalize angle to 0..TAU
    float a = mod(angle, TAU);
    float s = mod(arcStart, TAU);
    float e = mod(s + arcLen, TAU);
    float inArc;
    if (s < e) {
      inArc = step(s, a) * step(a, e);
    } else {
      inArc = step(s, a) + step(a, e);
    }
    return r * inArc;
  }

  float tickMarks(float angle, float dist, float radius, float thickness, float count, float tickWidth) {
    float r = ring(dist, radius, thickness);
    float segment = TAU / count;
    float a = mod(angle, segment);
    float tick = 1.0 - smoothstep(0.0, tickWidth, a);
    tick += 1.0 - smoothstep(segment - tickWidth, segment, a);
    return r * min(tick, 1.0);
  }

  // Dashed ring: segments with gaps
  float dashedRing(float angle, float dist, float radius, float thickness, float segments, float gapRatio) {
    float r = ring(dist, radius, thickness);
    float seg = TAU / segments;
    float a = mod(angle, seg) / seg;
    float dash = smoothstep(0.0, 0.02, a) * (1.0 - smoothstep(1.0 - gapRatio, 1.0 - gapRatio + 0.02, a));
    return r * dash;
  }

  void main() {
    vec2 center = vUv - 0.5;
    float dist = length(center);
    float angle = atan(center.y, center.x) + PI; // 0..TAU

    float t = uTime;
    float result = 0.0;
    vec3 col = vec3(0.0);

    // ---- Glowing center core ----
    float core = exp(-dist * 18.0) * 1.2;
    col += uColorPrimary * core;

    // ---- Inner solid ring (thin, bright) ----
    result = ring(dist, 0.06, 0.003);
    col += uColorPrimary * result * 0.8;

    // ---- Rotating dashed ring 1 ----
    float a1 = angle + t * 0.8;
    result = dashedRing(a1, dist, 0.10, 0.004, 8.0, 0.3);
    col += uColorPrimary * result * 0.7;

    // ---- Tick marks ring (like a compass/dial) ----
    result = tickMarks(angle, dist, 0.15, 0.006, 36.0, 0.03);
    col += uColorSecondary * result * 0.4;

    // Major ticks (bigger, fewer)
    result = tickMarks(angle, dist, 0.15, 0.012, 4.0, 0.04);
    col += uColorPrimary * result * 0.6;

    // ---- Segmented arc ring 2 (counter-rotating) ----
    float a2 = angle - t * 0.5;
    result = dashedRing(a2, dist, 0.20, 0.003, 6.0, 0.4);
    col += uColorPrimary * result * 0.6;

    // ---- Mid ring (solid, thin) ----
    result = ring(dist, 0.24, 0.002);
    col += uColorSecondary * result * 0.35;

    // ---- Rotating arc segments (HUD-style partial arcs) ----
    float a3 = angle + t * 0.3;
    result = arc(a3, dist, 0.28, 0.005, 0.0, 1.2);
    col += uColorPrimary * result * 0.7;
    result = arc(a3, dist, 0.28, 0.005, PI, 0.8);
    col += uColorPrimary * result * 0.5;
    result = arc(a3, dist, 0.28, 0.005, PI * 1.5, 0.5);
    col += uColorSecondary * result * 0.4;

    // ---- Fine tick ring (outer dial) ----
    result = tickMarks(angle - t * 0.15, dist, 0.32, 0.005, 60.0, 0.015);
    col += uColorSecondary * result * 0.3;

    // Major outer ticks
    result = tickMarks(angle, dist, 0.32, 0.01, 12.0, 0.025);
    col += uColorPrimary * result * 0.5;

    // ---- Outer dashed ring (fast rotating) ----
    float a4 = angle + t * 1.2;
    result = dashedRing(a4, dist, 0.37, 0.003, 12.0, 0.25);
    col += uColorPrimary * result * 0.5;

    // ---- Outermost ring (solid, faint) ----
    result = ring(dist, 0.42, 0.002);
    col += uColorSecondary * result * 0.25;

    // ---- Slow rotating accent arcs (outermost) ----
    float a5 = angle - t * 0.2;
    result = arc(a5, dist, 0.45, 0.004, 0.3, 1.8);
    col += uColorPrimary * result * 0.4;
    result = arc(a5, dist, 0.45, 0.004, PI + 0.5, 1.5);
    col += uColorSecondary * result * 0.3;

    // ---- Radial lines (cross-hairs / grid) ----
    for (int i = 0; i < 4; i++) {
      float lineAngle = float(i) * PI / 2.0 + t * 0.1;
      float angleDiff = abs(mod(angle - lineAngle + PI, TAU) - PI);
      float line = (1.0 - smoothstep(0.0, 0.008, angleDiff))
                 * smoothstep(0.08, 0.12, dist)
                 * (1.0 - smoothstep(0.40, 0.46, dist));
      col += uColorSecondary * line * 0.2;
    }

    // ---- Subtle pulsing glow across the whole disc ----
    float discGlow = exp(-dist * 5.0) * (0.04 + 0.02 * sin(t * 2.0));
    col += uColorPrimary * discGlow;

    // ---- Overall vignette: fade out at edge of disc ----
    float vignette = 1.0 - smoothstep(0.35, 0.48, dist);
    col *= mix(vignette, 1.0, 0.3);

    float alpha = length(col) * uOpacity;
    alpha = min(alpha, 1.0);

    gl_FragColor = vec4(col * 1.5, alpha);
  }
`;
