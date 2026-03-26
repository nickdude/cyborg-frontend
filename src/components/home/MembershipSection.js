"use client";

import Link from "next/link";
import { useRef } from "react";

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

function MembershipFeatureCard({ item }) {
  return (
    <article className="relative w-full shrink-0 snap-start bg-[#ECECEC] px-5 pb-6 pt-5 text-center lg:w-[286px] lg:max-w-none xl:w-[300px]">
      <div className="relative">
        <button
          type="button"
          onClick={item.onPrev}
          className="absolute left-[-12px] top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black text-white"
          aria-label="Previous membership card"
        >
          <span className="text-[20px] leading-none">‹</span>
        </button>

        <button
          type="button"
          onClick={item.onNext}
          className="absolute right-[-12px] top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black text-white"
          aria-label="Next membership card"
        >
          <span className="text-[20px] leading-none">›</span>
        </button>

        <img src={item.image} alt={item.title} className="mx-auto h-[198px] w-full rounded-2xl object-cover lg:h-[205px] xl:h-[212px] rounded-lg" />
      </div>

      <h3 className="mt-4 text-[clamp(1.8rem,3.4vw,2rem)] font-semibold leading-[1.12] text-[#0d0d0f]">{item.title}</h3>
      <p className="mx-auto mt-2.5 max-w-[24ch] text-[clamp(1.1rem,2.6vw,1.55rem)] leading-[1.32] text-[#666973]">{item.description}</p>
    </article>
  );
}

export default function MembershipSection() {
  const scrollerRef = useRef(null);

  const scrollByCards = (direction) => {
    if (!scrollerRef.current) return;

    const firstCard = scrollerRef.current.querySelector("article");
    const cardWidth = firstCard?.getBoundingClientRect?.().width || 300;

    scrollerRef.current.scrollBy({
      left: direction === "next" ? cardWidth : -cardWidth,
      behavior: "smooth",
    });
  };

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

        <div className="relative mt-8 md:mt-10">
          <div
            ref={scrollerRef}
            className="mx-auto flex w-full max-w-[1920px] snap-x snap-mandatory gap-0 overflow-x-auto [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden"
            >
            {MEMBERSHIP_FEATURES.map((item) => (
                <MembershipFeatureCard
                key={item.id}
                item={{
                    ...item,
                    onPrev: () => scrollByCards("prev"),
                    onNext: () => scrollByCards("next"),
                }}
                />
            ))}
            </div>
        </div>
      </div>
    </section>
  );
}
