"use client";

import { useEffect, useRef } from "react";

const MAX_RIPPLES = 5;

// Shared flag any component can set to signal a hoverable state to the cursor
export const cursorHoverSignal = { value: false };

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const rippleContainerRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const isHovering = useRef(false);
  const isVisible = useRef(false);

  useEffect(() => {
    if ("ontouchstart" in window) return;

    const onMouseMove = (e: MouseEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
      if (!isVisible.current) {
        isVisible.current = true;
        if (dotRef.current) dotRef.current.style.opacity = "1";
        if (ringRef.current) ringRef.current.style.opacity = "1";
      }
    };

    const onMouseLeave = () => {
      isVisible.current = false;
      if (dotRef.current) dotRef.current.style.opacity = "0";
      if (ringRef.current) ringRef.current.style.opacity = "0";
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactive =
        target.closest("a, button, [data-cursor-hover]") ||
        target.tagName === "A" ||
        target.tagName === "BUTTON";
      const wasHovering = isHovering.current;
      isHovering.current = !!interactive;
      // Spawn ripple when entering hover state
      if (!wasHovering && isHovering.current) {
        spawnRipple(pos.current.x, pos.current.y);
      }
    };

    let raf: number;
    const animate = () => {
      // Also check the external hover signal (from R3F canvas events)
      const wasHovering = isHovering.current;
      const external = cursorHoverSignal.value;
      if (external && !wasHovering) {
        isHovering.current = true;
        spawnRipple(pos.current.x, pos.current.y);
      } else if (!external && wasHovering) {
        // Only reset if DOM hover isn't active either
        isHovering.current = false;
      }

      ringPos.current.x += (pos.current.x - ringPos.current.x) * 0.15;
      ringPos.current.y += (pos.current.y - ringPos.current.y) * 0.15;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`;
      }

      if (ringRef.current) {
        const scale = isHovering.current ? 1.8 : 1;
        ringRef.current.style.transform = `translate(${ringPos.current.x}px, ${ringPos.current.y}px) scale(${scale})`;
        ringRef.current.style.borderColor = isHovering.current
          ? "rgba(255, 80, 80, 0.9)"
          : "rgba(80, 255, 140, 0.4)";
        ringRef.current.style.boxShadow = isHovering.current
          ? "0 0 16px 2px rgba(255, 80, 80, 0.4), 0 0 40px 8px rgba(255, 60, 60, 0.15)"
          : "0 0 12px 1px rgba(80, 255, 140, 0.1)";
      }
      if (dotRef.current) {
        dotRef.current.style.background = isHovering.current ? "#ff6060" : "#c0ffd0";
        dotRef.current.style.boxShadow = isHovering.current
          ? "0 0 10px 2px rgba(255, 80, 80, 0.7), 0 0 24px 5px rgba(255, 60, 60, 0.25)"
          : "0 0 8px 2px rgba(80, 255, 140, 0.6), 0 0 20px 4px rgba(80, 255, 140, 0.2)";
      }

      raf = requestAnimationFrame(animate);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseover", onMouseOver);
    raf = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseover", onMouseOver);
      cancelAnimationFrame(raf);
    };
  }, []);

  function spawnRipple(x: number, y: number) {
    const container = rippleContainerRef.current;
    if (!container) return;

    // Cap ripple count
    while (container.children.length >= MAX_RIPPLES) {
      container.removeChild(container.children[0]);
    }

    // Wrapper handles position; inner element handles scale animation
    // (keeps transforms independent, works on Safari)
    const wrapper = document.createElement("div");
    wrapper.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      pointer-events: none;
      transform: translate(${x}px, ${y}px);
    `;

    const ripple = document.createElement("div");
    ripple.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 36px;
      height: 36px;
      margin-left: -18px;
      margin-top: -18px;
      border-radius: 50%;
      border: 1.5px solid rgba(255, 80, 80, 0.7);
      box-shadow: 0 0 10px 1px rgba(255, 80, 80, 0.2);
      pointer-events: none;
      animation: cursor-ripple 0.6s ease-out forwards;
    `;

    wrapper.appendChild(ripple);
    container.appendChild(wrapper);

    ripple.addEventListener("animationend", () => {
      wrapper.remove();
    });
  }

  return (
    <>
      {/* Inner dot */}
      <div
        ref={dotRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          marginLeft: -3,
          marginTop: -3,
          borderRadius: "50%",
          background: "#c0ffd0",
          boxShadow:
            "0 0 8px 2px rgba(80, 255, 140, 0.6), 0 0 20px 4px rgba(80, 255, 140, 0.2)",
          pointerEvents: "none",
          zIndex: 9999,
          opacity: 0,
          transition: "opacity 0.3s",
          willChange: "transform",
        }}
      />
      {/* Outer ring */}
      <div
        ref={ringRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 36,
          height: 36,
          marginLeft: -18,
          marginTop: -18,
          borderRadius: "50%",
          border: "1.5px solid rgba(80, 255, 140, 0.4)",
          boxShadow: "0 0 12px 1px rgba(80, 255, 140, 0.1)",
          pointerEvents: "none",
          zIndex: 9998,
          opacity: 0,
          transition: "opacity 0.3s, border-color 0.3s, transform 0.2s ease-out",
          willChange: "transform",
        }}
      />
      {/* Ripple container */}
      <div ref={rippleContainerRef} style={{ pointerEvents: "none", zIndex: 9997 }} />
    </>
  );
}
