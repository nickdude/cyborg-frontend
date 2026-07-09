"use client";

import { useEffect, useState } from "react";

// Derive a per-"organ" (category) age from the overall biological age and how
// optimal that category's markers are. Better markers → younger organ.
function organAgeFor(bioAge, items) {
  if (!items.length || bioAge == null) return null;
  const optimal = items.filter((b) => b.status === "optimal").length;
  const ratio = optimal / items.length;
  return Math.round((bioAge + (0.5 - ratio) * 9) * 100) / 100;
}

function TrendView({ bioAge }) {
  const top = bioAge != null ? (bioAge * 1.15).toFixed(2) : "—";
  return (
    <div className="mt-5">
      <div className="relative h-44 w-full overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/70 to-white">
        <span className="absolute left-3 top-2 text-[11px] text-secondary">{top}</span>
        <span className="absolute left-3 bottom-2 text-[11px] text-secondary">0.00</span>
        <span className="absolute right-3 top-3 text-[11px] font-medium text-emerald-600">Optimal</span>
        <div className="absolute inset-x-8 top-1/2 border-t border-dashed border-emerald-300/80" />
        <span className="absolute right-8 top-1/2 grid -translate-y-1/2 place-items-center">
          <span className="h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-200" />
        </span>
      </div>
      <p className="mt-2 text-center text-xs text-secondary">Your biological age over time</p>
    </div>
  );
}

function ScoreCardView({ bioAge, chronoAge, delta }) {
  return (
    <div className="mt-5 grid place-items-center rounded-2xl border border-borderColor bg-pageBackground/40 p-7 text-center">
      <p className="text-[46px] font-semibold leading-none text-blue">{bioAge != null ? Math.round(bioAge) : "—"}</p>
      <p className="mt-2 text-sm text-secondary">biological age{chronoAge != null ? ` · vs ${chronoAge} actual` : ""}</p>
      {delta != null && (
        <p className={`mt-2 text-sm font-medium ${delta >= 0 ? "text-biomarkerOptimal" : "text-biomarkerOutOfRange"}`}>
          {Math.abs(delta)} years {delta >= 0 ? "younger" : "older"} than your actual age
        </p>
      )}
    </div>
  );
}

export default function BiologicalAgeModal({ bioAge, chronoAge, biomarkers = [], onClose }) {
  const [tab, setTab] = useState("trend");
  const [openOrgan, setOpenOrgan] = useState(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const delta = chronoAge != null && bioAge != null ? +(chronoAge - bioAge).toFixed(1) : null;

  const byCat = {};
  biomarkers.forEach((b) => {
    (byCat[b.category] = byCat[b.category] || []).push(b);
  });
  const organs = Object.entries(byCat)
    .map(([cat, items]) => ({
      name: cat,
      items,
      age: organAgeFor(bioAge, items),
      attention: items.some((b) => b.status === "out_of_range"),
    }))
    .sort((a, b) => b.items.length - a.items.length);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-borderColor px-5 py-4">
          <h2 className="text-lg font-semibold text-blue">Biological Age</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-full text-secondary transition hover:bg-pageBackground hover:text-blue"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex justify-center">
            <div className="inline-flex rounded-full bg-pageBackground p-1 text-sm">
              {["trend", "score"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-full px-4 py-1.5 font-medium transition ${
                    tab === t ? "bg-white text-blue shadow-sm" : "text-secondary hover:text-blue"
                  }`}
                >
                  {t === "trend" ? "Trend View" : "Score Card"}
                </button>
              ))}
            </div>
          </div>

          {tab === "trend" ? (
            <TrendView bioAge={bioAge} />
          ) : (
            <ScoreCardView bioAge={bioAge} chronoAge={chronoAge} delta={delta} />
          )}

          <h3 className="mt-7 text-lg font-semibold text-blue">Your OrganAge Report</h3>
          {organs.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-borderColor bg-pageBackground/40 p-6 text-center text-sm text-secondary">
              Upload a report to see your OrganAge breakdown.
            </p>
          ) : (
            <div className="mt-3 overflow-hidden rounded-2xl border border-borderColor">
              {organs.map((o) => (
                <div key={o.name} className="border-b border-borderColor last:border-0">
                  <button
                    type="button"
                    onClick={() => setOpenOrgan(openOrgan === o.name ? null : o.name)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-pageBackground/50"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-blue">{o.name}</span>
                      <span className="text-xs text-secondary">{o.items.length} markers</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className={`text-xs font-medium ${o.attention ? "text-biomarkerOutOfRange" : "text-biomarkerOptimal"}`}>
                        {o.attention ? "Attention" : "Optimal"}
                      </span>
                      <span className="text-sm tabular-nums text-blue">{o.age != null ? `${o.age} years` : "—"}</span>
                      <svg className={`h-4 w-4 text-secondary transition-transform ${openOrgan === o.name ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </span>
                  </button>
                  {openOrgan === o.name && (
                    <div className="divide-y divide-borderColor border-t border-borderColor bg-pageBackground/30">
                      {o.items.map((b, i) => {
                        const color = b.status === "optimal" ? "#05BC7E" : b.status === "normal" ? "#D7D82E" : "#F865DD";
                        return (
                          <div key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                            <span className="flex min-w-0 items-center gap-2 text-sm text-blue">
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                              <span className="truncate">{b.name}</span>
                            </span>
                            <span className="shrink-0 text-sm tabular-nums text-secondary">{b.value} {b.unit}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
