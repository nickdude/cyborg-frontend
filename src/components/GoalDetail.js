"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { goalsAPI } from "@/services/api";
import { supplementInfo } from "@/utils/supplementInfo";
import { supplementImage } from "@/utils/supplementImage";
import BiomarkerCard from "./BiomarkerCard";
import { SourceChips } from "./concierge/Sources";

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

// Map a persisted biomarker flag (optimal / suboptimal / normal / high / low /
// critical_* / "Normal") to a BiomarkerCard status. Case-insensitive so optimal
// markers show the green "Optimal" pill instead of a misleading pink "Out of range".
function biomarkerStatus(flag) {
  const f = String(flag || "").toLowerCase();
  if (f === "optimal") return "optimal";
  if (f === "normal" || f === "suboptimal") return "normal";
  return "out_of_range"; // high, low, critical_high, critical_low, "out of range"
}

// "8–12 weeks to meaningful improvement" from recoveryTimeWeeks [8, 12].
function formatTimeframe(weeks) {
  if (!Array.isArray(weeks) || !weeks.length) return "";
  const [a, b] = weeks;
  const range = b && b !== a ? `${a}–${b}` : `${a}`;
  return `${range} weeks to meaningful improvement`;
}

// Split an action's prose `detail` into bullet items on sentence boundaries.
// One sentence → one bullet.
const toBullets = (text) =>
  String(text || "")
    .split(/\.\s+/)
    .map((s) => s.trim().replace(/\.$/, ""))
    .filter(Boolean);

