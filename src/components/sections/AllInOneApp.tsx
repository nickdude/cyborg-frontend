"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import { Container } from "@/components/Container";
import BottomNavbar from "@/components/BottomNavbar";

const easeOut = [0.22, 1, 0.36, 1] as const;

/* Full-bleed hero renders (hand + phone) from /assets/all-in-one, keyed by the
   BottomNavbar demo tab index: 0 Home · 1 Twin · 3 Protocol · 4 Marketplace.
   Index 2 is the center "+" — intentionally left without an image so it is a
   no-op. The renders already include the device, so there is no wrapping phone
   frame (that caused a phone-in-phone nesting). */
const TAB_IMAGES: Record<number, string> = {
  0: "/assets/all-in-one/1.webp",
  1: "/assets/all-in-one/2.webp",
  3: "/assets/all-in-one/3.webp",
  4: "/assets/all-in-one/4.webp",
};

// Auto-advance cycle through the demo screens; index 2 (the "+" no-op) is skipped.
const ORDER = [0, 1, 3, 4];

function AppShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const inView = useInView(ref, { amount: 0.4 });
  const reduce = useReducedMotion();

  // Auto-advance while on screen — until the user takes over (paused) and
  // never for reduced-motion users.
  useEffect(() => {
    if (!inView || paused || reduce) return;
    const id = setInterval(
      () => setActive((a) => ORDER[(ORDER.indexOf(a) + 1) % ORDER.length]),
      3500
    );
    return () => clearInterval(id);
  }, [inView, paused, reduce]);

  // The "+" (index 2) has no image, so tapping it changes nothing. Any manual
  // tap permanently stops the autoplay.
  const handleTab = (i: number) => {
    setPaused(true);
    if (TAB_IMAGES[i] !== undefined) setActive(i);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.8, ease: easeOut }}
      className="relative flex w-fit flex-col items-center"
    >
      {/* swappable render — a ratio-locked box (aspect 2179:2473) with a definite
          viewport-based height, so its width is deterministic. The column is w-fit,
          so the BottomNavbar below inherits exactly the phone's rendered width. */}
      <div className="relative aspect-[2179/2473] h-[48vh] max-h-[420px] min-h-[300px]">
        <AnimatePresence initial={false}>
          <motion.div
            key={active}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.4, ease: easeOut }}
            className="absolute inset-0"
          >
            <Image
              src={TAB_IMAGES[active]}
              alt="Cyborg app"
              fill
              priority={active === 0}
              sizes="(min-width: 640px) 400px, 300px"
              className="object-contain"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* the real BottomNavbar drives the demo (+ is a no-op here) */}
      <div className="relative mt-4 h-16 w-full shrink-0">
        <BottomNavbar demoMode activeTab={active} onTabChange={handleTab} />
      </div>
    </motion.div>
  );
}

/** "All in one app." — full-viewport white section; the render scales to fit. */
export function AllInOneApp() {
  return (
    <section className="relative h-screen overflow-hidden bg-white">
      <Container className="relative flex h-full flex-col items-center justify-center py-10 text-center">
        {/* heading */}
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="shrink-0 text-5xl font-bold leading-[0.95] tracking-[-0.04em] text-neutral-900 sm:text-6xl md:text-7xl"
        >
          All in
          <br />
          one app.
        </motion.h2>

        {/* phone render + nav */}
        <div className="my-8 flex w-full justify-center">
          <AppShowcase />
        </div>

        {/* supporting text */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ duration: 0.7, delay: 0.1, ease: easeOut }}
          className="shrink-0 max-w-[700px] text-balance text-base leading-relaxed text-neutral-500 md:text-lg"
        >
          Leverage the Cyborg&apos;s advanced, discreet and preventive health
          monitoring to guide your path toward vitality and a longer, healthier
          life.
        </motion.p>
      </Container>
    </section>
  );
}
