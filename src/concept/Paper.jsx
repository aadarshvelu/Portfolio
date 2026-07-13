import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { useLayout } from "./layoutContext";
import { sanitizeText } from "./sanitizeText";

const BODY = `I build things.

Mostly AI systems.
Sometimes products.
Sometimes tools.

What pulls me in is the moment
a tangled problem becomes simple.

This is a small archive of that.

Scroll to continue.`;

const SIGN = `Aadarsh Velu
Lead Technical Architect
Dubai, U.A.E.`;

const PLANE_W = 1.5;
const PLANE_H = 2.0;
const PIVOT = PLANE_H / 2;

/**
 * Paper — the note. Two layouts, chosen by `layout.paper.wall`:
 *
 *   DESK (desktop / tablet): the sheet lies flat on the desk, tilted up about
 *   its near edge so it reads like a note left to be found.
 *
 *   WALL (mobile portrait): the note hangs vertical in a picture frame, lit by
 *   its own warm spotlight — gallery art on the wall, stacked under the TV so a
 *   tall narrow screen has a clean top(TV)/bottom(note) composition.
 *
 * Same text either way. As the sequence moves to the TV, the note dims back.
 */
export default function Paper({ phase }) {
  const dimRef = useRef();
  const bodyRefs = useRef([]);
  const signRefs = useRef([]);
  const spotRef = useRef();
  const spotTarget = useRef();

  // Per-line strings (no embedded "\n", which troika draws as tofu).
  const bodyLines = useMemo(() => sanitizeText(BODY).split("\n"), []);
  const signLines = useMemo(() => sanitizeText(SIGN).split("\n"), []);

  const { paper } = useLayout();
  const wall = !!paper.wall; // vertical + picture frame
  const lit = !!paper.lit; // render the note's own spotlight (mobile, no lamp)
  const F = paper.frame || {};

  const paperMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#e8e0cf",
        roughness: 0.95,
        metalness: 0,
        emissive: "#1a1407",
        emissiveIntensity: 0.15,
      }),
    [],
  );

  const frameMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: F.color || "#241a11",
        roughness: 0.68,
        metalness: 0.05,
      }),
    [F.color],
  );

  useFrame(() => {
    const t = phase.current ?? 0;
    // Paper recedes as the TV takes over (after ~50%).
    const dim = 1 - THREE.MathUtils.smoothstep(t, 0.45, 0.9);
    if (dimRef.current) {
      paperMat.emissiveIntensity = 0.15 * (0.2 + 0.8 * dim);
    }
    if (spotRef.current && F.spot) {
      spotRef.current.intensity = F.spot.intensity * (0.25 + 0.75 * dim);
    }
    const ink = 0.12 + 0.88 * dim;
    for (const r of bodyRefs.current) if (r) r.fillOpacity = ink;
    for (const r of signRefs.current) if (r) r.fillOpacity = ink;
  });

  // Aim the note's spotlight at the sheet.
  useEffect(() => {
    if (lit && spotRef.current && spotTarget.current) {
      spotRef.current.target = spotTarget.current;
      spotRef.current.target.updateMatrixWorld();
    }
  }, [lit, paper]);

  // DESK lays the sheet down (-π/2) then adds the config tilt; WALL keeps it
  // vertical (facing +Z toward the camera) using the config rotation directly.
  const rot = wall
    ? paper.rotation
    : [-Math.PI / 2 + paper.rotation[0], paper.rotation[1], paper.rotation[2]];
  // DESK pivots content about the near edge; WALL centres it in the frame.
  const contentY = wall ? 0 : PIVOT;

  const fw = F.borderW ?? 0.13;
  const fd = F.depth ?? 0.09;

  return (
    <>
      <group ref={dimRef} position={paper.position} rotation={rot} scale={paper.scale}>
        <group position={[0, contentY, 0]}>
          {/* Picture frame (wall mode only) — backing board + four rails. */}
          {wall && (
            <group>
              <mesh position={[0, 0, -0.045]} material={frameMat}>
                <boxGeometry args={[PLANE_W + 2 * fw, PLANE_H + 2 * fw, fd]} />
              </mesh>
              <mesh position={[0, PLANE_H / 2 + fw / 2, 0]} material={frameMat}>
                <boxGeometry args={[PLANE_W + 2 * fw, fw, fd * 1.7]} />
              </mesh>
              <mesh position={[0, -PLANE_H / 2 - fw / 2, 0]} material={frameMat}>
                <boxGeometry args={[PLANE_W + 2 * fw, fw, fd * 1.7]} />
              </mesh>
              <mesh position={[-PLANE_W / 2 - fw / 2, 0, 0]} material={frameMat}>
                <boxGeometry args={[fw, PLANE_H + 2 * fw, fd * 1.7]} />
              </mesh>
              <mesh position={[PLANE_W / 2 + fw / 2, 0, 0]} material={frameMat}>
                <boxGeometry args={[fw, PLANE_H + 2 * fw, fd * 1.7]} />
              </mesh>
            </group>
          )}

          {/* Sheet */}
          <mesh receiveShadow material={paperMat}>
            <planeGeometry args={[PLANE_W, PLANE_H]} />
          </mesh>

          {/* Body copy — one <Text> per line (no embedded newlines). */}
          {bodyLines.map((ln, i) =>
            ln === "" ? null : (
              <Text
                key={`b${i}`}
                ref={(el) => (bodyRefs.current[i] = el)}
                position={[-0.6, 0.86 - i * 0.062 * 1.42, 0.006]}
                anchorX="left"
                anchorY="top"
                fontSize={0.062}
                letterSpacing={0.005}
                maxWidth={1.3}
                color="#1d1810"
                material-toneMapped={false}
              >
                {ln}
              </Text>
            ),
          )}

          {/* Signature — one <Text> per line. */}
          {signLines.map((ln, i) =>
            ln === "" ? null : (
              <Text
                key={`s${i}`}
                ref={(el) => (signRefs.current[i] = el)}
                position={[-0.6, -0.62 - i * 0.058 * 1.4, 0.006]}
                anchorX="left"
                anchorY="top"
                fontSize={0.058}
                color="#4a3c26"
                material-toneMapped={false}
              >
                {ln}
              </Text>
            ),
          )}
        </group>
      </group>

      {/* Note spotlight — rendered OUTSIDE the scaled group so its range/position
          aren't distorted by paper.scale. Aims at the sheet centre. Used in wall
          mode AND on the desk when the lamp is absent (mobile). */}
      {lit && F.spot && (
        <>
          <object3D ref={spotTarget} position={paper.position} />
          <spotLight
            ref={spotRef}
            position={[
              paper.position[0] + F.spot.offset[0],
              paper.position[1] + F.spot.offset[1],
              paper.position[2] + F.spot.offset[2],
            ]}
            color={F.spot.color}
            intensity={F.spot.intensity}
            angle={F.spot.angle}
            penumbra={F.spot.penumbra}
            distance={F.spot.distance}
            decay={2}
          />
        </>
      )}
    </>
  );
}
