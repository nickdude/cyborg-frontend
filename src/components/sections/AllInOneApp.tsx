"use client";

import { useState } from "react";
import { Container } from "@/components/Container";
import { cn } from "@/lib/utils";

// The 4 app-preview mockups, in order. Drop the images into
// public/assets/app-showcase/ as 1.png … 4.png (Home, Twin, Concierge, Marketplace).
const SLIDES = [
  { src: "/assets/app-showcase/1.png", alt: "Cyborg home dashboard" },
  { src: "/assets/app-showcase/2.png", alt: "Cyborg digital twin" },
  { src: "/assets/app-showcase/3.png", alt: "Cyborg AI concierge" },
  { src: "/assets/app-showcase/4.png", alt: "Cyborg marketplace" },
];
const SLIDE_COUNT = SLIDES.length;

/** "All in one app." — phone preview with an interactive dot carousel. */
export function AllInOneApp() {
  const [index, setIndex] = useState(0);

  const handlePrev = () => setIndex((i) => (i - 1 + SLIDE_COUNT) % SLIDE_COUNT);
  const handleNext = () => setIndex((i) => (i + 1) % SLIDE_COUNT);

  return (
    <section className="bg-[#ececec] py-20 md:py-24">
      <Container>
        <div className="flex flex-col items-center text-center">
          <h2 className="mx-auto max-w-[700px] text-center text-5xl font-semibold leading-[0.95] tracking-[-0.03em] text-black md:text-[72px]">
            All in one app.
          </h2>

          <div className="mx-auto mt-10 w-[360px] max-w-full">
            <img
              key={index}
              src={SLIDES[index].src}
              alt={SLIDES[index].alt}
              className="h-auto w-full select-none"
              draggable={false}
            />
          </div>

          <div className="mt-8 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={handlePrev}
              className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-black"
            >
              Previous
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className={cn(
                    "h-2.5 rounded-full transition-all",
                    i === index ? "w-6 bg-black" : "w-2.5 bg-black/20",
                  )}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-black"
            >
              Next
            </button>
          </div>

          <p className="mt-4 text-center text-sm text-black/60">
            {index + 1} / {SLIDE_COUNT}
          </p>

          <p className="mx-auto mt-6 max-w-[560px] text-center text-lg leading-relaxed text-black/60">
            Leverage the Cyborg&apos;s advanced, discreet and preventive health
            monitoring to guide your path toward vitality and a longer, healthier
            life
          </p>
        </div>
      </Container>
    </section>
  );
}
