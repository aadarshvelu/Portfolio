export const neonBannerVertex = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const neonBannerFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uTint;
  uniform float uOpacity;

  varying vec2 vUv;

  // Rounded box signed distance — positive outside, negative inside
  float sdRoundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + vec2(r);
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  }

  void main() {
    // Panel shape mask — rounded corners, slightly inset from UV edges
    float panelDist = sdRoundedBox(vUv - vec2(0.5), vec2(0.48, 0.42), 0.12);
    float panelMask = 1.0 - smoothstep(-0.003, 0.002, panelDist);

    // Neon edge glow — sharp bright border
    float borderGlow = 1.0 - smoothstep(0.0, 0.015, abs(panelDist));

    // Top & bottom rope attachment nubs (two small notches at top corners)
    float leftNub = 1.0 - smoothstep(0.01, 0.02, length(vUv - vec2(0.12, 0.92)));
    float rightNub = 1.0 - smoothstep(0.01, 0.02, length(vUv - vec2(0.88, 0.92)));

    // CRT scanlines (subtle)
    float scan = 0.94 + 0.06 * sin(vUv.y * 500.0 + uTime * 2.0);

    // Subtle flicker
    float flicker = 0.97 + 0.03 * sin(uTime * 9.0 + 2.0);

    // Dark panel background (matches the scene theme tint, dimmed)
    vec3 panelBg = uTint * 0.08;
    // Inner gradient — top slightly brighter
    panelBg += uTint * 0.04 * vUv.y;

    // Neon layer
    vec3 neonColor = uTint * borderGlow * 1.8 * scan * flicker;
    neonColor += uTint * (leftNub + rightNub) * 2.0;

    vec3 finalColor = panelBg + neonColor;

    float alpha = panelMask * 0.94 * uOpacity;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;
