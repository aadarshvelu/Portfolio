import BackButton from "@/components/ui/BackButton";

export default function AboutPage() {
  return (
    <main className="relative min-h-screen bg-black text-[#d0ffdc]">
      <BackButton />
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1
          className="text-5xl font-black tracking-tight sm:text-7xl"
          style={{
            fontFamily: "var(--font-orbitron)",
            color: "#e0ffe8",
            textShadow: "0 0 20px rgba(80, 255, 140, 0.5), 0 0 60px rgba(80, 255, 140, 0.2)",
          }}
        >
          About Aadarsh
        </h1>
        <p
          className="mt-6 text-sm tracking-widest uppercase sm:text-base"
          style={{
            fontFamily: "var(--font-share-tech-mono)",
            color: "#7ad090",
            textShadow: "0 0 12px rgba(80, 220, 130, 0.3)",
          }}
        >
          Coming soon
        </p>
      </div>
    </main>
  );
}
