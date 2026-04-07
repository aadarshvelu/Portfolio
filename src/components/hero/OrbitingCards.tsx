"use client";

import { useRef, useMemo, useCallback } from "react";
import { useFrame, useLoader, ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { animState } from "@/lib/animation-state";

const CARD_PATHS = [
  "/cards/exp_golden_card.png",
  "/cards/know_more__golden_card.png",
  "/cards/projects_golden_card.png",
];
const ORBIT_RADIUS = 5.5;
const ORBIT_SPEED = .4;
const CARD_WIDTH = 3.9;
const CARD_HEIGHT = 5;
const BORDER_RADIUS = 0.50;
const TILT_STRENGTH = 0.3;
const CARD_ENTRANCE_DELAY = 0.4; // seconds between each card appearing
const CARD_ENTRANCE_DURATION = 0.8; // seconds for each card to fly out

function createRoundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

interface CardProps {
  texture: THREE.Texture;
  targetPosition: [number, number, number];
  rotation: [number, number, number];
  geometry: THREE.ShapeGeometry;
  index: number;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

function Card({ texture, targetPosition, rotation, geometry, index, onHoverStart, onHoverEnd }: CardProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const tiltRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const isHovered = useRef(false);
  const entranceDoneTime = useRef<number | null>(null);

  const onPointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!meshRef.current) return;
    const uv = e.uv;
    if (uv) {
      tiltRef.current.targetX = -(uv.y - 0.5) * 2 * TILT_STRENGTH;
      tiltRef.current.targetY = (uv.x - 0.5) * 2 * TILT_STRENGTH;
    }
  }, []);

  const onPointerEnter = useCallback(() => {
    isHovered.current = true;
    onHoverStart();
    document.body.style.cursor = "pointer";
  }, [onHoverStart]);

  const onPointerLeave = useCallback(() => {
    isHovered.current = false;
    tiltRef.current.targetX = 0;
    tiltRef.current.targetY = 0;
    onHoverEnd();
    document.body.style.cursor = "auto";
  }, [onHoverEnd]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    // Track when particle entrance finishes
    if (animState.isEntranceDone && entranceDoneTime.current === null) {
      entranceDoneTime.current = clock.getElapsedTime();
    }

    // Card entrance: hidden until particles done, then fly out one by one from center
    if (!animState.isEntranceDone || entranceDoneTime.current === null) {
      meshRef.current.scale.setScalar(0);
      meshRef.current.position.set(0, targetPosition[1], 0);
      return;
    }

    const timeSinceEntrance = clock.getElapsedTime() - entranceDoneTime.current;
    const cardStart = index * CARD_ENTRANCE_DELAY;
    const cardProgress = Math.min(Math.max((timeSinceEntrance - cardStart) / CARD_ENTRANCE_DURATION, 0), 1);
    const easedProgress = easeOutBack(cardProgress);

    // Lerp position from center (0,y,0) to target orbit position
    const x = targetPosition[0] * easedProgress;
    const z = targetPosition[2] * easedProgress;
    meshRef.current.position.set(x, targetPosition[1], z);

    // Scale: grow from 0 to 1
    const scale = easedProgress;

    // Hover tilt
    tiltRef.current.x += (tiltRef.current.targetX - tiltRef.current.x) * 0.1;
    tiltRef.current.y += (tiltRef.current.targetY - tiltRef.current.y) * 0.1;

    meshRef.current.rotation.set(
      rotation[0] + tiltRef.current.x,
      rotation[1] + tiltRef.current.y,
      rotation[2],
    );

    // Hover scale bump
    const hoverScale = isHovered.current ? 1.08 : 1;
    const currentScale = meshRef.current.scale.x;
    const targetScale = scale * hoverScale;
    const newScale = currentScale + (targetScale - currentScale) * 0.15;
    meshRef.current.scale.setScalar(newScale);
  });

  return (
    <mesh
      ref={meshRef}
      position={[0, targetPosition[1], 0]}
      rotation={rotation}
      geometry={geometry}
      onPointerMove={onPointerMove}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <meshStandardMaterial
        map={texture}
        transparent
        side={THREE.DoubleSide}
        emissive="#d4a030"
        emissiveIntensity={0.5}
        emissiveMap={texture}
        metalness={0.4}
        roughness={0.3}
      />
    </mesh>
  );
}

export default function OrbitingCards() {
  const groupRef = useRef<THREE.Group>(null);
  const textures = useLoader(THREE.TextureLoader, CARD_PATHS);
  const isPaused = useRef(false);

  const roundedGeometry = useMemo(() => {
    const shape = createRoundedRectShape(CARD_WIDTH, CARD_HEIGHT, BORDER_RADIUS);
    const geo = new THREE.ShapeGeometry(shape);
    const pos = geo.attributes.position;
    const uvs = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      uvs[i * 2] = (pos.getX(i) + CARD_WIDTH / 2) / CARD_WIDTH;
      uvs[i * 2 + 1] = (pos.getY(i) + CARD_HEIGHT / 2) / CARD_HEIGHT;
    }
    geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    return geo;
  }, []);

  const onHoverStart = useCallback(() => { isPaused.current = true; }, []);
  const onHoverEnd = useCallback(() => { isPaused.current = false; }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    if (animState.isEntranceDone && !isPaused.current) {
      groupRef.current.rotation.y += ORBIT_SPEED * 0.016;
    }
  });

  return (
    <group ref={groupRef} position={[0, 6.4, 0]}>
      {textures.map((texture, i) => {
        const angle = (i / CARD_PATHS.length) * Math.PI * 2;
        const x = Math.cos(angle) * ORBIT_RADIUS;
        const z = Math.sin(angle) * ORBIT_RADIUS;

        return (
          <Card
            key={i}
            texture={texture}
            targetPosition={[x, -2, z]}
            rotation={[0, -angle + Math.PI / 2, 0]}
            geometry={roundedGeometry}
            index={i}
            onHoverStart={onHoverStart}
            onHoverEnd={onHoverEnd}
          />
        );
      })}
    </group>
  );
}
