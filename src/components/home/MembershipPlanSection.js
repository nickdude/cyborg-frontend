"use client";

import Link from "next/link";
import { useState } from "react";

const STEP_IMAGES = [
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
    <div className="mt-3 flex items-center justify-center gap-2 lg:justify-start">
      <span className="inline-flex h-9 min-w-[66px] items-center justify-center rounded bg-[#1c48c6] px-3 text-xl font-bold italic text-white">VISA</span>
      <span className="inline-flex h-9 min-w-[66px] items-center justify-center rounded bg-black px-3">
        <span className="relative inline-flex h-6 w-10 items-center justify-center">
          <span className="absolute left-1 h-5 w-5 rounded-full bg-[#eb001b]" />
          <span className="absolute right-1 h-5 w-5 rounded-full bg-[#f79e1b]" />
        </span>
      </span>
      <span className="inline-flex h-9 min-w-[66px] items-center justify-center rounded border border-black/15 bg-white px-3 text-base font-bold tracking-wide text-black">UPI</span>
    </div>
  );
}

export default function MembershipPlanSection() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="bg-[#ECECEC] px-5 pb-14 pt-10 text-black md:px-8 md:pb-20 md:pt-14 lg:flex lg:h-screen lg:items-center lg:py-10">
      <div className="mx-auto w-full max-w-[430px] md:max-w-[820px] lg:grid lg:max-w-[1180px] lg:grid-cols-2 lg:items-start lg:gap-x-16">
        {/* Copy — top of the left column on desktop */}
        <div className="lg:col-start-1 lg:row-start-1">
          <p className="text-[clamp(1.2rem,3.9vw,1.75rem)] leading-[1.3] text-[#666973] lg:text-[15px] lg:font-semibold lg:uppercase lg:tracking-[0.14em] lg:text-[#7a7d87]">
            Comprehensive metabolic care, one plan.
          </p>

          <h2 className="mt-4 text-[clamp(2.2rem,7.8vw,3.6rem)] font-semibold leading-[1.08] tracking-[-0.02em] lg:mt-5 lg:text-[68px] lg:leading-[0.98] lg:tracking-[-0.03em]">
            ADVANCED
            <br />
            PLAN
          </h2>

          <p className="mt-5 max-w-[25ch] text-[clamp(1.3rem,4.4vw,1.9rem)] leading-[1.34] text-[#111216] lg:mt-6 lg:max-w-[32ch] lg:text-[19px] lg:leading-[1.55] lg:text-[#3f4150]">
            Everything you need in one plan — Amino+9, full labs, and a GLP-1 pen each quarter
          </p>
        </div>

        {/* Visual — right column on desktop, vertically centered across both copy rows */}
        <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:mx-auto lg:w-full lg:max-w-[440px] lg:self-center">
          <div className="mt-7 flex items-center justify-center overflow-hidden rounded-[18px] border-[6px] border-[#d7d7dc] lg:mt-0">
            <img
              src={STEP_IMAGES[activeStep]}
              alt={`Membership step ${activeStep + 1}`}
              className="h-full w-full scale-110 rounded-md object-contain"
            />
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {STEP_IMAGES.map((image, index) => (
              <button
                key={image}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`overflow-hidden rounded border ${activeStep === index ? "border-[#5B2487]" : "border-[#cfd0d5]"}`}
                aria-label={`Show step ${index + 1}`}
              >
                <img src={image} alt="" aria-hidden="true" className="h-[56px] w-full object-cover" style={{ imageRendering: "crisp-edges" }} />
              </button>
            ))}
          </div>
        </div>

        {/* Benefits + pricing + CTA — bottom of the left column on desktop */}
        <div className="lg:col-start-1 lg:row-start-2 lg:mt-8">
          <ul className="mt-6 space-y-3 lg:mt-0 lg:space-y-2.5">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3 text-[clamp(1.2rem,3.9vw,1.65rem)] leading-[1.36] text-[#3f4150] lg:text-[17px]">
                <span className="mt-0.5 text-[#5B2487] lg:text-[19px]">✓</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex items-end gap-2 text-[#0f1013] lg:mt-7">
            <span className="text-[clamp(2rem,6.8vw,3rem)] lg:text-[34px]">₹</span>
            <span className="text-[clamp(4rem,12vw,5.5rem)] font-semibold leading-none lg:text-[64px] lg:tracking-[-0.02em]">15,000</span>
            <span className="mb-2 text-[clamp(1.25rem,3.9vw,1.7rem)] text-[#666973] lg:mb-1.5 lg:text-[17px]">/month</span>
          </div>

          <p className="mt-3 text-center text-[clamp(1.2rem,3.9vw,1.65rem)] text-[#666973] lg:mt-4 lg:text-left lg:text-[14px] lg:font-medium lg:uppercase lg:tracking-[0.1em]">Flexible payment options</p>
          <PaymentBadges />
          <p className="mt-2 text-center text-xs text-secondary lg:text-left">Secure payments via Razorpay</p>

          <Link
            href="/register"
            className="mt-7 flex h-[58px] w-full items-center justify-center rounded-xl bg-black text-[clamp(1.35rem,4.2vw,1.8rem)] font-semibold text-white lg:mt-7 lg:h-[56px] lg:w-fit lg:px-14 lg:text-[18px] lg:transition lg:duration-300 lg:hover:bg-[#1a1a1a]"
          >
            Start testing
          </Link>
        </div>
      </div>
    </section>
  );
}
