"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import * as THREE from "three";
import { animState } from "@/lib/animation-state";
import {
  hologramConeVertex,
  hologramConeFragment,
} from "@/shaders/hologram-cone.glsl";
import {
  hologramBaseVertex,
  hologramBaseFragment,
} from "@/shaders/hologram-base.glsl";

/** Procedural sci-fi projector disc */
function ProjectorDisc() {
  const matRef = useRef<THREE.ShaderMaterial>(null!);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uColorPrimary: { value: new THREE.Color(0.4, 0.8, 1.0) },   // bright cyan
      uColorSecondary: { value: new THREE.Color(0.2, 0.45, 0.6) }, // muted blue
    }),
    []
  );

  useFrame(({ clock }) => {
    const mat = matRef.current;
    if (!mat) return;
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uOpacity.value = animState.hologramBaseOpacity;
  });

  return (
    <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[12, 12]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={hologramBaseVertex}
        fragmentShader={hologramBaseFragment}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export default function HologramBase() {
  const coneMatRef = useRef<THREE.ShaderMaterial>(null!);

  const coneUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uColor: { value: new THREE.Color(0.27, 0.53, 0.67) },
    }),
    []
  );

  // Cone + disc fade in first during boot
  useGSAP(() => {
    gsap.to(animState, {
      hologramBaseOpacity: 1,
      duration: 0.5,
      ease: "power2.in",
      delay: 0.05,
    });
  }, []);

  useFrame(({ clock }) => {
    const mat = coneMatRef.current;
    if (!mat) return;
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uOpacity.value = animState.hologramBaseOpacity;
  });

  return (
    <group>
      {/* Sci-fi projector disc */}
      <ProjectorDisc />

      {/* Light cone — truncated cone from base up to portrait */}
      <mesh position={[0, 4.0, 0]}>
        <cylinderGeometry args={[6.5, 2.5, 11, 32, 1, true]} />
        <shaderMaterial
          ref={coneMatRef}
          vertexShader={hologramConeVertex}
          fragmentShader={hologramConeFragment}
          uniforms={coneUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
