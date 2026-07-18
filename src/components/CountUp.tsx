"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

const easeOut = [0.22, 1, 0.36, 1] as const;

type CountUpProps = {
  to: number;
  format?: (n: number) => string;
  duration?: number;
  delay?: number;
  /** Extra gate (e.g. wait for the preloader) on top of the in-view check. */
  start?: boolean;
  className?: string;
};

const defaultFormat = (n: number) => Math.round(n).toLocaleString("en-IN");

/**
 * Animated number that counts up once when scrolled into view. Reduced-motion
 * users get the final value immediately.
 */
export function CountUp({
  to,
  format = defaultFormat,
  duration = 1.2,
  delay = 0,
  start = true,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  // No shrink margin: the hero stat row sits at the very bottom of the
  // viewport on desktop, and a negative margin would keep it "out of view".
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(() => format(0));

  // `format` is deliberately not a dependency — callers pass inline lambdas,
  // and re-running the effect every render would restart the animation.
  useEffect(() => {
    if (!inView || !start) return;
    if (reduce) {
      setDisplay(format(to));
      return;
    }
    const controls = animate(0, to, {
      duration,
      delay,
      ease: easeOut,
      onUpdate: (v) => setDisplay(format(v)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, start, reduce, to, duration, delay]);

  return (
    <span ref={ref} className={`tabular-nums ${className ?? ""}`}>
      {display}
    </span>
  );
}
