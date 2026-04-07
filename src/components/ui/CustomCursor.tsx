"use client";

import { useEffect, useRef } from "react";

const MAX_RIPPLES = 5;

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
      isHovering.current = !!interactive;
    };

    // Click ripple
    const onMouseDown = () => {
      spawnRipple(pos.current.x, pos.current.y);
    };

    let raf: number;
    const animate = () => {
      ringPos.current.x += (pos.current.x - ringPos.current.x) * 0.15;
      ringPos.current.y += (pos.current.y - ringPos.current.y) * 0.15;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`;
      }

      if (ringRef.current) {
        const scale = isHovering.current ? 1.8 : 1;
        ringRef.current.style.transform = `translate(${ringPos.current.x}px, ${ringPos.current.y}px) scale(${scale})`;
        ringRef.current.style.borderColor = isHovering.current
          ? "rgba(100, 200, 255, 0.8)"
          : "rgba(100, 200, 255, 0.4)";
      }

      raf = requestAnimationFrame(animate);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mousedown", onMouseDown);
    raf = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mousedown", onMouseDown);
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

    const ripple = document.createElement("div");
    ripple.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 36px;
      height: 36px;
      margin-left: -18px;
      margin-top: -18px;
      border-radius: 50%;
      border: 1.5px solid rgba(100, 200, 255, 0.6);
      box-shadow: 0 0 8px 1px rgba(100, 200, 255, 0.15);
      pointer-events: none;
      transform: translate(${x}px, ${y}px);
      animation: cursor-ripple 0.6s ease-out forwards;
    `;

    container.appendChild(ripple);

    ripple.addEventListener("animationend", () => {
      ripple.remove();
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
          background: "#c0e8ff",
          boxShadow:
            "0 0 8px 2px rgba(100, 200, 255, 0.6), 0 0 20px 4px rgba(100, 200, 255, 0.2)",
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
          border: "1.5px solid rgba(100, 200, 255, 0.4)",
          boxShadow: "0 0 12px 1px rgba(100, 200, 255, 0.1)",
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
