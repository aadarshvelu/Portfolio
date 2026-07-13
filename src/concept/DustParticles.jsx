import React, { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SCENE_CONFIG } from "./config/sceneConfig";
import { useLayout } from "./layoutContext";

/**
 * DustParticles — realistic atmospheric dust, not a particle demo.
 *
 * The motes live in a small volume over the desk/lamp beam and barely move
 * (quiet-room air). They are only *visible* where the lamp beam passes through
 * them: each mote's brightness is driven by how close it sits to the beam axis,
 * so motes outside the cone fall to near-black and — with additive blending —
 * effectively vanish. You see dust because of the light, not because it was
 * rendered. As the camera leaves the desk for the TV, all dust fades away.
 *
 * Size mix (no large motes, no obvious circles): ~95% tiny, ~4% small, ~1% medium.
 */
export default function DustParticles({ phase }) {
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const cfg = SCENE_CONFIG.dust;
  const { lamp, quality } = useLayout();
  const count = quality.dustCount ?? cfg.count;

  // Lamp beam, derived from the lamp light so dust tracks the actual cone.
  const beam = useMemo(() => {
    const b = new THREE.Vector3(...lamp.light.position);
    const t = new THREE.Vector3(...lamp.light.target);
    const dir = t.clone().sub(b);
    return { b, dir, len2: Math.max(dir.dot(dir), 1e-6) };
  }, [lamp]);

  // Warm tint matching the lamp.
  const warm = useMemo(() => new THREE.Color("#ffe6b8"), []);

  const motes = useMemo(() => {
    const [sx, sy, sz] = cfg.spread;
    const [cx, cy, cz] = cfg.center;
    const arr = [];
    for (let i = 0; i < count; i++) {
      // Size category: overwhelmingly tiny, a few small, the rare medium.
      const r = i / count; // deterministic spread (no Math.random reliance)
      const roll = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      const k = Math.abs(roll);
      let sizeMul;
      if (k < 0.95) sizeMul = 0.35 + 0.25 * k; // tiny
      else if (k < 0.99) sizeMul = 0.9; // small
      else sizeMul = 1.6; // medium (rare)

      arr.push({
        home: new THREE.Vector3(
          cx + (Math.sin(i * 1.7) * 0.5) * sx,
          cy + (Math.sin(i * 2.3 + 1.1) * 0.5) * sy,
          cz + (Math.sin(i * 0.9 + 2.7) * 0.5) * sz
        ),
        amp: 0.02 + 0.05 * k, // tiny drift radius
        phase: r * Math.PI * 2,
        spin: 0.6 + k, // slightly different per-mote drift rate
        size: cfg.size * sizeMul,
        twinkle: 0.7 + 0.3 * Math.sin(i * 5.0),
      });
    }
    return arr;
  }, [count, cfg.spread, cfg.center, cfg.size]);

  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ffffff",
        transparent: true,
        opacity: cfg.opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [cfg.opacity]
  );

  // Seed instance colours once so instanceColor exists.
  useLayoutEffect(() => {
    const inst = ref.current;
    if (!inst) return;
    for (let i = 0; i < count; i++) inst.setColorAt(i, warm);
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  }, [count, warm]);

  const tmp = useMemo(() => new THREE.Vector3(), []);
  const closest = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const inst = ref.current;
    if (!inst) return;
    const t = state.clock.elapsedTime * cfg.speed;

    // Fade the whole field out as the camera leaves the desk for the TV.
    const p = phase?.current ?? 0;
    const fade = 1 - THREE.MathUtils.smoothstep(p, 0.32, 0.62);
    if (fade <= 0.001) {
      if (inst.visible) inst.visible = false;
      return;
    }
    inst.visible = true;

    const beamR = 0.5; // beam radius for the visibility falloff

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      // Almost-still drift.
      const px = m.home.x + Math.sin(t * m.spin + m.phase) * m.amp;
      const py = m.home.y + Math.sin(t * m.spin * 0.7 + m.phase * 1.3) * m.amp * 0.8;
      const pz = m.home.z + Math.cos(t * m.spin * 0.8 + m.phase) * m.amp;

      dummy.position.set(px, py, pz);
      dummy.scale.setScalar(m.size);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);

      // Distance from the beam axis → only lit motes are visible.
      tmp.set(px, py, pz).sub(beam.b);
      let u = tmp.dot(beam.dir) / beam.len2;
      u = THREE.MathUtils.clamp(u, -0.15, 1.25);
      closest.copy(beam.dir).multiplyScalar(u).add(beam.b);
      const dist = closest.distanceTo(dummy.position);

      let lit = 1 - dist / beamR; // 1 at axis → 0 at beam edge
      lit = lit > 0 ? lit * lit : 0; // sharpen falloff
      const bright = (0.05 + 0.95 * lit) * m.twinkle * fade;

      color.copy(warm).multiplyScalar(bright);
      inst.setColorAt(i, color);
    }
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} material={mat} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
    </instancedMesh>
  );
}
