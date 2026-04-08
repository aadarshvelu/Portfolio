"use client";

import { motion } from "framer-motion";

type Contact = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const CONTACTS: Contact[] = [
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/aadarshvelu",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-6 lg:w-6">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/+971528070820",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-6 lg:w-6">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  {
    label: "Email",
    href: "mailto:aadarshvelu@gmail.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-6 lg:w-6">
        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
      </svg>
    ),
  },
  {
    label: "Kaggle",
    href: "https://kaggle.com/aadarshvelu",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-6 lg:w-6">
        <path d="M18.825 23.859c-.022.092-.117.141-.281.141h-3.139c-.187 0-.351-.082-.492-.248l-5.178-6.589-1.448 1.374v5.111c0 .235-.117.352-.351.352H5.505c-.236 0-.354-.117-.354-.352V.353c0-.233.118-.353.354-.353h2.431c.234 0 .351.12.351.353v14.343l6.203-6.272c.165-.165.33-.246.495-.246h3.239c.144 0 .236.06.285.18.046.149.034.255-.036.315l-6.555 6.344 6.836 8.507c.095.104.117.208.07.336" />
      </svg>
    ),
  },
];

export default function ContactIcons() {
  return (
    <motion.div
      className="mt-3 flex items-center justify-center gap-2 sm:mt-5 sm:gap-4 lg:mt-6 lg:justify-end lg:gap-7"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 3.7, ease: "easeOut" }}
    >
      {CONTACTS.map((c, i) => (
        <motion.a
          key={c.label}
          href={c.href}
          target={c.href.startsWith("mailto:") ? undefined : "_blank"}
          rel={c.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
          aria-label={c.label}
          title={c.label}
          className="scifi-icon pointer-events-auto group relative inline-flex h-9 w-9 items-center justify-center text-[#7ad090] transition-colors duration-300 hover:text-[#e0ffe8] sm:h-11 sm:w-11 lg:h-14 lg:w-14"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: 3.7 + i * 0.08,
            ease: "easeOut",
          }}
        >
          {/* Corner brackets */}
          <span className="pointer-events-none absolute left-0 top-0 h-2.5 w-2.5 border-l border-t border-[#7ad090]/60 transition-all duration-300 group-hover:h-3.5 group-hover:w-3.5 lg:h-3.5 lg:w-3.5 lg:group-hover:h-5 lg:group-hover:w-5 group-hover:border-[#e0ffe8] group-hover:shadow-[0_0_8px_rgba(80,255,140,0.8)]" />
          <span className="pointer-events-none absolute right-0 top-0 h-2.5 w-2.5 border-r border-t border-[#7ad090]/60 transition-all duration-300 group-hover:h-3.5 group-hover:w-3.5 lg:h-3.5 lg:w-3.5 lg:group-hover:h-5 lg:group-hover:w-5 group-hover:border-[#e0ffe8] group-hover:shadow-[0_0_8px_rgba(80,255,140,0.8)]" />
          <span className="pointer-events-none absolute bottom-0 left-0 h-2.5 w-2.5 border-b border-l border-[#7ad090]/60 transition-all duration-300 group-hover:h-3.5 group-hover:w-3.5 lg:h-3.5 lg:w-3.5 lg:group-hover:h-5 lg:group-hover:w-5 group-hover:border-[#e0ffe8] group-hover:shadow-[0_0_8px_rgba(80,255,140,0.8)]" />
          <span className="pointer-events-none absolute bottom-0 right-0 h-2.5 w-2.5 border-b border-r border-[#7ad090]/60 transition-all duration-300 group-hover:h-3.5 group-hover:w-3.5 lg:h-3.5 lg:w-3.5 lg:group-hover:h-5 lg:group-hover:w-5 group-hover:border-[#e0ffe8] group-hover:shadow-[0_0_8px_rgba(80,255,140,0.8)]" />

          {/* Inner dark panel appears on hover */}
          <span className="pointer-events-none absolute inset-1 bg-[#7ad090]/0 transition-all duration-300 group-hover:bg-[#7ad090]/10" />

          {/* Scan line sweep on hover */}
          <span className="scifi-scan pointer-events-none absolute left-1 right-1 top-1 h-px bg-gradient-to-r from-transparent via-[#e0ffe8] to-transparent opacity-0 group-hover:opacity-100" />

          {/* Icon — sits above overlays */}
          <span className="relative z-10 drop-shadow-[0_0_6px_rgba(80,220,130,0.4)] group-hover:drop-shadow-[0_0_12px_rgba(80,255,140,0.9)]">
            {c.icon}
          </span>
        </motion.a>
      ))}
    </motion.div>
  );
}
