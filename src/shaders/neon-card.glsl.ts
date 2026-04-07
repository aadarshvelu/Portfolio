export const neonCardVertex = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const neonCardFragment = /* glsl */ `
  #define PI 3.14159265359

  uniform float uTime;
  uniform vec3 uTint;
  uniform float uOpacity;
  uniform int uCardType; // 0 = experience, 1 = projects, 2 = about

  varying vec2 vUv;

  // ---- drawing primitives ----

  float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  }

  float sdCircle(vec2 p, float r) {
    return length(p) - r;
  }

  float line(float v, float target, float thickness) {
    return 1.0 - smoothstep(0.0, thickness, abs(v - target));
  }

  float rect(vec2 uv, vec2 pos, vec2 size) {
    vec2 d = abs(uv - pos) - size;
    float dist = length(max(d, 0.0));
    return 1.0 - smoothstep(0.0, 0.005, dist);
  }

  float rectOutline(vec2 uv, vec2 pos, vec2 size, float thickness) {
    float outer = sdBox(uv - pos, size);
    float inner = sdBox(uv - pos, size - vec2(thickness));
    return 1.0 - smoothstep(0.0, 0.004, max(outer, -inner));
  }

  float circle(vec2 uv, vec2 pos, float r, float thickness) {
    float d = abs(length(uv - pos) - r);
    return 1.0 - smoothstep(0.0, thickness, d);
  }

  // ---- corner brackets (HUD targeting frame) ----
  float cornerBrackets(vec2 uv, vec2 size, float len, float thickness) {
    float result = 0.0;
    // Four corners
    for (int cx = 0; cx < 2; cx++) {
      for (int cy = 0; cy < 2; cy++) {
        vec2 corner = vec2(
          cx == 0 ? -size.x : size.x,
          cy == 0 ? -size.y : size.y
        );
        vec2 p = uv - vec2(0.5) - corner;
        // Horizontal arm
        float hx = cx == 0 ? 1.0 : -1.0;
        float hy = cy == 0 ? 1.0 : -1.0;
        float h = step(0.0, p.x * hx) * step(abs(p.x), len) * (1.0 - smoothstep(0.0, thickness, abs(p.y)));
        float v = step(0.0, p.y * hy) * step(abs(p.y), len) * (1.0 - smoothstep(0.0, thickness, abs(p.x)));
        result = max(result, max(h, v));
      }
    }
    return result;
  }

  // ---- bar graph ----
  float bar(vec2 uv, float y, float fill, float width, float height) {
    vec2 barPos = vec2(0.5, y);
    vec2 barSize = vec2(width, height);
    float bg = rectOutline(uv, barPos, barSize, 0.003);
    // Fill portion
    float fillBox = rect(uv,
      vec2(0.5 - width + width * fill, y),
      vec2(width * fill, height - 0.003)
    );
    return max(bg * 0.4, fillBox);
  }

  // ---- hexagon ----
  float sdHexagon(vec2 p, float r) {
    p = abs(p);
    float d = dot(p, normalize(vec2(1.0, 1.73)));
    return max(d, p.x) - r;
  }

  float hexOutline(vec2 uv, vec2 pos, float r, float thickness) {
    float d = sdHexagon(uv - pos, r);
    return 1.0 - smoothstep(0.0, thickness, abs(d));
  }

  // ---- waveform ----
  float waveform(vec2 uv, float y, float xStart, float xEnd, float amp, float freq, float offset) {
    if (uv.x < xStart || uv.x > xEnd) return 0.0;
    float wave = y + amp * sin((uv.x - xStart) * freq + offset);
    return 1.0 - smoothstep(0.0, 0.006, abs(uv.y - wave));
  }

  // ---- dot grid ----
  float dotGrid(vec2 uv, vec2 offset, float spacing, float radius) {
    vec2 cell = mod(uv - offset, vec2(spacing)) - vec2(spacing * 0.5);
    return 1.0 - smoothstep(radius - 0.003, radius, length(cell));
  }

  // ---- card frame + mild top/bottom accents ----
  float cardContent(vec2 uv, float t) {
    float result = 0.0;

    // Corner brackets + outer frame
    result += cornerBrackets(uv, vec2(0.42, 0.44), 0.08, 0.006) * 1.4;
    result += rectOutline(uv, vec2(0.5), vec2(0.44, 0.46), 0.002) * 0.35;

    // --- TOP accent zone (y 0.78 - 0.90) ---
    // Thin line with diamond terminators
    result += line(uv.y, 0.82, 0.002) * step(0.20, uv.x) * step(uv.x, 0.80) * 0.4;
    // Diamond shapes at line ends
    float d1 = abs(uv.x - 0.18) + abs(uv.y - 0.82);
    float d2 = abs(uv.x - 0.82) + abs(uv.y - 0.82);
    result += (1.0 - smoothstep(0.012, 0.016, d1)) * 0.8;
    result += (1.0 - smoothstep(0.012, 0.016, d2)) * 0.8;
    // Animated pulsing center dot
    float pulse = 0.004 + 0.002 * sin(t * 2.5);
    result += (1.0 - smoothstep(pulse, pulse + 0.004, length(uv - vec2(0.5, 0.87)))) * 0.6;

    // --- BOTTOM accent zone (y 0.08 - 0.22) ---
    // Thin line
    result += line(uv.y, 0.19, 0.002) * step(0.20, uv.x) * step(uv.x, 0.80) * 0.4;
    // 3 small progress pips (animated fill)
    for (int i = 0; i < 3; i++) {
      float px = 0.35 + float(i) * 0.15;
      float fill = 0.5 + 0.5 * sin(t * 1.8 + float(i) * 1.5);
      result += rectOutline(uv, vec2(px, 0.12), vec2(0.04, 0.015), 0.002) * 0.4;
      result += rect(uv, vec2(px - 0.04 + 0.04 * fill, 0.12), vec2(0.04 * fill, 0.012)) * 0.5;
    }
    // Diamond terminators at bottom line ends
    float d3 = abs(uv.x - 0.18) + abs(uv.y - 0.19);
    float d4 = abs(uv.x - 0.82) + abs(uv.y - 0.19);
    result += (1.0 - smoothstep(0.012, 0.016, d3)) * 0.8;
    result += (1.0 - smoothstep(0.012, 0.016, d4)) * 0.8;

    return result;
  }

  void main() {
    float t = uTime;

    // Card frame + mild accents
    float content = cardContent(vUv, t);

    // Panel shape mask
    float panelDist = sdBox(vUv - vec2(0.5), vec2(0.43, 0.45));
    float panelMask = 1.0 - smoothstep(-0.005, 0.002, panelDist);

    // Neon border — bright edge of the panel
    float borderGlow = (1.0 - smoothstep(0.0, 0.015, abs(panelDist))) * 1.8;

    // Corner bracket glow boost
    float brackets = cornerBrackets(vUv, vec2(0.42, 0.44), 0.08, 0.006);

    // CRT scanlines (subtle)
    float scan = 0.94 + 0.06 * sin(vUv.y * 400.0 + t * 2.5);

    // Subtle flicker
    float flicker = 0.97 + 0.03 * sin(t * 9.0 + 2.0);

    // --- Solid dark panel background ---
    vec3 panelBg = vec3(0.02, 0.06, 0.10); // dark blue-black
    // Subtle inner gradient (slightly brighter at top)
    panelBg += vec3(0.01, 0.02, 0.04) * vUv.y;

    // --- Neon content layer ---
    vec3 neonColor = uTint * content * scan * flicker * 2.0;
    neonColor += uTint * borderGlow * scan;
    neonColor += uTint * brackets * 1.5;

    // Compose: dark panel base + bright neon on top
    vec3 finalColor = panelBg + neonColor;

    // Alpha: solid panel with slight edge softness
    float alpha = panelMask * 0.92 * uOpacity;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;
