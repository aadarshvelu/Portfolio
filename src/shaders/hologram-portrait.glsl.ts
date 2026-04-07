export const hologramPortraitVertex = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const hologramPortraitFragment = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform vec3 uGlowColor;
  uniform float uGlowIntensity;
  uniform float uScanlineY;
  uniform float uBootProgress;
  uniform float uFlicker;

  varying vec2 vUv;

  void main() {
    // 1. Sample and invert: dark lines on white -> bright strokes
    float raw = 1.0 - texture2D(uTexture, vUv).r;

    // 2. Threshold to isolate clean strokes
    float edge = smoothstep(0.25, 0.55, raw);

    // 3. Boot-up scan mask: reveal from bottom (uv.y=0) to top (uv.y=1)
    //    Everything below scanlineY is visible
    float scanMask = 1.0 - smoothstep(uScanlineY - 0.08, uScanlineY, vUv.y);

    // 4. Bright scan-line edge (the leading edge of the reveal)
    float scanEdgeDist = abs(vUv.y - uScanlineY);
    float scanEdge = exp(-scanEdgeDist * 40.0) * step(0.01, uScanlineY) * step(uScanlineY, 0.99);

    // 5. Hologram flicker
    float flicker = uFlicker;

    // 6. Horizontal scanlines (CRT / hologram aesthetic)
    float scanlines = 0.92 + 0.08 * sin(vUv.y * 600.0 + uTime * 2.0);

    // 7. Slight chromatic-style edge brightening at stroke edges
    float edgeGlow = smoothstep(0.15, 0.25, raw) * (1.0 - smoothstep(0.25, 0.55, raw));
    float strokeWithGlow = edge + edgeGlow * 0.5;

    // 8. Compose final intensity
    float intensity = strokeWithGlow * scanMask * flicker * scanlines * uGlowIntensity;

    // Add the scan-line sweep glow
    intensity += scanEdge * 2.0 * flicker * uGlowIntensity;

    // Apply boot progress overall fade
    intensity *= uBootProgress;

    vec3 color = uGlowColor * intensity;

    // Alpha: transparent where nothing glows
    float alpha = smoothstep(0.01, 0.1, intensity);

    gl_FragColor = vec4(color, alpha);
  }
`;
