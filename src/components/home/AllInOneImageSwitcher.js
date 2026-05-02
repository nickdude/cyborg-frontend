"use client";

import { useMemo, useState } from "react";

export default function AllInOneImageSwitcher({
  images,
  altPrefix = "Cyborg mobile app preview",
  onChange,
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeImage = useMemo(() => images?.[activeIndex], [images, activeIndex]);

  if (!images || images.length === 0) {
    return null;
  }

  const setActiveSlide = (nextIndex) => {
    setActiveIndex(nextIndex);
    onChange?.(nextIndex);
  };

  const goToPrevious = () => {
    setActiveIndex((currentIndex) => {
      const nextIndex = (currentIndex - 1 + images.length) % images.length;
      onChange?.(nextIndex);
      return nextIndex;
    });
  };

  const goToNext = () => {
    setActiveIndex((currentIndex) => {
      const nextIndex = (currentIndex + 1) % images.length;
      onChange?.(nextIndex);
      return nextIndex;
    });
  };

  return (
    <div className="mx-auto mt-6 w-full max-w-[620px]">
      <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
        <img
          src={activeImage.src}
          alt={`${altPrefix} ${activeIndex + 1}`}
          className="h-auto w-full"
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goToPrevious}
          className="flex h-11 min-w-[92px] items-center justify-center rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-black transition active:scale-95"
          aria-label="Show previous image"
        >
          Previous
        </button>

        <div className="flex items-center gap-2">
          {images.map((image, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={image.src}
                type="button"
                onClick={() => setActiveSlide(index)}
                className={`h-3.5 rounded-full transition-all ${
                  isActive ? "w-8 bg-black" : "w-3.5 bg-black/20"
                }`}
                aria-label={`Show image ${index + 1}`}
                aria-pressed={isActive}
              />
            );
          })}
        </div>

        <button
          type="button"
          onClick={goToNext}
          className="flex h-11 min-w-[92px] items-center justify-center rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-black transition active:scale-95"
          aria-label="Show next image"
        >
          Next
        </button>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-black/55">
        <span>{activeIndex + 1}</span>
        <span>/</span>
        <span>{images.length}</span>
      </div>
    </div>
  );
}