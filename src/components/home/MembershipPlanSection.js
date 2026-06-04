"use client";

import Link from "next/link";
import { useState } from "react";

const STEP_IMAGES = [
  "/assets/preview/steps/1.webp",
  "/assets/preview/steps/2.webp",
  "/assets/preview/steps/3.webp",
  "/assets/preview/steps/4.webp",
  "/assets/preview/steps/5.webp",
];

const BENEFITS = [
  "Amino+9",
  "Labs",
  "1 GLP-1 Pen (Indian) per quarter",
];

function PaymentBadges() {
  return (
    <div className="mt-3 flex items-center justify-center gap-2">
      <span className="inline-flex h-9 min-w-[66px] items-center justify-center rounded bg-[#1c48c6] px-3 text-xl font-bold italic text-white">VISA</span>
      <span className="inline-flex h-9 min-w-[66px] items-center justify-center rounded bg-black px-3">
        <span className="relative inline-flex h-6 w-10 items-center justify-center">
          <span className="absolute left-1 h-5 w-5 rounded-full bg-[#eb001b]" />
          <span className="absolute right-1 h-5 w-5 rounded-full bg-[#f79e1b]" />
        </span>
      </span>
      <span className="inline-flex h-9 min-w-[66px] items-center justify-center rounded bg-[#1c48c6] px-3 text-xl font-bold italic text-white">VISA</span>
      <span className="inline-flex h-9 min-w-[66px] items-center justify-center rounded bg-[#1c48c6] px-3 text-xl font-bold italic text-white">VISA</span>
    </div>
  );
}

export default function MembershipPlanSection() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="bg-[#ECECEC] px-5 pb-14 pt-10 text-black md:px-8 md:pb-20 md:pt-14 lg:py-32">
      <div className="mx-auto w-full max-w-[430px] md:max-w-[820px] lg:max-w-[980px]">
        <p className="text-[clamp(1.2rem,3.9vw,1.75rem)] leading-[1.3] text-[#666973]">
          Comprehensive metabolic care, one plan.
        </p>

        <h2 className="mt-4 text-[clamp(2.2rem,7.8vw,3.6rem)] font-semibold leading-[1.08] tracking-[-0.02em] lg:text-[64px] lg:leading-[1.02]">
          ADVANCED
          <br />
          PLAN
        </h2>

        <p className="mt-5 max-w-[25ch] text-[clamp(1.3rem,4.4vw,1.9rem)] leading-[1.34] text-[#111216]">
          Everything you need in one plan — Amino+9, full labs, and a GLP-1 pen each quarter
        </p>

        <div className="mt-7 flex items-center justify-center rounded-[18px] border-[6px] border-[#d7d7dc]">
          <img
            src={STEP_IMAGES[activeStep]}
            alt={`Membership step ${activeStep + 1}`}
            className="h-full w-full rounded-md object-contain"
          />
        </div>

        <div className="mt-4 grid grid-cols-5 gap-2">
          {STEP_IMAGES.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActiveStep(index)}
              className={`overflow-hidden rounded border ${activeStep === index ? "border-[#5B2487]" : "border-[#cfd0d5]"}`}
              aria-label={`Show step ${index + 1}`}
            >
              <img src={image} alt="" aria-hidden="true" className="h-[56px] w-full object-contain" style={{ imageRendering: "crisp-edges" }} />
            </button>
          ))}
        </div>

        <ul className="mt-6 space-y-3">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-start gap-3 text-[clamp(1.2rem,3.9vw,1.65rem)] leading-[1.36] text-[#3f4150]">
              <span className="mt-0.5 text-[#5B2487]">✓</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <div className="mt-7 flex items-end gap-2 text-[#0f1013]">
          <span className="text-[clamp(2rem,6.8vw,3rem)]">₹</span>
          <span className="text-[clamp(4rem,12vw,5.5rem)] font-semibold leading-none">15,000</span>
          <span className="mb-2 text-[clamp(1.25rem,3.9vw,1.7rem)] text-[#666973]">/month</span>
        </div>

        <p className="mt-3 text-center text-[clamp(1.2rem,3.9vw,1.65rem)] text-[#666973]">Flexible payment options</p>
        <PaymentBadges />

        <Link
          href="/register"
          className="mt-7 flex h-[58px] w-full items-center justify-center rounded-xl bg-black text-[clamp(1.35rem,4.2vw,1.8rem)] font-semibold text-white"
        >
          Start testing
        </Link>
      </div>
    </section>
  );
}
