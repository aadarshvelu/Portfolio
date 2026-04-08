"use client";

import { createContext, useContext, ReactNode } from "react";
import { useViewportTier, type ViewportTier } from "@/hooks/useViewportTier";

const ViewportContext = createContext<ViewportTier>("desktop");

export function ViewportProvider({ children }: { children: ReactNode }) {
  const tier = useViewportTier();
  return <ViewportContext.Provider value={tier}>{children}</ViewportContext.Provider>;
}

export function useViewport(): ViewportTier {
  return useContext(ViewportContext);
}

export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}
