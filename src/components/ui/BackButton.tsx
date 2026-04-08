"use client";

import Link from "next/link";

export default function BackButton() {
  return (
    <Link
      href="/"
      className="group fixed left-6 top-6 z-50 inline-flex items-center gap-2 rounded-full border border-[#7ad090]/40 bg-black/40 px-4 py-2 text-sm font-medium text-[#d0ffdc] backdrop-blur-sm transition-all hover:border-[#7ad090] hover:bg-[#7ad090]/10 sm:left-10 sm:top-10"
      style={{
        fontFamily: "var(--font-share-tech-mono)",
        textShadow: "0 0 8px rgba(80, 220, 130, 0.4)",
        boxShadow: "0 0 20px rgba(80, 220, 130, 0.15)",
      }}
    >
      <span className="transition-transform group-hover:-translate-x-1">←</span>
      <span>BACK</span>
    </Link>
  );
}
