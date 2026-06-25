"use client";

import { useEffect, useState } from "react";

/**
 * Full-screen branded preloader for the landing page. It stays up until the hero
 * background video has buffered enough to play — slow the first time (the 35 MB
 * video downloads), then near-instant once the browser has it cached. A minimum
 * show time avoids a jarring flash, and a hard cap means it can never get stuck.
 */
export function LandingPreloader() {
  const [ready, setReady] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const started = Date.now();
    const MIN_MS = 350; // avoid a flash on fast/cached loads
    const MAX_MS = 9000; // hard cap so it never sticks

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      const wait = Math.max(0, MIN_MS - (Date.now() - started));
      window.setTimeout(() => {
        setReady(true);
        window.setTimeout(() => setGone(true), 600); // unmount after the fade
      }, wait);
    };

    const video = document.querySelector("video");
    if (video) {
      // readyState >= 3 (HAVE_FUTURE_DATA) means it's buffered enough to play.
      if (video.readyState >= 3) finish();
      else {
        video.addEventListener("canplay", finish, { once: true });
        video.addEventListener("loadeddata", finish, { once: true });
      }
    } else {
      finish(); // no video on the page — don't block it
    }

    const cap = window.setTimeout(finish, MAX_MS);
    return () => {
      window.clearTimeout(cap);
      if (video) {
        video.removeEventListener("canplay", finish);
        video.removeEventListener("loadeddata", finish);
      }
    };
  }, []);

  if (gone) return null;

  return (
    <div
      aria-hidden={ready}
      className={`fixed inset-0 z-[300] flex flex-col items-center justify-center gap-6 bg-black transition-opacity duration-500 ${
        ready ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <span className="text-2xl font-bold tracking-tight text-white">CYBORG</span>
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/25 border-t-white" />
    </div>
  );
}
