"use client";

import Image from "next/image";
import { motion } from "motion/react";

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
    image: "/assets/check-list/check-list1.png",
    step: "01",
    label: "A new health check",
    title: "Every membership starts with 100+ biomarkers",
    body: "A full body test with a quick 10-min lab draw to get started. Test at 2,000+ Quest locations or at-home.",
    tone: "dark",
  },
  {
    id: 2,
    image: "/assets/check-list/check-list2.png",
    step: "02",
    label: "All your health data",
    title: "All your health data, in one place",
    body: "Upload past bloodwork, connect your wearables and Apple Health or Health Connect — we'll connect the dots and surface the trends that matter.",
    tone: "light",
  },
  {
    id: 3,
    image: "/assets/check-list/check-list3.png",
    step: "03",
    label: "A custom action plan",
    title: "Get a personalized health protocol",
    body: "A clinician-grade action plan that turns every result into clear next steps — lifestyle, nutrition and supplements.",
    tone: "light",
  },
  {
    id: 4,
    image: "/assets/check-list/check-list4.png",
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
    scrim: "from-white/80 via-white/30 to-transparent",
  },
  light: {
    active: "text-white",
    muted: "text-white/50",
    title: "text-white",
    body: "text-white/80",
    scrim: "from-black/60 via-black/25 to-transparent",
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

function StoryCard({ card, index }: { card: StoryCardData; index: number }) {
  const t = TONE[card.tone];

  return (
    <div className="relative h-full w-screen shrink-0 snap-start snap-always overflow-hidden">
      <Image
        src={card.image}
        alt=""
        fill
        priority={index === 0}
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* legibility scrim */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b ${t.scrim}`}
      />

      {/* overlay content */}
      <div className="absolute inset-0">
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col px-6 pt-10 md:px-12 md:pt-16">
          <StepHeader activeIndex={index} tone={card.tone} />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px -15% 0px -15%" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 max-w-[340px] md:mt-12 md:max-w-[460px]"
          >
            <h2
              className={`text-[28px] font-semibold leading-[1.08] tracking-[-0.02em] md:text-5xl ${t.title}`}
            >
              {card.title}
            </h2>
            <p className={`mt-4 text-[15px] leading-relaxed md:mt-6 md:text-lg ${t.body}`}>
              {card.body}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/**
 * ChecklistStorySection — a single full-viewport (100vh) section the user swipes
 * through horizontally. Native horizontal scroll with snap; each card is 100vw.
 */
export function ChecklistStorySection() {
  return (
    <section className="h-screen w-full bg-white">
      <div className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth scrollbar-hide">
        {CARDS.map((card, i) => (
          <StoryCard key={card.id} card={card} index={i} />
        ))}
      </div>
    </section>
  );
}
