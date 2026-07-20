"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft } from "lucide-react";
import { goalsAPI } from "@/services/api";
import { goalBackground } from "@/utils/goalBackgrounds";
import { humanizeBiomarkerName } from "@/utils/biomarkerAdapter";

// Map a persisted biomarker flag (optimal / suboptimal / normal / high / low /
// critical_* / "Normal") to a display status. Case-insensitive so optimal
// markers show green instead of a misleading pink "out of range". A missing
// flag (old goals) maps to "unknown" and renders neutral grey.
function biomarkerStatus(flag) {
  const f = String(flag || "").toLowerCase();
  if (!f) return "unknown";
  if (f === "optimal") return "optimal";
  if (f === "normal" || f === "suboptimal") return "normal";
  return "out_of_range"; // high, low, critical_high, critical_low, "out of range"
}

// Status dot + slider-track gradient classes per biomarker status.
const STATUS_STYLES = {
  optimal: { dot: "bg-biomarkerOptimal", track: "from-biomarkerOptimal/10 to-biomarkerOptimal/40" },
  normal: { dot: "bg-biomarkerNormal", track: "from-biomarkerNormal/10 to-biomarkerNormal/40" },
  out_of_range: { dot: "bg-biomarkerOutOfRange", track: "from-biomarkerOutOfRange/10 to-biomarkerOutOfRange/40" },
  unknown: { dot: "bg-secondary", track: "from-secondary/10 to-secondary/30" },
};

// Priority value colors, matching the ActionPlan chip precedent.
const PRIORITY_TEXT = {
  High: "text-rose-600",
  Medium: "text-amber-700",
  Low: "text-emerald-700",
};

// "high" / "HIGH" / "High" → "High"; anything unrecognized → null (card omitted).
function normalizePriority(priority) {
  const p = String(priority || "").trim().toLowerCase();
  if (p === "high" || p === "medium" || p === "low") return p[0].toUpperCase() + p.slice(1);
  return null;
}

// Split narrative prose into sentence bullets. Boundaries are ". " followed by
// a capital, so decimals (252.09), units (mg/dL, mm/hr) and "e.g." survive.
function sentenceBullets(text) {
  const sentences = String(text || "")
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences.length > 1 ? sentences : null;
}

