"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { Container } from "@/components/Container";

const easeOut = [0.22, 1, 0.36, 1] as const;

/**
 * Hero — content fades/slides in on load, then parallaxes up + fades as you scroll
 * (superpower.com style), layered over the fixed scroll.mp4 background video.
 */
export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[900px] items-center [min-height:max(900px,100vh)]"
    >
      {/* Left-to-right dark overlay for text legibility */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent"
      />

      <motion.div style={{ y, opacity }} className="relative z-10 w-full">
        <Container>
          <motion.h1
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: easeOut }}
            className="max-w-[620px] text-5xl font-bold leading-[1.04] tracking-[-0.02em] text-white md:text-[64px]"
          >
            Unlock your new health intelligence
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.12, ease: easeOut }}
            className="mt-6 max-w-[440px] text-[18px] leading-relaxed text-white/85"
          >
            Clinician-guided GLP-1 therapy. Every week. Target 50+ conditions tied
            to obesity and metabolic aging. Starting at ₹10,000/month
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.24, ease: easeOut }}
          >
            <Link
              href="/login"
              className="mt-8 inline-flex items-center justify-center rounded-2xl bg-white px-12 py-4 text-xl font-semibold text-black transition-transform hover:scale-[1.03]"
            >
              Join Today
            </Link>

            <div className="mt-6 flex items-center gap-2">
              <svg
                aria-hidden
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white/70"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m8 12 3 3 5-6" />
              </svg>
              <span className="text-[13px] font-medium tracking-wide text-white/70">
                NSF FSCC 22000
              </span>
            </div>
          </motion.div>
        </Container>
      </motion.div>
    </section>
  );
}
