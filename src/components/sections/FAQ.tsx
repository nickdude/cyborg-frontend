"use client";

import { useState } from "react";
import { Container } from "@/components/Container";
import { cn } from "@/lib/utils";

type FaqItem = {
  q: string;
  a: string;
};

type FaqGroup = {
  label: string;
  items: FaqItem[];
};

const groups: FaqGroup[] = [
  {
    label: "How it works",
    items: [
      {
        q: "What should I expect during a blood draw?",
        a: "A trained phlebotomist will collect a small sample from a vein in your arm. The process is quick, typically taking just a few minutes, and most people feel only a brief pinch.",
      },
      {
        q: "How do I prepare for a blood draw?",
        a: "We generally recommend fasting for 8 to 12 hours beforehand and staying well hydrated. Your personalized instructions will be available in the app once your test is booked.",
      },
      {
        q: "What should I do after my blood draw?",
        a: "Keep the bandage on for a few hours and avoid heavy lifting with that arm for the rest of the day. You can resume your normal routine right away.",
      },
      {
        q: "Where can I take my blood test?",
        a: "You can visit any of our 2,000+ partner labs or schedule an at-home draw with a mobile phlebotomist at a time that suits you.",
      },
    ],
  },
  {
    label: "Our testing",
    items: [
      {
        q: "Does Cyborg replace my primary care provider?",
        a: "No. Cyborg complements your existing care by giving you deeper insights into your health, which you can share and discuss with your primary care provider.",
      },
      {
        q: "How fast are blood test results and how do I read them?",
        a: "Results are usually ready within a few days and delivered through the app with clear, plain-language explanations and tailored recommendations.",
      },
      {
        q: "Does Cyborg accept health insurance?",
        a: "Cyborg is a membership service and is not billed through insurance. Many members use HSA or FSA funds to cover the cost of their testing.",
      },
      {
        q: "What if I want more than 1 blood test per year?",
        a: "Additional tests can be added at any time directly from your account, so you can track your progress as often as you like.",
      },
    ],
  },
];

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function FAQ() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <section className="bg-white py-20 md:py-24">
      <Container className="max-w-[940px]">
        <h2 className="text-center text-3xl font-semibold tracking-[-0.02em] text-black md:text-[44px]">
          Frequently Asked Questions
        </h2>

        <button
          type="button"
          className="mx-auto mt-6 block rounded-2xl border border-[#e6e6e8] bg-white px-6 py-3 text-base text-black"
        >
          Read more
        </button>

        <div className="mt-12">
          {groups.map((group, groupIndex) => (
            <div key={group.label} className={cn(groupIndex > 0 && "mt-10")}>
              <h3 className="border-b border-black/10 pb-3 text-lg font-semibold text-black">
                {group.label}
              </h3>

              <div>
                {group.items.map((item, itemIndex) => {
                  const key = `${groupIndex}-${itemIndex}`;
                  const isOpen = openKey === key;

                  return (
                    <div key={key}>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setOpenKey(isOpen ? null : key)}
                        className="flex w-full items-center justify-between border-b border-black/10 py-4 text-left"
                      >
                        <span className="text-base text-black">{item.q}</span>
                        <ChevronDown
                          className={cn(
                            "shrink-0 text-black/50 transition-transform duration-200",
                            isOpen && "rotate-180",
                          )}
                        />
                      </button>

                      {isOpen && (
                        <p className="border-b border-black/10 pb-4 text-sm leading-relaxed text-black/55">
                          {item.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
