"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Desktop-only fade-up on scroll. The animation classes are ALL `lg:`-prefixed,
 * so on mobile/tablet (<1024px) the wrapper has no opacity/transform/transition
 * and renders exactly as before — mobile behavior is untouched.
 */
export default function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
      className={[
        "lg:motion-safe:transition-all lg:motion-safe:duration-700 lg:motion-safe:ease-out",
        shown
          ? "lg:opacity-100 lg:translate-y-0"
          : "lg:motion-safe:opacity-0 lg:motion-safe:translate-y-10",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
