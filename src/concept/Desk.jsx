import React, { useMemo } from "react";
import * as THREE from "three";
import { SCENE_CONFIG } from "./config/sceneConfig";
import { useLayout } from "./layoutContext";

/**
 * Desk — the hero of the frame. A large, heavy wooden writing desk that
 * extends well past the edges of the view, so the camera reads as *someone
 * standing right at it* rather than looking at a floating platform.
 *
 * Coordinates: the desk runs along X (wide), with its surface near the camera
 * (+Z) and the back of the desk toward the wall (−Z). The lamp, paper and pen
 * all physically rest on this surface.
 */

// Top surface height (world Y). Everything on the desk references this.
// Mirrored in SCENE_CONFIG.desk.surfaceY for the placement layer.
export const DESK_TOP_Y = SCENE_CONFIG.desk.surfaceY;

export default function Desk() {
  const topWood = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#4a3420",
        roughness: 0.78,
        metalness: 0.04,
      }),
    []
  );

  const bodyWood = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#33240f",
        roughness: 0.88,
        metalness: 0.03,
      }),
    []
  );

  const drawerWood = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#3c2a14",
        roughness: 0.82,
        metalness: 0.04,
      }),
    []
  );

  const brass = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#a9823c",
        roughness: 0.4,
        metalness: 0.85,
        emissive: "#2a1c04",
        emissiveIntensity: 0.3,
      }),
    []
  );

  const TOP_W = 9.0; // extends beyond frame
  const TOP_D = 3.2;
  const TOP_T = 0.14;
  const topY = DESK_TOP_Y - TOP_T / 2;
  const frontZ = TOP_D / 2 + 0.4; // front edge nearer the camera

  const { desk } = useLayout();

  return (
    <group position={desk.position} rotation={desk.rotation} scale={desk.scale}>
      {/* ---- Heavy top slab ---- */}
      <mesh position={[0, topY, 0]} castShadow receiveShadow material={topWood}>
        <boxGeometry args={[TOP_W, TOP_T, TOP_D]} />
      </mesh>
      {/* Front apron under the lip */}
      <mesh position={[0, DESK_TOP_Y - 0.22, frontZ - 0.45]} castShadow material={bodyWood}>
        <boxGeometry args={[TOP_W, 0.22, 0.12]} />
      </mesh>

      {/* ---- Left pedestal with drawers ---- */}
      <group position={[-3.1, 0, -0.1]}>
        <mesh position={[0, (DESK_TOP_Y - 0.18) / 2, 0]} castShadow receiveShadow material={bodyWood}>
          <boxGeometry args={[1.5, DESK_TOP_Y - 0.18, 2.4]} />
        </mesh>
        {[0.72, 0.4].map((y, i) => (
          <group key={i} position={[0, y, 1.21]}>
            <mesh material={drawerWood} castShadow>
              <boxGeometry args={[1.36, 0.24, 0.04]} />
            </mesh>
            <mesh position={[0, 0, 0.05]} material={brass}>
              <cylinderGeometry args={[0.04, 0.04, 0.16, 12]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ---- Right pedestal ---- */}
      <group position={[3.1, 0, -0.1]}>
        <mesh position={[0, (DESK_TOP_Y - 0.18) / 2, 0]} castShadow receiveShadow material={bodyWood}>
          <boxGeometry args={[1.5, DESK_TOP_Y - 0.18, 2.4]} />
        </mesh>
        {[0.72, 0.4].map((y, i) => (
          <group key={i} position={[0, y, 1.21]}>
            <mesh material={drawerWood} castShadow>
              <boxGeometry args={[1.36, 0.24, 0.04]} />
            </mesh>
            <mesh position={[0, 0, 0.05]} material={brass}>
              <cylinderGeometry args={[0.04, 0.04, 0.16, 12]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ---- Modesty panel across the back ---- */}
      <mesh position={[0, (DESK_TOP_Y - 0.2) / 2 + 0.18, -1.1]} material={bodyWood}>
        <boxGeometry args={[5.0, DESK_TOP_Y - 0.55, 0.08]} />
      </mesh>

      {/* The lamp and pen are now GLBs rendered by <Lamp> and <Pen> in Scene.jsx. */}
    </group>
  );
}
