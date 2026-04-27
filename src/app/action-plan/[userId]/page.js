"use client";

export const dynamic = "force-dynamic";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { actionPlanAPI } from "@/services/api";
import Navbar from "@/components/Navbar";

const SECTION_GRADIENTS = [
  "from-[#D97706] to-[#F59E0B]",
  "from-[#475569] to-[#64748B]",
  "from-[#0F766E] to-[#14B8A6]",
  "from-[#991B1B] to-[#DC2626]",
  "from-[#92400E] to-[#D97706]",
];

function SectionHeader({ number, total, title, index = 0 }) {
  return (
    <div className={`rounded-2xl px-5 py-5 bg-gradient-to-r ${SECTION_GRADIENTS[index]} shadow-sm`}>
      <p className="text-xs font-semibold text-white/70 tracking-wider uppercase">
        {number} of {total}
      </p>
      <h2 className="text-xl font-bold text-white mt-1 tracking-tight">{title}</h2>
    </div>
  );
}

function BiomarkerBar({ biomarker }) {
  const { name, value, unit, flag, referenceMin, referenceMax, optimalMin, optimalMax } = biomarker;

  const flagStyles = {
    "Out of range": { dot: "bg-biomarkerOutOfRange", text: "text-biomarkerOutOfRange" },
    "Elevated": { dot: "bg-amber-500", text: "text-amber-600" },
    "Low": { dot: "bg-biomarkerOutOfRange", text: "text-biomarkerOutOfRange" },
    "High": { dot: "bg-amber-500", text: "text-amber-600" },
    "Normal": { dot: "bg-biomarkerNormal", text: "text-biomarkerNormal" },
    "Optimal": { dot: "bg-biomarkerOptimal", text: "text-biomarkerOptimal" },
  };

  const style = flagStyles[flag] || { dot: "bg-secondary", text: "text-secondary" };

  const lo = referenceMin ?? 0;
  const hi = referenceMax ?? (value * 2 || 100);
  const span = hi - lo || 1;
  const pct = Math.max(2, Math.min(98, ((value - lo) / span) * 100));

  const optLo = optimalMin != null ? Math.max(0, ((optimalMin - lo) / span) * 100) : null;
  const optHi = optimalMax != null ? Math.min(100, ((optimalMax - lo) / span) * 100) : null;

  return (
    <div className="rounded-xl border border-borderColor bg-white p-3.5 transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${style.dot}`} />
          <span className="text-sm font-medium text-gray-900">{name}</span>
        </div>
        <span className="text-sm font-semibold text-gray-700">
          {value} <span className="text-xs font-normal text-secondary">{unit}</span>
        </span>
      </div>
      <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
        {optLo != null && optHi != null && (
          <div
            className="absolute inset-y-0 bg-biomarkerOptimal/20 rounded-full"
            style={{ left: `${optLo}%`, width: `${optHi - optLo}%` }}
          />
        )}
        <div
          className={`absolute w-2.5 h-2.5 rounded-full ${style.dot} -top-[2px] shadow-sm ring-2 ring-white`}
          style={{ left: `calc(${pct}% - 5px)` }}
        />
        {referenceMax != null && (
          <div
            className="absolute w-px h-3 bg-teal-500 -top-[3px]"
            style={{ left: `${Math.min(99, ((referenceMax - lo) / span) * 100)}%` }}
          />
        )}
        {referenceMin != null && referenceMin > lo && (
          <div
            className="absolute w-px h-3 bg-teal-500 -top-[3px]"
            style={{ left: `${Math.max(1, ((referenceMin - lo) / span) * 100)}%` }}
          />
        )}
      </div>
    </div>
  );
}

