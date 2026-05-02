"use client";

import { useState } from "react";

export default function TestimonialCarousel({ items: propItems, onChange }) {
  const defaultItems = [
    { src: "/assets/testinomial/test1.png", title: "Upload past lab data", description: "Visualize past Quest or Labcorp results." },
    { src: "/assets/testinomial/test2.png", title: "All your data in one place", description: "100+ labs, your biological age & health report." },
    { src: "/assets/testinomial/test3.png", title: "Personalized insights", description: "Deep insights tailored to your biomarkers." },
    { src: "/assets/testinomial/test4.png", title: "Concierge support", description: "Talk to specialists and get curated plans." },
    { src: "/assets/testinomial/test5.png", title: "Flexible testing", description: "Add-on testing anytime for deeper analysis." },
    { src: "/assets/testinomial/test6.png", title: "Actionable plan", description: "A plan that evolves with your data." },
  ];

  const items = propItems && propItems.length ? propItems : defaultItems;

  const [active, setActive] = useState(0);

  const setActiveIndex = (i) => {
    const idx = ((i % items.length) + items.length) % items.length;
    setActive(idx);
    onChange?.(idx);
  };

  const prev = () => setActiveIndex(active - 1);
  const next = () => setActiveIndex(active + 1);

  return (
    <section className="bg-[#f3f3f5] px-5 py-10 text-black md:px-8">
      <div className="mx-auto w-full max-w-[430px] md:max-w-[820px] lg:max-w-[980px]">
        <div className="relative">
            <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
              <img src={items[active].src} alt={`testimonial ${active + 1}`} className="w-full h-auto object-cover" />
            </div>

          <button
            type="button"
            onClick={prev}
            aria-label="Previous"
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black p-2 text-white shadow-lg"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={next}
            aria-label="Next"
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black p-2 text-white shadow-lg"
          >
            ›
          </button>
        </div>

        <h3 className="mt-6 text-center text-[clamp(1.6rem,4vw,2rem)] font-semibold">{items[active].title}</h3>
        <p className="mx-auto mt-3 max-w-[34ch] text-center text-[clamp(1rem,3.2vw,1.15rem)] text-[#666973]">{items[active].description}</p>

        <div className="mt-4 flex items-center justify-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              aria-label={`Go to ${i + 1}`}
              className={`h-2.5 rounded-full transition-all ${i === active ? 'w-8 bg-black' : 'w-2.5 bg-black/20'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
