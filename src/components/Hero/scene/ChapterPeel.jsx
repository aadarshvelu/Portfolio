import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ORDER } from '../config.js'
import { useLayout } from '../breakpoint.js'

const DEG = Math.PI / 180
const clamp01 = (x) => Math.min(1, Math.max(0, x))
const smoothstep = (x) => x * x * (3 - 2 * x)

const peelVert = /* glsl */ `
uniform float uPeel;
uniform float uWidth;
uniform float uHeight;
uniform float uCurlRadius;

varying vec2 vUv;
varying float vFoldDist;
varying float vCurlAngle;

void main() {
  vUv = uv;

  vec3 pos = vec3(position.x * uWidth, position.y * uHeight, 0.0);

  vec2 diagDir = normalize(vec2(uWidth, uHeight));
  vec2 foldTan = vec2(-diagDir.y, diagDir.x);

  float diagLen = length(vec2(uWidth, uHeight));
  float foldPos = -diagLen * 0.5 + uPeel * (diagLen + uCurlRadius * 3.14159);

  float across = dot(pos.xy, diagDir);
  float along  = dot(pos.xy, foldTan);
  float d = across - foldPos;
  vFoldDist = d;

  if (d < 0.0) {
    float absD = -d;
    float R = uCurlRadius;
    float theta = min(absD / R, 4.0);
    vCurlAngle = theta;

    float newAcross = foldPos + R * sin(theta);
    float newZ = R * (1.0 - cos(theta));

    pos.xy = diagDir * newAcross + foldTan * along;
    pos.z = newZ;
  } else {
    vCurlAngle = 0.0;
  }

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const peelFrag = /* glsl */ `
uniform sampler2D uSceneTexture;
uniform float uOverscan;
uniform float uOpacity;

varying vec2 vUv;
varying float vFoldDist;
varying float vCurlAngle;

float hash21(vec2 p) {
  p = fract(p * vec2(233.34, 851.74));
  p += dot(p, p + 23.45);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1, 0)), f.x),
    mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x),
    f.y
  );
}

