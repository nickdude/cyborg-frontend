"use client";

import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";

/**
 * "The most complete picture of your health you've ever had" — superpower.com's
 * 3D tablet. It tilts in perspective as you scroll, the bottom tab pills
 * (Home / Services / Action Plan / Data / Doctors) auto-switch with the screen,
 * AND it tilts left/right + up/down following the mouse on hover.
 */

type Tab = { label: string; color: string; img: string };

const TABS: Tab[] = [
  { label: "Home", color: "#ec4899", img: "/assets/sm/sub-main.webp" },
  { label: "Services", color: "#f97316", img: "/assets/sm/membership-1.webp" },
  { label: "Action Plan", color: "#22c55e", img: "/assets/sm/test4.webp" },
  { label: "Data", color: "#3b82f6", img: "/assets/sm/mobile-image-2.webp" },
  { label: "Doctors", color: "#ef4444", img: "/assets/sm/test2.webp" },
];

export function TiltTablet() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // 3D tilt from scroll: starts tilted back, settles, then tips slightly forward.
  const rotateX = useTransform(scrollYProgress, [0, 0.25, 0.85, 1], [22, 5, 4, -3]);
  const scale = useTransform(scrollYProgress, [0, 0.25], [0.9, 1]);

  // Hover tilt (mouse-follow), smoothed with springs.
  const hx = useMotionValue(0);
  const hy = useMotionValue(0);
  const hoverRotateY = useSpring(useTransform(hx, [-1, 1], [-12, 12]), {
    stiffness: 120,
    damping: 18,
  });
  const hoverRotateX = useSpring(useTransform(hy, [-1, 1], [10, -10]), {
    stiffness: 120,
    damping: 18,
  });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    hx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    hy.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const handleLeave = () => {
    hx.set(0);
    hy.set(0);
  };

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const t = Math.min(0.999, Math.max(0, (v - 0.12) / 0.76));
    const idx = Math.min(TABS.length - 1, Math.floor(t * TABS.length));
    setActive(idx);
  });

  return (
    <section ref={ref} className="relative h-[260vh] bg-white">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden px-6 py-[5vh]">
        <h2 className="mx-auto mb-[3vh] max-w-[680px] text-center text-2xl font-bold leading-[1.05] tracking-[-0.02em] text-black md:text-[42px]">
          The most complete picture of your health you&apos;ve ever had
        </h2>

        {/* 3D stage — hover tilts the tablet */}
        <div
          className="[perspective:1600px]"
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
        >
          <motion.div
            style={{ rotateX, scale, transformStyle: "preserve-3d" }}
            className="relative w-[min(84vw,660px)] origin-bottom"
          >
            <motion.div
              style={{
                rotateY: hoverRotateY,
                rotateX: hoverRotateX,
                transformStyle: "preserve-3d",
              }}
            >
              <div className="relative aspect-[16/10] max-h-[46vh] w-full overflow-hidden rounded-[22px] border border-black/10 bg-black p-2 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.45)]">
                <div className="relative h-full w-full overflow-hidden rounded-[14px] bg-neutral-100">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={active}
                      src={TABS[active].img}
                      alt={`${TABS[active].label} screen`}
                      initial={{ opacity: 0, scale: 1.03 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="absolute inset-0 h-full w-full object-cover object-top"
                    />
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Tab pills */}
        <div className="mt-[3vh] flex flex-wrap items-center justify-center gap-2 rounded-full border border-black/10 bg-white/80 p-1.5 shadow-sm backdrop-blur">
          {TABS.map((t, i) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                i === active ? "text-white" : "text-black/60 hover:text-black"
              )}
              style={i === active ? { backgroundColor: t.color } : undefined}
            >
              {t.label}
            </button>
          ))}
        </div>

        <p className="mt-[2.5vh] max-w-[440px] text-center text-sm text-black/55">
          Combining whole-body testing, leading doctors and personalized health
          programs.
        </p>
      </div>
    </section>
  );
}
