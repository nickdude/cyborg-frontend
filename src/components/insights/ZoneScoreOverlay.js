"use client";

import { useEffect, useState } from "react";
import { foodScoreAPI } from "@/services/api";

// Design-approved gradient/accent hexes for this alert screen (built 1:1 from
// the reference image) — kept in JS style objects, not tailwind classes.
const BANDS = {
  red: {
    background:
      "linear-gradient(190.32deg, #EF5D68 1.67%, #ED5776 23.32%, #AE4976 49.02%, #843561 95.82%)",
    circle: "linear-gradient(#FFFFFF 0%, #DDB1C5 100%)",
    accent: "#ED5776",
    headline: "This zone had a large glucose response",
  },
  amber: {
    background:
      "linear-gradient(190.32deg, #F5A55C 1.67%, #EE8F5B 23.32%, #C46A52 49.02%, #8A4A3F 95.82%)",
    circle: "linear-gradient(#FFFFFF 0%, #E8C9A8 100%)",
    accent: "#EE8F5B",
    headline: "This zone had a moderate glucose response",
  },
  green: {
    background:
      "linear-gradient(190.32deg, #4FC486 1.67%, #3BB58B 23.32%, #2E8F7A 49.02%, #1F5F58 95.82%)",
    circle: "linear-gradient(#FFFFFF 0%, #B9DEC9 100%)",
    accent: "#3BB58B",
    headline: "This zone kept your glucose steady",
  },
  // Unknown score — desaturated so a loading/failed fetch never wears the
  // "large response" alarm colors.
  neutral: {
    background:
      "linear-gradient(190.32deg, #8E8798 1.67%, #7C7489 23.32%, #635C72 49.02%, #4A4458 95.82%)",
    circle: "linear-gradient(#FFFFFF 0%, #D5D1DC 100%)",
    accent: "#7C7489",
    headline: "Analyzing this zone's glucose response",
  },
};

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

export default function ZoneScoreOverlay({ entry, userId, onClose, onDetails }) {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const mealId = entry?.id || entry?._id;
  // The timeline response bundles the meal's score — when it's there the
  // overlay opens with zero requests; the fetch is only a fallback for
  // entries from older cached payloads.
  const bundledScore = entry?.data?.foodScore;

  useEffect(() => {
    if (bundledScore != null) {
      setScore({
        score: bundledScore,
        predictedGlucosePeak: { deltaMgDl: entry?.data?.deltaMgDl ?? null },
      });
      setLoading(false);
      return;
    }
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
  const band = bandFor(foodScore ?? null);
  const headline = error
    ? "Couldn't load this zone's score"
    : foodScore == null
      ? "Analyzing this zone's glucose response"
      : band.headline;

  return (
    // Full-bleed backdrop keeps the page behind unclickable on wide
    // viewports; the gradient panel itself stays phone-width.
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Zone Score"
      className="fixed inset-0 z-[70] flex justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-md flex-col items-center overflow-hidden"
        style={{ background: band.background }}
        onClick={(e) => e.stopPropagation()}
      >
      {/* Bokeh accents from the reference frame */}
      <div
        className="pointer-events-none absolute"
        style={{
          left: -78,
          top: 30,
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.25)",
          filter: "blur(18px)",
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          left: -60,
          top: "45%",
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.2)",
          filter: "blur(25px)",
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          right: -30,
          top: "60%",
          width: 150,
          height: 150,
          borderRadius: "50%",
          background: band.accent,
          filter: "blur(3px)",
        }}
      />

      <button
        type="button"
        onClick={() => setShowInfo((v) => !v)}
        aria-label="What is Zone Score?"
        className="absolute right-5 top-5 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-white text-xs font-medium text-white"
        style={{ background: "rgba(255,255,255,0.2)" }}
      >
        ?
      </button>

      <div
        className="z-10 mt-20 flex h-[166px] w-[166px] flex-col items-center justify-center rounded-full shadow-lg"
        style={{ background: band.circle }}
      >
        <span
          className={`text-[55px] font-bold leading-none${loading ? " animate-pulse" : ""}`}
          style={{ color: band.accent }}
        >
          {loading || foodScore == null ? "--" : foodScore}
        </span>
        {!loading && delta != null && (
          <span className="mt-1 text-[15px] font-medium" style={{ color: band.accent }}>
            {delta >= 0 ? "+" : ""}
            {Math.round(delta)} mg/dL
          </span>
        )}
      </div>

      <div className="relative mt-8 w-full">
        <svg viewBox="0 0 320 100" preserveAspectRatio="none" className="h-32 w-full">
          <path
            d="M0,80 C40,80 60,75 80,70 C100,65 120,10 160,15 C200,20 240,85 280,90 C300,92 320,90 360,90"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        {/* Meal marker on the curve's left rise */}
        <div
          className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-white"
          style={{ left: 70, top: 98, transform: "translate(-50%, -50%)" }}
        >
          <span style={{ fontSize: 12 }} aria-hidden="true">
            🥗
          </span>
        </div>
      </div>

      <div className="z-10 mt-auto w-full px-6 text-center">
        <p className="text-sm uppercase tracking-widest text-white/70">
          ZONE SCORE &bull; {relativeTime(entry?.time)}
        </p>
        <h2 className="mt-2 text-3xl font-medium leading-tight text-white">{headline}</h2>
        {showInfo && (
          <p className="mt-2 text-sm text-white/80">
            Zone Score estimates how this meal moved your glucose, from your meal&apos;s
            composition.
          </p>
        )}
      </div>

      <div className="z-10 mb-10 mt-6 flex w-full gap-3 px-5">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-lg bg-white py-4 text-sm font-medium text-black"
        >
          Dismiss
        </button>
        <button
          type="button"
          onClick={onDetails}
          className="flex-1 rounded-lg bg-black py-4 text-sm font-medium text-white"
        >
          Details
        </button>
      </div>
      </div>
    </div>
  );
}
