"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { Container } from "@/components/Container";
import { CountUp } from "@/components/CountUp";

const easeOut = [0.22, 1, 0.36, 1] as const;

/** Headline words slide up out of per-word overflow masks (transform-only). */
function MaskedWords({
  text,
  baseDelay,
  start,
}: {
  text: string;
  baseDelay: number;
  start: boolean;
}) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        // pb/-mb keep descenders ("y", "g") visible inside the overflow mask
        // despite the tight leading-[1.05].
        <span
          key={i}
          className="inline-block overflow-hidden pb-[0.1em] -mb-[0.1em] align-bottom"
        >
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            animate={start ? { y: 0 } : undefined}
            transition={{ duration: 0.7, delay: baseDelay + i * 0.05, ease: easeOut }}
          >
            {i < words.length - 1 ? `${word} ` : word}
          </motion.span>
        </span>
      ))}
    </>
  );
}

const statItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
};

/**
 * Hero — orchestrated entrance (badge → masked headline → subcopy → CTAs →
 * counting stats) gated on the preloader via `start`, then parallaxes up +
 * fades as you scroll (superpower.com style), layered over the fixed
 * landing-hero.mp4 background video.
 */
export function Hero({ start = true }: { start?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const stats = [
    {
      title: "Whole body check",
      sub: (
        <>
          Detect{" "}
          <CountUp
            to={1000}
            start={start}
            delay={0.2}
            format={(n) => `${Math.round(n).toLocaleString("en-IN")}+`}
          />{" "}
          conditions
        </>
      ),
    },
    {
      title: "Accessible",
      sub: (
        <>
          Starts at{" "}
          <CountUp
            to={15000}
            start={start}
            delay={0.2}
            format={(n) => `₹${Math.round(n).toLocaleString("en-IN")}`}
          />
          /month
        </>
      ),
    },
    {
      title: "Trusted",
      sub: (
        <>
          <CountUp
            to={1000000}
            start={start}
            delay={0.2}
            format={(n) => (n >= 995000 ? "1M" : `${Math.round(n / 1000)}K`)}
          />{" "}
          biomarkers tested
        </>
      ),
    },
  ];

  return (
    <section
      ref={ref}
      className="relative flex flex-col [min-height:max(820px,100vh)]"
    >
      {/* Left-to-right dark overlay for text legibility */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent"
      />

      <motion.div
        style={reduce ? undefined : { y, opacity }}
        className="relative z-10 flex flex-1 flex-col"
      >
        {/* Main copy — flows from top on mobile, vertically centered on desktop */}
        <Container className="flex flex-col justify-start pt-28 sm:flex-1 sm:justify-center">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={start ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.7, ease: easeOut }}
            className="flex items-center gap-2 text-[15px] font-medium text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="text-white">
              <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Doctor-reviewed results
          </motion.div>

          <h1 className="mt-4 max-w-[620px] text-[44px] font-bold leading-[1.05] tracking-[-0.02em] text-white sm:text-6xl md:text-[68px]">
            <MaskedWords
              text="Get better at being healthy, every year"
              baseDelay={0.12}
              start={start}
            />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 26 }}
            animate={start ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.8, delay: 0.5, ease: easeOut }}
            className="mt-6 max-w-[460px] text-[18px] leading-[1.5] text-white/85"
          >
            100+ biomarkers. A plan built around you.
            <br />
            Everything you need to act on it.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={start ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.8, delay: 0.62, ease: easeOut }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-[17px] font-semibold text-black transition-transform hover:scale-[1.03]"
            >
              Become a member
            </Link>
            <Link
              href="/market-place"
              className="inline-flex items-center justify-center rounded-full bg-white/15 px-8 py-4 text-[17px] font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-white/25"
            >
              See what we test
            </Link>
          </motion.div>
        </Container>

        {/* Stats — right after the buttons on mobile, pinned to the bottom on desktop */}
        <Container className="pb-28 pt-9 sm:pb-10 sm:pt-0">
          <motion.div
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.1, delayChildren: 0.74 } },
            }}
            initial="hidden"
            animate={start ? "show" : "hidden"}
            className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6"
          >
            {stats.map((s, i) => (
              <motion.div key={s.title} variants={statItem} className="flex items-center gap-6">
                {i > 0 && <span className="hidden h-8 w-px bg-white/25 sm:block" />}
                <div>
                  <p className="text-[15px] font-semibold text-white">{s.title}</p>
                  <p className="mt-0.5 text-[15px] text-white/55">{s.sub}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </motion.div>
    </section>
  );
}
