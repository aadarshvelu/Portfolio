"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { animState } from "@/lib/animation-state";
import { neonCardVertex, neonCardFragment } from "@/shaders/neon-card.glsl";
import { cursorHoverSignal } from "@/components/ui/CustomCursor";

const CARDS = [
  {
    label: "Experience", cardType: 0, route: "/experience",
    tiltZ: 0, tiltX: 15, startPhase: 0,
    flyFrom: [20, 6, 10] as [number, number, number],
    flyControl: [10, 2, 4] as [number, number, number],
  },
  {
    label: "Projects", cardType: 1, route: "/projects",
    tiltZ: 35, tiltX: 10, startPhase: 0.33,
    flyFrom: [22, 7, 6] as [number, number, number],
    flyControl: [8, 3, 5] as [number, number, number],
  },
  {
    label: "Learn More About Me", cardType: 2, route: "/about",
    tiltZ: -35, tiltX: 10, startPhase: 0.66,
    flyFrom: [-18, -5, -12] as [number, number, number],
    flyControl: [-6, -2, -6] as [number, number, number],
  },
];

const ZOOM_DURATION = 2.2; // seconds for the full slam-into-camera animation

const ORBIT_RADIUS_X = 6;
const ORBIT_RADIUS_Z = 4.5;
const ORBIT_SPEED = 0.25;
const ORBIT_CENTER_Y = 5.0;
const CARD_WIDTH = 2.6;
const CARD_HEIGHT = 3.2;
const DRONE_SCALE = 0.25;
const FLY_IN_STAGGER = 0.6;
const FLY_IN_DURATION = 3;
const TILT_STRENGTH = 0.35;

const DRONE_COLOR = new THREE.Color(0.3, 0.75, 0.95);
const THRUSTER_COLOR = new THREE.Color(0.4, 0.85, 1.0);
const DEG2RAD = Math.PI / 180;

// Shared mutable pause state — any hovered card pauses ALL drones
const orbitPause = {
  paused: false,
  pauseStart: 0,
  accumulated: 0,
};

function smoothstep(x: number, min: number, max: number): number {
  const t = Math.max(0, Math.min(1, (x - min) / (max - min)));
  return t * t * (3 - 2 * t);
}