void main() {
  if (gl_FrontFacing) {
    vec2 sceneUv = (vUv - 0.5) * uOverscan + 0.5;
    vec3 col = texture2D(uSceneTexture, sceneUv).rgb;
    float edgeShadow = smoothstep(20.0, 0.0, vFoldDist) * 0.15;
    col -= edgeShadow;
    gl_FragColor = vec4(col, uOpacity);
  } else {
    vec3 base = mix(vec3(0.886, 0.835, 0.714), vec3(0.847, 0.784, 0.659),
                    noise(vUv * 24.0));
    float n = noise(vUv * 48.0) * 0.04;
    vec3 col = base + n;
    float vig = smoothstep(0.0, 1.5, vCurlAngle) * 0.12;
    col -= vig;
    gl_FragColor = vec4(pow(col, vec3(2.2)), uOpacity);
  }
}
`

const shadowVert = /* glsl */ `
uniform float uWidth;
uniform float uHeight;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 pos = vec3(position.x * uWidth, position.y * uHeight, 0.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const shadowFrag = /* glsl */ `
uniform float uPeel;
uniform float uWidth;
uniform float uHeight;

varying vec2 vUv;

void main() {
  vec2 worldPos = (vUv - 0.5) * vec2(uWidth, uHeight);
  vec2 diagDir = normalize(vec2(uWidth, uHeight));
  float diagLen = length(vec2(uWidth, uHeight));
  float curlR = diagLen * 0.08;
  float foldPos = -diagLen * 0.5 + uPeel * (diagLen + curlR * 3.14159);

  float d = dot(worldPos, diagDir) - foldPos;
  float shadowRange = diagLen * 0.08;
  float shadow = smoothstep(-shadowRange, 0.0, d) * (1.0 - smoothstep(0.0, shadowRange * 0.15, d));
  shadow *= 0.4;

  gl_FragColor = vec4(0.0, 0.0, 0.0, shadow);
}
`

export default function PagePeel({ smoothed, start, end, capturedRef, children }) {
  const { peel: peelLayout } = useLayout()
  const peelDist = peelLayout.peelDist
  const overscan = peelLayout.overscan

  const groupRef = useRef()
  const peelMeshRef = useRef()
  const shadowMeshRef = useRef()
  const childrenRef = useRef()
  const wasPeeling = useRef(false)
  const fboRef = useRef(null)
  // Hysteresis: enter peel when sm > start, exit only when sm drops below start - HYST.
  // Prevents oscillation while exponential smoothing settles near the boundary.
  const PEEL_HYST = 0.008
  const isPeelingStable = useRef(false)

  const fwd = useMemo(() => new THREE.Vector3(), [])

  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1, 64, 64), [])

  const peelUniforms = useMemo(() => ({
    uPeel: { value: 0 },
    uOpacity: { value: 1 },
    uSceneTexture: { value: null },
    uOverscan: { value: overscan },
    uWidth: { value: 1 },
    uHeight: { value: 1 },
    uCurlRadius: { value: 1 },
  }), [])

  const shadowUniforms = useMemo(() => ({
    uPeel: { value: 0 },
    uWidth: { value: 1 },
    uHeight: { value: 1 },
  }), [])

  useEffect(() => () => fboRef.current?.dispose(), [])

  useFrame((state) => {
    const sm = smoothed.current ?? 0
    const peelT = clamp01((sm - start) / (end - start))

    const grp = groupRef.current
    if (!grp) return

    // Hysteresis gate: enter when sm crosses start, exit only when sm drops
    // below start - PEEL_HYST. Prevents the easing interpolation from flapping
    // the transition boundary while the smoothed value converges.
    if (!isPeelingStable.current && sm > start) {
      isPeelingStable.current = true
    } else if (isPeelingStable.current && sm < start - PEEL_HYST) {
      isPeelingStable.current = false
    }
    const isPeeling = isPeelingStable.current
    if (isPeeling && !wasPeeling.current) {
      const dpr = state.gl.getPixelRatio()
      const w = Math.floor(state.size.width * dpr)
      const h = Math.floor(state.size.height * dpr)

      if (!fboRef.current || fboRef.current.width !== w || fboRef.current.height !== h) {
        fboRef.current?.dispose()
        fboRef.current = new THREE.WebGLRenderTarget(w, h, {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          type: THREE.HalfFloatType,
        })
      }

      grp.visible = false
      const prevTarget = state.gl.getRenderTarget()
      const prevColorSpace = state.gl.outputColorSpace
      state.gl.outputColorSpace = THREE.LinearSRGBColorSpace
      state.gl.setRenderTarget(fboRef.current)
      state.gl.clear()
      state.gl.render(state.scene, state.camera)
      state.gl.setRenderTarget(prevTarget)
      state.gl.outputColorSpace = prevColorSpace
      peelUniforms.uSceneTexture.value = fboRef.current.texture
      if (capturedRef) capturedRef.current = true
    }
    if (!isPeeling && wasPeeling.current) {
      if (capturedRef) capturedRef.current = false
    }
    wasPeeling.current = isPeeling

    grp.visible = isPeeling
    if (!isPeeling) return

    const cam = state.camera

    cam.getWorldDirection(fwd)
    grp.position.copy(cam.position).addScaledVector(fwd, peelDist)
    grp.quaternion.copy(cam.quaternion)

    const h = 2 * peelDist * Math.tan(cam.fov * DEG / 2) * overscan
    const w = h * state.size.width / state.size.height
    const diag = Math.sqrt(w * w + h * h)
    const curlR = diag * peelLayout.curlRadiusFrac

    const peelVal = smoothstep(clamp01(peelT))
    const peelDone = peelVal >= 0.999
    if (peelMeshRef.current) peelMeshRef.current.visible = !peelDone
    if (shadowMeshRef.current) shadowMeshRef.current.visible = !peelDone

    peelUniforms.uPeel.value = peelVal
    peelUniforms.uOverscan.value = overscan
    peelUniforms.uWidth.value = w
    peelUniforms.uHeight.value = h
    peelUniforms.uCurlRadius.value = curlR

    shadowUniforms.uPeel.value = peelVal
    shadowUniforms.uWidth.value = w
    shadowUniforms.uHeight.value = h
  })

  return (
    <group ref={groupRef} visible={false}>
      <group ref={childrenRef} renderOrder={ORDER.nextChapter}>
        {children}
      </group>

      <mesh ref={shadowMeshRef} renderOrder={ORDER.peelShadow} position={[0, 0, -1]}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          vertexShader={shadowVert}
          fragmentShader={shadowFrag}
          uniforms={shadowUniforms}
          transparent
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={peelMeshRef} geometry={geo} renderOrder={ORDER.peel}>
        <shaderMaterial
          vertexShader={peelVert}
          fragmentShader={peelFrag}
          uniforms={peelUniforms}
          side={THREE.DoubleSide}
          transparent
          depthTest
          depthWrite
        />
      </mesh>
    </group>
  )
}