function GradeCircle({ grade, label }) {
  const colors = {
    A: "border-biomarkerOptimal text-biomarkerOptimal bg-biomarkerOptimal/10",
    B: "border-biomarkerNormal text-yellow-700 bg-biomarkerNormal/10",
    C: "border-orange-400 text-orange-600 bg-orange-50",
    D: "border-biomarkerOutOfRange text-pink-700 bg-biomarkerOutOfRange/10",
    F: "border-red-500 text-red-700 bg-red-50",
  };
  const cls = colors[grade] || "border-gray-300 text-secondary bg-gray-50";
  const displayLabel = label.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="flex items-center gap-2.5">
      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${cls}`}>
        {grade}
      </span>
      <span className="text-sm text-gray-800">{displayLabel}</span>
    </div>
  );
}

function AccordionSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-borderColor rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition-colors cursor-pointer"
      >
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <svg
          className={`w-4 h-4 text-secondary transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-4 pb-4 border-t border-borderColor pt-3">{children}</div>
      </div>
    </div>
  );
}

function PriorityBadge({ priority }) {
  const cls = {
    High: "text-red-600 bg-red-50 border-red-200",
    Medium: "text-amber-600 bg-amber-50 border-amber-200",
    Low: "text-biomarkerOptimal bg-green-50 border-green-200",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cls[priority] || "text-secondary bg-gray-50 border-gray-200"}`}>
      {priority} priority
    </span>
  );
}

function DeltaBadge({ delta }) {
  if (!delta || delta.status === "new") return null;
  const map = {
    improved: { text: "Improved", cls: "text-biomarkerOptimal bg-green-50 border-green-200" },
    worsened: { text: "Worsened", cls: "text-red-600 bg-red-50 border-red-200" },
    unchanged: { text: "Unchanged", cls: "text-secondary bg-gray-50 border-gray-200" },
    resolved: { text: "Resolved", cls: "text-blue-600 bg-blue-50 border-blue-200" },
  };
  const b = map[delta.status];
  if (!b) return null;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${b.cls}`}>
      {b.text}
    </span>
  );
}

function SupplementCard({ supplement }) {
  return (
    <div className="rounded-xl border border-borderColor bg-gray-50/50 p-4 space-y-2">
      <h4 className="font-bold text-gray-900 text-sm">{supplement.name}</h4>
      {supplement.whatItIs && (
        <p className="text-xs text-gray-600 leading-relaxed">
          <span className="font-semibold text-primary">What it is: </span>{supplement.whatItIs}
        </p>
      )}
      {supplement.whyItMatters && (
        <p className="text-xs text-gray-600 leading-relaxed">
          <span className="font-semibold text-primary">Why this matters: </span>{supplement.whyItMatters}
        </p>
      )}
      {supplement.howToTake && (
        <p className="text-xs text-gray-600 leading-relaxed">
          <span className="font-semibold text-primary">How to take it: </span>{supplement.howToTake}
        </p>
      )}
    </div>
  );
}

