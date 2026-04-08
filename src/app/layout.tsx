import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist, Geist_Mono } from "next/font/google";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import { ViewportProvider } from "@/components/providers/ViewportProvider";
import CustomCursor from "@/components/ui/CustomCursor";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = localFont({
  src: [
    { path: "../../public/fonts/Orbitron-Bold.ttf", weight: "700", style: "normal" },
    { path: "../../public/fonts/Orbitron-Black.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-orbitron",
  display: "swap",
});

const shareTechMono = localFont({
  src: [
    { path: "../../public/fonts/ShareTechMono-Regular.ttf", weight: "400", style: "normal" },
  ],
  variable: "--font-share-tech-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aadarsh | Creative Developer",
  description: "Portfolio of Aadarsh — Creative Developer crafting immersive web experiences with WebGL, Three.js, and modern frontend technologies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} ${shareTechMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col cursor-none">
          <ViewportProvider>
            <CustomCursor />
            <SmoothScrollProvider>{children}</SmoothScrollProvider>
          </ViewportProvider>
        </body>
    </html>
  );
}
