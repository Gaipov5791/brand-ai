"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

const CapScene3D = dynamic(() => import("./CapScene3D"), { ssr: false });

gsap.registerPlugin(ScrollTrigger, useGSAP);

const SCRUB_SMOOTHNESS = 0.5;

export default function HeroSection() {
  const triggerRef = useRef<HTMLElement>(null);
  const brandRef = useRef<HTMLHeadingElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const sceneWrapRef = useRef<HTMLDivElement>(null);
  const [timeline, setTimeline] = useState<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      const trigger = triggerRef.current;
      const brand = brandRef.current;
      const scrollHint = scrollHintRef.current;
      const sceneWrap = sceneWrapRef.current;
      if (!trigger || !brand || !scrollHint || !sceneWrap) return;

      gsap.set(brand, {
        filter: "blur(0px)",
        willChange: "transform, opacity, filter",
      });
      gsap.set(scrollHint, { willChange: "opacity" });
      gsap.set(sceneWrap, { opacity: 0, willChange: "opacity" });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger,
          start: "top top",
          end: "bottom bottom",
          scrub: SCRUB_SMOOTHNESS,
        },
      });

      setTimeline(tl);

      tl.to(
        scrollHint,
        { opacity: 0, duration: 0.15, ease: "power2.inOut" },
        0,
      );

      // 0% → 25%: BRAND dissolves with cinematic blur
      tl.to(
        brand,
        {
          opacity: 0,
          y: -28,
          scale: 0.94,
          filter: "blur(4px)",
          duration: 0.25,
          ease: "power2.inOut",
        },
        0,
      );

      // 25% → 50%: 3D scene emerges from darkness
      tl.fromTo(
        sceneWrap,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.25,
          ease: "power2.out",
        },
        0.25,
      );

      // 50% → 100%: rotation driven inside CapScene3D via the same timeline

      const onResize = () => {
        ScrollTrigger.refresh();
      };

      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
        setTimeline(null);
        gsap.set(brand, { clearProps: "willChange,filter" });
        gsap.set(scrollHint, { clearProps: "willChange" });
        gsap.set(sceneWrap, { clearProps: "willChange" });
      };
    },
    { scope: triggerRef },
  );

  return (
    <section ref={triggerRef} className="relative h-[300vh] w-full">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#050505]">
        <div
          ref={sceneWrapRef}
          className="absolute inset-0 z-10 block h-screen min-h-screen w-full pointer-events-none"
          style={{ opacity: 0 }}
        >
          <CapScene3D timeline={timeline} />
        </div>

        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <h1
            ref={brandRef}
            className="select-none text-5xl font-bold uppercase tracking-[0.42em] text-white/55 sm:text-7xl md:text-8xl"
            style={{ filter: "blur(0px)" }}
          >
            Brand
          </h1>
        </div>

        <div
          ref={scrollHintRef}
          className="absolute bottom-10 left-1/2 z-20 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-3 opacity-30">
            <span className="text-[10px] uppercase tracking-[0.35em] text-white/80">
              Scroll
            </span>
            <div className="h-px w-8 bg-gradient-to-b from-white/60 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
