"use client";

import { motion } from "framer-motion";

export default function HeroOverlay() {
  return (
    <div className="pointer-events-none relative z-10 h-full w-full">
      {/* Name + title — top right */}
      <div className="absolute right-8 top-12 text-right sm:right-16 sm:top-16">
        <motion.h1
          className="hero-glitch pointer-events-auto text-5xl font-bold tracking-tight sm:text-7xl"
          data-text="Aadarsh velu"
          style={{ color: "#e0f0ff" }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.8, ease: "easeOut" }}
        >
          Aadarsh velu
        </motion.h1>
        <motion.p
          className="pointer-events-auto mt-2 text-lg font-medium tracking-widest uppercase sm:text-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: [0, 0.6, 1, 0.6],
            y: 0,
            textShadow: [
              "0 0 8px rgba(100, 200, 255, 0.3), 0 0 25px rgba(100, 200, 255, 0.1)",
              "0 0 8px rgba(100, 200, 255, 0.3), 0 0 25px rgba(100, 200, 255, 0.1)",
              "0 0 20px rgba(100, 200, 255, 0.7), 0 0 60px rgba(100, 200, 255, 0.3), 0 0 100px rgba(100, 200, 255, 0.1)",
              "0 0 8px rgba(100, 200, 255, 0.3), 0 0 25px rgba(100, 200, 255, 0.1)",
            ],
          }}
          style={{ color: "#80d0ff" }}
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
      </div>

      {/* Tagline — left center, vertical */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 sm:left-16">
        <motion.p
          className="pointer-events-auto max-w-[180px] text-sm font-light leading-relaxed tracking-wide sm:max-w-[220px] sm:text-base"
          style={{
            color: "#5a9ab8",
            textShadow: "0 0 12px rgba(80, 160, 220, 0.25)",
          }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 3.5, ease: "easeOut" }}
        >
          Where Creativity
          <br />
          Meets Innovation
        </motion.p>
      </div>
    </div>
  );
}
