"use client";

import { useEffect } from "react";
import { animState } from "@/lib/animation-state";

export function useMouseParallax(strength: number = 0.3) {
  useEffect(() => {
    // Disable on touch devices
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to -1 to 1
      animState.mouseX = ((e.clientX / window.innerWidth) * 2 - 1) * strength;
      animState.mouseY = ((e.clientY / window.innerHeight) * 2 - 1) * -strength;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [strength]);
}
