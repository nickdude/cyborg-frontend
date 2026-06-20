"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/Container";
import { cn } from "@/lib/utils";

const SLIDE_COUNT = 4;

export function MembershipIncluded() {
  const [index, setIndex] = useState(0);

  const goPrev = () => setIndex((i) => (i - 1 + SLIDE_COUNT) % SLIDE_COUNT);
  const goNext = () => setIndex((i) => (i + 1) % SLIDE_COUNT);

  return (
    <section className="bg-[#ececec] py-20 md:py-24">
      <Container>
        <div className="flex flex-col items-center gap-12 md:flex-row">
          {/* LEFT */}
          <div className="md:flex-1">
            <h2 className="max-w-[460px] text-4xl font-semibold leading-[1.04] tracking-[-0.02em] text-black md:text-[60px]">
              What&rsquo;s included in your membership
            </h2>
            <p className="mt-6 text-[20px] font-medium text-black">
              Cyborg is more than a blood test.
            </p>
            <p className="mt-3 max-w-[420px] text-[17px] leading-relaxed text-black/60">
              Access an ecosystem of diagnostics and doctor-trusted solutions
              personalized to you
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-black px-8 py-3.5 text-base font-semibold text-white"
            >
              Join Today &rsaquo;
            </Link>
          </div>

          {/* RIGHT */}
          <div className="flex w-full flex-col items-center md:flex-1">
            <div className="relative w-full max-w-[460px]">
              <img
                src="/assets/sm/membership-1.webp"
                alt="Upload past lab data"
                className="h-auto w-full rounded-3xl"
              />
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous"
                className="absolute left-0 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black text-white"
              >
                &lsaquo;
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Next"
                className="absolute right-0 top-1/2 flex h-9 w-9 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black text-white"
              >
                &rsaquo;
              </button>
            </div>

            <h3 className="mt-6 text-center text-2xl font-semibold text-black md:text-[32px]">
              Upload past lab data
            </h3>
            <p className="mt-1 text-center text-sm text-black/55">
              Visualize past Quest or Labcorp results.
            </p>

            <div className="mt-4 flex items-center justify-center gap-1.5">
              {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={cn(
                    "h-2 w-2 rounded-full",
                    i === index ? "bg-black" : "bg-black/20",
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
