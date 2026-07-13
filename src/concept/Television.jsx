import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import AssetModel from "./AssetModel";
import { ASSET_URLS } from "./config/sceneConfig";
import { useLayout } from "./layoutContext";
import { TRANSITION_CONFIG } from "./config/transitionConfig";
import { sanitizeText } from "./sanitizeText";

// Load the Hero's fonts as CSS web fonts so the 2D canvas can draw with them.
import "@fontsource/anton/400.css";
import "@fontsource/dm-mono/400.css";
import "@fontsource/cormorant-garamond/400-italic.css";

/**
 * A late-night broadcast already in progress. The CRT plays chapter title cards
 * ONE at a time, each held ~4.5s like a paused documentary frame, then dissolving
 * into the next over ~1.2s (easeInOutCubic) with the signal destabilizing.
 *
 * The title text is NOT a separate layer — it is PAINTED INTO THE SIGNAL: drawn
 * to a canvas texture and composited inside the CRT shader, so scanlines, the
 * curved-glass distortion, phosphor glow and flicker all run through it. It reads
 * like text on a real 1960s television, fused with the picture.
 *
 * Each frame carries a vibrant color that glows the whole screen and eases the
 * room's ambient reflection (desk, paper, pen, clock, wall) toward it.
 */
// One consistent typeface + weight across every frame (DM Mono 400), sizes ~half.
const FRAMES = [
  {
    color: [0.20, 0.42, 1.0], // THE ORIGIN — deep / cool blue
    lines: [
      { t: "I.   THE ORIGIN", fam: "DM Mono", size: 0.034, y: 0.045, ls: 0.2, a: 1.0 },
      { t: "2018 - 2020", fam: "DM Mono", size: 0.02, y: -0.07, ls: 0.26, a: 0.72 },
    ],
  },
  {
    color: [1.0, 0.86, 0.6], // FIRST LIGHT — warm cream
    lines: [
      { t: "FIRST LIGHT", fam: "DM Mono", size: 0.042, y: 0.045, ls: 0.16, a: 1.0 },
      { t: "before anyone was watching", fam: "DM Mono", size: 0.022, y: -0.075, ls: 0.06, a: 0.82 },
    ],
  },
  {
    color: [1.0, 0.6, 0.18], // THE UPGRADE — amber
    lines: [
      { t: "II.   THE UPGRADE", fam: "DM Mono", size: 0.032, y: 0.045, ls: 0.2, a: 1.0 },
      { t: "2020 - 2023", fam: "DM Mono", size: 0.02, y: -0.07, ls: 0.26, a: 0.72 },
    ],
  },
  {
    color: [0.42, 0.66, 0.42], // 50,000 RESUMES — desaturated office green
    lines: [
      { t: "50,000 RESUMES", fam: "DM Mono", size: 0.038, y: 0.05, ls: 0.12, a: 1.0 },
      { t: "ONE DECISION", fam: "DM Mono", size: 0.024, y: -0.07, ls: 0.3, a: 0.85 },
    ],
  },
  {
    color: [0.92, 0.72, 0.3], // THE BOARDROOM — deep gold / bronze
    lines: [{ t: "III.   THE BOARDROOM", fam: "DM Mono", size: 0.03, y: 0.0, ls: 0.18, a: 1.0 }],
  },
  {
    color: [1.0, 0.55, 0.24], // CONTACT — warm orange / tungsten
    lines: [{ t: "THE DIRECTOR TAKES CALLS", fam: "DM Mono", size: 0.03, y: 0.0, ls: 0.18, a: 1.0 }],
  },
  {
    color: [1.0, 0.9, 0.74], // warm cream
    lines: [
      { t: "AI HELPED WRITE THE CODE.", fam: "DM Mono", size: 0.028, y: 0.05, ls: 0.1, a: 0.95 },
      { t: "THE CREATIVITY IS MINE.", fam: "DM Mono", size: 0.028, y: -0.06, ls: 0.1, a: 1.0 },
    ],
  },
];
const HOLD = 4.5;
const TRANS = 1.2;
const CYCLE = HOLD + TRANS;
const TEX_W = 1024;
const TEX_H = 768;

const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

const ScreenMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uWake: { value: 0.5 },
    uOpacity: { value: 1 },
    uReveal: { value: 0 },
    uInstab: { value: 0 },
    uTint: { value: new THREE.Color(0.2, 0.4, 1.0) },
    uText: { value: null },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    precision highp float;
    varying vec2 vUv;
    uniform float uTime;
    uniform float uWake;
    uniform float uOpacity;
    uniform float uReveal;
    uniform float uInstab;
    uniform vec3 uTint;
    uniform sampler2D uText;

    float hash(vec2 p){ p=fract(p*vec2(123.34,345.45)); p+=dot(p,p+34.345); return fract(p.x*p.y); }
    float sdRoundRect(vec2 p, vec2 b, float r){ vec2 q=abs(p)-b+r; return length(max(q,0.0))+min(max(q.x,q.y),0.0)-r; }

    void main() {
      float lock = uReveal * (1.0 - uReveal) * 4.0;
      float inst = max(uInstab, lock);

      vec2 cc = vUv - 0.5;
      float r2 = dot(cc, cc);
      vec2 uv = vUv + cc * r2 * 0.16; // subtle barrel distortion (curved glass)

      // Signal drift — a little always, more while changing frames.
      float band = floor(uv.y * 18.0);
      uv.x += step(0.95, hash(vec2(band, floor(uTime*2.0)))) * (hash(vec2(band, floor(uTime*7.0)))-0.5) * 0.04;
      uv.x += inst * (hash(vec2(band, floor(uTime*30.0)))-0.5) * 0.05;

      // Vibrant phosphor field glowing in the current broadcast color.
      float n = hash(uv * vec2(210.0,150.0) + floor(uTime*24.0));
      vec3 col = uTint * (0.78 + 0.42*n);
      col += uTint * inst * 0.35 * n;

      // ---- Paint the broadcast TEXT into the signal (curves + drifts with it) ----
      vec4 txt = texture2D(uText, vec2(uv.x, uv.y));
      col = col * (1.0 - txt.a) + txt.rgb * 1.35 * txt.a; // bright phosphor core + dark halo

      // Scanlines + shadow-mask triads run THROUGH the text.
      col *= 0.82 + 0.18*sin(uv.y*900.0 + inst*sin(uTime*12.0)*5.0);
      float tri = mod(floor(vUv.x*760.0), 3.0);
      vec3 m3 = vec3(0.8);
      if (tri<1.0) m3.r=1.0; else if (tri<2.0) m3.g=1.0; else m3.b=1.0;
      col *= mix(vec3(1.0), m3, 0.14);

      // Gentle tube vignette.
      float vig = smoothstep(0.94, 0.36, length(cc*vec2(1.05,1.25)));
      col *= mix(0.55, 1.0, vig);

      // Phosphor bloom (text glows).
      col += col*col*0.18;

      // Lock shimmer + brightness drift on a frame change.
      col.r += lock * 0.10 * sin(uv.y*320.0 + uTime*22.0);
      col.b += lock * 0.10 * sin(uv.y*320.0 - uTime*22.0);
      col *= 1.0 - inst*0.18*sin(uTime*9.0);

      // Mild flicker.
      col *= (0.96 + 0.04*sin(uTime*40.0)) * uWake;

      float d = sdRoundRect(vUv - 0.5, vec2(0.5), 0.11);
      float mask = smoothstep(0.012, -0.004, d);
      gl_FragColor = vec4(col, mask * uOpacity);
    }
  `,
};

function makeCurvedScreen(w, h, bulge, segX = 48, segY = 36) {
  const geo = new THREE.PlaneGeometry(w, h, segX, segY);
  const pos = geo.attributes.position;
  const hw = w / 2;
  const hh = h / 2;
  for (let i = 0; i < pos.count; i++) {
    const nx = pos.getX(i) / hw;
    const ny = pos.getY(i) / hh;
    pos.setZ(i, bulge * (1 - nx * nx) * (1 - ny * ny));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

// Screen units → canvas pixels.
const PX = TEX_H / 0.745;

function drawFrame(ctx, frame, alpha) {
  if (alpha <= 0.001) return;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const ln of frame.lines) {
    const px = ln.size * PX;
    const cx = TEX_W / 2;
    const cy = TEX_H / 2 - (ln.y / 0.3725) * (TEX_H / 2);
    ctx.font = `${ln.italic ? "italic " : ""}400 ${px}px "${ln.fam}", sans-serif`;
    ctx.letterSpacing = `${(ln.ls || 0) * px}px`;
    ctx.globalAlpha = alpha * (ln.a ?? 1);
    // Soft dark phosphor halo (separates the text from any vibrant frame color).
    ctx.shadowColor = "rgba(0,0,0,0.65)";
    ctx.shadowBlur = px * 0.12;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(sanitizeText(ln.t), cx, cy);
  }
  ctx.shadowBlur = 0;
}

export default function Television({ phase }) {
  const { tv } = useLayout();
  const S = tv.screen;
  const curve = S.curve ?? 0.06;

  // Offscreen canvas the title cards are painted onto, fed into the shader.
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = TEX_W;
    c.height = TEX_H;
    return c;
  }, []);
  const ctx2d = useMemo(() => canvas.getContext("2d"), [canvas]);
  const textTex = useMemo(() => {
    const tx = new THREE.CanvasTexture(canvas);
    tx.minFilter = THREE.LinearFilter;
    tx.magFilter = THREE.LinearFilter;
    return tx;
  }, [canvas]);
  const lastKey = useRef("");

  const screenMat = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(ScreenMaterial.uniforms),
      vertexShader: ScreenMaterial.vertexShader,
      fragmentShader: ScreenMaterial.fragmentShader,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    m.uniforms.uText.value = textTex;
    return m;
  }, [textTex]);

  // Force a redraw once the web fonts are actually available.
  useEffect(() => {
    let alive = true;
    const want = ['400 80px "Anton"', '400 80px "DM Mono"', 'italic 400 80px "Cormorant Garamond"'];
    Promise.all(want.map((f) => document.fonts.load(f).catch(() => {})))
      .then(() => document.fonts.ready)
      .then(() => {
        if (alive) lastKey.current = ""; // invalidate → redraw with real fonts
      });
    return () => {
      alive = false;
    };
  }, []);

  const holeMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.CustomBlending,
        blendEquation: THREE.AddEquation,
        blendSrc: THREE.ZeroFactor,
        blendDst: THREE.ZeroFactor,
        blendEquationAlpha: THREE.AddEquation,
        blendSrcAlpha: THREE.ZeroFactor,
        blendDstAlpha: THREE.ZeroFactor,
      }),
    []
  );

  const screenGeo = useMemo(() => makeCurvedScreen(S.size[0], S.size[1], curve), [S.size, curve]);
  const holeGeo = useMemo(() => makeCurvedScreen(S.size[0] * 0.985, S.size[1] * 0.985, curve), [S.size, curve]);

  const glow = useRef();
  const holeRef = useRef();

  const tint = useMemo(() => new THREE.Color().setRGB(...FRAMES[0].color), []);
  const target = useMemo(() => new THREE.Color(), []);
  const cA = useMemo(() => new THREE.Color(), []);
  const cB = useMemo(() => new THREE.Color(), []);

  useFrame((state, delta) => {
    const t = phase.current ?? 0;
    const el = state.clock.elapsedTime;
    const wake = 0.6 + 0.4 * THREE.MathUtils.smoothstep(t, 0.25, 0.75);
    const rs = TRANSITION_CONFIG.heroRevealStart;
    const re = TRANSITION_CONFIG.heroRevealEnd;
    const reveal = THREE.MathUtils.clamp((t - rs) / (re - rs), 0, 1);

    const N = FRAMES.length;
    const cur = Math.floor(el / CYCLE) % N;
    const nxt = (cur + 1) % N;
    const localT = el % CYCLE;
    const tf = localT > HOLD ? (localT - HOLD) / TRANS : 0;
    const e = easeInOutCubic(THREE.MathUtils.clamp(tf, 0, 1));
    const instab = tf > 0 ? Math.sin(Math.PI * tf) : 0;

    // Repaint the title canvas only when the picture actually changes.
    const key = `${cur}|${e.toFixed(3)}`;
    if (key !== lastKey.current) {
      lastKey.current = key;
      ctx2d.clearRect(0, 0, TEX_W, TEX_H);
      drawFrame(ctx2d, FRAMES[cur], 1 - e); // outgoing lingers
      drawFrame(ctx2d, FRAMES[nxt], e); // incoming emerges
      textTex.needsUpdate = true;
    }

    // Blended broadcast color → vibrant screen tint + room light (eased).
    cA.setRGB(...FRAMES[cur].color);
    cB.setRGB(...FRAMES[nxt].color);
    target.copy(cA).lerp(cB, e);
    tint.lerp(target, Math.min(1, delta * 1.6));
    screenMat.uniforms.uTint.value.copy(tint);

    screenMat.uniforms.uTime.value = el;
    screenMat.uniforms.uWake.value = wake;
    screenMat.uniforms.uOpacity.value = 1 - reveal;
    screenMat.uniforms.uReveal.value = reveal;
    screenMat.uniforms.uInstab.value = instab;

    if (holeRef.current) holeRef.current.visible = reveal > 0.001;

    if (glow.current) {
      glow.current.color.copy(tint);
      glow.current.intensity = (0.35 + 0.35 * wake) * tv.glow.intensity * (1 - 0.6 * reveal);
    }
  });

  return (
    <AssetModel name="TV" url={ASSET_URLS.tv} config={tv}>
      <group position={S.position} rotation={S.rotation}>
        <mesh ref={holeRef} geometry={holeGeo} material={holeMat} renderOrder={5} visible={false} />
        <mesh geometry={screenGeo} renderOrder={6}>
          <primitive object={screenMat} attach="material" />
        </mesh>
      </group>

      {/* Living screen glow — color follows the current broadcast frame. */}
      <pointLight
        ref={glow}
        position={tv.glow.position}
        color={tv.glow.color}
        intensity={tv.glow.intensity * 0.35}
        distance={tv.glow.distance}
        decay={2}
      />
      <pointLight
        position={tv.rim.position}
        color={tv.rim.color}
        intensity={tv.rim.intensity}
        distance={tv.rim.distance}
        decay={2}
      />
    </AssetModel>
  );
}
