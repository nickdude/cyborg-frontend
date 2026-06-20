"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Generate a simple glucose response curve (white line on gradient bg). */
function generateCurvePoints(score) {
  const points = [];
  const peak = score <= 4 ? 40 : 15;
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const y = peak * Math.sin(Math.PI * t) * Math.exp(-0.3 * t);
    points.push({ x: i * 5, y: Math.round(50 - y) });
  }
  return points;
}

function curveToPath(points) {
  if (points.length === 0) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx1 = prev.x + (curr.x - prev.x) / 3;
    const cpx2 = prev.x + (2 * (curr.x - prev.x)) / 3;
    d += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

/* ------------------------------------------------------------------ */
/* Bokeh circle component (decorative blurred circles)                 */
/* ------------------------------------------------------------------ */

function BokehCircles({ isNegative }) {
  const circles = useMemo(() => {
    const base = isNegative
      ? [
          { cx: "15%", cy: "20%", r: 60, opacity: 0.15 },
          { cx: "80%", cy: "15%", r: 40, opacity: 0.1 },
          { cx: "70%", cy: "70%", r: 80, opacity: 0.12 },
          { cx: "25%", cy: "80%", r: 50, opacity: 0.08 },
          { cx: "50%", cy: "45%", r: 35, opacity: 0.1 },
        ]
      : [
          { cx: "20%", cy: "25%", r: 55, opacity: 0.12 },
          { cx: "75%", cy: "20%", r: 45, opacity: 0.1 },
          { cx: "65%", cy: "65%", r: 70, opacity: 0.1 },
          { cx: "30%", cy: "75%", r: 40, opacity: 0.08 },
          { cx: "55%", cy: "40%", r: 30, opacity: 0.1 },
        ];
    return base;
  }, [isNegative]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {circles.map((c, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: c.cx,
            top: c.cy,
            width: c.r * 2,
            height: c.r * 2,
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(255,255,255," + c.opacity + ")",
            filter: "blur(20px)",
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

/**
 * GlucoseNotification
 *
 * Full-screen gradient overlay for glucose zone scores.
 * - Negative (score <= 4): pink/red gradient with bokeh
 * - Positive (score >= 8): green/teal gradient with bokeh
 * - Neutral (5-7): amber gradient
 *
 * @param {number}   score     - Glucose zone score (1-10)
 * @param {number}   deltaMgDl - Glucose change in mg/dL (e.g. 26)
 * @param {string}   message   - Description text
 * @param {string}   type      - "positive" | "negative"
 * @param {number}   minutesAgo - Minutes since this zone was recorded
 * @param {string}   date      - Date string for the day review link
 * @param {function} onDismiss - Called when user dismisses
 */
export default function GlucoseNotification({
  score = 3,
  deltaMgDl = 26,
  message,
  type,
  minutesAgo = 13,
  date,
  onDismiss,
}) {
  const router = useRouter();

  const isNegative = type === "negative" || score <= 4;
  const isPositive = type === "positive" || score >= 8;

  // Gradient classes
  const gradientClass = isNegative
    ? "from-rose-400 via-rose-500 to-rose-600"
    : isPositive
    ? "from-emerald-400 via-emerald-500 to-emerald-600"
    : "from-amber-400 via-amber-500 to-amber-600";

  // Auto-generate description if none provided
  const displayMessage =
    message ||
    (isNegative
      ? "This zone had a large glucose response"
      : isPositive
      ? "This zone had a healthy glucose response"
      : "This zone had a moderate glucose response");

  const curvePoints = useMemo(() => generateCurvePoints(score), [score]);
  const curvePath = useMemo(() => curveToPath(curvePoints), [curvePoints]);

  // Find the peak point for the dot marker
  const peakPoint = useMemo(() => {
    let minY = Infinity;
    let peak = curvePoints[0];
    for (const p of curvePoints) {
      if (p.y < minY) {
        minY = p.y;
        peak = p;
      }
    }
    return peak;
  }, [curvePoints]);

  const handleDetails = () => {
    if (date) {
      router.push(`/glucose/review/${date}`);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b ${gradientClass}`}
    >
      {/* Bokeh circles */}
      <BokehCircles isNegative={isNegative} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-8 w-full max-w-md">
        {/* Zone score label */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80 mb-6">
          Zone Score &middot; {minutesAgo} min ago
        </p>

        {/* Large score number */}
        <span className="text-[55px] font-bold leading-none text-white">
          {score}
        </span>

        {/* Delta mg/dL */}
        <p className="mt-2 text-[15px] text-white/90">
          +{deltaMgDl} mg/dL
        </p>

        {/* Glucose response curve */}
        <div className="mt-6 w-full flex justify-center">
          <svg width="100" height="60" viewBox="0 0 100 60" fill="none">
            <path d={curvePath} stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Dot marker at peak */}
            <circle cx={peakPoint.x} cy={peakPoint.y} r="4" fill="white" />
          </svg>
        </div>

        {/* Description text */}
        <p className="mt-6 text-center text-[22px] font-bold leading-tight text-white px-2">
          {displayMessage}
        </p>

        {/* Buttons */}
        <div className="mt-10 flex w-full gap-3">
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="flex-1 rounded-xl border-2 border-white/60 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Dismiss
            </button>
          )}
          {date && (
            <button
              type="button"
              onClick={handleDetails}
              className="flex-1 rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
