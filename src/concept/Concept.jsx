import React, { Suspense, useCallback, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import Scene from "./Scene";
import Overlay from "./Overlay";
import { SCENE_CONFIG, ASSET_URLS } from "./config/sceneConfig";
import "./styles.css";

// Warm the GLB cache so the scene pops in without a hitch.
useGLTF.preload(ASSET_URLS.lamp);
useGLTF.preload(ASSET_URLS.tv);
useGLTF.preload(ASSET_URLS.pen);

/**
 * Concept — opening sequence of a cinematic portfolio.
 *
 * The user enters a dark room: a desk, a study lamp, a sheet of paper and a
 * dormant CRT television. A short scroll range (≈5–8s) dollies the camera from
 * a wide readable shot of the paper into the glowing television, which resolves
 * to "SIGNAL FOUND / LOADING ARCHIVE..." before firing onSequenceComplete().
 *
 * Mount directly:
 *   import Concept from "./concept/Concept";
 *   root.render(<Concept />);
 */
export default function Concept({ onSequenceComplete }) {
  const scrollRef = useRef(null);
  const progress = useRef(0);
  const [entered, setEntered] = useState(false);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    progress.current = max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0;
  }, []);

  const handleComplete = useCallback(() => {
    if (entered) return;
    setEntered(true);
    if (typeof onSequenceComplete === "function") {
      onSequenceComplete();
    } else {
      // eslint-disable-next-line no-console
      console.log("ENTER PORTFOLIO");
    }
  }, [entered, onSequenceComplete]);

  return (
    <div className="concept-root">
      <Canvas
        className="concept-canvas"
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{
          fov: SCENE_CONFIG.camera.fovStart,
          near: 0.1,
          far: 100,
          position: SCENE_CONFIG.camera.path[0].position,
        }}
        shadows
      >
        <Suspense fallback={null}>
          <Scene progress={progress} onSequenceComplete={handleComplete} />
        </Suspense>
      </Canvas>

      <Overlay />

      {/* Scroll driver — gives the page real height and drives `progress`. */}
      <div className="concept-scroll" ref={scrollRef} onScroll={handleScroll}>
        <div className="concept-scroll-spacer" />
      </div>

      {!entered && <div className="concept-hint">scroll</div>}
    </div>
  );
}
