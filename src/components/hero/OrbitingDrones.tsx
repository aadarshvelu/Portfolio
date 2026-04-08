"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { animState } from "@/lib/animation-state";
import { neonBannerVertex, neonBannerFragment } from "@/shaders/neon-banner.glsl";
import { cursorHoverSignal } from "@/components/ui/CustomCursor";
import type { ViewportTier } from "@/hooks/useViewportTier";

const CARDS = [
  {
    label: "View Experience", cardType: 0, route: "/experience",
    tiltZ: 0, tiltX: 15, startPhase: 0,
    flyFrom: [20, 6, 10] as [number, number, number],
    flyControl: [10, 2, 4] as [number, number, number],
  },
  {
    label: "Explore My Projects", cardType: 1, route: "/projects",
    tiltZ: 35, tiltX: 10, startPhase: 0.33,
    flyFrom: [22, 7, 6] as [number, number, number],
    flyControl: [8, 3, 5] as [number, number, number],
  },
  {
    label: "Learn More About Aadarsh", cardType: 2, route: "/about",
    tiltZ: -35, tiltX: 10, startPhase: 0.66,
    flyFrom: [-18, -5, -12] as [number, number, number],
    flyControl: [-6, -2, -6] as [number, number, number],
  },
];

const ZOOM_DURATION = 2.2; // seconds for the full slam-into-camera animation

// Base (desktop) orbit radii — scaled per tier at runtime
const BASE_ORBIT_RADIUS_X = 4.8;
const BASE_ORBIT_RADIUS_Z = 3.6;
const ORBIT_SPEED = 0.45;

function getOrbitRadii(tier: ViewportTier): { x: number; z: number } {
  const scale = tier === "mobile" ? 0.7 : tier === "tablet" ? 0.85 : 1;
  return { x: BASE_ORBIT_RADIUS_X * scale, z: BASE_ORBIT_RADIUS_Z * scale };
}
const ORBIT_CENTER_Y = 5.0;
// Banner dimensions — wider than tall, like a hanging sign
const BANNER_WIDTH = 3.4;
const BANNER_HEIGHT = 1.0;
const ROPE_LENGTH = 0.6;
const DRONE_SCALE = 0.25;
const FLY_IN_STAGGER = 0.6;
const FLY_IN_DURATION = 3;
const TILT_STRENGTH = 0.35;

const DRONE_COLOR = new THREE.Color(0.3, 0.95, 0.55);
const THRUSTER_COLOR = new THREE.Color(0.45, 1.0, 0.65);
const DEG2RAD = Math.PI / 180;

// Shared mutable pause state — any hovered card pauses ALL drones
const orbitPause = {
  paused: false,
  pauseStart: 0,
  accumulated: 0,
};

// Shared orbit reference time — set when the FIRST drone finishes fly-in.
// All drones use this so startPhase spacing stays consistent (no drift from stagger).
const globalOrbit = {
  startTime: -1,
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
  orbitRadiusX: number;
  orbitRadiusZ: number;
}

const _worldPos = new THREE.Vector3();
const _parentQuat = new THREE.Quaternion();
const _orbitQuat = new THREE.Quaternion();
const _cameraLocalQuat = new THREE.Quaternion();
const _yAxis = new THREE.Vector3(0, 1, 0);
const _bezierPos = new THREE.Vector3();

