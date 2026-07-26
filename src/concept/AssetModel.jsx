import React, { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { DEBUG } from "./config/debugConfig";
import { ASSET_ALIGNMENT, IDENTITY_ALIGNMENT } from "./config/assetAlignmentConfig";

/**
 * AssetModel — loads a GLB and places it from a config transform.
 *
 * It makes NO assumptions about the model's orientation, pivot, scale or
 * origin. You position it entirely from sceneConfig.js. On load it measures the
 * model's bounding box and (optionally) logs its real-world size + center, and
 * can draw an axes cross and a bounding-box wireframe for placement debugging.
 *
 * Layout:
 *   <group position rotation>      ← placement (from config), children share it
 *     <group scale>                ← GLB-only scale, so children stay in clean units
 *       <primitive model />
 *       {axes + bbox helpers}
 *     </group>
 *     {children}                   ← screen overlay, lights, text, etc.
 *   </group>
 */
export default function AssetModel({ name, url, config, castShadow = true, receiveShadow = true, children }) {
  const { scene } = useGLTF(url);

  // Clone so the cached GLTF isn't mutated and multiple uses stay independent.
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = castShadow;
        o.receiveShadow = receiveShadow;
        if (o.material) {
          // Subtle image-based reflections + keep the dark mood.
          o.material.envMapIntensity = 0.35;
          o.material.needsUpdate = true;
        }
      }
    });
    return clone;
  }, [scene, castShadow, receiveShadow]);

  // Local-space bounding box (before the config scale is applied).
  const box = useMemo(() => new THREE.Box3().setFromObject(model), [model]);

  const { size, center, axisSize } = useMemo(() => {
    const s = new THREE.Vector3();
    const c = new THREE.Vector3();
    box.getSize(s);
    box.getCenter(c);
    return { size: s, center: c, axisSize: Math.max(s.x, s.y, s.z) * 0.75 || 1 };
  }, [box]);

  // Log dimensions once on load.
  useEffect(() => {
    if (!DEBUG.logModelInfo) return;
    /* eslint-disable no-console */
    console.log(
      `MODEL: ${name}\n` +
        `  width:  ${size.x.toFixed(3)}\n` +
        `  height: ${size.y.toFixed(3)}\n` +
        `  depth:  ${size.z.toFixed(3)}\n` +
        `  center: [${center.x.toFixed(3)}, ${center.y.toFixed(3)}, ${center.z.toFixed(3)}]`
    );
    /* eslint-enable no-console */
  }, [name, size, center]);

  const scaleVec = Array.isArray(config.scale)
    ? config.scale
    : [config.scale, config.scale, config.scale];

  // Per-GLB orientation correction (independent of room placement).
  const a = ASSET_ALIGNMENT[(name || "").toLowerCase()] || IDENTITY_ALIGNMENT;

  const helpersOn = DEBUG.showHelpers;

  return (
    <group position={config.position} rotation={config.rotation}>
      {/* Alignment correction — fixes a crooked/back-to-front import. */}
      <group
        position={[a.positionX, a.positionY, a.positionZ]}
        rotation={[a.rotationX, a.rotationY, a.rotationZ]}
        scale={a.scale}
      >
        <group scale={scaleVec}>
          <primitive object={model} />

          {helpersOn && DEBUG.showBoundingBoxes && <box3Helper args={[box, "#00ff88"]} />}
          {helpersOn && DEBUG.showAxes && <axesHelper args={[axisSize]} />}
        </group>
      </group>

      {children}
    </group>
  );
}
