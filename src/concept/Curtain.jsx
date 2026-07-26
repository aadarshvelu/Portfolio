import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SCENE_CONFIG } from "./config/sceneConfig";

/**
 * Curtain — a thin sheer hung over the window. It is translucent, so the cold
 * night/moonlight reads through it, and it breathes almost imperceptibly: the
 * top is pinned to the rod and the fabric ripples in tiny, slow waves toward
 * the hem — still night air, not a draft.
 */
export default function Curtain() {
  const { curtain } = SCENE_CONFIG;
  const [w, h] = curtain.size;
  const SEG_X = 16;
  const SEG_Y = 20;

  const geo = useMemo(() => new THREE.PlaneGeometry(w, h, SEG_X, SEG_Y), [w, h]);

  // Cache the rest positions so we can ripple relative to them each frame.
  const rest = useMemo(() => geo.attributes.position.array.slice(0), [geo]);

  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: curtain.color,
        emissive: curtain.color,
        emissiveIntensity: 0.18, // a faint cold glow, as if moonlit through
        roughness: 1,
        metalness: 0,
        transparent: true,
        opacity: curtain.opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [curtain.color, curtain.opacity]
  );

  const meshRef = useRef();

  useFrame((state) => {
    const m = meshRef.current;
    if (!m) return;
    const t = state.clock.elapsedTime * curtain.speed;
    const pos = m.geometry.attributes.position;
    const halfH = h / 2;
    for (let i = 0; i < pos.count; i++) {
      const x = rest[i * 3];
      const y = rest[i * 3 + 1];
      // 0 at the pinned top, 1 at the free hem — fabric is freer lower down.
      const free = THREE.MathUtils.clamp((halfH - y) / h, 0, 1);
      const wave =
        Math.sin(x * 1.6 + t) * 0.6 + Math.sin(x * 3.3 - t * 0.7 + y * 0.8) * 0.4;
      pos.setZ(i, wave * curtain.sway * free);
    }
    pos.needsUpdate = true;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geo}
      material={mat}
      position={curtain.position}
      renderOrder={-1}
    />
  );
}
