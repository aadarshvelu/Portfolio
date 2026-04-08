"use client";

import { motion } from "framer-motion";
import ContactIcons from "@/components/ui/ContactIcons";

export default function HeroOverlay() {
  return (
    <div className="pointer-events-none relative z-10 h-full w-full">
      {/* Name + title — centered in empty upper area on mobile/tablet, top-right on desktop */}
      <div className="absolute left-1/2 top-[6%] -translate-x-1/2 text-center md:top-[4%] lg:left-auto lg:right-16 lg:top-16 lg:translate-x-0 lg:text-right">
        <motion.h1
          className="hero-glitch pointer-events-auto whitespace-nowrap text-4xl font-black tracking-tight sm:text-5xl md:text-5xl lg:text-7xl"
          data-text="Aadarsh velu"
          style={{ color: "#e0ffe8", fontFamily: "var(--font-orbitron)" }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.8, ease: "easeOut" }}
        >
          Aadarsh velu
        </motion.h1>
        <motion.p
          className="pointer-events-auto mt-2 whitespace-nowrap text-xs tracking-[0.2em] uppercase sm:text-sm sm:tracking-widest md:mt-1 md:text-sm lg:mt-2 lg:text-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: [0, 0.6, 1, 0.6],
            y: 0,
            textShadow: [
              "0 0 8px rgba(80, 255, 140, 0.3), 0 0 25px rgba(80, 255, 140, 0.1)",
              "0 0 8px rgba(80, 255, 140, 0.3), 0 0 25px rgba(80, 255, 140, 0.1)",
              "0 0 20px rgba(80, 255, 140, 0.7), 0 0 60px rgba(80, 255, 140, 0.3), 0 0 100px rgba(80, 255, 140, 0.1)",
              "0 0 8px rgba(80, 255, 140, 0.3), 0 0 25px rgba(80, 255, 140, 0.1)",
            ],
          }}
          style={{ color: "#70e090", fontFamily: "var(--font-share-tech-mono)" }}
          transition={{
            y: { duration: 0.8, delay: 3.1, ease: "easeOut" },
            opacity: {
              duration: 3,
              delay: 3.1,
              ease: "easeInOut",
              repeat: Infinity,
              times: [0, 0.01, 0.5, 1],
            },
            textShadow: {
              duration: 3,
              delay: 3.1,
              ease: "easeInOut",
              repeat: Infinity,
              times: [0, 0.01, 0.5, 1],
            },
          }}
        >
          AI Full-Stack Engineer
        </motion.p>

        {/* Bio — 3 lines on mobile (natural wrap), 2 lines on sm+ (forced break) */}
        <motion.p
          className="pointer-events-auto mx-auto mt-3 max-w-[260px] text-[10px] leading-relaxed tracking-wide sm:mt-4 sm:max-w-none sm:whitespace-nowrap sm:text-xs md:mt-3 md:text-sm lg:ml-auto lg:mr-0 lg:mt-4 lg:text-sm"
          style={{
            color: "#8fc89e",
            textShadow: "0 0 10px rgba(100, 200, 130, 0.2)",
            fontFamily: "var(--font-share-tech-mono)",
          }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 0.85, y: 0 }}
          transition={{ duration: 0.9, delay: 3.3, ease: "easeOut" }}
        >
          Started at 16 with curiosity, hired at 18 without a degree.{" "}
          <br className="hidden sm:inline" />
          I&apos;ve been building full-stack and AI ever since, across many startups.
        </motion.p>

        {/* Contact icons — sci-fi themed, below the bio */}
        <ContactIcons />
      </div>

      {/* Tagline — bottom center on mobile, left edge on tablet, left center on desktop */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center md:bottom-8 md:left-6 md:translate-x-0 md:text-left lg:bottom-auto lg:left-16 lg:top-1/2 lg:-translate-y-1/2">
        <motion.p
          className="pointer-events-auto max-w-[260px] text-sm leading-relaxed tracking-wide sm:text-base md:max-w-[180px] md:text-xs lg:max-w-[220px] lg:text-base"
          style={{
            color: "#5ab872",
            textShadow: "0 0 12px rgba(80, 200, 120, 0.25)",
            fontFamily: "var(--font-share-tech-mono)",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 3.5, ease: "easeOut" }}
        >
          Where Creativity Meets Innovation
        </motion.p>
      </div>
    </div>
  );
}
