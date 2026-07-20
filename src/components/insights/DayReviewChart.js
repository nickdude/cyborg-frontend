"use client";


/* Chart values live in JS constants (MACRO_META pattern) — named Tailwind
   tokens can't reach SVG props/inline styles. */
const BRAND_PURPLE = "#541D7A"; // primary token value
// Frame-sampled stable-curve green (day-review-positive) — softer than the
// biomarkerOptimal teal, per the Figma reference.
const STABLE_GREEN = "#4DA852";
// Figma band: horizontal wash rgba(0,0,0,0.04) → rgba(0,0,0,0.012)
const BAND_GRADIENT =
  "linear-gradient(90deg, rgba(0,0,0,0.012) 0%, rgba(0,0,0,0.04) 100%)";

// Fixed vertical geometry (px). Width is fluid; x positions are % of width.
const PLOT_TOP = 50; // annotation zone above the plot
const PLOT_H = 224;
const BAND_TOP = 63; // y of 110 mg/dL inside the plot
const BAND_BOT = 179; // y of 70 mg/dL inside the plot
const AXIS_TOP = PLOT_TOP + PLOT_H + 6;
const TOTAL_H = AXIS_TOP + 26;

// Peak of sin(pi*u)*exp(-0.35u) — used to normalize the spike curve so the
// drawn crest hits exactly the predicted peak value.
const SPIKE_SHAPE_MAX = 0.835;

/* The Figma chart is not on a linear scale — the 70-110 target band is
   exaggerated to ~52% of the plot. Mirror that with a piecewise mapping. */
function makeYScale(peak) {
  const gTop = Math.max(peak + 8, 124);
  return (g) => {
    if (g >= 110) return BAND_TOP - ((g - 110) / (gTop - 110)) * (BAND_TOP - 10);
    if (g >= 70) return BAND_BOT - ((g - 70) / 40) * (BAND_BOT - BAND_TOP);
    return Math.min(BAND_BOT + ((70 - g) / 30) * (PLOT_H - BAND_BOT - 6), PLOT_H - 2);
  };
}

function roundToHalfHour(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const mins = d.getMinutes();
  d.setMinutes(mins < 15 ? 0 : mins < 45 ? 30 : 60, 0, 0);
  return d;
}

function clockLower(d) {
  if (!d || isNaN(d.getTime())) return "";
  return d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase();
}

function clockUpper(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toUpperCase();
}

/**
 * Day Review step-1 glucose chart, built 1:1 from the Figma frame:
 * full-bleed target-range band, annotated meal marker on the curve,
 * end dot, right-edge range labels and a bottom time axis.
 *
 * variant "spike"  — purple rise-and-fall curve peaking above the band.
 * variant "stable" — gentle green rise that stays inside the band.
 */
export default function DayReviewChart({ variant = "spike", predicted, consumedAt }) {
  const stable = variant === "stable";
  const baseline = Math.round(predicted?.baselineMgDl ?? 90);
  // Derive a missing peak from the delta (or vice versa) — never invent one.
  const peak = Math.round(
    predicted?.peakMgDl ?? baseline + (predicted?.deltaMgDl ?? 0)
  );
  const yFor = makeYScale(peak);

  // x positions (% of width) taken from the Figma frames.
  const xMeal = stable ? 23 : 16;
  const xEnd = stable ? 66 : 75;

  const glucoseAt = (x) => {
    if (stable) {
      // Gentle near-flat rise from baseline to peak across the whole span.
      return baseline + (peak - baseline) * (x / xEnd);
    }
    if (x < xMeal) {
      // Slight pre-meal dip, as in the frame.
      return baseline - 1.5 * Math.sin((Math.PI * x) / xMeal);
    }
    const u = (x - xMeal) / (xEnd - xMeal);
    const amp = (peak - baseline) / SPIKE_SHAPE_MAX;
    return baseline + amp * Math.sin(Math.PI * u) * Math.exp(-0.35 * u);
  };

  const N = 56;
  const path = Array.from({ length: N + 1 }, (_, i) => {
    const x = (xEnd * i) / N;
    return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${yFor(glucoseAt(x)).toFixed(2)}`;
  }).join(" ");

  const stroke = stable ? STABLE_GREEN : BRAND_PURPLE;
  const yMeal = yFor(glucoseAt(xMeal));
  const yEnd = yFor(glucoseAt(xEnd));

  // Annotation: baseline at meal time for spikes, the peak for stable curves.
  const annotationValue = stable ? peak : baseline;
  const annotationTime = clockUpper(consumedAt);

  const tick0 = roundToHalfHour(consumedAt);
  const tick1 = tick0 ? new Date(tick0.getTime() + 60 * 60 * 1000) : null;

  return (
    <div className="relative w-full" style={{ height: TOTAL_H }}>
      {/* Meal-time annotation over the marker */}
      <div
        className="absolute top-0 -translate-x-1/2 text-center"
        style={{ left: `${xMeal}%` }}
      >
        <p className="whitespace-nowrap text-[10px] text-secondary">{annotationTime}</p>
        <p className="whitespace-nowrap text-[15px] font-medium text-ink">
          {annotationValue} mg/dL
        </p>
      </div>
      {/* Dotted drop line from the annotation down to the marker */}
      <span
        className="absolute border-l border-dotted border-secondary/60"
        style={{
          left: `${xMeal}%`,
          top: 42,
          height: Math.max(PLOT_TOP + yMeal - 12 - 42, 0),
        }}
      />

      {/* Target-range band (full-bleed) */}
      <div
        className="absolute inset-x-0"
        style={{
          top: PLOT_TOP + BAND_TOP,
          height: BAND_BOT - BAND_TOP,
          backgroundImage: BAND_GRADIENT,
        }}
      />
      <p
        className="absolute right-5 text-right text-[10px] text-secondary"
        style={{ top: PLOT_TOP + BAND_TOP - 22 }}
      >
        110 mg/dL
      </p>
      <p
        className="absolute right-4 w-[64px] -translate-y-1/2 text-center text-[10px] font-medium leading-[15px] text-secondary"
        style={{ top: PLOT_TOP + (BAND_TOP + BAND_BOT) / 2 }}
      >
        TARGET RANGE
      </p>

      {/* Curve */}
      <svg
        className="absolute inset-x-0"
        style={{ top: PLOT_TOP, height: PLOT_H }}
        width="100%"
        height={PLOT_H}
        viewBox={`0 0 100 ${PLOT_H}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d={path}
          fill="none"
          stroke={stroke}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* End dot */}
      <span
        className="absolute h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ left: `${xEnd}%`, top: PLOT_TOP + yEnd, backgroundColor: stroke }}
      />

      {/* Meal marker on the curve — Figma-exported glyph (node 1867:4659) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/insights/utensils-marker.svg"
        alt=""
        className="absolute h-[19px] w-[19px] -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${xMeal}%`, top: PLOT_TOP + yMeal }}
      />

      {/* Time axis */}
      <div className="absolute inset-x-0" style={{ top: AXIS_TOP }}>
        {tick0 && (
          <span className="absolute -translate-x-1/2 text-[10px] text-secondary" style={{ left: "20%" }}>
            {clockLower(tick0)}
          </span>
        )}
        {tick1 && (
          <span className="absolute -translate-x-1/2 text-[10px] text-secondary" style={{ left: "53%" }}>
            {clockLower(tick1)}
          </span>
        )}
        <span className="absolute right-5 text-[10px] text-secondary">40 mg/dL</span>
      </div>
    </div>
  );
}
