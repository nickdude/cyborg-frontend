"use client";

import { ChevronLeft } from "lucide-react";

// Figma story-slide scrim: transparent → black/40 at ~52% → black/70 at ~84%.
const SCRIM =
  "linear-gradient(180deg, rgba(122,120,120,0) 0%, rgba(0,0,0,0.4) 51.98%, rgba(0,0,0,0.7) 84.315%)";

/**
 * Full-bleed educational story slide (Day Review stable variant, steps 2-3):
 * background photo + dark gradient, white headline question, body copy and a
 * white Next button. Built 1:1 from the Figma story frames.
 */
export default function StorySlide({ image, dayLabel, headline, paragraphs = [], onBack, onNext }) {
  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-black font-sans">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0" style={{ background: SCRIM }} />

      <header className="relative z-10 px-5 pb-3 pt-5">
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="absolute left-0 text-white"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
          <h1 className="text-base font-medium text-white">
            Day Review{dayLabel ? ` - ${dayLabel}` : ""}
          </h1>
        </div>
      </header>

      <div className="relative z-10 mt-auto px-5">
        <h2 className="text-[30px] font-semibold leading-[38px] text-white">{headline}</h2>
        <div className="mt-6 space-y-6 text-base font-medium leading-6 text-white">
          {paragraphs.map((text, idx) => (
            <p key={idx}>{text}</p>
          ))}
        </div>
      </div>

      <div className="relative z-10 px-5 pb-6 pt-16">
        <button
          type="button"
          onClick={onNext}
          className="h-12 w-full rounded-lg bg-white text-base font-medium text-black transition active:scale-[0.99]"
        >
          Next
        </button>
      </div>
    </div>
  );
}
