"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ViewportTier } from "@/hooks/useViewportTier";

const CONE_HEIGHT = 12;
const CONE_BASE_Y = -1.5;

interface Props {
  tier?: ViewportTier;
}

export default function AmbientParticles({ tier = "desktop" }: Props) {
  const pointsRef = useRef<THREE.Points>(null!);

  // Same count across all tiers — modern phones handle 600 particles fine
  const PARTICLE_COUNT = 600;
  void tier;

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      // Random position within a cone-like volume
      const y = Math.random() * CONE_HEIGHT + CONE_BASE_Y;
      const heightRatio = (y - CONE_BASE_Y) / CONE_HEIGHT;
      const radius = 1.5 + heightRatio * 3.0;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      pos[i3] = Math.cos(angle) * r;
      pos[i3 + 1] = y;
      pos[i3 + 2] = Math.sin(angle) * r * 0.3; // flattened z for a more frontal look
      vel[i] = 0.2 + Math.random() * 0.5; // drift speed
    }

    return { positions: pos, velocities: vel };
  }, [PARTICLE_COUNT]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.getAttribute(
      "position"
    ) as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      // Drift upward
      arr[i3 + 1] += velocities[i] * delta;

      // Wrap when exiting top
      if (arr[i3 + 1] > CONE_BASE_Y + CONE_HEIGHT) {
        arr[i3 + 1] = CONE_BASE_Y;
        // Re-randomize x/z within cone base
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 1.5;
        arr[i3] = Math.cos(angle) * r;
        arr[i3 + 2] = Math.sin(angle) * r * 0.3;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color="#66dd88"
        size={0.04}
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
