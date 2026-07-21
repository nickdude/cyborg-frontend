"use client";

import { useEffect, useState } from "react";
import { foodScoreAPI } from "@/services/api";

// Design-approved gradient/accent hexes for this alert screen (built 1:1 from
// the reference frames) — kept in JS style objects, not tailwind classes.
const BANDS = {
  red: {
    background:
      "linear-gradient(201.93deg, #EF5D68 1.67%, #ED5776 23.32%, #AE4976 49.02%, #843561 95.82%)",
    circle: "linear-gradient(#FFFFFF 0%, #DDB1C5 100%)",
    accent: "#ED5776",
    headline: "This zone had a large glucose response",
  },
  amber: {
    background:
      "linear-gradient(201.93deg, #F5A55C 1.67%, #EE8F5B 23.32%, #C46A52 49.02%, #8A4A3F 95.82%)",
    circle: "linear-gradient(#FFFFFF 0%, #E8C9A8 100%)",
    accent: "#EE8F5B",
    headline: "This zone had a moderate glucose response",
  },
  green: {
    background:
      "linear-gradient(201.93deg, #4FC486 1.67%, #3BB58B 23.32%, #2E8F7A 49.02%, #1F5F58 95.82%)",
    circle: "linear-gradient(#FFFFFF 0%, #B9DEC9 100%)",
    accent: "#3BB58B",
    headline: "This zone kept your glucose steady",
  },
  // Unknown score — desaturated so a loading/failed fetch never wears the
  // "large response" alarm colors.
  neutral: {
    background:
      "linear-gradient(201.93deg, #8E8798 1.67%, #7C7489 23.32%, #635C72 49.02%, #4A4458 95.82%)",
    circle: "linear-gradient(#FFFFFF 0%, #D5D1DC 100%)",
    accent: "#7C7489",
    headline: "Analyzing this zone's glucose response",
  },
  // Predicted Glucose Peak variant — teal, per the "Positive Score" frame.
  glucose: {
    background:
      "linear-gradient(201.93deg, #047A8D 1.67%, #079696 23.32%, #80C49F 95.82%)",
    circle: "linear-gradient(#FFFFFF 0%, #C9E8DE 100%)",
    accent: "#2997A1",
    headline: "New zone insights identified",
  },
};

// Bokeh accents from the reference frame (score-band variants only — the
// glucose frame is a clean gradient).
// The frame's exported circle assets carry only ~4px of blur (their bounds
// bleed ~3.7% past the 111px circles) at ~20-35% white — heavier blur smears
// the circle edges into an unreadable haze, so keep it in the 6-10px range.
const BOKEH = [
  { left: -43, top: -72, size: 111, alpha: 0.28, blur: 6 },
  { left: 67, top: -22, size: 111, alpha: 0.28, blur: 6 },
  { left: 102, top: 14, size: 111, alpha: 0.22, blur: 6 },
  { left: 291, top: -7, size: 111, alpha: 0.2, blur: 6 },
  { left: -78, top: 30, size: 160, alpha: 0.32, blur: 8 },
  { left: 25, top: 64, size: 115, alpha: 0.25, blur: 7 },
  { left: -60, top: "45%", size: 120, alpha: 0.28, blur: 10 },
];

function bandFor(score) {
  if (score == null) return BANDS.neutral;
  if (score <= 4) return BANDS.red;
  if (score >= 8) return BANDS.green;
  return BANDS.amber;
}