function bezier2(
  out: THREE.Vector3,
  p0: [number, number, number],
  p1: [number, number, number],
  p2: [number, number, number],
  t: number,
) {
  const inv = 1 - t;
  out.set(
    inv * inv * p0[0] + 2 * inv * t * p1[0] + t * t * p2[0],
    inv * inv * p0[1] + 2 * inv * t * p1[1] + t * t * p2[1],
    inv * inv * p0[2] + 2 * inv * t * p1[2] + t * t * p2[2],
  );
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function DroneBody() {
  return (
    <group scale={DRONE_SCALE}>
      <mesh>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#0a1520" transparent opacity={0.85} />
      </mesh>
      <mesh>
        <octahedronGeometry args={[1.02, 0]} />
        <meshBasicMaterial color={DRONE_COLOR} wireframe transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[-1.3, 0, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[1.0, 0.05, 0.4]} />
        <meshBasicMaterial color="#0a1822" transparent opacity={0.8} />
      </mesh>
      <mesh position={[-1.3, 0.03, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[1.02, 0.06, 0.42]} />
        <meshBasicMaterial color={DRONE_COLOR} wireframe transparent opacity={0.4} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[1.3, 0, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[1.0, 0.05, 0.4]} />
        <meshBasicMaterial color="#0a1822" transparent opacity={0.8} />
      </mesh>
      <mesh position={[1.3, 0.03, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[1.02, 0.06, 0.42]} />
        <meshBasicMaterial color={DRONE_COLOR} wireframe transparent opacity={0.4} blending={THREE.AdditiveBlending} />
      </mesh>
      {(
        [[-1.7, -0.08, 0.15], [-1.7, -0.08, -0.15], [1.7, -0.08, 0.15], [1.7, -0.08, -0.15]] as [number, number, number][]
      ).map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color={THRUSTER_COLOR} transparent opacity={0.9} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
      <mesh position={[0, -0.5, 0.6]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshBasicMaterial color={THRUSTER_COLOR} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

interface DroneUnitProps {
  label: string;
  cardType: number;
  route: string;
  index: number;
  startPhase: number;
  flyFrom: [number, number, number];
  flyControl: [number, number, number];
}

const _worldPos = new THREE.Vector3();
const _parentQuat = new THREE.Quaternion();
const _orbitQuat = new THREE.Quaternion();
const _cameraLocalQuat = new THREE.Quaternion();
const _yAxis = new THREE.Vector3(0, 1, 0);
const _bezierPos = new THREE.Vector3();

function DroneUnit({ label, cardType, route, index, startPhase, flyFrom, flyControl }: DroneUnitProps) {
  const router = useRouter();
  const groupRef = useRef<THREE.Group>(null!);
  const cardMatRef = useRef<THREE.ShaderMaterial>(null!);
  const entranceDoneTime = useRef<number | null>(null);
  const orbitStartTime = useRef<number | null>(null);

  // Hover / tilt
  const isHovered = useRef(false);
  const tilt = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const hoverScale = useRef(1);

  // Zoom-to-camera state
  const isZooming = useRef(false);
  const zoomStartTime = useRef(0);
  const zoomStartPos = useRef(new THREE.Vector3());
  const zoomStartQuat = useRef(new THREE.Quaternion());
  const navigated = useRef(false);

  const cardUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTint: { value: new THREE.Color(0.4, 0.8, 1.0) },
      uOpacity: { value: 1.0 },
      uCardType: { value: cardType },
    }),
    [cardType],
  );

  const startAngle = startPhase * Math.PI * 2;

  const flyTarget: [number, number, number] = useMemo(
    () => [Math.cos(startAngle) * ORBIT_RADIUS_X, 0, Math.sin(startAngle) * ORBIT_RADIUS_Z],
    [startAngle],
  );

  useFrame(({ clock, camera }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;

    // --- Zoom-to-camera animation (takes over once triggered) ---
    if (isZooming.current) {
      if (zoomStartTime.current < 0) zoomStartTime.current = t;
      const zt = Math.min((t - zoomStartTime.current) / ZOOM_DURATION, 1);

      groupRef.current.parent!.updateWorldMatrix(true, false);
      const invParent = new THREE.Matrix4().copy(groupRef.current.parent!.matrixWorld).invert();

      // Phase A (0 - 0.5): graceful glide to scene center
      // Phase B (0.5 - 1): slow-building slam from center toward camera
      const PHASE_A = 0.5;

      // Gather point — raised above scene center so drones fly to ~20% from screen top
      // Camera looks at y=6.4; visible top is ~14.4. Y=9.0 sits ~30% above center.
      const sceneCenterLocal = new THREE.Vector3(0, 9.0, 0).applyMatrix4(invParent);

      // Camera position in parent local
      camera.getWorldPosition(_worldPos);
      const cameraLocal = _worldPos.clone().applyMatrix4(invParent);

      if (zt < PHASE_A) {
        // Phase A: ease-out glide to center
        const pa = zt / PHASE_A;
        const eased = 1 - Math.pow(1 - pa, 2); // ease-out quad
        groupRef.current.position.lerpVectors(zoomStartPos.current, sceneCenterLocal, eased);

        // Small scale bump during gather
        groupRef.current.scale.setScalar(1 + eased * 0.3);
      } else {
        // Phase B: quadratic ease-in slam — slower ramp, still punchy at the end
        const pb = (zt - PHASE_A) / (1 - PHASE_A);
        const eased = pb * pb;
        groupRef.current.position.lerpVectors(sceneCenterLocal, cameraLocal, eased);

        // Massive scale ramp (1.3 -> 100)
        groupRef.current.scale.setScalar(1.3 + 98.7 * eased);
      }

      // Face camera throughout
      groupRef.current.parent!.getWorldQuaternion(_parentQuat);
      _cameraLocalQuat.copy(_parentQuat).invert().premultiply(camera.quaternion);
      groupRef.current.quaternion.slerpQuaternions(zoomStartQuat.current, _cameraLocalQuat, Math.min(zt * 2, 1));

      // Navigate at ~88% — just before the drone fully smashes the camera
      if (zt >= 0.88 && !navigated.current) {
        navigated.current = true;
        router.push(route);
      }

      if (cardMatRef.current) {
        cardMatRef.current.uniforms.uTime.value = t;
      }
      return;
    }

    // Start fly-in when hologram scan is ~halfway
    if (animState.scanlineY > 0.4 && entranceDoneTime.current === null) {
      entranceDoneTime.current = t;
    }
    if (entranceDoneTime.current === null) {
      groupRef.current.scale.setScalar(0);
      return;
    }

    const timeSinceEntrance = t - entranceDoneTime.current;
    const flyInElapsed = timeSinceEntrance - index * FLY_IN_STAGGER;

    if (flyInElapsed < 0) {
      groupRef.current.scale.setScalar(0);
      return;
    }

    const flyInProgress = Math.min(flyInElapsed / FLY_IN_DURATION, 1);

    if (flyInProgress < 1) {
      // --- Flying in ---
      const eased = easeInOutCubic(flyInProgress);
      bezier2(_bezierPos, flyFrom, flyControl, flyTarget, eased);
      groupRef.current.position.copy(_bezierPos);

      const scaleProgress = Math.min(flyInElapsed / (FLY_IN_DURATION * 0.3), 1);
      groupRef.current.scale.setScalar(scaleProgress);

      groupRef.current.parent!.getWorldQuaternion(_parentQuat);
      _cameraLocalQuat.copy(_parentQuat).invert().premultiply(camera.quaternion);
      groupRef.current.quaternion.copy(_cameraLocalQuat);
    } else {
      // --- Orbiting ---
      if (orbitStartTime.current === null) {
        orbitStartTime.current = t;
      }

      // Global pause: accumulate paused time (only one drone needs to manage this)
      if (index === 0) {
        if (orbitPause.paused && orbitPause.pauseStart === 0) {
          orbitPause.pauseStart = t;
        }
        if (!orbitPause.paused && orbitPause.pauseStart > 0) {
          orbitPause.accumulated += t - orbitPause.pauseStart;
          orbitPause.pauseStart = 0;
        }
      }

      // Hover scale
      const targetScale = isHovered.current ? 1.12 : 1;
      hoverScale.current += (targetScale - hoverScale.current) * 0.1;
      groupRef.current.scale.setScalar(hoverScale.current);

      // Orbit angle (paused time subtracted so orbit freezes in place)
      const totalPaused = orbitPause.accumulated + (orbitPause.pauseStart > 0 ? t - orbitPause.pauseStart : 0);
      const orbitTime = t - orbitStartTime.current - totalPaused;
      const orbitAngle = startAngle + orbitTime * ORBIT_SPEED;

      const x = Math.cos(orbitAngle) * ORBIT_RADIUS_X;
      const z = Math.sin(orbitAngle) * ORBIT_RADIUS_Z;
      const bob = Math.sin(t * 1.5 + index * 2.0) * 0.12;
      groupRef.current.position.set(x, bob, z);

      // Rotation: orbit-facing <-> camera-facing blend
      const outwardAngle = -orbitAngle + Math.PI / 2;
      _orbitQuat.setFromAxisAngle(_yAxis, outwardAngle);

      groupRef.current.parent!.getWorldQuaternion(_parentQuat);
      _cameraLocalQuat.copy(_parentQuat).invert().premultiply(camera.quaternion);

      groupRef.current.getWorldPosition(_worldPos);
      const frontality = smoothstep(_worldPos.z, -1.5, 2.5);
      groupRef.current.quaternion.slerpQuaternions(_orbitQuat, _cameraLocalQuat, frontality);

      // 3D tilt on hover
      tilt.current.x += (tilt.current.targetX - tilt.current.x) * 0.1;
      tilt.current.y += (tilt.current.targetY - tilt.current.y) * 0.1;
      if (Math.abs(tilt.current.x) > 0.001 || Math.abs(tilt.current.y) > 0.001) {
        groupRef.current.rotateX(tilt.current.x);
        groupRef.current.rotateY(tilt.current.y);
      }
    }

    if (cardMatRef.current) {
      cardMatRef.current.uniforms.uTime.value = t;
    }
  });

  return (
    <group ref={groupRef}>
      <group position={[0, 0.8, 0]}>
        <DroneBody />
      </group>

      <mesh
        position={[0, -0.9, 0]}
        onPointerEnter={() => {
          isHovered.current = true;
          orbitPause.paused = true;
          cursorHoverSignal.value = true;
        }}
        onPointerLeave={() => {
          isHovered.current = false;
          tilt.current.targetX = 0;
          tilt.current.targetY = 0;
          orbitPause.paused = false;
          cursorHoverSignal.value = false;
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (isZooming.current || !groupRef.current) return;
          // Snapshot current position/rotation — clock time captured in useFrame next frame
          zoomStartPos.current.copy(groupRef.current.position);
          zoomStartQuat.current.copy(groupRef.current.quaternion);
          zoomStartTime.current = -1; // sentinel — useFrame will assign real clock time
          isZooming.current = true;
          orbitPause.paused = true;
          cursorHoverSignal.value = false;
        }}
        onPointerMove={(e) => {
          if (e.uv) {
            tilt.current.targetX = -(e.uv.y - 0.5) * 2 * TILT_STRENGTH;
            tilt.current.targetY = (e.uv.x - 0.5) * 2 * TILT_STRENGTH;
          }
        }}
      >
        <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
        <shaderMaterial
          ref={cardMatRef}
          vertexShader={neonCardVertex}
          fragmentShader={neonCardFragment}
          uniforms={cardUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <Text
        position={[0, -0.9, 0.02]}
        fontSize={0.28}
        color="#e0f4ff"
        anchorX="center"
        anchorY="middle"
        maxWidth={CARD_WIDTH * 0.65}
        textAlign="center"
        letterSpacing={0.04}
        fontWeight={700}
      >
        {label.toUpperCase()}
      </Text>
    </group>
  );
}

export default function OrbitingDrones() {
  return (
    <group position={[0, ORBIT_CENTER_Y, 0]}>
      {CARDS.map((card, i) => (
        <group key={i} rotation={[card.tiltX * DEG2RAD, 0, card.tiltZ * DEG2RAD]}>
          <DroneUnit
            label={card.label}
            cardType={card.cardType}
            route={card.route}
            index={i}
            startPhase={card.startPhase}
            flyFrom={card.flyFrom}
            flyControl={card.flyControl}
          />
        </group>
      ))}
    </group>
  );
}
