import { useMemo } from 'react'
import { Uniform } from 'three'
import { Effect } from 'postprocessing'

// CRT post-process: gentle barrel UV bow + RGB-split aberration + scanlines +
// grain + vignette, masked to a soft rounded-rectangle screen shape (curvy
// CRT corners). `time`, `resolution`, `inputBuffer` are built-in.
const fragment = /* glsl */ `
uniform float barrel;
uniform float aberration;
uniform float scanline;
uniform float vignetteAmt;
uniform float grainAmt;
uniform float corner;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void mainUv(inout vec2 uv) {
  vec2 cc = uv - 0.5;
  float dist = dot(cc, cc);
  uv += cc * dist * barrel;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 dir = uv - 0.5;

  // chromatic aberration — split R/B outward from centre
  float r = texture2D(inputBuffer, uv - dir * aberration).r;
  float b = texture2D(inputBuffer, uv + dir * aberration).b;
  vec3 col = vec3(r, inputColor.g, b);

  // scanlines
  float sl = 0.5 - 0.5 * cos(uv.y * resolution.y * 1.4);
  col *= 1.0 - scanline * sl;

  // grain
  col += (hash(uv * resolution + time) - 0.5) * grainAmt;

  // vignette
  col *= 1.0 - vignetteAmt * dot(dir, dir) * 2.0;

  // rounded-rectangle screen mask -> soft curvy CRT corners.
  // aspect-corrected so the corner radius is circular, not elliptical.
  float aspect = resolution.x / resolution.y;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  vec2 halfSize = vec2(0.5 * aspect, 0.5);
  vec2 d = abs(p) - halfSize + corner;
  float sdf = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - corner;
  float mask = 1.0 - smoothstep(0.0, 0.01, sdf);

  outputColor = vec4(col * mask, 1.0);
}
`

class CrtEffectImpl extends Effect {
  constructor() {
    super('CrtEffect', fragment, {
      uniforms: new Map([
        ['barrel', new Uniform(0.1)],
        ['aberration', new Uniform(0.0038)],
        ['scanline', new Uniform(0.16)],
        ['vignetteAmt', new Uniform(0.55)],
        ['grainAmt', new Uniform(0.05)],
        ['corner', new Uniform(0.07)], // corner radius (fraction of screen height)
      ]),
    })
  }
}

export default function CrtEffect() {
  const effect = useMemo(() => new CrtEffectImpl(), [])
  return <primitive object={effect} dispose={null} />
}