// ── Inline Material-3 icons (coral accent applied via currentColor) ──────────
const IconArrowBack = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </svg>
);
const IconArrowForward = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const IconChevron = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
);
const IconActivity = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);
const IconCheck = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);
const IconNutrition = ({ className = "" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3s7 6 7 11a7 7 0 11-14 0c0-5 7-11 7-11z" />
  </svg>
);

// Coral-bulleted list used across the Actions cards.
function BulletList({ items, className = "" }) {
  if (!items?.length) return null;
  return (
    <ul className={`space-y-3 ${className}`}>
      {items.map((b, i) => (
        <li key={i} className="flex items-start gap-3 font-body-md text-body-md text-on-surface-variant">
          <span className="mt-1.5 text-xs leading-none text-primary-container">•</span>
          <span>{b}</span>
        </li>
      ))}
    </ul>
  );
}

export default function GoalDetail({ goal, protocol, onBack, stepNumber = 1 }) {
  const router = useRouter();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("findings"); // findings | actions
  const [askText, setAskText] = useState("");
  const [whyOpen, setWhyOpen] = useState(false);

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
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="font-body-md text-body-md text-on-surface-variant">Loading goal details...</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="min-h-screen bg-surface pb-24">
        <div className="mx-auto flex w-full max-w-[760px] items-center gap-4 px-container-padding pb-5 pt-6">
          <button onClick={onBack} aria-label="Back" className="flex h-8 w-8 items-center justify-center text-primary-container transition-opacity hover:opacity-80">
            <IconArrowBack className="h-6 w-6" />
          </button>
          <h1 className="font-headline-lg text-title-md text-on-surface">Protocol</h1>
        </div>
        <div className="px-container-padding pt-12 text-center font-body-md text-body-md text-error">{error || "Goal not found"}</div>
      </div>
    );
  }

  const rawBiomarkers = details.biomarkerEvidence || details.biomarkersToImprove || [];
  const biomarkers = rawBiomarkers.map((b) => ({
    id: b.canonicalName,
    name: b.name || b.canonicalName,
    value: b.value != null ? String(b.value) : "—",
    unit: b.unit || "",
    status: biomarkerStatus(b.flag),
    category: b.category || "",
    trend: [],
    optimalRange: { min: b.optimalMin ?? null, max: b.optimalMax ?? null },
  }));

  const timeframe = formatTimeframe(details.recoveryTimeWeeks);
  const symptoms = Array.isArray(details.symptoms) ? details.symptoms : [];
  const citations = (Array.isArray(details.citations) ? details.citations : [])
    .filter((c) => c?.url)
    .map((c) => ({ url: c.url, title: c.title || c.source || c.domain || c.url }));

  // Join per-goal protocol items to the plan's rich supplement copy (why / how / timing).
  const suppMap = {};
  for (const s of (protocol?.supplements || [])) suppMap[norm(s.name)] = s;

  const actions = details.recommendedActions || [];
  const keyAction = actions[0] || null;
  const moreActions = actions.slice(1);
  const protocolItems = details.protocolItems || [];
  const nutrition = protocol?.nutrition || [];

  const whatWeFound = details.whatThisMeans || details.description;
  const whyBody = details.potentialCauses || details.healthImpact || "";

  const hasAdditional = moreActions.length > 0 || protocolItems.length > 0 || nutrition.length > 0;
  const noActions = !keyAction && !hasAdditional;

  const askAI = (e) => {
    e?.preventDefault?.();
    const q = askText.trim() || `Tell me more about my goal: ${details.title}`;
    router.push(`/concierge?q=${encodeURIComponent(q)}`);
  };

  // Enrich a protocol item with the plan's rich supplement copy + a product photo.
  const enrichItem = (item) => {
    const supp = suppMap[norm(item.productName)] || {};
    const info = supplementInfo({ ...item, ...supp }, supp.timing);
    return {
      name: item.productName,
      dosing: item.dosing || supp.dose || "",
      why: supp.whyItMatters || info.why || "",
      how: supp.howToTake || info.how || "",
      image: supplementImage(item.productName) || "/assets/preview/product-1.webp",
    };
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface pb-24">
      {/* Header */}
      <header className="border-b border-outline-variant">
        <div className="mx-auto flex w-full max-w-[760px] items-center px-container-padding pb-5 pt-6">
          <button onClick={onBack} aria-label="Back" className="flex h-8 w-8 items-center justify-center text-primary-container transition-opacity hover:opacity-80">
            <IconArrowBack className="h-6 w-6" />
          </button>
          <h1 className="flex-1 text-center font-headline-lg text-headline-lg text-on-surface">Protocol</h1>
          <span className="h-8 w-8" aria-hidden="true" />
        </div>
      </header>

      <div className="mx-auto w-full max-w-[760px] px-container-padding pt-8">
        {/* Hero — step number + title */}
        <section className="mb-stack-lg flex items-start gap-gutter">
          <div className="shrink-0 font-step-number text-step-number text-primary-container">{stepNumber || 1}</div>
          <div>
            <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface md:text-headline-lg">{details.title}</h2>
            {(timeframe || details.description) && (
              <p className="mt-2 font-body-md text-body-md text-on-surface-variant">{timeframe || details.description}</p>
            )}
          </div>
        </section>

        {/* Tabs */}
        <nav className="mb-section-gap flex items-center gap-8 border-b border-outline-variant">
          {[["findings", "Findings"], ["actions", "Actions"]].map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`-mb-px border-b-2 pb-3 font-label-caps text-label-caps uppercase transition-colors ${
                tab === k
                  ? "border-primary-container text-primary-container"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {l}
            </button>
          ))}
        </nav>

        {tab === "findings" ? (
          <div>
            {/* How you might be feeling */}
            {symptoms.length > 0 && (
              <section className="mb-section-gap">
                <h3 className="mb-stack-md font-label-caps text-label-caps uppercase text-on-surface-variant">How you might be feeling</h3>
                <div className="flex flex-wrap gap-stack-md">
                  {symptoms.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-4 py-2 font-body-md text-body-md text-on-surface-variant"
                    >
                      {s.source === "reported" && <span className="h-1.5 w-1.5 rounded-full bg-primary-container" />}
                      {s.label}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* What we found */}
            {whatWeFound && (
              <section className="mb-section-gap">
                <h3 className="mb-stack-md font-label-caps text-label-caps uppercase text-on-surface-variant">What we found</h3>
                <div className="font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
                  <p>{whatWeFound}</p>
                </div>
              </section>
            )}

            {/* Why this matters + Citations */}
            <div className="mb-section-gap grid grid-cols-1 gap-gutter md:grid-cols-2">
              <div className="flex flex-col rounded-xl border border-surface-container bg-surface-container-lowest p-gutter card-shadow">
                <button
                  type="button"
                  onClick={() => whyBody && setWhyOpen((o) => !o)}
                  className="flex w-full items-start justify-between gap-3 text-left"
                >
                  <div>
                    <h4 className="font-title-md text-title-md text-on-surface">Why this matters</h4>
                    <p className="mt-0.5 font-body-md text-body-md text-on-surface-variant">How this impacts your health</p>
                  </div>
                  {whyBody && (
                    <span className={`mt-1 shrink-0 text-on-surface-variant transition-transform ${whyOpen ? "rotate-90" : ""}`}>
                      <IconChevron className="h-5 w-5" />
                    </span>
                  )}
                </button>
                {whyBody && whyOpen && (
                  <p className="mt-3 font-body-md text-body-md leading-relaxed text-on-surface-variant">{whyBody}</p>
                )}
              </div>

              {citations.length > 0 && (
                <div className="flex flex-col rounded-xl border border-surface-container bg-surface-container-lowest p-gutter card-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-title-md text-title-md text-on-surface">
                      {citations.length} {citations.length === 1 ? "Citation" : "Citations"}
                    </h4>
                    <IconChevron className="mt-1 h-5 w-5 shrink-0 text-on-surface-variant" />
                  </div>
                  <SourceChips sources={citations} label="" />
                </div>
              )}
            </div>

            {/* Biomarkers to improve (real clinical data) */}
            {biomarkers.length > 0 && (
              <section className="mb-section-gap">
                <h3 className="mb-stack-md font-label-caps text-label-caps uppercase text-on-surface-variant">Biomarkers to improve</h3>
                <div className="space-y-4">
                  {biomarkers.map((biomarker) => (
                    <BiomarkerCard key={biomarker.id} biomarker={biomarker} />
                  ))}
                </div>
              </section>
            )}

            {/* Ask Cyborg AI */}
            <section>
              <h3 className="mb-stack-md font-label-caps text-label-caps uppercase text-on-surface-variant">Ask Cyborg AI</h3>
              <form onSubmit={askAI} className="relative">
                <input
                  type="text"
                  value={askText}
                  onChange={(e) => setAskText(e.target.value)}
                  placeholder={`How to improve ${details.title.toLowerCase()}?`}
                  className="w-full rounded-xl border border-surface-container bg-surface-container-lowest px-gutter py-6 pr-16 font-body-lg text-body-lg text-on-surface outline-none card-shadow transition focus:border-primary-container/40 focus:ring-2 focus:ring-primary-container/20"
                />
                <button
                  type="submit"
                  aria-label="Ask Cyborg AI"
                  className="absolute right-gutter top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-primary-container text-on-primary-container transition hover:opacity-90 active:scale-95"
                >
                  <IconArrowForward className="h-5 w-5" />
                </button>
              </form>
            </section>
          </div>
        ) : (
          <div>
            {/* Key Action */}
            {keyAction && (
              <section className="mb-section-gap">
                <h2 className="mb-stack-md font-label-caps text-label-caps uppercase text-on-surface-variant">Key Action</h2>
                <div className="rounded-xl border border-surface-container-low bg-surface-container-lowest p-6 card-shadow">
                  <div className="mb-6 flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-container-low text-primary-container">
                      <IconActivity className="h-6 w-6" />
                    </div>
                    <h3 className="font-title-md text-title-md text-on-surface">{keyAction.label}</h3>
                  </div>
                  <BulletList items={toBullets(keyAction.detail)} className="mb-8" />
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/concierge?q=${encodeURIComponent(`Tell me more about: ${keyAction.label}`)}`)
                    }
                    className="group inline-flex items-center gap-1 self-start font-title-md text-title-md text-primary-container hover:underline"
                  >
                    Learn more
                    <IconChevron className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </section>
            )}

            {/* Additional Actions */}
            {hasAdditional && (
              <section>
                <h2 className="mb-stack-md font-label-caps text-label-caps uppercase text-on-surface-variant">Additional Actions</h2>
                <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
                  {/* Remaining recommended (text) actions — no Learn more */}
                  {moreActions.map((a, i) => (
                    <div key={`a${i}`} className="flex flex-col rounded-xl border border-surface-container-low bg-surface-container-lowest p-6 card-shadow">
                      <div className="mb-6 flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-primary-container">
                          <IconCheck className="h-5 w-5" />
                        </div>
                        <h3 className="font-title-md text-title-md text-on-surface">{a.label}</h3>
                      </div>
                      <BulletList items={toBullets(a.detail)} className="flex-grow" />
                    </div>
                  ))}

                  {/* Supplement cards from the goal's protocol items */}
                  {protocolItems.map((item, i) => {
                    const e = enrichItem(item);
                    const bullets = [e.dosing, e.how].filter(Boolean);
                    return (
                      <div key={`s${i}`} className="flex flex-col rounded-xl border border-surface-container-low bg-surface-container-lowest p-6 card-shadow">
                        <div className="mb-6 flex items-center gap-4">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={e.image}
                            alt=""
                            className="h-14 w-10 shrink-0 object-contain"
                            onError={(ev) => (ev.currentTarget.style.visibility = "hidden")}
                          />
                          <h3 className="font-title-md text-title-md text-on-surface">{e.name}</h3>
                        </div>
                        <BulletList items={bullets} className="mb-8 flex-grow" />
                        <Link
                          href="/market-place"
                          className="group inline-flex items-center gap-1 self-start font-title-md text-title-md text-primary-container hover:underline"
                        >
                          Learn more
                          <IconChevron className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    );
                  })}

                  {/* Nutrition card spans both columns */}
                  {nutrition.length > 0 && (
                    <div className="flex flex-col rounded-xl border border-surface-container-low bg-surface-container-lowest p-6 card-shadow md:col-span-2">
                      <div className="mb-6 flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-primary-container">
                          <IconNutrition className="h-5 w-5" />
                        </div>
                        <h3 className="font-title-md text-title-md text-on-surface">Nutrition</h3>
                      </div>
                      <BulletList items={nutrition.map((n) => n.text).filter(Boolean)} className="flex-grow" />
                    </div>
                  )}
                </div>
              </section>
            )}

            {noActions && (
              <div className="rounded-xl border border-surface-container-low bg-surface-container-lowest p-10 text-center font-body-md text-body-md text-on-surface-variant card-shadow">
                Actions for this goal will appear here once your plan is ready.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
