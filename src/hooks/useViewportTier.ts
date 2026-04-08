"use client";

import { useEffect, useState } from "react";

export type ViewportTier = "mobile" | "tablet" | "desktop" | "ultrawide";

export function getViewportTier(width: number): ViewportTier {
  if (width < 640) return "mobile";
  if (width < 1024) return "tablet";
  if (width < 1920) return "desktop";
  return "ultrawide";
}

/**
 * Returns the current viewport tier. SSR-safe — defaults to "desktop" until mounted.
 * Updates on resize (debounced to 150ms).
 */
export function useViewportTier(): ViewportTier {
  const [tier, setTier] = useState<ViewportTier>("desktop");

  useEffect(() => {
    // Set initial tier on mount
    setTier(getViewportTier(window.innerWidth));

    let timeout: number | null = null;
    const onResize = () => {
      if (timeout !== null) window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        setTier(getViewportTier(window.innerWidth));
      }, 150);
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (timeout !== null) window.clearTimeout(timeout);
    };
  }, []);

  return tier;
}
