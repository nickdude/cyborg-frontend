"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Score / Biological-age detail modal (Superpower-style).
 * Two tabs — Cyborg Score (purple card) and Biological Age (green card) — each
 * showing an enlarged image card with the value + a short description. Opens on
 * whichever tab the user clicked. When there's no DOB, the bio-age card prompts
 * the user to add it in Settings (we never fabricate a biological age).
 */
function BigCard({ variant, title, value, name, desc, hideValue }) {
  const purple = variant === "score";
  const img = purple ? "/assets/data/score.jpg" : "/assets/data/bioage.jpg";
  const fallback = purple
    ? "bg-gradient-to-br from-[#7b3ff2] via-[#6a27d8] to-[#3f1585]"
    : "bg-gradient-to-br from-[#5fd08a] via-[#31b36a] to-[#1a7d46]";
  return (
    <div className={`relative flex h-[320px] w-[248px] flex-col justify-between overflow-hidden rounded-[26px] p-5 text-white shadow-md ${fallback}`}>
      <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" onError={(e) => e.currentTarget.remove()} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-black/10" />
      <div className="relative z-10 flex items-start justify-between gap-2">
        <span className="text-[15px] font-medium text-white/90">{title}</span>
        {value != null && (
          <span className={`text-[30px] font-semibold leading-none ${hideValue ? "blur-[8px]" : ""}`}>{value}</span>
        )}
      </div>
      <div className="relative z-10">
        <p className="text-[15px] font-semibold">{name}</p>
        <p className="mt-1 text-[13px] leading-snug text-white/85">{desc}</p>
      </div>
    </div>
  );
}

export default function ScoreDetailModal({ open, initialTab = "score", onClose, scoreVal, bioAgeVal, effChrono, userName }) {
  const [tab, setTab] = useState(initialTab);
  const [hideAge, setHideAge] = useState(false);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const name = userName || "You";
  const bioDelta = effChrono != null && bioAgeVal != null ? +(effChrono - bioAgeVal).toFixed(1) : null;
  const scoreStatus = scoreVal == null ? "" : scoreVal >= 80 ? "On Track" : scoreVal >= 60 ? "On Track" : "Needs attention";
  const bioDesc = bioAgeVal == null
    ? null
    : bioDelta != null
      ? `Your biological age is ${Math.abs(bioDelta)} ${bioDelta >= 0 ? "younger" : "older"} than your calendar age`
      : "PhenoAge estimate";

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] rounded-3xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-blue">{tab === "bioage" ? "Biological Age" : "Cyborg Score"}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-full text-secondary transition hover:bg-pageBackground hover:text-blue"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* tabs */}
        <div className="mt-4 flex justify-center">
          <div className="inline-flex rounded-full bg-pageBackground p-1 text-sm">
            {[["score", "Cyborg Score"], ["bioage", "Biological Age"]].map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`rounded-full px-4 py-1.5 font-medium transition ${tab === k ? "bg-white text-blue shadow-sm" : "text-secondary hover:text-blue"}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* card */}
        <div className="mt-5 flex justify-center">
          {tab === "score" ? (
            <BigCard
              variant="score"
              title="Cyborg Score"
              value={scoreVal != null ? Math.round(scoreVal) : "—"}
              name={name}
              desc={scoreStatus}
            />
          ) : (
            <BigCard
              variant="bioage"
              title="Biological Age"
              value={bioAgeVal != null ? Math.round(bioAgeVal) : null}
              name={name}
              desc={
                bioAgeVal != null ? (
                  bioDesc
                ) : (
                  <>
                    Add your date of birth in{" "}
                    <Link href="/settings" onClick={onClose} className="font-semibold underline">
                      Settings
                    </Link>{" "}
                    to see your biological age.
                  </>
                )
              }
              hideValue={hideAge}
            />
          )}
        </div>

        {/* hide-age toggle (bio-age only, and only when there's a value) */}
        {tab === "bioage" && bioAgeVal != null && (
          <div className="mt-5 flex items-center justify-center gap-3 text-sm text-secondary">
            <span>Hide age</span>
            <button
              type="button"
              role="switch"
              aria-checked={hideAge}
              onClick={() => setHideAge((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition ${hideAge ? "bg-primary" : "bg-borderColor"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${hideAge ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
        )}

        <p className="mt-5 text-center text-sm text-secondary">
          {tab === "bioage" ? "What is Biological Age?" : "What is Cyborg Score?"}
        </p>
      </div>
    </div>
  );
}