// Narrative section: bullets when the prose splits into 2+ sentences,
// otherwise the plain paragraph.
function NarrativeSection({ title, text }) {
  if (!text) return null;
  const bullets = sentenceBullets(text);
  return (
    <section className="mb-6">
      <h3 className="mb-2 text-lg font-bold text-ink">{title}</h3>
      {bullets ? (
        <ul className="space-y-2">
          {bullets.map((s, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-secondary">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-secondary/50" aria-hidden="true" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-relaxed text-secondary">{text}</p>
      )}
    </section>
  );
}

// Fraction along the 128px slider track for a biomarker's current value.
// Inside the optimal (or, failing that, reference) band the dot sits at the
// right end (0.85, next to the green target tick); the further out of band,
// the further left it drifts. No usable ranges → centered.
function sliderPosition(marker) {
  const value = Number(marker?.value);
  if (!Number.isFinite(value)) return 0.5;
  const bands = [
    [marker?.optimalMin, marker?.optimalMax],
    [marker?.referenceMin, marker?.referenceMax],
  ];
  for (const [rawMin, rawMax] of bands) {
    // Bands are often one-sided (e.g. HDL optimalMin 60, optimalMax null) —
    // treat a missing bound as open-ended rather than coercing null to 0.
    if (rawMin == null && rawMax == null) continue;
    const min = rawMin == null ? -Infinity : Number(rawMin);
    const max = rawMax == null ? Infinity : Number(rawMax);
    if (Number.isNaN(min) || Number.isNaN(max)) continue;
    if (value >= min && value <= max) return 0.85;
    const nearest = value < min ? min : max; // the violated bound; always finite here
    const span = Number.isFinite(max - min) ? Math.abs(max - min) : Math.abs(nearest);
    const deviation = Math.abs(value - nearest) / (span || 1);
    return Math.min(0.85, Math.max(0.1, 0.85 - 0.55 * Math.min(deviation, 1)));
  }
  return 0.5;
}

// Sticky "Goals" header shared by the loaded and error states.
function GoalsHeader({ onBack }) {
  return (
    <header className="sticky top-0 z-50 border-b border-borderColor bg-white">
      <div className="mx-auto flex w-full max-w-[520px] items-center px-4 py-3 lg:max-w-[760px]">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-8 w-8 items-center justify-center text-ink transition-opacity hover:opacity-70"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-ink">Goals</h1>
        <span className="h-8 w-8" aria-hidden="true" />
      </div>
    </header>
  );
}

export default function GoalDetail({ goal, onBack }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const goalId = goal?.goalId || goal?.id;

  const fetchDetail = useCallback(async () => {
    if (!goalId) {
      setError("Invalid goal");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await goalsAPI.get(goalId);
      const data = response?.data || response;
      setDetails(data);
    } catch (err) {
      setError("Failed to load goal details");
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pageBackground">
        <p className="text-sm text-secondary">Loading goal details...</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="min-h-screen bg-pageBackground">
        <GoalsHeader onBack={onBack} />
        <div className="mx-auto w-full max-w-[520px] px-4 pt-12 text-center text-sm text-error lg:max-w-[760px]">
          {error || "Goal not found"}
        </div>
      </div>
    );
  }

  const priority = normalizePriority(details.priority);
  const weeks = Array.isArray(details.recoveryTimeWeeks) ? details.recoveryTimeWeeks : [];
  const recovery = weeks.length === 2 && weeks.every((w) => w != null && w !== "") ? weeks : null;
  const whatThisMeans = details.whatThisMeans || details.description || "";
  const potentialCauses = details.potentialCauses || "";
  const biomarkers = (details.biomarkerEvidence || details.biomarkersToImprove || []).filter(
    (b) => b && (b.name || b.canonicalName)
  );
  const actions = (Array.isArray(details.recommendedActions) ? details.recommendedActions : []).filter(
    (a) => a && (a.label || a.detail)
  );

  return (
    <div className="min-h-screen bg-pageBackground">
      <GoalsHeader onBack={onBack} />

      <div className="mx-auto w-full max-w-[520px] px-4 pb-32 pt-4 lg:max-w-[760px] lg:pb-16">
        {/* Hero — per-goal background art + title */}
        <section className="relative mb-6 min-h-[320px] overflow-hidden rounded-2xl shadow-lg">
          <div className="absolute inset-0 bg-ink" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={goalBackground(details)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={(ev) => (ev.currentTarget.style.visibility = "hidden")}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-transparent" aria-hidden="true" />
          <div className="relative z-10 p-6">
            <h2 className="text-2xl font-bold leading-tight text-white">{details.title}</h2>
          </div>
        </section>

        {/* Metrics grid */}
        {(priority || details.healthImpact || recovery) && (
          <div className="mb-6 grid grid-cols-2 gap-3">
            {priority && (
              <div className="rounded-xl border border-borderColor bg-white p-4 shadow-sm">
                <span className="mb-1 block text-xs font-medium text-secondary">Priority</span>
                <span className={`text-base font-bold ${PRIORITY_TEXT[priority]}`}>{priority} Priority</span>
              </div>
            )}
            {details.healthImpact && (
              <div className="rounded-xl border border-borderColor bg-white p-4 shadow-sm">
                <span className="mb-1 block text-xs font-medium text-secondary">Health Impact</span>
                <span className="text-base font-bold text-ink">{details.healthImpact}</span>
              </div>
            )}
            {recovery && (
              <div className="rounded-xl border border-borderColor bg-white p-4 shadow-sm">
                <span className="mb-1 block text-xs font-medium text-secondary">Recovery Time</span>
                <span className="text-base font-bold text-ink">{recovery[0]} - {recovery[1]} weeks</span>
              </div>
            )}
          </div>
        )}

        <NarrativeSection title="What this means:" text={whatThisMeans} />
        <NarrativeSection title="Potential Causes:" text={potentialCauses} />

        {/* Biomarkers to improve */}
        {biomarkers.length > 0 && (
          <section className="mb-6">
            <h3 className="mb-2 text-lg font-bold text-ink">Biomarkers to improve:</h3>
            <div className="space-y-3">
              {biomarkers.map((b, i) => {
                const status = biomarkerStatus(b.flag);
                const styles = STATUS_STYLES[status];
                const pos = sliderPosition(b);
                const hasValue = b.value != null && b.value !== "";
                return (
                  <div
                    key={b.canonicalName || b.name || i}
                    className="flex flex-col gap-1 rounded-xl border border-borderColor bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${styles.dot}`} aria-hidden="true" />
                        <span className="font-semibold text-ink">{humanizeBiomarkerName(b.name || b.canonicalName)}</span>
                      </div>
                      {/* Slider viz: tinted track, current-value dot, green target tick.
                          Legacy docs persisted no value — no position to plot, so omit. */}
                      {hasValue && (
                        <div className="relative flex h-8 w-32 shrink-0 items-center" aria-hidden="true">
                          <div className={`h-1 w-full rounded-full bg-gradient-to-r ${styles.track}`} />
                          {Number.isFinite(Number(b.value)) && (
                            <span
                              className={`absolute h-2 w-2 rounded-full ${styles.dot}`}
                              style={{ left: `calc(${(pos * 100).toFixed(1)}% - 4px)` }}
                            />
                          )}
                          <span className="absolute right-0 h-4 w-1 rounded-sm bg-biomarkerOptimal" />
                        </div>
                      )}
                    </div>
                    {hasValue && (
                      <p className="text-sm font-bold text-ink">
                        {b.value}
                        {b.unit ? <span className="font-normal text-secondary"> {b.unit}</span> : null}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Recommended actions — placeholder cards; final design arrives later */}
        {actions.length > 0 && (
          <section>
            <h3 className="mb-2 text-lg font-bold text-ink">Recommended actions</h3>
            <div className="space-y-3">
              {actions.map((a, i) => (
                <div key={i} className="flex gap-3 rounded-xl border border-borderColor bg-white p-4 shadow-sm">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-pageBackground text-sm font-bold text-ink">
                    {i + 1}
                  </span>
                  <div>
                    {a.label && <p className="font-semibold text-ink">{a.label}</p>}
                    {a.detail && <p className="text-sm text-secondary">{a.detail}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
