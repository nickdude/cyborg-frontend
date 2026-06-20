"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Container } from "@/components/Container";

/**
 * Testimonial with a rising fiery sun (superpower.com 0:52). A dome rises from the
 * bottom of a white page: a black body with a vivid white→yellow→orange→red rim
 * crests behind the quote, then the body fills the screen and a black overlay
 * completes the engulf into the dark sections after.
 */
export function Testimonial() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Dome grows from the bottom up past the top of the screen.
  const domeH = useTransform(scrollYProgress, [0.05, 0.9], ["0vh", "200vh"]);
  const domeOpacity = useTransform(scrollYProgress, [0, 0.07], [0, 1]);
  // Quote fades as the sun overtakes it.
  const textOpacity = useTransform(scrollYProgress, [0, 0.34, 0.48], [1, 1, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.48], [0, -70]);
  // Black engulf after the crest → clean white → fire → black handoff.
  const blackoutOpacity = useTransform(scrollYProgress, [0.55, 0.8], [0, 1]);

  return (
    <section ref={ref} className="relative h-[235vh] bg-white">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Rising fiery sun dome: black body, vivid fiery rim. */}
        <motion.div
          aria-hidden
          style={{
            height: domeH,
            opacity: domeOpacity,
            borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
            background:
              "radial-gradient(ellipse 108% 100% at 50% 100%, #000 0%, #000 37%, #1a0100 45%, #9e0f00 55%, #ff2a00 64%, #ff7a00 72%, #ffc21f 81%, #fff7d6 89%, rgba(255,247,214,0) 97%)",
          }}
          className="absolute bottom-0 left-1/2 w-[152vw] -translate-x-1/2"
        />

        {/* Black engulf overlay → seamless handoff into the dark sections after. */}
        <motion.div
          aria-hidden
          style={{ opacity: blackoutOpacity }}
          className="pointer-events-none absolute inset-0 z-20 bg-black"
        />

        {/* Quote */}
        <motion.div
          style={{ opacity: textOpacity, y: textY }}
          className="absolute inset-x-0 top-[15vh] z-10"
        >
          <Container className="flex flex-col items-center text-center">
            <h2 className="mx-auto max-w-[820px] text-3xl font-semibold leading-[1.1] tracking-[-0.02em] text-black md:text-[52px]">
              Cyborg put me on the road to feeling great
            </h2>
            <div className="mt-6 flex items-center justify-center gap-2.5">
              <img
                src="/assets/profile1.png"
                alt=""
                className="h-7 w-7 rounded-full object-cover"
              />
              <span className="text-xs font-medium uppercase tracking-[0.1em] text-black/70">
                Dr. Cole Palmer, Cyborg Chief Longevity Officer
              </span>
            </div>
          </Container>
        </motion.div>
      </div>
    </section>
  );
}
