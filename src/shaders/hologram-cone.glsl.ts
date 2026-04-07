export const hologramConeVertex = /* glsl */ `
  varying vec2 vUv;
  varying float vY;

  void main() {
    vUv = uv;
    vY = position.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const hologramConeFragment = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uColor;

  varying vec2 vUv;
  varying float vY;

  void main() {
    // Vertical falloff: bright at base (bottom), fading upward
    float falloff = pow(1.0 - vUv.y, 3.0);

    // Radial falloff: brighter in center
    float distFromCenter = abs(vUv.x - 0.5) * 2.0;
    float radial = 1.0 - smoothstep(0.0, 1.0, distFromCenter);
    radial = pow(radial, 1.5);

    // Animated shimmer
    float shimmer = 0.85 + 0.15 * sin(uTime * 3.0 + vUv.y * 15.0);

    // Rising light streaks
    float streak = sin(vUv.y * 40.0 - uTime * 4.0) * 0.5 + 0.5;
    streak = pow(streak, 8.0) * 0.3;

    float alpha = (falloff * radial * shimmer + streak * radial * falloff) * uOpacity;

    gl_FragColor = vec4(uColor, alpha * 0.12);
  }
`;
