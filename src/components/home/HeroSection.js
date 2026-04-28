"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const firstFrame = 1000;
const lastFrame = 1170;
const frameCount = lastFrame - firstFrame + 1;

const getFrameSrc = (frameNumber) =>
  `/assets/hero-images/${encodeURIComponent(`Comp ${frameNumber}.jpg`)}`;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const REVERSE_CAPTURE_SCROLL_Y = 12;

export default function HeroSection() {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const scrollProgress = useRef(0);

  const frameSrc = useMemo(
    () => getFrameSrc(firstFrame + currentFrame),
    [currentFrame]
  );

  useEffect(() => {
    let touchStartY = 0;

    const updateFrame = (delta) => {
      scrollProgress.current += delta;
      scrollProgress.current = clamp(scrollProgress.current, 0, 1);

      const nextFrame = Math.round(scrollProgress.current * (frameCount - 1));
      setCurrentFrame(nextFrame);

      // Re-engage hero if scrolling backward from completed state
      if (isCompleted && scrollProgress.current < 1) {
        setIsCompleted(false);
      }

      // Mark as completed when reaching the end
      if (scrollProgress.current >= 1 && !isCompleted) {
        setIsCompleted(true);
      }
    };

    const handleWheel = (e) => {
      // Only prevent default and update frame if hero is active
      if (!isCompleted) {
        e.preventDefault();
        updateFrame(e.deltaY > 0 ? 0.01 : -0.01);
      } else {
        // Re-enter hero reverse animation only when user is already near the top.
        if (e.deltaY < 0 && window.scrollY <= REVERSE_CAPTURE_SCROLL_Y) {
          e.preventDefault();
          updateFrame(-0.01);
        }
      }
    };

    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const touchY = e.touches[0].clientY;
      const delta = touchStartY - touchY;

      if (!isCompleted) {
        e.preventDefault();
        updateFrame(delta * 0.005);
      } else if (delta < 0 && window.scrollY <= REVERSE_CAPTURE_SCROLL_Y) {
        // Re-enter hero reverse animation only when user is already near the top.
        e.preventDefault();
        updateFrame(delta * 0.005);
      }

      touchStartY = touchY;
    };

    // Always attach listeners, only prevent default if not completed
    document.body.style.overflow = isCompleted ? "auto" : "hidden";

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isCompleted]);

  return (
    <section className="relative w-full bg-black">
      {/* HERO */}
      <div
        className={`fixed top-0 left-0 z-50 h-screen w-full bg-black transition-opacity duration-300 ${
          isCompleted ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <img
          src={frameSrc}
          alt={`Hero frame ${currentFrame + 1}`}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Spacer so next section starts correctly */}
      <div className="h-screen" />
    </section>
  );
}
