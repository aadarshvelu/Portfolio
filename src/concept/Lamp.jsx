import React, { useEffect, useRef } from "react";
import AssetModel from "./AssetModel";
import { ASSET_URLS } from "./config/sceneConfig";
import { useLayout } from "./layoutContext";

/**
 * Lamp — the lamp.glb model plus the warm tungsten light it casts.
 *
 * The model placement comes from SCENE_CONFIG.lamp (position / rotation /
 * scale). The light is defined separately in SCENE_CONFIG.lamp.light and lives
 * in world space, so it keeps lighting the paper no matter how the model is
 * scaled. It casts real shadows of the pen and paper onto the desk.
 */
export default function Lamp() {
  const { lamp, quality } = useLayout();
  const spot = useRef();
  const target = useRef();
  const glowRef = useRef();

  // Bind the spotlight to its (in-scene) target so the cone actually aims.
  useEffect(() => {
    if (spot.current && target.current) {
      spot.current.target = target.current;
      spot.current.target.updateMatrixWorld();
    }
  }, [lamp]);

  const L = lamp.light;
  const G = lamp.glow;

  return (
    <>
      <AssetModel name="LAMP" url={ASSET_URLS.lamp} config={lamp} />

      {/* Where the warm key points (the paper). */}
      <object3D ref={target} position={L.target} />

      {/* Warm tungsten key — casts shadows of pen + paper across the desk. */}
      <spotLight
        ref={spot}
        position={L.position}
        color={L.color}
        intensity={L.intensity}
        angle={L.angle}
        penumbra={L.penumbra}
        distance={L.distance}
        decay={2}
        castShadow
        shadow-mapSize-width={quality.lampShadowMap}
        shadow-mapSize-height={quality.lampShadowMap}
        shadow-bias={-0.0004}
      />

      {/* Soft bulb glow. */}
      <pointLight ref={glowRef} position={G.position} color={G.color} intensity={G.intensity} distance={G.distance} decay={2} />
    </>
  );
}
