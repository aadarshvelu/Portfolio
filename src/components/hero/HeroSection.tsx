"use client";

import dynamic from "next/dynamic";
import { useMouseParallax } from "@/hooks/useMouseParallax";
import HeroOverlay from "./HeroOverlay";

const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false });

export default function HeroSection() {
  useMouseParallax(0.3);

  return (
    <section className="relative h-screen w-screen overflow-hidden bg-black">
      <div className="absolute inset-0 z-0">
        <HeroCanvas />
      </div>
      <HeroOverlay />
    </section>
  );
}