function DroneUnit({ label, cardType, route, index, startPhase, flyFrom, flyControl, orbitRadiusX, orbitRadiusZ }: DroneUnitProps) {
  const router = useRouter();
  const groupRef = useRef<THREE.Group>(null!);
  const swayRef = useRef<THREE.Group>(null!);
  const droneBodyGroupRef = useRef<THREE.Group>(null!);
  const ropeGroupRef = useRef<THREE.Group>(null!);
  const bannerGroupRef = useRef<THREE.Group>(null!);
  const cardMatRef = useRef<THREE.ShaderMaterial>(null!);
  const entranceDoneTime = useRef<number | null>(null);
  const orbitStartTime = useRef<number | null>(null);

  // Hover / tilt
  const isHovered = useRef(false);
  const tilt = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const hoverScale = useRef(1);

  // Sway physics — banner lags behind drone motion
  const lastDronePos = useRef(new THREE.Vector3());
  const swayAngle = useRef(0);
  const swayVelocity = useRef(0);

  // Zoom-to-camera state
  const isZooming = useRef(false);
  const zoomStartTime = useRef(0);
  const zoomStartPos = useRef(new THREE.Vector3());
  const zoomStartQuat = useRef(new THREE.Quaternion());
  const navigated = useRef(false);

  const cardUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTint: { value: new THREE.Color(0.4, 1.0, 0.55) },
      uOpacity: { value: 1.0 },
      uCardType: { value: cardType },
    }),
    [cardType],
  );

  const startAngle = startPhase * Math.PI * 2;

  // Fly target is computed dynamically each frame (during fly-in) to track the moving orbit slot.
  // See useFrame for actual computation.
  const flyTarget = useRef<[number, number, number]>([
    Math.cos(startAngle) * orbitRadiusX,
    0,
    Math.sin(startAngle) * orbitRadiusZ,
  ]);

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

      // --- Hide drone body + ropes; pull banner up to group origin so it covers screen ---
      // Hide quickly (within first 20% of zoom)
      const hideProgress = Math.min(zt / 0.2, 1);
      if (droneBodyGroupRef.current) {
        droneBodyGroupRef.current.scale.setScalar(1 - hideProgress);
      }
      if (ropeGroupRef.current) {
        ropeGroupRef.current.scale.setScalar(1 - hideProgress);
      }
      // Banner needs to sit at the drone group's origin (y=0) so scaling 100x is symmetric.
      //   swayRef is at groupRef.y = 0.55
      //   banner default position in swayRef = -ROPE_LENGTH - BANNER_HEIGHT/2 = -1.1
      //   → banner's current y in groupRef = 0.55 + (-1.1) = -0.55
      //   → we need to lift it by +0.55 (in swayRef local) to land at y=0 in groupRef
      if (bannerGroupRef.current) {
        const baseY = -ROPE_LENGTH - BANNER_HEIGHT / 2; // -1.1
        const lift = 0.55; // cancels swayRef's y offset
        bannerGroupRef.current.position.y = baseY + lift * hideProgress;
      }
      // Flatten sway during zoom
      if (swayRef.current) {
        swayRef.current.rotation.z *= 1 - hideProgress;
      }

      // Face camera throughout
      groupRef.current.parent!.getWorldQuaternion(_parentQuat);
      _cameraLocalQuat.copy(_parentQuat).invert().premultiply(camera.quaternion);
      groupRef.current.quaternion.slerpQuaternions(zoomStartQuat.current, _cameraLocalQuat, Math.min(zt * 2, 1));

      // Navigate at ~88% — just before the banner fully smashes the camera
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
      // Update fly target to track the live orbit slot so we land exactly where the orbit expects us.
      // If orbit hasn't started yet (this is the first drone), use the static startAngle position.
      if (globalOrbit.startTime >= 0) {
        const totalPausedFly = orbitPause.accumulated + (orbitPause.pauseStart > 0 ? t - orbitPause.pauseStart : 0);
        const liveAngle = startAngle + (t - globalOrbit.startTime - totalPausedFly) * ORBIT_SPEED;
        flyTarget.current[0] = Math.cos(liveAngle) * orbitRadiusX;
        flyTarget.current[2] = Math.sin(liveAngle) * orbitRadiusZ;
      }
      const eased = easeInOutCubic(flyInProgress);
      bezier2(_bezierPos, flyFrom, flyControl, flyTarget.current, eased);
      groupRef.current.position.copy(_bezierPos);

      const scaleProgress = Math.min(flyInElapsed / (FLY_IN_DURATION * 0.3), 1);
      groupRef.current.scale.setScalar(scaleProgress);

      groupRef.current.parent!.getWorldQuaternion(_parentQuat);
      _cameraLocalQuat.copy(_parentQuat).invert().premultiply(camera.quaternion);
      groupRef.current.quaternion.copy(_cameraLocalQuat);
    } else {
      // --- Orbiting ---
      // First drone to arrive sets the shared orbit reference time
      if (globalOrbit.startTime < 0) {
        globalOrbit.startTime = t;
      }
      const firstOrbitFrame = orbitStartTime.current === null;
      if (firstOrbitFrame) {
        orbitStartTime.current = t;
        // Reset sway state so fly-in motion doesn't carry over
        swayAngle.current = 0;
        swayVelocity.current = 0;
        lastDronePos.current.copy(groupRef.current.position);
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

      // Hover scale (visibility fade applied below once world position is known)
      const targetScale = isHovered.current ? 1.12 : 1;
      hoverScale.current += (targetScale - hoverScale.current) * 0.1;

      // Orbit angle — uses shared globalOrbit.startTime so startPhase alone drives spacing
      // (no drift from per-drone fly-in stagger)
      const totalPaused = orbitPause.accumulated + (orbitPause.pauseStart > 0 ? t - orbitPause.pauseStart : 0);
      const orbitTime = t - globalOrbit.startTime - totalPaused;
      const orbitAngle = startAngle + orbitTime * ORBIT_SPEED;

      const x = Math.cos(orbitAngle) * orbitRadiusX;
      const z = Math.sin(orbitAngle) * orbitRadiusZ;
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

      // Visibility fade — hide when behind the portrait plane (z < ~0)
      // Full visibility at z >= 1.0, hidden at z <= -0.5
      const visibility = smoothstep(_worldPos.z, -0.5, 1.0);
      groupRef.current.scale.setScalar(hoverScale.current * visibility);

      // 3D tilt on hover
      tilt.current.x += (tilt.current.targetX - tilt.current.x) * 0.1;
      tilt.current.y += (tilt.current.targetY - tilt.current.y) * 0.1;
      if (Math.abs(tilt.current.x) > 0.001 || Math.abs(tilt.current.y) > 0.001) {
        groupRef.current.rotateX(tilt.current.x);
        groupRef.current.rotateY(tilt.current.y);
      }

      // --- Banner sway physics (damped harmonic oscillator driven by drone velocity) ---
      if (swayRef.current) {
        // Compute drone's local X velocity (how fast it moved since last frame)
        const dx = groupRef.current.position.x - lastDronePos.current.x;
        lastDronePos.current.copy(groupRef.current.position);

        // Drive sway: large velocity → bigger swing kick; banner lags behind
        // Angular spring: restoring force pulls toward 0
        const stiffness = 0.08;
        const damping = 0.88;
        // Input force: opposite to drone horizontal motion (banner trails)
        swayVelocity.current += -dx * 0.6;
        // Spring pulls angle back to rest
        swayVelocity.current += -swayAngle.current * stiffness;
        // Damping
        swayVelocity.current *= damping;
        swayAngle.current += swayVelocity.current;

        // Idle breeze — gentle secondary oscillation
        const breeze = Math.sin(t * 1.2 + index * 1.5) * 0.015;
        swayRef.current.rotation.z = swayAngle.current + breeze;
      }
    }

    if (cardMatRef.current) {
      cardMatRef.current.uniforms.uTime.value = t;
    }
  });

  // Precompute rope geometry once
  const ropeGeom = useMemo(() => {
    const topY = 0;
    const bottomY = -ROPE_LENGTH;
    const bottomHalfX = BANNER_WIDTH * 0.42;
    const dxp = bottomHalfX;
    const dyp = bottomY - topY;
    const ropeLen = Math.sqrt(dxp * dxp + dyp * dyp);
    const angle = Math.atan2(dxp, -dyp);
    return {
      bottomHalfX,
      topY,
      bottomY,
      ropeLen,
      angle,
      midY: (topY + bottomY) / 2,
    };
  }, []);

  return (
    <group ref={groupRef}>
      {/* Drone body — hidden during zoom */}
      <group ref={droneBodyGroupRef} position={[0, 0.8, 0]}>
        <DroneBody />
      </group>

      {/* Rope anchor — pivots from drone bottom, sways with motion */}
      <group ref={swayRef} position={[0, 0.55, 0]}>
        {/* Ropes — hidden during zoom */}
        <group ref={ropeGroupRef}>
          <mesh position={[-ropeGeom.bottomHalfX / 2, ropeGeom.midY, 0]} rotation={[0, 0, -ropeGeom.angle]}>
            <cylinderGeometry args={[0.012, 0.012, ropeGeom.ropeLen, 6]} />
            <meshBasicMaterial color="#7ad090" transparent opacity={0.8} />
          </mesh>
          <mesh position={[ropeGeom.bottomHalfX / 2, ropeGeom.midY, 0]} rotation={[0, 0, ropeGeom.angle]}>
            <cylinderGeometry args={[0.012, 0.012, ropeGeom.ropeLen, 6]} />
            <meshBasicMaterial color="#7ad090" transparent opacity={0.8} />
          </mesh>
        </group>

        {/* Banner — scaled independently during zoom to cover the screen */}
        <group ref={bannerGroupRef} position={[0, -ROPE_LENGTH - BANNER_HEIGHT / 2, 0]}>
          <mesh
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
              zoomStartPos.current.copy(groupRef.current.position);
              zoomStartQuat.current.copy(groupRef.current.quaternion);
              zoomStartTime.current = -1;
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
            <planeGeometry args={[BANNER_WIDTH, BANNER_HEIGHT]} />
            <shaderMaterial
              ref={cardMatRef}
              vertexShader={neonBannerVertex}
              fragmentShader={neonBannerFragment}
              uniforms={cardUniforms}
              transparent
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Text label centered on the banner */}
          <Text
            position={[0, 0, 0.02]}
            fontSize={0.32}
            color="#d0ffdc"
            anchorX="center"
            anchorY="middle"
            maxWidth={BANNER_WIDTH * 0.85}
            textAlign="center"
            letterSpacing={0.04}
            font="/fonts/ShareTechMono-Regular.ttf"
          >
            {label.toUpperCase()}
          </Text>
        </group>
      </group>
    </group>
  );
}

interface OrbitingDronesProps {
  tier?: ViewportTier;
}

export default function OrbitingDrones({ tier = "desktop" }: OrbitingDronesProps) {
  const { x: orbitRadiusX, z: orbitRadiusZ } = getOrbitRadii(tier);
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
            orbitRadiusX={orbitRadiusX}
            orbitRadiusZ={orbitRadiusZ}
          />
        </group>
      ))}
    </group>
  );
}
