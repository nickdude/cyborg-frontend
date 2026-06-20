"use client";

import { ReactLenis } from "lenis/react";

/**
 * Lenis smooth-scroll (superpower.com-style buttery scroll). Wraps the whole app
 * as the root scroller so window-scroll based animations (Motion useScroll) still work.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  // QA bypass: ?nolenis disables smoothing so screenshots can scroll to exact positions.
  if (
    typeof window !== "undefined" &&
    window.location.search.includes("nolenis")
  ) {
    return <>{children}</>;
  }
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        duration: 1.2,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
      }}
    >
      {children}
    </ReactLenis>
  );
}