export default function ActionPlanPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.userId;
  const planId = searchParams.get("planId");
  const router = useRouter();
  const { token, user } = useAuth();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const fetchPlan = useCallback(async () => {
    try {
      let response;
      if (planId) {
        response = await actionPlanAPI.get(planId);
      } else {
        response = await actionPlanAPI.getLatest();
      }

      if (response.data) {
        const data = response.data;
        if (data.status === "ready" || data.status === "approved") {
          setPlan(data);
          setError("");
        } else if (data.status === "awaiting_review") {
          setPlan(data);
          setError("");
        } else if (data.status === "pending" || data.status === "generating") {
          setError("Your action plan is being generated. You'll be notified when it's ready.");
        } else if (data.status === "failed") {
          setError(data.errorMessage || "Failed to generate plan.");
        } else {
          setError("Plan not found.");
        }
      }
    } catch (err) {
      const msg = err.message || err.msg || "Unknown error";
      if (msg.includes("No action plan found")) {
        setError("No action plan yet. Upload a blood report to get started.");
      } else {
        setError("Failed to load plan: " + msg);
      }
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    if (!token) {
      router.push("/login");
    } else {
      fetchPlan();
    }
  }, [token, planId, fetchPlan, router]);

  const handleDownloadPDF = async () => {
    const id = planId || plan?._id;
    if (!id) return;
    try {
      const blob = await actionPlanAPI.exportPDF(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `action-plan-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setToast({ type: "success", message: "PDF downloaded!" });
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast({ type: "error", message: "PDF export not available yet" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pageBackground flex flex-col">
        <Navbar backHref="/dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-secondary">Loading your action plan...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !plan) {
    return (
      <div className="min-h-screen bg-pageBackground flex flex-col">
        <Navbar backHref="/dashboard" />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-secondary leading-relaxed">{error}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-black text-white text-sm px-6 py-2.5 rounded-xl hover:bg-gray-900 transition-colors cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const userName = user?.firstName || "Member";
  const overview = plan?.overview || {};
  const healthReport = plan?.healthReport || {};
  const monitoredIssues = plan?.monitoredIssues || [];
  const protocol = plan?.protocol || {};
  const nextSteps = plan?.nextSteps || {};
  const categoryGrades = healthReport.categoryGrades || {};

  return (
    <div className="min-h-screen bg-pageBackground flex flex-col font-inter">
      <Navbar backHref="/dashboard" />

      {toast && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl shadow-lg text-white text-sm z-50 animate-in fade-in slide-in-from-top-2 ${
            toast.type === "success" ? "bg-biomarkerOptimal" : "bg-red-500"
          }`}
        >
          {toast.message}
        </div>
      )}

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-8 pb-28">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {userName}&apos;s Action Plan
          </h1>
          {plan?.generatedAt && (
            <p className="text-xs text-secondary mt-1">
              {new Date(plan.generatedAt).toLocaleDateString("en-US", {
                year: "numeric", month: "short", day: "numeric",
              })}
            </p>
          )}
        </div>

        {/* ── Section 1: Overview ── */}
        <section className="space-y-4">
          <SectionHeader number={1} total={5} title="Overview" index={0} />
          <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
            <p>{overview.intro}</p>
            {overview.dataSources?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
                  Data we reviewed:
                </p>
                <ul className="space-y-1">
                  {overview.dataSources.map((ds, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                      <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                      {ds}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* ── Section 2: Health Report ── */}
        <section className="space-y-4">
          <SectionHeader number={2} total={5} title="Health Report" index={1} />

          <p className="text-sm text-gray-600">
            Your Health Report distills your Cyborg Score, Biological Age, and Biomarkers across key health categories.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-borderColor bg-white p-4">
              <p className="text-[10px] font-semibold text-secondary uppercase tracking-wider">Cyborg Score</p>
              <p className="text-3xl font-bold text-gray-900 mt-1.5">
                {healthReport.cyborgScore ?? "—"}
              </p>
            </div>
            <div className="rounded-xl border border-borderColor bg-white p-4">
              <p className="text-[10px] font-semibold text-secondary uppercase tracking-wider">Biological Age</p>
              <p className="text-3xl font-bold text-gray-900 mt-1.5">
                {healthReport.bioAge?.phenoAge != null
                  ? healthReport.bioAge.phenoAge.toFixed(1)
                  : "—"}
              </p>
              {healthReport.bioAge?.delta != null && (
                <p className={`text-[10px] mt-0.5 font-medium ${healthReport.bioAge.delta <= 0 ? "text-biomarkerOptimal" : "text-biomarkerOutOfRange"}`}>
                  {healthReport.bioAge.delta <= 0
                    ? `${Math.abs(healthReport.bioAge.delta).toFixed(1)} years younger`
                    : `${healthReport.bioAge.delta.toFixed(1)} years older`}
                </p>
              )}
            </div>
          </div>

          {healthReport.markerCounts && (
            <div className="rounded-xl border border-borderColor bg-white p-4">
              <p className="text-xs font-semibold text-gray-800 mb-2">Biomarkers</p>
              <div className="flex items-baseline gap-4">
                <span className="text-2xl font-bold text-gray-900">{healthReport.markerCounts.total}</span>
                <span className="text-xs text-biomarkerOptimal font-semibold">{healthReport.markerCounts.optimal} Optimal</span>
                <span className="text-xs text-secondary font-medium">{healthReport.markerCounts.inRange} Normal</span>
                <span className="text-xs text-biomarkerOutOfRange font-semibold">{healthReport.markerCounts.outOfRange} Out of Range</span>
              </div>
              <div className="flex h-1.5 rounded-full overflow-hidden mt-3 bg-gray-100">
                {healthReport.markerCounts.total > 0 && (
                  <>
                    <div className="bg-blue-500 transition-all" style={{ width: `${(healthReport.markerCounts.optimal / healthReport.markerCounts.total) * 100}%` }} />
                    <div className="bg-biomarkerOptimal transition-all" style={{ width: `${(healthReport.markerCounts.inRange / healthReport.markerCounts.total) * 100}%` }} />
                    <div className="bg-biomarkerOutOfRange transition-all" style={{ width: `${(healthReport.markerCounts.outOfRange / healthReport.markerCounts.total) * 100}%` }} />
                  </>
                )}
              </div>
            </div>
          )}

          {Object.keys(categoryGrades).length > 0 && (
            <div className="rounded-xl border border-borderColor bg-white p-4">
              <p className="text-xs font-semibold text-gray-800 mb-3">Category Overview</p>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                {Object.entries(categoryGrades).map(([key, val]) => (
                  <GradeCircle key={key} grade={val?.grade || "—"} label={key} />
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] text-secondary leading-relaxed">
            Scores are system-generated using your medical history and health background. Not intended to diagnose disease or substitute a physician&apos;s consultation.
          </p>
        </section>

        {/* ── Section 3: Monitored Issues ── */}
        <section className="space-y-4">
          <SectionHeader number={3} total={5} title="Monitored Issues" index={2} />

          {plan?.status === "awaiting_review" ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Your doctor is reviewing your health plan</h3>
              <p className="text-sm text-gray-500">You&apos;ll be notified when your personalized goals are ready.</p>
            </div>
          ) : (
          <>
          <p className="text-sm text-gray-600">
            {monitoredIssues.length > 0
              ? `We detected ${monitoredIssues.length} monitored issue${monitoredIssues.length !== 1 ? "s" : ""} you should be aware of.`
              : "No monitored issues detected. Your biomarkers look healthy."}
          </p>

          <div className="space-y-6">
            {monitoredIssues.map((issue, idx) => (
              <div key={issue.goalId || idx} className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold text-gray-900 leading-snug">
                    {idx + 1}. {issue.title}
                  </h3>
                  <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
                    <PriorityBadge priority={issue.priority} />
                    <DeltaBadge delta={issue.delta} />
                  </div>
                </div>

                {issue.description && (
                  <p className="text-sm text-gray-700 leading-relaxed">{issue.description}</p>
                )}

                {issue.biomarkerEvidence?.length > 0 && (
                  <div className="space-y-1.5">
                    {issue.biomarkerEvidence.map((bm, i) => (
                      <BiomarkerBar key={i} biomarker={bm} />
                    ))}
                  </div>
                )}

                {issue.whatThisMeans && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1">What this means:</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">{issue.whatThisMeans}</p>
                  </div>
                )}

                {issue.potentialCauses && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1">Potential Causes:</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">{issue.potentialCauses}</p>
                  </div>
                )}

                {issue.recommendedActions?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Recommended Actions:</h4>
                    <ol className="space-y-2">
                      {issue.recommendedActions.map((action, i) => (
                        <li key={i} className="text-xs text-gray-700 leading-relaxed">
                          <span className="font-bold text-primary">
                            {action.number}. <span className="underline">{action.label}</span>
                          </span>
                          <br />
                          <span className="ml-3.5 inline-block mt-0.5">{action.detail}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {idx < monitoredIssues.length - 1 && (
                  <hr className="border-borderColor mt-2" />
                )}
              </div>
            ))}
          </div>
          </>
          )}
        </section>

        {/* ── Section 4: Protocol ── */}
        {plan?.status !== "awaiting_review" && (
        <section className="space-y-4">
          <SectionHeader number={4} total={5} title="Protocol" index={3} />

          <p className="text-sm text-gray-600">
            Cyborg has designed a personal protocol to help target your health goals and address your monitored issues.
          </p>

          <div className="space-y-2.5">
            <AccordionSection title="Lifestyle" defaultOpen>
              <div className="space-y-4">
                {protocol.lifestyle?.sleep?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">Sleep</h4>
                    <ul className="space-y-1.5">
                      {protocol.lifestyle.sleep.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                          <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {protocol.lifestyle?.exercise?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">Exercise</h4>
                    <ul className="space-y-1.5">
                      {protocol.lifestyle.exercise.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                          <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {protocol.lifestyle?.stress?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">Stress</h4>
                    <ul className="space-y-1.5">
                      {protocol.lifestyle.stress.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                          <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AccordionSection>

            <AccordionSection title="Nutrition">
              <ul className="space-y-1.5">
                {(protocol.nutrition || []).map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                    <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                    {item.text}
                  </li>
                ))}
              </ul>
            </AccordionSection>

            <AccordionSection title="Supplements">
              <div className="space-y-3">
                {(protocol.supplements || []).map((supp, i) => (
                  <SupplementCard key={i} supplement={supp} />
                ))}
                {(!protocol.supplements || protocol.supplements.length === 0) && (
                  <p className="text-xs text-secondary">No supplements recommended based on your current biomarkers.</p>
                )}
              </div>
            </AccordionSection>

            <AccordionSection title="Diagnostic Tests">
              <div className="space-y-3">
                {(protocol.diagnosticTests || []).map((test, i) => (
                  <div key={i} className="rounded-xl border border-borderColor bg-gray-50/50 p-4 space-y-1.5">
                    <h4 className="font-bold text-gray-900 text-sm">{test.name}</h4>
                    {test.whatItIs && (
                      <p className="text-xs text-gray-600 leading-relaxed">
                        <span className="font-semibold text-primary">What it is: </span>{test.whatItIs}
                      </p>
                    )}
                    {test.whyTestIt && (
                      <p className="text-xs text-gray-600 leading-relaxed">
                        <span className="font-semibold text-primary">Why test it: </span>{test.whyTestIt}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </AccordionSection>
          </div>
        </section>
        )}

        {/* ── Section 5: Next Steps ── */}
        {plan?.status !== "awaiting_review" && (
        <section className="space-y-4">
          <SectionHeader number={5} total={5} title="Next Steps" index={4} />

          <div className="space-y-4 text-sm text-gray-700">
            {nextSteps.text && <p className="leading-relaxed">{nextSteps.text}</p>}

            {nextSteps.followUpTimeline && (
              <div className="rounded-xl border border-borderColor bg-white p-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-secondary">Follow-up</p>
                  <p className="text-sm font-semibold text-gray-900">{nextSteps.followUpTimeline}</p>
                </div>
              </div>
            )}

            {nextSteps.checklist?.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2">Your action checklist:</h4>
                <ul className="space-y-2">
                  {nextSteps.checklist.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-gray-700 leading-relaxed">
                      <span className="w-4 h-4 rounded border-2 border-gray-300 shrink-0 mt-0.5" />
                      {item.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {nextSteps.recommendedProducts?.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">
                  {nextSteps.recommendedProducts.length} items recommended for you
                </h4>
                <div className="space-y-2">
                  {nextSteps.recommendedProducts.map((product, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl border border-borderColor bg-white p-3 cursor-pointer hover:shadow-sm transition-shadow"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{product.productName}</p>
                        {product.price != null && (
                          <p className="text-xs text-secondary">${product.price}</p>
                        )}
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {nextSteps.disclaimer && (
            <p className="text-[10px] text-secondary leading-relaxed pt-2 border-t border-borderColor">
              {nextSteps.disclaimer}
            </p>
          )}
        </section>
        )}

        {/* ── Action Buttons ── */}
        <div className="flex gap-3">
          <button
            onClick={handleDownloadPDF}
            className="flex-1 bg-black text-white text-sm px-5 py-3 rounded-xl font-semibold hover:bg-gray-900 transition-colors cursor-pointer"
          >
            Download as PDF
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 border border-borderColor text-gray-800 text-sm px-5 py-3 rounded-xl font-semibold hover:bg-white transition-colors cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
