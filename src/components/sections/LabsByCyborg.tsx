"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Check, MessageCircle } from "lucide-react";

const FEATURES = [
  "80+ blood markers synced with your lifestyle data",
  "18+ high-impact markers, beyond standard tests.",
  "Comprehensive AI clinician's summary",
  "Track health across biomarkers, sleep, and activity",
] as const;

const easeOut = [0.22, 1, 0.36, 1] as const;

export function LabsByCyborg() {
  // Float the image on tablet/desktop only — it stays perfectly still on mobile.
  const [floats, setFloats] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setFloats(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <section className="bg-white md:py-20 lg:py-24">
      {/* Mobile: full-bleed, full-height, square panel. md+: centered, padded, rounded. */}
      <div className="mx-auto w-full md:max-w-[1200px] md:px-10">
        <div className="bg-cyborg-labs relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden rounded-none px-5 py-12 text-center text-white md:min-h-0 md:rounded-[2rem] md:px-12 md:py-16">
      {/* ambient depth */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-72 w-[140%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.18),transparent_70%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      <div className="relative z-10 flex w-full flex-col items-center">
        {/* heading */}
        <h2 className="text-4xl font-semibold leading-[1.02] tracking-[-0.03em] md:text-6xl">
          Labs by CYBORG
        </h2>
        <p className="mt-4 max-w-[640px] text-lg text-white/85 md:text-xl">
          Decoding the language of blood biomarkers
        </p>

        {/* hero image — stable on mobile, subtle float on md+ */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="mt-6 md:mt-10"
        >
          <motion.img
            src="/assets/lab-by-cyborg/lab-by-cyborg.png"
            alt="Labs by Cyborg app preview showing your CYBORG biomarker score"
            width={156}
            height={140}
            draggable={false}
            animate={floats ? { y: [0, -10, 0] } : { y: 0 }}
            transition={floats ? { duration: 5, repeat: Infinity, ease: "easeInOut" } : { duration: 0 }}
            className="h-auto w-[160px] select-none drop-shadow-[0_24px_48px_rgba(0,0,0,0.35)] sm:w-[220px] md:w-[280px]"
          />
        </motion.div>

        {/* glassy feature card */}
        <div className="mt-0 w-full max-w-[440px] rounded-2xl border border-white/15 bg-white/10 p-6 text-left backdrop-blur-md md:mt-10 md:p-8">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-xl font-semibold md:text-2xl">Labs by CYBORG</h3>
            <span className="shrink-0 text-sm font-medium text-white/85 md:text-base">
              Starts at $100
            </span>
          </div>

          <ul className="mt-6 flex flex-col gap-3.5 text-[15px] leading-snug text-white/95">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-col gap-2.5">
            <Link
              href="/market-place"
              className="inline-flex w-full items-center justify-center rounded-md bg-white py-2.5 text-base font-semibold text-black transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-cyborg-purple"
            >
              Buy Blood Vision
            </Link>
            <Link
              href="/concierge"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border-2 border-white/60 py-2.5 text-base font-medium text-white transition-colors duration-300 ease-out hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-cyborg-purple"
            >
              <MessageCircle className="h-5 w-5" aria-hidden />
              Talk to a specialist
            </Link>
          </div>
        </div>
      </div>
      </div>
      </div>
    </section>
  );
}
