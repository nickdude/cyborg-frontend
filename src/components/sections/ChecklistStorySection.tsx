"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";

type Tone = "dark" | "light";

interface StoryCardData {
  id: number;
  image: string;
  step: string;
  label: string;
  title: string;
  body: string;
  tone: Tone;
}

const CARDS: StoryCardData[] = [
  {
    id: 1,
    image: "/assets/check-list/check-list1.webp",
    step: "01",
    label: "A new health check",
    title: "Every membership starts with 100+ biomarkers",
    body: "A full body test with a quick 10-min lab draw to get started. Test at 2,000+ Quest locations or at-home.",
    tone: "dark",
  },
  {
    id: 2,
    image: "/assets/check-list/check-list2.webp",
    step: "02",
    label: "All your health data",
    title: "All your health data, in one place",
    body: "Upload past bloodwork, connect your wearables and Apple Health or Health Connect — we'll connect the dots and surface the trends that matter.",
    tone: "light",
  },
  {
    id: 3,
    image: "/assets/check-list/check-list3.webp",
    step: "03",
    label: "A custom action plan",
    title: "Get a personalized health protocol",
    body: "A clinician-grade action plan that turns every result into clear next steps — lifestyle, nutrition and supplements.",
    tone: "light",
  },
  {
    id: 4,
    image: "/assets/check-list/check-list4.webp",
    step: "04",
    label: "24/7 care team",
    title: "Message your private care team 24/7",
    body: "A private care-team in your pocket at all times for any health questions or concerns.",
    tone: "light",
  },
];

const TONE = {
  dark: {
    active: "text-neutral-900",
    muted: "text-neutral-900/40",
    title: "text-neutral-900",
    body: "text-neutral-600",
    scrim: "from-white/90 via-white/45 to-white/0",
    shadow: "",
  },
  light: {
    active: "text-white",
    muted: "text-white/50",
    title: "text-white",
    body: "text-white/80",
    scrim: "from-black/70 via-black/35 to-black/0",
    shadow: "text-scrim-shadow",
  },
} as const;

function StepHeader({ activeIndex, tone }: { activeIndex: number; tone: Tone }) {
  const t = TONE[tone];
  return (
    <div className="flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] md:text-xs">
      {CARDS.map((c, i) => (
        <div key={c.id} className="flex items-center gap-2">
          <span className={i === activeIndex ? t.active : t.muted}>{c.step}</span>
          {i === activeIndex && <span className={t.active}>{c.label}</span>}
        </div>
      ))}
    </div>
  );
}

function StoryCard({
  card,
  index,
  progress,
  range,
  targetScale,
}: {
  card: StoryCardData;
  index: number;
  progress: MotionValue<number>;
  range: [number, number];
  targetScale: number;
}) {
  const t = TONE[card.tone];
  // Card shrinks toward its stacked resting size as the next card scrolls over it.
  const scale = useTransform(progress, range, [1, targetScale]);

  return (
    <div className="sticky top-0 flex h-screen items-center justify-center">
      <motion.div
        style={{ scale, top: `calc(-6vh + ${index * 26}px)` }}
        className="relative h-[86vh] w-[92vw] max-w-6xl origin-top overflow-hidden rounded-[28px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)] md:h-[88vh] md:w-[90vw]"
      >
        <Image
          src={card.image}
          alt=""
          fill
          priority={index === 0}
          sizes="92vw"
          className="object-cover object-center"
        />

        {/* legibility scrim */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b ${t.scrim}`}
        />

        {/* overlay content */}
        <div className="absolute inset-0">
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col px-6 pt-8 md:px-12 md:pt-14">
            <StepHeader activeIndex={index} tone={card.tone} />

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px -10% 0px -10%" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 max-w-[340px] md:mt-12 md:max-w-[460px]"
            >
              <h2
                className={`text-[28px] font-semibold leading-[1.08] tracking-[-0.02em] md:text-5xl ${t.title} ${t.shadow}`}
              >
                {card.title}
              </h2>
              <p className={`mt-4 text-[15px] leading-relaxed md:mt-6 md:text-lg ${t.body} ${t.shadow}`}>
                {card.body}
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * ChecklistStorySection — scroll-stacked cards. The section is tall; each card
 * pins to the top of the viewport (sticky) and, as the following card scrolls up
 * over it, scales down and settles into a receding stack (Superpower/Apple-style).
 */
export function ChecklistStorySection() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  return (
    <section ref={container} className="relative bg-white">
      {CARDS.map((card, i) => (
        <StoryCard
          key={card.id}
          card={card}
          index={i}
          progress={scrollYProgress}
          range={[i / CARDS.length, 1]}
          targetScale={1 - (CARDS.length - i) * 0.04}
        />
      ))}
    </section>
  );
}
