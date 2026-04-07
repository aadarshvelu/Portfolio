"use client";

import { useRef, useMemo, useEffect, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import * as THREE from "three";
import type { PointCloudData } from "@/types/pointcloud";
import { animState } from "@/lib/animation-state";
import {
  generateStartPositions,
  computeStaggerOffsets,
  generateDisperseDirections,
  clamp,
  type EntranceMode,
} from "@/lib/particle-utils";

const PARTICLE_RADIUS = 0.014;
const ENTRANCE_DURATION = 2;
const DISPERSE_STRENGTH = 1510;
const HOVER_RADIUS = 0.8;
const HOVER_STRENGTH = 0.15;

interface ParticlePortraitProps {
  data: PointCloudData;
  particleCount?: number;
  entranceMode?: EntranceMode;
}

// Golden palette — rich and luminous
const COLOR_DEEP = new THREE.Color("#d4a030");
const COLOR_MID = new THREE.Color("#f0c848");
const COLOR_BRIGHT = new THREE.Color("#ffe080");

export default function ParticlePortrait({
  data,
  particleCount,
  entranceMode = "rain",
}: ParticlePortraitProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  const { camera, size } = useThree();

  const count = particleCount ?? data.count;

  // Raycaster for pointer → world-space
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointerVec = useMemo(() => new THREE.Vector2(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const intersectPoint = useMemo(() => new THREE.Vector3(), []);

  const onPointerMove = useCallback((e: PointerEvent) => {
    pointerVec.x = (e.clientX / size.width) * 2 - 1;
    pointerVec.y = -(e.clientY / size.height) * 2 + 1;
    raycaster.setFromCamera(pointerVec, camera);
    if (raycaster.ray.intersectPlane(plane, intersectPoint)) {
      animState.pointerX = intersectPoint.x;
      animState.pointerY = intersectPoint.y;
      animState.pointerActive = true;
    }
  }, [camera, size, raycaster, pointerVec, plane, intersectPoint]);

  const onPointerLeave = useCallback(() => {
    animState.pointerActive = false;
  }, []);

  useEffect(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    return () => {
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [onPointerMove, onPointerLeave]);

  // Pre-compute animation buffers
  const { startPositions, staggerOffsets, disperseDirections, restJitter } = useMemo(() => {
    const jitter = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      jitter[i] = (Math.random() - 0.5) * 0.06;
    }
    return {
      startPositions: generateStartPositions(count, entranceMode, data.positions),
      staggerOffsets: computeStaggerOffsets(data.positions, count, entranceMode),
      disperseDirections: generateDisperseDirections(count),
      restJitter: jitter,
    };
  }, [data.positions, count, entranceMode]);

  // Explode mode: extra phase — first explode outward, then converge
  const explodeOutPositions = useMemo(() => {
    if (entranceMode !== "explode") return null;
    const out = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.5) * Math.PI;
      const r = 10 + Math.random() * 6;
      out[i * 3] = Math.cos(angle) * Math.cos(elevation) * r;
      out[i * 3 + 1] = 6.4 + Math.sin(elevation) * r;
      out[i * 3 + 2] = Math.sin(angle) * Math.cos(elevation) * r;
    }
    return out;
  }, [count, entranceMode]);

  // Set initial state + per-instance colors
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    for (let i = 0; i < count; i++) {
      tempObject.position.set(
        startPositions[i * 3],
        startPositions[i * 3 + 1],
        startPositions[i * 3 + 2],
      );
      tempObject.scale.setScalar(entranceMode === "draw" ? 0 : 0);
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);

      const blend = Math.random();
      if (blend < 0.4) {
        tempColor.copy(COLOR_DEEP).lerp(COLOR_MID, blend / 0.4);
      } else {
        tempColor.copy(COLOR_MID).lerp(COLOR_BRIGHT, (blend - 0.4) / 0.6);
      }
      mesh.setColorAt(i, tempColor);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [count, data.positions, data.sizes, startPositions, tempObject, tempColor, entranceMode]);

  // GSAP entrance animation
  useGSAP(() => {
    animState.entranceProgress = 0;
    animState.isEntranceDone = false;

    if (entranceMode === "explode") {
      // Two-phase: explode out (0→0.4), then converge (0.4→1)
      gsap.to(animState, {
        entranceProgress: 1,
        duration: ENTRANCE_DURATION + .5,
        ease: "power2.inOut",
        delay: 0,
        onComplete: () => { animState.isEntranceDone = true; },
      });
    } else {
      gsap.to(animState, {
        entranceProgress: 1,
        duration: ENTRANCE_DURATION,
        ease: "power3.inOut",
        delay: 0,
        onComplete: () => { animState.isEntranceDone = true; },
      });
    }
  }, [entranceMode]);

  // Per-frame buffer updates
  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const time = clock.getElapsedTime();
    const { entranceProgress, disperseProgress, pointerX, pointerY, pointerActive } = animState;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const tx = data.positions[i3] + restJitter[i3];
      const ty = data.positions[i3 + 1] + restJitter[i3 + 1];
      const tz = data.positions[i3 + 2] + restJitter[i3 + 2];

      // Per-particle staggered progress
      const stagger = staggerOffsets[i];
      const maxStagger = entranceMode === "draw" ? 0.8 : entranceMode === "explode" ? 0.7 : 0.5;
      const particleProgress = clamp(
        (entranceProgress - stagger) / (1 - maxStagger),
        0,
        1,
      );
      const smoothProgress = particleProgress * particleProgress * (3 - 2 * particleProgress);

      let x: number, y: number, z: number;

      if (entranceMode === "explode" && explodeOutPositions) {
        // Phase 1 (0→0.4): center → explode outward
        // Phase 2 (0.4→1): explode positions → target
        const phase1End = 0.35;
        if (entranceProgress < phase1End) {
          const p1 = clamp(entranceProgress / phase1End, 0, 1);
          const sp1 = p1 * p1 * (3 - 2 * p1);
          x = startPositions[i3] + (explodeOutPositions[i3] - startPositions[i3]) * sp1;
          y = startPositions[i3 + 1] + (explodeOutPositions[i3 + 1] - startPositions[i3 + 1]) * sp1;
          z = startPositions[i3 + 2] + (explodeOutPositions[i3 + 2] - startPositions[i3 + 2]) * sp1;
        } else {
          const p2 = clamp((particleProgress), 0, 1);
          const sp2 = p2 * p2 * (3 - 2 * p2);
          x = explodeOutPositions[i3] + (tx - explodeOutPositions[i3]) * sp2;
          y = explodeOutPositions[i3 + 1] + (ty - explodeOutPositions[i3 + 1]) * sp2;
          z = explodeOutPositions[i3 + 2] + (tz - explodeOutPositions[i3 + 2]) * sp2;
        }
      } else {
        const sx = startPositions[i3];
        const sy = startPositions[i3 + 1];
        const sz = startPositions[i3 + 2];
        x = sx + (tx - sx) * smoothProgress;
        y = sy + (ty - sy) * smoothProgress;
        z = sz + (tz - sz) * smoothProgress;
      }

      // Idle breathing
      if (animState.isEntranceDone && disperseProgress < 0.01) {
        x += Math.cos(time * 0.6 + i * 0.02) * 0.015;
        y += Math.sin(time * 0.8 + i * 0.01) * 0.03;
        z += Math.sin(time * 0.5 + i * 0.015) * 0.02;
      }

      // Hover
      if (pointerActive && animState.isEntranceDone) {
        const dx = x - pointerX;
        const dy = y - pointerY;
        const distSq = dx * dx + dy * dy;
        if (distSq < HOVER_RADIUS * HOVER_RADIUS) {
          const dist = Math.sqrt(distSq) || 0.01;
          const force = HOVER_STRENGTH * (1 - dist / HOVER_RADIUS);
          x += (dx / dist) * force * force;
          y += (dy / dist) * force * force;
        }
      }

      // Scroll dispersion
      if (disperseProgress > 0.01) {
        const dp = disperseProgress * disperseProgress;
        x += disperseDirections[i3] * dp * DISPERSE_STRENGTH;
        y += disperseDirections[i3 + 1] * dp * DISPERSE_STRENGTH;
        z += disperseDirections[i3 + 2] * dp * DISPERSE_STRENGTH;
      }

      // Scale
      const baseSize = data.sizes[i] * PARTICLE_RADIUS;
      const entranceScale = smoothProgress * 0.6;
      const disperseScale = 1 - disperseProgress;
      const finalScale = baseSize * entranceScale * disperseScale;

      tempObject.position.set(x, y, z);
      tempObject.scale.setScalar(finalScale);
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#ffffff" metalness={0.2} roughness={0.6} />
    </instancedMesh>
  );
}
