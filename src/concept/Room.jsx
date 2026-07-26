import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DESK_TOP_Y } from "./Desk";
import { useLayout } from "./layoutContext";

/**
 * Room — the environmental anchor. A floor the desk stands on and a back wall
 * with a simple window silhouette implying night. Faint moonlight rakes in from
 * the side, catching the wall and the desk's far edge so the space reads as a
 * real, inhabited room rather than a void.
 */
export default function Room({ phase }) {
  const moon = useRef();
  const tvBleed = useRef();
  const { window: win } = useLayout();

  useFrame(() => {
    const t = phase.current ?? 0;
    // Room dims slightly as the TV takes over; cold TV bleed grows.
    if (moon.current) moon.current.intensity = THREE.MathUtils.lerp(1.5, 0.9, THREE.MathUtils.smoothstep(t, 0.5, 1));
    if (tvBleed.current) tvBleed.current.intensity = THREE.MathUtils.smoothstep(t, 0.45, 1) * 8;
  });

  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#16151b",
        roughness: 1,
        metalness: 0,
      }),
    []
  );
  const trimMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: "#0c0b10", roughness: 1, metalness: 0 }),
    []
  );
  const floorMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: "#0d0a08", roughness: 0.92, metalness: 0.05 }),
    []
  );
  // Faint cold night sky seen through the window.
  const skyMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({ color: "#1d2740", toneMapped: false }),
    []
  );

  const WALL_Z = -4.6;

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.5]} receiveShadow material={floorMat}>
        <planeGeometry args={[40, 30]} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 4, WALL_Z]} receiveShadow material={wallMat}>
        <planeGeometry args={[40, 14]} />
      </mesh>

      {/* ---- Window silhouette (upper-left), implying night ---- */}
      <group position={win.position}>
        {/* Night sky pane behind the frame */}
        <mesh material={skyMat}>
          <planeGeometry args={win.paneSize} />
        </mesh>
        {/* Frame trim */}
        <mesh position={[0, 1.55, 0.02]} material={trimMat}>
          <boxGeometry args={[2.9, 0.18, 0.1]} />
        </mesh>
        <mesh position={[0, -1.55, 0.02]} material={trimMat}>
          <boxGeometry args={[2.9, 0.18, 0.1]} />
        </mesh>
        <mesh position={[-1.4, 0, 0.02]} material={trimMat}>
          <boxGeometry args={[0.18, 3.2, 0.1]} />
        </mesh>
        <mesh position={[1.4, 0, 0.02]} material={trimMat}>
          <boxGeometry args={[0.18, 3.2, 0.1]} />
        </mesh>
        {/* Muntins (cross bars) */}
        <mesh position={[0, 0, 0.02]} material={trimMat}>
          <boxGeometry args={[2.7, 0.08, 0.08]} />
        </mesh>
        <mesh position={[0, 0, 0.02]} material={trimMat}>
          <boxGeometry args={[0.08, 3.0, 0.08]} />
        </mesh>
      </group>

      {/* Cool moonlight raking in from the window side.
          Shadows DISABLED — with castShadow on, this directional light was
          throwing a second fan-blade shadow onto the wall behind the TV
          (unwanted, duplicated the desk shadow). The moonlight is subtle
          enough that shadowless is visually indistinguishable, and it removes
          a full shadow-map pass per frame + a shader-compile at boot. */}
      <directionalLight
        ref={moon}
        position={[-7, 6, 1]}
        color="#5a78c8"
        intensity={1.5}
      />
      {/* A soft blue ambient fill from the window so the wall isn't pure black. */}
      <pointLight position={[-3.6, 3.2, WALL_Z + 1.6]} color="#3a4f8c" intensity={6} distance={11} decay={2} />

      {/* Cold bleed the TV throws onto the desk/wall as it wakes. */}
      <pointLight ref={tvBleed} position={[2.2, DESK_TOP_Y + 0.7, 0.3]} color="#3b6dff" intensity={0} distance={6} decay={2} />
    </group>
  );
}
