"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { Container } from "@/components/Container";
import { cn } from "@/lib/utils";

/**
 * "Get exclusive access to our marketplace" — superpower.com scatter section.
 * Product cards rest fully-visible around a centered headline (pinned viewport).
 * They animate in on enter, drift gently with scroll, and parallax left/right +
 * up/down following the mouse (different depth per card).
 */

interface CardData {
  img: string;
  label: string;
  top: string;
  left: string;
  rotate: number;
  widthClass: string;
  /** parallax depth (0.2 = subtle, 1.2 = strong) */
  depth: number;
  desktopOnly?: boolean;
}

const CARDS: CardData[] = [
  { img: "/assets/sm/test1.webp", label: "VO2 Max", top: "17%", left: "16%", rotate: -8, widthClass: "w-[150px] md:w-[200px]", depth: 1.0 },
  { img: "/assets/sm/membership-1.webp", label: "Microbiome Test Kit", top: "11%", left: "37%", rotate: 6, widthClass: "w-[110px] md:w-[140px]", depth: 0.6, desktopOnly: true },
  { img: "/assets/sm/test2.webp", label: "Full Genome Sequencing", top: "9%", left: "55%", rotate: -5, widthClass: "w-[120px] md:w-[150px]", depth: 0.7 },
  { img: "/assets/sm/test3.webp", label: "Continuous Glucose Monitoring", top: "16%", left: "82%", rotate: 7, widthClass: "w-[160px] md:w-[210px]", depth: 1.1 },
  { img: "/assets/sm/sub-main.webp", label: "Biomarker Tracking", top: "48%", left: "11%", rotate: -6, widthClass: "w-[150px] md:w-[190px]", depth: 0.9 },
  { img: "/assets/sm/test5.webp", label: "Grail Cancer Test", top: "47%", left: "87%", rotate: 6, widthClass: "w-[150px] md:w-[190px]", depth: 0.9 },
  { img: "/assets/sm/test4.webp", label: "Intestinal Permeability Panel", top: "80%", left: "19%", rotate: 8, widthClass: "w-[160px] md:w-[210px]", depth: 1.1 },
  { img: "/assets/product-3.png", label: "Prescriptions", top: "86%", left: "45%", rotate: -6, widthClass: "w-[110px] md:w-[140px]", depth: 0.5, desktopOnly: true },
  { img: "/assets/sm/test6.webp", label: "MRIs", top: "79%", left: "63%", rotate: 5, widthClass: "w-[120px] md:w-[150px]", depth: 0.7 },
  { img: "/assets/sm/mobile-image-2.webp", label: "DEXA Scan", top: "82%", left: "82%", rotate: -8, widthClass: "w-[160px] md:w-[200px]", depth: 1.0 },
];

const easeOut = [0.22, 1, 0.36, 1] as const;

function ScatterCard({
  card,
  index,
  mx,
  my,
  scrollY,
}: {
  card: CardData;
  index: number;
  mx: MotionValue<number>;
  my: MotionValue<number>;
  scrollY: MotionValue<number>;
}) {
  // mouse parallax (±) blended with a gentle scroll drift
  const range = 46 * card.depth;
  const x = useTransform(mx, [-1, 1], [-range, range]);
  const y = useTransform(
    [my, scrollY] as [MotionValue<number>, MotionValue<number>],
    ([m, s]: number[]) => m * range + (s - 0.5) * card.depth * 70
  );

  return (
    <motion.div
      className={cn(
        "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2",
        card.desktopOnly && "hidden md:block"
      )}
      style={{ top: card.top, left: card.left }}
      initial={{ opacity: 0, scale: 0.7 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.7, delay: index * 0.05, ease: easeOut }}
    >
      <motion.div style={{ x, y, rotate: card.rotate }}>
        <img
          src={card.img}
          alt={card.label}
          loading="lazy"
          className={cn(
            "h-auto rounded-2xl object-cover shadow-[0_22px_55px_-20px_rgba(0,0,0,0.4)]",
            card.widthClass
          )}
          style={{ aspectRatio: "4 / 3" }}
        />
        <span className="mt-2 block max-w-[160px] text-center text-xs font-medium text-black/70">
          {card.label}
        </span>
      </motion.div>
    </motion.div>
  );
}

export function MarketplaceScatter() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 80, damping: 20, mass: 0.4 });
  const my = useSpring(rawY, { stiffness: 80, damping: 20, mass: 0.4 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    rawX.set(((e.clientX - r.left) / r.width) * 2 - 1);
    rawY.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const handleLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <section ref={ref} className="relative min-h-[120vh] w-full bg-white">
      <div
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className="sticky top-0 h-screen overflow-hidden"
      >
        {CARDS.map((card, i) => (
          <ScatterCard
            key={card.label}
            card={card}
            index={i}
            mx={mx}
            my={my}
            scrollY={scrollYProgress}
          />
        ))}

        <div className="absolute inset-0 flex items-center justify-center">
          <Container className="flex flex-col items-center">
            <h2 className="max-w-[560px] text-center text-4xl font-semibold tracking-[-0.02em] text-black md:text-[52px]">
              Get exclusive access to our marketplace
            </h2>
            <p className="mt-4 max-w-[420px] text-center text-base text-black/55 md:text-lg">
              Unlimited tools to transform your health and change your life.
            </p>
          </Container>
        </div>
      </div>
    </section>
  );
}
