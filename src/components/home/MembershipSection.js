"use client";

import Link from "next/link";
import { useState } from "react";
import TestimonialCarousel from "./TestimonialCarousel";

const MEMBERSHIP_FEATURES = [
  {
    id: 1,
    title: "Upload past lab data",
    description: "Visualize past Quest or Labcorp results.",
    image: "/assets/preview/membership/membership-1.png",
  },
  {
    id: 2,
    title: "Your personalized health plan",
    description: "Lifestyle, diet, supplement & Rx recommendations.",
    image: "/assets/preview/membership/membership-2.png",
  },
  {
    id: 3,
    title: "Unlimited concierge messaging",
    description: "Ask questions and get answers from our care team.",
    image: "/assets/preview/membership/membership-3.png",
  },
  {
    id: 4,
    title: "Add-on testing anytime",
    description: "Advanced gut microbiome, toxins & cancer screens.",
    image: "/assets/preview/membership/membership-4.png",
  },
  {
    id: 5,
    title: "Access to Cyborg’s Virtual Clinic",
    description: "Curated solutions available after medical evaluation.",
    image: "/assets/preview/membership/membership-5.png",
  },
];

export default function MembershipSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  const allInOneItems = MEMBERSHIP_FEATURES.map((item) => ({
    src: item.image,
    title: item.title,
    description: item.description,
  }));

  const activeFeature = MEMBERSHIP_FEATURES[activeIndex];

  return (
    <section className="bg-[#ECECEC] text-black">
      <div className="mx-auto w-full max-w-[430px] px-4 pb-12 pt-10 md:max-w-[820px] md:px-8 md:pb-14 md:pt-14 lg:max-w-[1180px] lg:pb-16 lg:pt-16">
        <h2 className="max-w-[11ch] text-[clamp(2.2rem,8.2vw,4rem)] font-semibold leading-[1.08] tracking-[-0.02em]">
            What’s included in your membership
        </h2>

        <p className="mt-5 text-[clamp(1.05rem,3.7vw,2rem)] leading-[1.34] text-[#111216]">Cyborg is more than a blood test.</p>
        <p className="mt-4 max-w-[34ch] text-[clamp(1.05rem,3.7vw,2rem)] leading-[1.34] text-[#111216]">
          Access an ecosystem of diagnostics and doctor-trusted solutions personalized to you
        </p>

        <Link
          href="/register"
          className="mt-6 inline-flex h-[54px] items-center justify-center gap-3 rounded-xl bg-black px-8 text-[clamp(1.2rem,3.8vw,1.9rem)] font-semibold text-white"
        >
          Join Today <span className="text-[1.9rem] leading-none">›</span>
        </Link>

        <div className="mt-10">
          <TestimonialCarousel items={allInOneItems} onChange={setActiveIndex} />

          {/* <article className="mx-auto mt-6 max-w-[620px] rounded-[28px] bg-white px-5 py-6 text-center shadow-[0_16px_40px_rgba(0,0,0,0.06)] ring-1 ring-black/5 md:px-7 md:py-7">
            <h3 className="text-[clamp(1.7rem,3.8vw,2.1rem)] font-semibold leading-[1.12] text-[#0d0d0f]">
              {activeFeature.title}
            </h3>
            <p className="mx-auto mt-3 max-w-[26ch] text-[clamp(1.05rem,2.8vw,1.4rem)] leading-[1.35] text-[#666973]">
              {activeFeature.description}
            </p>
          </article> */}
        </div>
      </div>
    </section>
  );
}
