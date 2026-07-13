import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { LayoutProvider, buildLayout } from "./layoutContext";
import CameraRig from "./CameraRig";
import Room from "./Room";
import Desk from "./Desk";
import Paper from "./Paper";
import Lamp from "./Lamp";
import Pen from "./Pen";
import Television from "./Television";
import Curtain from "./Curtain";
import Clock from "./Clock";
import DustParticles from "./DustParticles";

/**
 * Scene — composes the room and animates a single shared `phase` value
 * (0 → 1) derived from scroll progress. Children read `phase` from a ref so
 * the whole sequence stays in lockstep without re-rendering React each frame.
 */
export default function Scene({ progress, phaseOut, device = "desktop" }) {
  const phase = useRef(0);
  const layout = useMemo(() => buildLayout(device), [device]);

  // Mobile AND tablet use the stripped portrait composition: the TV + the
  // spotlit note on the desk, no lamp/clock/pen/dust. With the lamp gone the
  // desk falls dark, so the lit pieces read cleanly. (The note carries its OWN
  // spotlight via paperLit.) Only desktop keeps the full room.
  const bare = device !== "desktop";

  useFrame((_, delta) => {
    // Ease the raw scroll toward a smoothed phase for filmic motion. Smoothing
    // is symmetric, so scrolling backward rewinds the move just as smoothly.
    const target = progress.current ?? 0;
    const k = 1 - Math.pow(0.0015, delta); // frame-rate independent smoothing
    phase.current += (target - phase.current) * k;

    // Publish the smoothed phase so the wrapper can drive DOM fades in lockstep.
    if (phaseOut) phaseOut.current = phase.current;
  });

  return (
    <LayoutProvider value={layout}>
      <CameraRig phase={phase} />

      {/* Faint base so the room reads as a space, not a void. The lamp does
          the real work of carving out the focal pool. */}
      <ambientLight intensity={0.22} color="#2a2840" />
      <hemisphereLight args={["#26243a", "#06050a", 0.35]} />

      {/* Procedural environment (no external asset) — gives the lamp metal and
          the TV glass subtle, mood-appropriate reflections. Kept dim so the
          room stays dark. */}
      <Environment resolution={layout.quality.envResolution} environmentIntensity={0.18}>
        <Lightformer intensity={2} color="#ffb45a" position={[-2, 3, 2]} scale={3} />
        <Lightformer intensity={1.2} color="#3b6dff" position={[4, 2, -1]} scale={3} />
        <Lightformer intensity={0.6} color="#1a2a55" position={[-4, 3, -3]} scale={4} />
      </Environment>

      {/* Opaque backdrop so the (alpha) canvas is solid everywhere except the
          portal the TV punches through — keeps the App hidden until revealed. */}
      <mesh position={[0, 4, -9]}>
        <planeGeometry args={[90, 60]} />
        <meshBasicMaterial color="#050407" />
      </mesh>

      <Room phase={phase} />
      <Desk />
      <Paper phase={phase} />
      <Television phase={phase} />

      <Curtain />

      {/* Desk props — DESKTOP only. Mobile + tablet use the bare portrait shot
          (TV + spotlit note), so the lamp, pen, clock and lamp-cone dust drop. */}
      {!bare && <Lamp />}
      {!bare && <Pen />}
      {!bare && <Clock />}
      {!bare && <DustParticles phase={phase} />}

      {/* Soft global fog to dissolve the room edges into black. */}
      <fog attach="fog" args={["#050407", 6, 16]} />
    </LayoutProvider>
  );
}
