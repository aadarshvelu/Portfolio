"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { animState } from "@/lib/animation-state";
import HologramPortrait from "./HologramPortrait";
import HologramBase from "./HologramBase";
import AmbientParticles from "./AmbientParticles";
import OrbitingDrones from "./OrbitingDrones";

function CameraRig() {
  const cameraRef = useRef({ x: 0, y: 0 });

  useFrame(({ camera }) => {
    cameraRef.current.x += (animState.mouseX - cameraRef.current.x) * 0.05;
    cameraRef.current.y += (animState.mouseY - cameraRef.current.y) * 0.05;

    camera.position.x = cameraRef.current.x;
    camera.position.y = 6.4 + cameraRef.current.y;
    camera.lookAt(0, 6.4, 0);
  });

  return null;
}

export default function HeroCanvas() {
  return (
    <Canvas
      camera={{ fov: 40, position: [0, 6.4, 22], near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
      style={{ background: "#000000" }}
    >
      <color attach="background" args={["#000000"]} />
      <ambientLight intensity={0.1} />

      <Suspense fallback={null}>
        <HologramBase />
        <HologramPortrait />
        <AmbientParticles />
        <OrbitingDrones />
      </Suspense>

      <CameraRig />

      <EffectComposer>
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          radius={0.85}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
