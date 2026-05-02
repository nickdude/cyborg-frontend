"use client";

import { useEffect, useState } from "react";

export default function TagOverlaySection({ images, tags, interval = 3000 }) {
  const defaultImages = [
    "/assets/testinomial/test1.png",
    "/assets/testinomial/test2.png",
    "/assets/testinomial/test3.png",
    "/assets/testinomial/test4.png",
    "/assets/testinomial/test5.png",
    "/assets/testinomial/test6.png",
  ];

  const defaultTags = [
    "Ultra-Processed Diet",
    "Chronic Stress",
    "Poor Sleep",
    "Sedentary Lifestyle",
    "Insulin Resistance",
    "Visceral Fat",
    "Gut Dysbiosis",
    "Chronic Inflammation",
    "Endocrine Disruptors",
    "Yo-Yo Dieting",
    "Alcohol",
    "Excess Sugar",
    "Hormonal Decline",
    "Mitochondrial Dysfunction",
    "Sarcopenia",
    "Hyperglycemia",
  ];

  const imgs = images && images.length ? images : defaultImages;
  const items = tags && tags.length ? tags : defaultTags;

  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((a) => (a + 1) % imgs.length);
    }, interval);
    return () => clearInterval(id);
  }, [imgs.length, interval]);

  return (
    <section className="relative bg-white px-0">
      <div className="mx-auto w-full max-w-[980px]">
        <div className="relative overflow-hidden">
            <p className="px-6 py-8 font-medium text-base font-inter ">&ldquo;Day-to-day life silently disrupts your metabolic signaling — blunting your body&apos;s critical appetite and energy regulator, GLP-1.&rdquo;</p>
          <div className="relative w-full h-[80vh] sm:h-[360px] md:h-[420px] lg:h-[480px]">
            {imgs.map((src, i) => (
              <img
                key={`${src}-${i}`}
                src={src}
                alt={`carousel-${i}`}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${
                  i === active ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}

            <div className="absolute left-0 right-0 top-6 mx-auto flex max-w-[860px] flex-wrap items-start justify-start gap-3 px-4 text-center">
              {items.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/90 bg-black/40 px-4 py-1 text-sm font-medium text-white backdrop-blur-sm"
                  style={{ textShadow: "0 1px 0 rgba(0,0,0,0.25)" }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
