"use client";

import { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface StoryCard {
  id: number;
  image: string;
  width: number;
  height: number;
  /** Heading. Wrap emphasized phrases in *asterisks* to render them solid white. */
  title: string;
  /** Optional Tailwind background class (e.g. a linear-gradient). Defaults to solid #1A1A1A. */
  bg?: string;
}

/** Card content for the first carousel (visualise-part-one). */
export const VISUALISE_PART_ONE: StoryCard[] = [
  {
    id: 1,
    image: "/assets/viusalise-part-one/feature1.webp",
    width: 320,
    height: 162,
    title: "Visualize your *metabolic fitness in real-time* with the *Metabolic Score*",
  },
  {
    id: 2,
    image: "/assets/viusalise-part-one/feature2.webp",
    width: 320,
    height: 282,
    title: "See exactly how your *body responds* to every meal, workout and night",
  },
  {
    id: 3,
    image: "/assets/viusalise-part-one/feature3.webp",
    width: 217,
    height: 244,
    title: "Spot your *patterns and trends* with clear, daily insights",
  },
  {
    id: 4,
    image: "/assets/viusalise-part-one/feature4.webp",
    width: 284,
    height: 268,
    title: "Turn complex biomarkers into *simple, personalized guidance*",
  },
  {
    id: 5,
    image: "/assets/viusalise-part-one/feature5.webp",
    width: 321,
    height: 241,
    title: "Stay on track with *real-time nudges* built around your life",
  },
];

/** Card content for the second carousel (visualise-part-two). */
export const VISUALISE_PART_TWO: StoryCard[] = [
  {
    id: 1,
    image: "/assets/viusalise-part-two/feature1.webp",
    width: 249,
    height: 217,
    title: "Track your *real-time glucose* with just a *quick scan*",
    bg: "bg-[linear-gradient(180deg,#198F83_0%,#072926_100%)]",
  },
  {
    id: 2,
    image: "/assets/viusalise-part-two/feature2.webp",
    width: 320,
    height: 107,
    title: "Measure the *impact of different foods* on your health with the *Food Score*",
    bg: "bg-[linear-gradient(180deg,#0480C9_0%,#023F63_100%)]",
  },
  {
    id: 3,
    image: "/assets/viusalise-part-two/feature3.webp",
    width: 226,
    height: 225,
    title: "Skip the guesswork and get real-time guidance from your *performance coach*",
    bg: "bg-[#1A1A1A]",
  },
  {
    id: 4,
    image: "/assets/viusalise-part-two/feature4.webp",
    width: 291,
    height: 158,
    title: "Get smarter *food scores* and better guidance, powered by *real data from people like you*",
    bg: "bg-[linear-gradient(180deg,#332C36_0%,#141013_100%)]",
  },
  {
    id: 5,
    image: "/assets/viusalise-part-two/feature5.webp",
    width: 304,
    height: 180,
    title: "Build *lasting habits* with insights that *adapt to you*",
    bg: "bg-[linear-gradient(180deg,#00551B_0%,#002D07_100%)]",
  },
];

/** Renders a heading where *asterisk-wrapped* phrases are solid white, the rest muted. */
function EmphasizedTitle({ title }: { title: string }) {
  return (
    <>
      {title.split("*").map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="text-white">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function StoryCardItem({ card }: { card: StoryCard }) {
  return (
    <article
      data-card
      className={`group relative flex h-[400px] w-[86vw] shrink-0 snap-start flex-col overflow-hidden rounded-3xl border border-white/10 p-6 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.6)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-sky-400/40 hover:shadow-[0_30px_70px_-28px_rgba(0,0,0,0.8)] sm:w-[420px] md:h-[430px] ${card.bg ?? "bg-[#1A1A1A]"}`}
    >
      <h3 className="flex min-h-[92px] items-start justify-center text-center text-[19px] font-semibold leading-[1.32] tracking-[-0.01em] text-white/40 md:text-xl">
        <span>
          <EmphasizedTitle title={card.title} />
        </span>
      </h3>

      <div className="relative mt-6 w-full flex-1">
        <Image
          src={card.image}
          alt=""
          fill
          sizes="(max-width: 640px) 86vw, 420px"
          className="object-contain object-bottom transition-transform duration-300 ease-out group-hover:scale-[1.03]"
        />
      </div>
    </article>
  );
}

interface VisualStorySectionProps {
  cards: StoryCard[];
  className?: string;
}

/**
 * VisualStorySection — premium, manually-navigated horizontal story carousel.
 * Swipe / drag / trackpad / hidden-scrollbar, CSS scroll-snap, desktop arrows.
 * No autoplay, no loop, no pagination. Reusable via the `cards` prop.
 */
export function VisualStorySection({ cards, className }: VisualStorySectionProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const amount = card ? card.offsetWidth + 24 : el.clientWidth * 0.85;
    el.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  return (
    <section className={`relative bg-black py-16 md:py-24 ${className ?? ""}`}>
      <div className="relative">
        {/* scroll track */}
        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-6 py-4 scrollbar-hide scroll-pl-6 sm:gap-6 lg:px-8 lg:scroll-pl-8"
        >
          {cards.map((card) => (
            <StoryCardItem key={card.id} card={card} />
          ))}
        </div>

        {/* desktop-only arrows (secondary to swipe/drag) */}
        <button
          type="button"
          onClick={() => scrollByCard(-1)}
          aria-label="Previous"
          className="absolute left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-white/90 text-black shadow-lg backdrop-blur transition hover:bg-white md:grid"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => scrollByCard(1)}
          aria-label="Next"
          className="absolute right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-white/90 text-black shadow-lg backdrop-blur transition hover:bg-white md:grid"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