function relativeTime(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (!Number.isFinite(mins) || mins < 1) return "JUST NOW";
  if (mins < 60) return `${mins} MIN AGO`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} HR AGO`;
  return `${Math.floor(hrs / 24)} DAYS AGO`;
}

/**
 * Full-screen zone insight overlay.
 *
 * Default variant colors itself by score band (red/amber/green). Pass
 * `variant="glucose"` for the teal "Predicted Glucose Peak" treatment.
 */
export default function ZoneScoreOverlay({ entry, userId, onClose, onDetails, variant = "score" }) {
  const isGlucose = variant === "glucose";
  const mealId = entry?.id || entry?._id;
  // The timeline response bundles the meal's score — when it's there the
  // overlay opens fully painted with zero requests; the fetch is only a
  // fallback for entries from older cached payloads.
  const bundledScore = entry?.data?.foodScore;
  const bundled =
    bundledScore != null
      ? {
          score: bundledScore,
          predictedGlucosePeak: { deltaMgDl: entry?.data?.deltaMgDl ?? null },
        }
      : null;

  const [score, setScore] = useState(bundled);
  const [loading, setLoading] = useState(bundled == null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (bundledScore != null) return;
    if (!userId || !mealId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const resp = await foodScoreAPI.get(userId, mealId);
        if (!cancelled) setScore(resp?.data || resp);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, mealId, bundledScore]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    document.body.classList.add("overflow-hidden");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("overflow-hidden");
    };
  }, [onClose]);

  const foodScore = score?.score ?? score?.foodScore;
  const delta = score?.predictedGlucosePeak?.deltaMgDl ?? null;
  const band = isGlucose ? BANDS.glucose : bandFor(foodScore ?? null);
  const headline = error
    ? "Couldn't load this zone's score"
    : foodScore == null
      ? "Analyzing this zone's glucose response"
      : isGlucose
        ? `${foodScore}/10 · New zone insights identified`
        : band.headline;

  return (
    // Full-bleed backdrop keeps the page behind unclickable on wide
    // viewports; the gradient panel itself stays phone-width.
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isGlucose ? "Predicted Glucose Peak" : "Zone Score"}
      className="fixed inset-0 z-[70] flex justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative flex w-full sm:max-w-md flex-col items-center overflow-hidden"
        style={{ background: band.background }}
        onClick={(e) => e.stopPropagation()}
      >
        {!isGlucose && (
          <>
            {BOKEH.map((b, i) => (
              <div
                key={i}
                className="pointer-events-none absolute rounded-full"
                style={{
                  left: b.left,
                  top: b.top,
                  width: b.size,
                  height: b.size,
                  background: `rgba(255,255,255,${b.alpha})`,
                  filter: `blur(${b.blur}px)`,
                }}
              />
            ))}
            {/* Sharp accent blob on the right */}
            <div
              className="pointer-events-none absolute rounded-full"
              style={{
                right: -30,
                top: "60%",
                width: 150,
                height: 150,
                background: band.accent,
                filter: "blur(3px)",
              }}
            />
          </>
        )}

        {/* White glucose curve with the meal marker */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/insights/zone-curve.svg"
          alt=""
          className={`pointer-events-none absolute max-w-none ${isGlucose ? "top-[54%]" : "top-[53%]"}`}
          // The SVG is authored with preserveAspectRatio="none", so without an
          // explicit proportional height the browser stretches it vertically
          // (turning the meal-marker circle into an ellipse). Lock the box to
          // the asset's viewBox ratio.
          style={{ width: "114.8%", left: "-3%", aspectRatio: "413.57 / 95.7" }}
        />

        {isGlucose && (
          <p className="z-10 mt-[90px] text-center text-[14px] font-semibold leading-5 text-white">
            Predicted Glucose Peak
          </p>
        )}

        <div
          className={`z-10 flex flex-col items-center justify-center rounded-full shadow-lg ${
            isGlucose ? "mt-10 h-[150px] w-[150px]" : "mt-[149px] h-[166px] w-[166px]"
          }`}
          style={{ background: band.circle }}
        >
          <span
            className={`font-bold leading-none ${isGlucose ? "text-[50px]" : "text-[55px]"}${loading ? " animate-pulse" : ""}`}
            style={{ color: band.accent }}
          >
            {loading || foodScore == null ? "--" : foodScore}
          </span>
          {!loading && delta != null && (
            <span
              className={`mt-1 font-medium ${isGlucose ? "text-[13px]" : "text-[15px]"}`}
              style={{ color: band.accent }}
            >
              {delta >= 0 ? "+" : ""}
              {Math.round(delta)} mg/dL
            </span>
          )}
        </div>

        <div className="z-10 mt-auto w-full px-6 text-center">
          <p className="text-[14px] font-medium text-white/70">
            ZONE SCORE &middot; {relativeTime(entry?.time)}
          </p>
          <h2
            className={`mt-2 text-[30px] leading-[38px] text-white ${isGlucose ? "font-normal" : "font-medium"}`}
          >
            {headline}
          </h2>
        </div>

        <div className="z-10 mb-10 mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className={`h-10 w-[109px] text-[14px] font-medium tracking-[0.28px] ${
              isGlucose
                ? "rounded-[10px] border border-white/20 text-white"
                : "rounded-lg bg-white text-black"
            }`}
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={onDetails}
            className={`h-10 w-[109px] text-[14px] font-medium tracking-[0.28px] ${
              isGlucose ? "rounded-[10px] bg-white text-black" : "rounded-lg bg-black text-white"
            }`}
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
}
