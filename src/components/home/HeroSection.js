"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const firstFrame = 1000;
const lastFrame = 1170;
const frameCount = lastFrame - firstFrame + 1;

const getFrameSrc = (frameNumber) =>
  `/assets/hero-images/${encodeURIComponent(`Comp ${frameNumber}.webp`)}`;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const REVERSE_CAPTURE_SCROLL_Y = 12;

export default function HeroSection() {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  const scrollProgress = useRef(0);
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const rafRef = useRef(0);

  // Preload every frame once, keeping decoded images in memory so scrubbing
  // never hits the network on production.
  useEffect(() => {
    let cancelled = false;
    let loaded = 0;
    const imgs = new Array(frameCount);

    const onSettled = () => {
      loaded += 1;
      if (cancelled) return;
      setLoadProgress(loaded / frameCount);
      if (loaded === frameCount) setIsReady(true);
    };

    for (let i = 0; i < frameCount; i += 1) {
      const img = new Image();
      img.decoding = "async";
      img.onload = onSettled;
      img.onerror = onSettled;
      img.src = getFrameSrc(firstFrame + i);
      imgs[i] = img;
    }
    imagesRef.current = imgs;

    return () => {
      cancelled = true;
    };
  }, []);

  // Draw a frame to the canvas: cover on mobile (fills the screen), contain on
  // desktop (zooms out so the whole composition is visible, no harsh crop).
  const drawFrame = useCallback((index) => {
    const canvas = canvasRef.current;
    const img = imagesRef.current[index];
    if (!canvas || !img || !img.complete || !img.naturalWidth) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    const targetW = Math.round(cssW * dpr);
    const targetH = Math.round(cssH * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    const scale = isDesktop
      ? Math.min(cw / iw, ch / ih) // contain → zoomed out
      : Math.max(cw / iw, ch / ih); // cover → fills viewport

    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }, []);

  // Render the active frame on the next animation frame (decouples paint from
  // the high-frequency scroll/wheel events for a smooth result).
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => drawFrame(currentFrame));
    return () => cancelAnimationFrame(rafRef.current);
  }, [currentFrame, isReady, drawFrame]);

  // Keep the canvas crisp and correctly fitted on viewport resize / rotation.
  useEffect(() => {
    const handleResize = () => drawFrame(currentFrame);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentFrame, drawFrame]);

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
        <canvas
          ref={canvasRef}
          aria-label="Hero animation"
          role="img"
          className="h-full w-full"
        />

        {/* Lightweight loader shown only while frames preload */}
        {!isReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black text-white">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/25 border-t-white" />
            <p className="text-sm font-medium tracking-wide text-white/70">
              {Math.round(loadProgress * 100)}%
            </p>
          </div>
        )}

        {/* Overlay copy + CTA (fades out with the hero when scroll completes) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-6 pb-10 pt-24 text-center text-white lg:inset-0 lg:flex lg:items-center lg:bg-gradient-to-r lg:from-black/90 lg:via-black/55 lg:via-40% lg:to-transparent lg:to-75% lg:px-20 lg:py-0 lg:text-left xl:px-28">
          <div className="mx-auto w-full max-w-[400px] lg:mx-0 lg:max-w-[640px]">
            <h1 className="mx-auto max-w-[11ch] text-[clamp(1.6rem,7.2vw,2.4rem)] font-bold leading-[1.12] tracking-[-0.02em] lg:mx-0 lg:max-w-[14ch] lg:text-[clamp(3rem,4.4vw,4.5rem)] lg:leading-[1.04]">
              Unlock your new health intelligence
            </h1>

            <p className="mx-auto mt-5 max-w-[30ch] text-[clamp(0.95rem,3.7vw,1.1rem)] leading-[1.4] text-white/90 lg:mx-0 lg:mt-7 lg:max-w-[44ch] lg:text-xl lg:leading-[1.5] lg:text-white/80">
              Clinician-guided GLP-1 therapy. Every week. Target 50+ conditions tied to obesity and metabolic aging. Starting at ₹10,000/month
            </p>

            <Link
              href="/login"
              className="pointer-events-auto mt-7 flex w-full items-center justify-center rounded-2xl bg-white py-4 text-lg font-semibold text-black transition hover:bg-white/90 lg:mt-9 lg:inline-flex lg:w-auto lg:px-12 lg:py-4 lg:text-xl lg:shadow-[0_12px_40px_rgba(255,255,255,0.18)] lg:hover:-translate-y-0.5 lg:hover:shadow-[0_18px_50px_rgba(255,255,255,0.28)]"
            >
              Join Today
            </Link>

            <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-white/85 lg:mt-6 lg:justify-start lg:text-base">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                <path d="M8.5 12.2l2.3 2.3 4.7-4.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              NSF FSCC 22000
            </div>
          </div>
        </div>
      </div>

      {/* Spacer so next section starts correctly */}
      <div className="h-screen" />
    </section>
  );
}
