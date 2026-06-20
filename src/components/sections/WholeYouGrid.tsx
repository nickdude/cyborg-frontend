"use client";

import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import { Container } from "@/components/Container";
import { cn } from "@/lib/utils";

type Tile = {
  label: string;
  img: string;
  /** Small annotation chips shown beside the tile when it is featured. */
  notes: string[];
};

/** Cyborg health categories — order matches the 5×2 grid (row-major). */
const TILES: Tile[] = [
  { label: "Heart & Vascular", img: "/assets/sm/test1.webp", notes: ["LDL-C", "ApoB", "Lp(a)"] },
  { label: "Gut Microbiome", img: "/assets/sm/test2.webp", notes: ["Diversity", "Inflammation"] },
  { label: "Sleep", img: "/assets/sm/test3.webp", notes: ["REM", "Deep", "Latency"] },
  { label: "Cognitive Health", img: "/assets/sm/test4.webp", notes: ["Focus", "Memory"] },
  { label: "Hormones", img: "/assets/sm/test5.webp", notes: ["Estrogen", "Progesterone", "Thyroid"] },
  { label: "Metabolic Health", img: "/assets/sm/test6.webp", notes: ["Glucose", "Insulin", "HbA1c"] },
  { label: "Liver Health", img: "/assets/1.jpg", notes: ["ALT", "AST"] },
  { label: "Kidney", img: "/assets/2.jpg", notes: ["eGFR", "Creatinine"] },
  { label: "Thyroid", img: "/assets/3.jpg", notes: ["TSH", "Free T4", "Free T3"] },
  { label: "Nutrients", img: "/assets/sm/test5_2.webp", notes: ["Vitamin D", "B12", "Iron"] },
];

const COLS = 5;
const easeOut = [0.22, 1, 0.36, 1] as const;

/**
 * "Finally, healthcare that looks at the whole you" — a grayscale grid of health
 * categories pinned via a sticky inner wrapper. Scroll progress drives which tile
 * is featured: it expands, gains color, and reveals annotation chips beside it.
 */
export function WholeYouGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const [active, setActive] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    // Map 0..1 scroll progress to a tile index, holding each tile for an
    // even slice of the scroll range.
    const idx = Math.min(
      TILES.length - 1,
      Math.max(0, Math.floor(v * TILES.length)),
    );
    setActive((prev) => (prev === idx ? prev : idx));
  });

  const featured = TILES[active];

  return (
    <section ref={ref} className="relative min-h-[260vh] bg-white">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden py-16">
        <Container>
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -12% 0px" }}
            transition={{ duration: 0.7, ease: easeOut }}
            className="mb-10 md:mb-14"
          >
            <h2 className="text-center text-3xl font-semibold tracking-[-0.02em] text-black md:text-[40px]">
              Finally, healthcare that looks at the whole you
            </h2>
            <p className="mt-3 text-center text-black/55">
              Personalized programs to improve every aspect of your health.
            </p>
          </motion.div>

          {/* Grid + featured overlay */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
              {TILES.map((tile, i) => (
                <motion.div
                  key={tile.label}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                  transition={{ duration: 0.55, delay: (i % COLS) * 0.05, ease: easeOut }}
                  className={cn(
                    "group relative aspect-[5/3] overflow-hidden rounded-xl ring-1 ring-black/5 transition-opacity duration-500",
                    i === active && "opacity-0",
                  )}
                >
                  <img
                    src={tile.img}
                    alt={tile.label}
                    className="h-full w-full object-cover grayscale"
                    loading="lazy"
                  />
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-2 py-1.5 text-[10px] font-medium leading-tight text-white md:text-[11px]">
                    {tile.label}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Featured tile — color, scaled, with annotation chips. */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={featured.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.45, ease: easeOut }}
                  className="flex items-center gap-3 md:gap-6"
                >
                  {/* Left annotation chips */}
                  <NoteColumn
                    notes={featured.notes.slice(0, Math.ceil(featured.notes.length / 2))}
                    align="right"
                  />

                  {/* Focus image */}
                  <div className="relative w-[44vw] max-w-[360px] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/10">
                    <div className="aspect-[5/4]">
                      <img
                        src={featured.img}
                        alt={featured.label}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-3 py-2 text-xs font-semibold text-white md:text-sm">
                      {featured.label}
                    </span>
                  </div>

                  {/* Right annotation chips */}
                  <NoteColumn
                    notes={featured.notes.slice(Math.ceil(featured.notes.length / 2))}
                    align="left"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}

function NoteColumn({
  notes,
  align,
}: {
  notes: string[];
  align: "left" | "right";
}) {
  if (notes.length === 0) {
    // Keep layout balanced even when one side has no chips.
    return <div className="hidden w-[88px] shrink-0 md:block" aria-hidden />;
  }
  return (
    <div
      className={cn(
        "hidden shrink-0 flex-col gap-2 md:flex",
        align === "right" ? "items-end" : "items-start",
      )}
    >
      {notes.map((note, i) => (
        <motion.span
          key={note}
          initial={{ opacity: 0, x: align === "right" ? 12 : -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 + i * 0.08, ease: easeOut }}
          className="whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black/70 shadow-md ring-1 ring-black/5"
        >
          {note}
        </motion.span>
      ))}
    </div>
  );
}
