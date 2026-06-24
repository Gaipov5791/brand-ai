import HeroSection from "@/components/HeroSection";

export default function Home() {
  return (
    <main className="bg-[#050505]">
      <HeroSection />
      <section className="flex min-h-screen items-center justify-center bg-[#050505] px-8">
        <p className="max-w-md text-center text-sm uppercase tracking-[0.3em] text-white/25">
          Stealth wealth — revealed on your terms
        </p>
      </section>
    </main>
  );
}
