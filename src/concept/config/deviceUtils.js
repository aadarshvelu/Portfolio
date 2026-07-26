import { useEffect, useState } from "react";

/**
 * deviceUtils — pick a "camera setup" by viewport width.
 *
 *   desktop : >= 1280px
 *   tablet  : 768px – 1279px
 *   mobile  : < 768px
 *
 * Each is treated as a different shot of the SAME room (see cameraProfiles.js /
 * layoutProfiles.js), not a scaled-down desktop.
 */
export const BREAKPOINTS = { tablet: 768, desktop: 1280 };

export function getDeviceType(width) {
  // Debug/testing override: window.__forceDevice = 'tablet' | 'mobile' | 'desktop'
  if (typeof window !== "undefined" && window.__forceDevice) return window.__forceDevice;
  const w = width ?? (typeof window !== "undefined" ? window.innerWidth : 1280);
  if (w >= BREAKPOINTS.desktop) return "desktop";
  if (w >= BREAKPOINTS.tablet) return "tablet";
  return "mobile";
}

/** Live device type that updates on resize / orientation change. */
export function useDeviceType() {
  const [device, setDevice] = useState(() => getDeviceType());
  useEffect(() => {
    const onResize = () => setDevice(getDeviceType());
    onResize();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);
  return device;
}
