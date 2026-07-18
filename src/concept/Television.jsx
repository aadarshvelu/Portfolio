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
 * A late-night broadcast already in progress. The CRT cycles funky old-school
 * "bumper" cards on a timer — each a bright saturated background with a chunky,
 * outlined, extruded heading (the WE'RE-BACK look), held ~4.5s then dissolving
 * into the next as the signal destabilizes. The final abstract card is left plain.
 *
 * The title text is NOT a separate layer — it is PAINTED INTO THE SIGNAL: drawn
 * to a canvas texture and composited inside the CRT shader, so scanlines, the
 * curved-glass distortion, phosphor glow and flicker all run through it. It reads
 * like text on a real 1960s television, fused with the picture.
 *
 * Each frame carries a vibrant color that glows the whole screen and eases the
 * room's ambient reflection (desk, paper, pen, clock, wall) toward it.
 */
// Each channel is a funky old-school BUMPER: a bright saturated background (the
// `color` = the phosphor tint) with a chunky, outlined, extruded heading in a
// contrasting ink (block: true). The final "abstract" closing card is LEFT plain
// (DM Mono, no block) on purpose.
// NOTE: text must be ASCII only — sanitizeText() strips every non-ASCII glyph
// (accents, middle-dots, em-dashes), which is why "RÉSUMÉS" came out "RSUMS".
const FRAMES = [
  {
    color: [0.12, 0.19, 0.95], ink: "#ffd23f", outline: "#0b1030", // blue / yellow
    lines: [
      { t: "THE ORIGIN", size: 0.092, y: 0.06, block: true, rot: -2 },
      { t: "my self-taught journey", fam: "DM Mono", size: 0.037, y: -0.15, ls: 0.04, a: 1, plate: true },
    ],
  },
  {
    color: [1.0, 0.46, 0.08], ink: "#fff2cf", outline: "#5a2606", // orange / cream
    lines: [
      { t: "THE UPGRADE", size: 0.092, y: 0.06, block: true, rot: -2 },
      { t: "the years I got sharp", fam: "DM Mono", size: 0.037, y: -0.15, ls: 0.04, a: 1, plate: true },
    ],
  },
  {
    color: [0.08, 0.73, 0.30], ink: "#ff54cf", outline: "#05200e", // green / magenta
    lines: [
      { t: "50,000 RESUMES", size: 0.075, y: 0.06, block: true, rot: -2 },
      { t: "the hiring AI I built", fam: "DM Mono", size: 0.037, y: -0.15, ls: 0.04, a: 1, plate: true },
    ],
  },
  {
    color: [0.48, 0.18, 0.97], ink: "#ffe14d", outline: "#140630", // purple / yellow
    lines: [
      { t: "THE BOARDROOM", size: 0.082, y: 0.06, block: true, rot: 2 },
      { t: "now I run the room", fam: "DM Mono", size: 0.037, y: -0.15, ls: 0.04, a: 1, plate: true },
    ],
  },
  {
    color: [0.95, 0.15, 0.24], ink: "#3de6f0", outline: "#2a060a", // red / cyan
    lines: [
      { t: "LET'S TALK", size: 0.092, y: 0.06, block: true, rot: -2 },
      { t: "the director takes calls", fam: "DM Mono", size: 0.037, y: -0.15, ls: 0.04, a: 1, plate: true },
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

      // Signal drift — a little always (CRT life), more across a bumper change.
      float band = floor(uv.y * 18.0);
      uv.x += step(0.95, hash(vec2(band, floor(uTime*2.0)))) * (hash(vec2(band, floor(uTime*7.0)))-0.5) * 0.035;
      uv.x += inst * (hash(vec2(band, floor(uTime*30.0)))-0.5) * 0.05;

      // Phosphor field in the broadcast color — bright bumper bg, abstract grain kept.
      float n = hash(uv * vec2(210.0,150.0) + floor(uTime*24.0));
      vec3 col = uTint * (0.80 + 0.30*n);
      col += uTint * inst * 0.4 * n;

      // ---- Paint the broadcast TEXT into the signal (curves + drifts with it) ----
      vec4 txt = texture2D(uText, vec2(uv.x, uv.y));
      col = col * (1.0 - txt.a) + txt.rgb * 1.18 * txt.a; // bright phosphor core + dark halo

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
    const text = sanitizeText(ln.t);
    ctx.save();
    ctx.translate(cx, cy);
    if (ln.rot) ctx.rotate((ln.rot * Math.PI) / 180);
    ctx.globalAlpha = alpha * (ln.a ?? 1);
    ctx.letterSpacing = `${(ln.ls || 0) * px}px`;

    if (ln.block) {
      // Funky old-school block letters: chunky extruded 3D drop, bold dark
      // outline, bright ink. Sized big so it reads over the CRT grain.
      ctx.font = `400 ${px}px "Anton", "DM Mono", sans-serif`;
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;
      const depth = px * 0.09;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      for (let d = depth; d >= 1; d -= 1.5) ctx.fillText(text, d, d);
      ctx.lineWidth = px * 0.09;
      ctx.strokeStyle = frame.outline || "#101018";
      ctx.strokeText(text, 0, 0);
      ctx.fillStyle = frame.ink || "#ffffff";
      ctx.fillText(text, 0, 0);
    } else if (ln.plate) {
      // Lower-third PLATE: a solid dark bar behind the sub. Its contrast is now
      // LOCAL (bright text on its own bar), so it survives the CRT scanlines +
      // grain instead of fighting the grainy colour field. This is the reliable fix.
      ctx.font = `${ln.italic ? "italic " : ""}400 ${px}px "${ln.fam || "DM Mono"}", sans-serif`;
      const w = ctx.measureText(text).width;
      const padX = px * 0.85, h = px * 1.6, r = Math.min(h * 0.32, 20);
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-w / 2 - padX, -h / 2, w + padX * 2, h, r);
      else ctx.rect(-w / 2 - padX, -h / 2, w + padX * 2, h);
      ctx.fillStyle = "rgba(7,7,15,0.92)";
      ctx.fill();
      ctx.fillStyle = frame.ink || "#ffffff";
      ctx.fillText(text, 0, 0);
    } else {
      // Plain text (the abstract closing) — dark ink on cream, soft shadow.
      ctx.font = `${ln.italic ? "italic " : ""}400 ${px}px "${ln.fam || "DM Mono"}", sans-serif`;
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = px * 0.12;
      ctx.fillStyle = frame.ink || "#ffffff";
      ctx.fillText(text, 0, 0);
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
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

    // Broadcast plays on its own timer: each bumper holds, then dissolves into
    // the next with the signal destabilizing across the switch.
    const N = FRAMES.length;
    const cur = Math.floor(el / CYCLE) % N;
    const nxt = (cur + 1) % N;
    const localT = el % CYCLE;
    const tf = localT > HOLD ? (localT - HOLD) / TRANS : 0;
    const e = easeInOutCubic(THREE.MathUtils.clamp(tf, 0, 1));
    const instab = tf > 0 ? Math.sin(Math.PI * tf) : 0;

    // Repaint the bumper canvas only when the picture actually changes.
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
