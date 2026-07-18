"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "What should I expect during a blood draw?",
    a: "A trained phlebotomist will collect blood samples quickly and safely — you'll feel a small pinch and be done within minutes.",
  },
  {
    q: "How do I prepare for a blood draw?",
    a: "Follow fasting instructions if provided, stay hydrated, and avoid heavy exercise beforehand for most tests.",
  },
  {
    q: "What should I do after my blood draw?",
    a: "Apply pressure to the site for a few minutes, avoid heavy lifting for the rest of the day, and keep the bandage on for an hour.",
  },
  {
    q: "Where can I take my blood test?",
    a: "We partner with convenient labs and clinics; pick the nearest location during checkout or request a home draw where available.",
  },
  {
    q: "Does Cyborg replace my primary care provider?",
    a: "Cyborg complements your primary care by providing biomarker tracking and personalized insights — it is not a replacement for ongoing medical care.",
  },
  {
    q: "How fast are blood test results and how do I read them?",
    a: "Most results are available within 3-7 business days. We present results with easy-to-read summaries, normal ranges, and recommended next steps where applicable.",
  },
  {
    q: "Does Cyborg accept health insurance?",
    a: "We currently do not bill most insurance plans directly. Some customers may be able to submit receipts for reimbursement — check with your insurer for coverage details.",
  },
  {
    q: "What if I want more than 1 blood test per year?",
    a: "You can purchase additional tests any time from your account; we also offer subscription options that include recurring testing at discounted rates.",
  },
];

function FaqItem({ item, open, onToggle }) {
  return (
    <div className="border-t last:border-b border-[#E6E6E8]">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-base font-medium text-black">{item.q}</span>
        <svg className={`h-5 w-5 text-[#717178] transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"}`} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div aria-hidden={!open} className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className={`px-4 pb-4 text-gray-700 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}>{item.a}</div>
        </div>
      </div>
    </div>
  );
}

export default function FaqAccordion() {
  const [open, setOpen] = useState(null);

  const firstGroup = FAQ_ITEMS.slice(0, 4);
  const secondGroup = FAQ_ITEMS.slice(4);

  return (
    <section className="bg-white px-5 py-12 md:px-8 lg:py-32">
      <div className="mx-auto max-w-[720px] lg:max-w-[860px]">
        <h2 className="text-center text-[28px] font-semibold lg:text-[44px] lg:tracking-[-0.02em]">Frequently Asked Questions</h2>

        <div className="mt-6 flex justify-center">
          <button className="rounded-2xl bg-white px-6 py-3 text-base shadow-sm border border-[#E6E6E8]">Read more</button>
        </div>

        <div className="mt-8">
          <h3 className="mb-4 text-lg font-semibold">How it works</h3>
          <div className="rounded-lg bg-white">
            {firstGroup.map((it, idx) => {
              const i = idx;
              return <FaqItem key={i} item={it} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />;
            })}
          </div>

          <h3 className="mt-8 mb-4 text-lg font-semibold">Our testing</h3>
          <div className="rounded-lg bg-white">
            {secondGroup.map((it, idx) => {
              const i = idx + firstGroup.length;
              return <FaqItem key={i} item={it} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />;
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
