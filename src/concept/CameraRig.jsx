import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useLayout } from "./layoutContext";

/**
 * CameraRig — drives the single cinematic move along the active device's camera
 * profile (cameraProfiles.js). Each device is a different shot of the same room.
 *
 *   0%   wide room shot, paper readable, TV dormant in the background
 *   50%  attention begins drifting toward the TV
 *   75%  paper becomes secondary, TV primary
 *   100% camera dollies fully into the TV screen
 *
 * All positions/lookAts/fov come from the config — edit them there, not here.
 */

function sample(arr, t) {
  const n = arr.length - 1;
  const f = THREE.MathUtils.clamp(t, 0, 1) * n;
  const i = Math.min(Math.floor(f), n - 1);
  const local = f - i;
  // smoothstep within each segment for soft acceleration
  const s = local * local * (3 - 2 * local);
  return arr[i].clone().lerp(arr[i + 1], s);
}

export default function CameraRig({ phase }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3());
  const { camera: c } = useLayout();

  // Rebuild keyframe arrays when the device (camera profile) changes.
  const { POS, LOOK, fovStart, fovEnd } = useMemo(
    () => ({
      POS: c.path.map((k) => new THREE.Vector3(...k.position)),
      LOOK: c.path.map((k) => new THREE.Vector3(...k.lookAt)),
      fovStart: c.fovStart,
      fovEnd: c.fovEnd,
    }),
    [c]
  );

  useFrame(() => {
    const t = phase.current ?? 0;
    const p = sample(POS, t);
    const l = sample(LOOK, t);

    camera.position.copy(p);
    target.current.copy(l);
    camera.lookAt(target.current);

    // Tighten the lens slightly as we close on the TV for an intimate feel.
    const fov = THREE.MathUtils.lerp(fovStart, fovEnd, THREE.MathUtils.smoothstep(t, 0.5, 1));
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
