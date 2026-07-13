import { createContext, useContext } from "react";
import { SCENE_CONFIG } from "./config/sceneConfig";
import { LAYOUT_PROFILES } from "./config/layoutProfiles";
import { CAMERA_PROFILES } from "./config/cameraProfiles";
import { qualityFor } from "./config/qualityProfiles";

/**
 * buildLayout — merge the per-device profile (positions / rotations / scales)
 * with the base SCENE_CONFIG (which still owns everything else: the lamp's light
 * details, the TV's screen/glow/rim, the clock's styling, etc.). Components read
 * the result via useLayout(), so NO transform is hardcoded in a component.
 */
export function buildLayout(device = "desktop") {
  const L = LAYOUT_PROFILES[device] || LAYOUT_PROFILES.desktop;
  const winScale = L.windowScale ?? 1;
  const pick = (a, b) => (a !== undefined ? a : b); // profile delta, else sceneConfig
  const C = SCENE_CONFIG;
  return {
    device,
    lamp: {
      ...C.lamp,
      position: pick(L.lampPosition, C.lamp.position),
      rotation: pick(L.lampRotation, C.lamp.rotation),
      scale: pick(L.lampScale, C.lamp.scale),
      light: pick(L.lampLight, C.lamp.light),
    },
    paper: {
      ...C.paper,
      position: pick(L.paperPosition, C.paper.position),
      rotation: pick(L.paperRotation, C.paper.rotation),
      scale: pick(L.paperScale, C.paper.scale),
      wall: pick(L.paperWall, C.paper.wall),
      lit: pick(L.paperLit, C.paper.lit),
      frame: C.paper.frame,
    },
    pen: {
      ...C.pen,
      position: pick(L.penPosition, C.pen.position),
      rotation: pick(L.penRotation, C.pen.rotation),
      scale: pick(L.penScale, C.pen.scale),
    },
    tv: {
      ...C.tv,
      position: pick(L.tvPosition, C.tv.position),
      rotation: pick(L.tvRotation, C.tv.rotation),
      scale: pick(L.tvScale, C.tv.scale),
    },
    clock: {
      ...C.clock,
      position: pick(L.clockPosition, C.clock.position),
      rotation: pick(L.clockRotation, C.clock.rotation),
      scale: pick(L.clockScale, 1),
    },
    window: {
      ...C.window,
      position: pick(L.windowPosition, C.window.position),
      paneSize: C.window.paneSize.map((v) => v * winScale),
    },
    desk: {
      ...C.desk,
      position: pick(L.deskPosition, C.desk.position),
    },
    curtain: C.curtain,
    camera: CAMERA_PROFILES[device] || CAMERA_PROFILES.desktop,
    quality: qualityFor(device),
  };
}

// Default to desktop so a component used outside the provider still works.
const LayoutContext = createContext(buildLayout("desktop"));

export const LayoutProvider = LayoutContext.Provider;

export function useLayout() {
  return useContext(LayoutContext);
}
