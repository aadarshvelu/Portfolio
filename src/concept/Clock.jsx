import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { useLayout } from "./layoutContext";

const pad2 = (n) => String(n).padStart(2, "0");

/**
 * Clock — a small vintage FLIP desk clock that sits on the desk beside the TV,
 * like a newsroom / editing-suite station clock. Matte bakelite body, cream
 * split-flap cards, dark digits, a warm amber status light that ticks every
 * second. The minute card does a tiny mechanical flip when the minute changes.
 *
 * It shows REAL local time (driven by `new Date()` each frame). It's deliberately
 * small and dim — discovered, not showcased — so the paper stays the hero.
 */
export default function Clock() {
  const { clock } = useLayout();
  const W = clock.width;
  const H = W * 0.6; // body height
  const D = W * 0.6; // body depth
  const cardW = W * 0.34;
  const cardH = H * 0.52;

  const minGroup = useRef();
  const minText = useRef();
  const hrText = useRef();

  // Initial time so the cards never flash a wrong value on mount.
  const init = useMemo(() => {
    const d = new Date();
    return { hh: pad2(d.getHours()), mm: pad2(d.getMinutes()) };
  }, []);

  // Mutable runtime state kept off React to avoid per-second re-renders.
  const disp = useRef({ h: init.hh, m: init.mm });
  const flip = useRef({ active: false, t: 0, next: init.mm });

  const bodyMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: clock.bodyColor, roughness: 0.78, metalness: 0.12 }),
    [clock.bodyColor]
  );
  const cardMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: clock.cardColor,
        emissive: clock.cardColor,
        emissiveIntensity: 0.12, // holds a little spill light so it reads in the dark
        roughness: 0.85,
      }),
    [clock.cardColor]
  );
  const seamMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#0b0a08", roughness: 0.9 }),
    []
  );
  // Colon dots — steady warm glow.
  const ledM = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: clock.accent,
        emissive: clock.accent,
        emissiveIntensity: 0.6,
        roughness: 0.5,
      }),
    [clock.accent]
  );
  // Status light — its own material so it can pulse without the colon.
  const statusM = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: clock.accent,
        emissive: clock.accent,
        emissiveIntensity: 0.6,
        roughness: 0.5,
        toneMapped: false,
      }),
    [clock.accent]
  );

  useFrame((_, delta) => {
    const d = new Date();
    const hh = pad2(d.getHours());
    const mm = pad2(d.getMinutes());
    const sec = d.getSeconds() + d.getMilliseconds() / 1000;

    // Hours update (no animation — changes rarely).
    if (hrText.current && disp.current.h !== hh) {
      disp.current.h = hh;
      hrText.current.text = hh;
      hrText.current.sync?.();
    }

    // Start a flip when the minute rolls over.
    if (!flip.current.active && disp.current.m !== mm) {
      flip.current.active = true;
      flip.current.t = 0;
      flip.current.next = mm;
    }

    // Drive the small mechanical flip (squash the card to the seam, swap, restore).
    if (flip.current.active) {
      flip.current.t += delta / 0.28; // ~0.28s flip
      let s;
      if (flip.current.t < 0.5) {
        s = 1 - flip.current.t * 2 * 0.92; // fold down to ~0.08
      } else {
        if (disp.current.m !== flip.current.next) {
          disp.current.m = flip.current.next;
          if (minText.current) {
            minText.current.text = flip.current.next;
            minText.current.sync?.();
          }
        }
        s = 0.08 + (flip.current.t - 0.5) * 2 * 0.92; // unfold
      }
      if (flip.current.t >= 1) {
        flip.current.active = false;
        s = 1;
      }
      if (minGroup.current) minGroup.current.scale.y = THREE.MathUtils.clamp(s, 0.08, 1);
    }

    // Amber status light ticks once a second.
    statusM.emissiveIntensity = sec % 1 < 0.5 ? 1.5 : 0.3;
  });

  const faceZ = D / 2 + 0.001;
  const gap = cardW * 0.62; // half-distance between the two cards

  const Card = ({ groupRef = undefined, textRef, value, x }) => (
    <group position={[x, H * 0.54, 0]}>
      <group ref={groupRef}>
        {/* Cream card */}
        <mesh position={[0, 0, faceZ]} material={cardMat}>
          <planeGeometry args={[cardW, cardH]} />
        </mesh>
        {/* Split-flap seam */}
        <mesh position={[0, 0, faceZ + 0.001]} material={seamMat}>
          <planeGeometry args={[cardW, cardH * 0.04]} />
        </mesh>
        {/* Digits */}
        <Text
          ref={textRef}
          position={[0, 0, faceZ + 0.003]}
          fontSize={cardH * 0.62}
          letterSpacing={-0.02}
          color={clock.digitColor}
          anchorX="center"
          anchorY="middle"
          material-toneMapped={false}
        >
          {value}
        </Text>
      </group>
    </group>
  );

  return (
    <group position={clock.position} rotation={clock.rotation} scale={clock.scale ?? 1}>
      {/* Body — matte bakelite block on a slim base. */}
      <mesh position={[0, H / 2, 0]} castShadow receiveShadow material={bodyMat}>
        <boxGeometry args={[W, H, D]} />
      </mesh>
      <mesh position={[0, 0.012, 0]} material={bodyMat}>
        <boxGeometry args={[W * 1.08, 0.024, D * 1.08]} />
      </mesh>
      {/* Recessed display well (darker inset behind the cards). */}
      <mesh position={[0, H * 0.54, D / 2 - 0.002]} material={seamMat}>
        <planeGeometry args={[W * 0.82, cardH * 1.15]} />
      </mesh>

      {/* Hours / minutes flip cards. */}
      <Card textRef={hrText} value={init.hh} x={-gap} />
      <Card groupRef={minGroup} textRef={minText} value={init.mm} x={gap} />

      {/* Colon between the cards. */}
      <mesh position={[0, H * 0.6, faceZ]} material={ledM}>
        <circleGeometry args={[W * 0.012, 12]} />
      </mesh>
      <mesh position={[0, H * 0.48, faceZ]} material={ledM}>
        <circleGeometry args={[W * 0.012, 12]} />
      </mesh>

      {/* Amber status light on the body — ticks every second. */}
      <mesh position={[W * 0.4, H * 0.2, D / 2 + 0.001]} material={statusM}>
        <circleGeometry args={[W * 0.02, 12]} />
      </mesh>
    </group>
  );
}
