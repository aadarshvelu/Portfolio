import { useMemo } from 'react'
import { DESIGN_W, DESIGN_H, ORDER } from '../config.js'
import { useFade } from '../../../hooks/useFade.js'

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

// Slate radial ground + 3 nebula blobs — ported from the prototype's CSS.
const fragmentShader = /* glsl */ `
varying vec2 vUv;
uniform float uNebula;

vec3 stageGradient(vec2 uv) {
  vec3 cLight = vec3(0.243, 0.306, 0.376); // #3e4e60
  vec3 cMid   = vec3(0.173, 0.227, 0.290); // #2c3a4a
  vec3 cDeepA = vec3(0.145, 0.188, 0.239); // #25303d
  vec3 cDeep  = vec3(0.106, 0.145, 0.188); // #1b2530
  float d = length((uv - vec2(0.5, 0.58)) / vec2(0.70, 0.55));
  vec3 col = cLight;
  col = mix(col, cMid,   smoothstep(0.0, 0.45, d));
  col = mix(col, cDeepA, smoothstep(0.45, 0.78, d));
  col = mix(col, cDeep,  smoothstep(0.78, 1.0, d));
  return col;
}

float blob(vec2 uv, vec2 c, vec2 r) {
  return 1.0 - smoothstep(0.0, 1.0, length((uv - c) / r));
}

void main() {
  vec3 col = stageGradient(vUv);
  vec3 neb = vec3(0.0);
  neb += vec3(0.275, 0.353, 0.627) * 0.30 * blob(vUv, vec2(0.62, 0.78), vec2(0.55, 0.38));
  neb += vec3(0.353, 0.275, 0.588) * 0.18 * blob(vUv, vec2(0.28, 0.45), vec2(0.45, 0.30));
  neb += vec3(0.196, 0.314, 0.549) * 0.12 * blob(vUv, vec2(0.80, 0.20), vec2(0.70, 0.50));
  col += neb * uNebula;
  gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0); // sRGB -> linear
}
`

export default function Background({ on }) {
  const uniforms = useMemo(() => ({ uNebula: { value: 0 } }), [])
  useFade(uniforms.uNebula, on, { prop: 'value', duration: 2.2, to: 1 })

  return (
    <mesh renderOrder={ORDER.background} position={[0, 0, 0]}>
      <planeGeometry args={[DESIGN_W, DESIGN_H]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}
