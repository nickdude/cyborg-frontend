"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/Container";
import { cn } from "@/lib/utils";

const PREVIEW_IMAGES: readonly string[] = [
  "/assets/1.webp",
  "/assets/2.webp",
  "/assets/3.webp",
  "/assets/4.webp",
  "/assets/5.webp",
];

const CHECKLIST: readonly string[] = [
  "Amino+9",
  "Labs",
  "1 GLP-1 Pen (Indian) per quarter",
];

/** Small VISA payment badge. */
function VisaBadge() {
  return (
    <span className="rounded bg-[#1a1f71] px-2.5 py-1.5 text-xs font-bold italic text-white">
      VISA
    </span>
  );
}

/** Mastercard overlapping-circles badge. */
function MastercardBadge() {
  return (
    <span className="relative inline-flex h-5 w-7 items-center justify-center rounded bg-black px-2.5 py-1.5">
      <span className="relative block h-3.5 w-7">
        <span className="absolute left-0 top-0 h-3.5 w-3.5 rounded-full bg-[#eb001b]" />
        <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full bg-[#f79e1b] opacity-90 mix-blend-screen" />
      </span>
    </span>
  );
}

export function AdvancedPlan() {
  const [selected, setSelected] = useState(0);

  return (
    <section className="bg-[#ececec] py-20 md:py-24">
      <Container>
        <div className="flex flex-col items-start justify-between gap-12 md:flex-row">
          {/* LEFT */}
          <div className="md:max-w-[460px]">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-black/45">
              Comprehensive metabolic care, one plan.
            </p>
            <h2 className="mt-3 text-5xl font-semibold leading-[0.98] tracking-[-0.03em] text-black md:text-[68px]">
              Advanced Plan
            </h2>
            <p className="mt-5 max-w-[340px] text-[18px] leading-relaxed text-black/60">
              Everything you need in one plan &mdash; Amino+9, full labs, and a
              GLP-1 pen each quarter
            </p>

            <ul className="mt-6 flex flex-col gap-2.5 text-[15px] text-black">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-[#5b2487]">&#10003;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex items-baseline">
              <span className="text-4xl font-bold text-black md:text-[44px]">
                <span className="text-3xl md:text-[34px]">&#8377;</span>15,000
              </span>
              <span className="ml-1 text-base text-black/50">/month</span>
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-black/45">
              Flexible payment options
            </p>
            <div className="mt-3 flex items-center gap-2">
              <VisaBadge />
              <MastercardBadge />
              <VisaBadge />
              <VisaBadge />
            </div>

            <Link
              href="/login"
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-black px-14 py-3.5 text-lg font-semibold text-white"
            >
              Start testing
            </Link>
          </div>

          {/* RIGHT */}
          <div className="w-full rounded-3xl border border-black/5 bg-[#f4f4f4] p-8 md:flex-1">
            <div className="flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={PREVIEW_IMAGES[selected]}
                alt="Membership preview"
                className="mx-auto h-auto w-full max-w-[420px] drop-shadow-2xl"
              />
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {PREVIEW_IMAGES.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  aria-label={`Show preview ${i + 1}`}
                  aria-pressed={selected === i}
                  onClick={() => setSelected(i)}
                  className={cn(
                    "h-[56px] w-[80px] overflow-hidden rounded-lg border bg-white",
                    selected === i
                      ? "border-2 border-[#5b2487]"
                      : "border-black/10",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`Preview ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
