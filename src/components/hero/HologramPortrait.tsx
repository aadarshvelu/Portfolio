"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import * as THREE from "three";
import { animState } from "@/lib/animation-state";
import {
  hologramPortraitVertex,
  hologramPortraitFragment,
} from "@/shaders/hologram-portrait.glsl";

export default function HologramPortrait() {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const texture = useTexture("/br_i.png");

  // Ensure texture has good filtering
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;

  const uniforms = useMemo(
    () => ({
      uTexture: { value: texture },
      uTime: { value: 0 },
      uGlowColor: { value: new THREE.Color(0.91, 0.96, 1.0) }, // #e8f4ff
      uGlowIntensity: { value: 3.0 },
      uScanlineY: { value: 0 },
      uBootProgress: { value: 0 },
      uFlicker: { value: 0 },
    }),
    [texture]
  );

  // Boot-up entrance timeline
  useGSAP(() => {
    const tl = gsap.timeline();

    // Flicker on (rapid toggling like CRT powering up)
    tl.to(animState, { hologramFlicker: 0.3, duration: 0.06 }, 0.2);
    tl.to(animState, { hologramFlicker: 0, duration: 0.05 }, 0.26);
    tl.to(animState, { hologramFlicker: 0.6, duration: 0.06 }, 0.34);
    tl.to(animState, { hologramFlicker: 0, duration: 0.04 }, 0.4);
    tl.to(animState, { hologramFlicker: 0.8, duration: 0.05 }, 0.46);
    tl.to(animState, { hologramFlicker: 0.4, duration: 0.04 }, 0.51);
    tl.to(animState, {
      hologramFlicker: 1,
      duration: 0.15,
      ease: "power2.in",
    }, 0.55);

    // Scan-line reveal (bottom to top)
    tl.to(animState, {
      scanlineY: 1,
      duration: 2.2,
      ease: "power2.inOut",
    }, 0.3);

    // Overall boot progress
    tl.to(animState, {
      hologramBoot: 1,
      duration: 2.0,
      ease: "power2.inOut",
    }, 0.3);

    // Mark entrance done
    tl.call(() => {
      animState.isEntranceDone = true;
    }, [], 2.6);
  }, []);

  // Update shader uniforms each frame
  useFrame(({ clock }) => {
    const mat = matRef.current;
    if (!mat) return;
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uScanlineY.value = animState.scanlineY;
    mat.uniforms.uBootProgress.value = animState.hologramBoot;
    mat.uniforms.uFlicker.value = animState.hologramFlicker;
  });

  return (
    <mesh position={[0, 5.8, 0]}>
      <planeGeometry args={[8.5, 13]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={hologramPortraitVertex}
        fragmentShader={hologramPortraitFragment}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
