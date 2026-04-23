"use client";

export const dynamic = "force-dynamic";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { actionPlanAPI } from "@/services/api";
import Navbar from "@/components/Navbar";

function SectionHeader({ number, total, title, gradient }) {
  return (
    <div
      className={`rounded-2xl px-5 py-4 ${gradient}`}
    >
      <p className="text-sm text-white/80 font-medium">
        {number} of {total}
      </p>
      <h2 className="text-2xl font-bold text-white mt-1">{title}</h2>
    </div>
  );
}

function BiomarkerBar({ biomarker }) {
  const { name, value, unit, flag, referenceMin, referenceMax, optimalMin, optimalMax } = biomarker;

  const flagColor = {
    "Out of range": "bg-red-500",
    "Elevated": "bg-yellow-500",
    "Low": "bg-red-400",
    "High": "bg-yellow-500",
    "Normal": "bg-green-500",
    "Optimal": "bg-green-500",
  };

  const dotColor = flagColor[flag] || "bg-gray-400";

  const min = referenceMin ?? 0;
  const max = referenceMax ?? (value * 2 || 100);
  const range = max - min || 1;
  const position = Math.max(0, Math.min(100, ((value - min) / range) * 100));

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
          <span className="font-medium text-gray-900">{name}</span>
        </div>
        <span className="text-sm text-gray-600">
          {value} {unit}
        </span>
      </div>
      <div className="relative h-2 bg-gray-100 rounded-full">
        {optimalMin != null && optimalMax != null && (
          <div
            className="absolute h-full bg-green-100 rounded-full"
            style={{
              left: `${Math.max(0, ((optimalMin - min) / range) * 100)}%`,
              width: `${Math.min(100, ((optimalMax - optimalMin) / range) * 100)}%`,
            }}
          />
        )}
        <div
          className={`absolute w-3 h-3 rounded-full ${dotColor} -top-0.5 border-2 border-white shadow`}
          style={{ left: `calc(${position}% - 6px)` }}
        />
        {referenceMin != null && (
          <div
            className="absolute w-0.5 h-4 bg-teal-500 -top-1"
            style={{ left: `${((referenceMin - min) / range) * 100}%` }}
          />
        )}
        {referenceMax != null && (
          <div
            className="absolute w-0.5 h-4 bg-teal-500 -top-1"
            style={{ left: `${((referenceMax - min) / range) * 100}%` }}
          />
        )}
      </div>
    </div>
  );
}

function GradeCircle({ grade, label }) {
  const colors = {
    A: "bg-green-100 text-green-700 border-green-300",
    B: "bg-yellow-100 text-yellow-700 border-yellow-300",
    C: "bg-orange-100 text-orange-700 border-orange-300",
    D: "bg-red-100 text-red-700 border-red-300",
    F: "bg-red-200 text-red-800 border-red-400",
  };
  const colorClass = colors[grade] || "bg-gray-100 text-gray-700 border-gray-300";

  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${colorClass}`}
      >
        {grade}
      </span>
      <span className="text-sm text-gray-800 capitalize">
        {label.replace(/_/g, " ")}
      </span>
    </div>
  );
}

function AccordionSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition"
      >
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
}

function DeltaBadge({ delta }) {
  if (!delta || delta.status === "new") return null;
  const badges = {
    improved: { text: "Improved", className: "bg-green-100 text-green-700" },
    worsened: { text: "Worsened", className: "bg-red-100 text-red-700" },
    unchanged: { text: "Unchanged", className: "bg-gray-100 text-gray-600" },
    resolved: { text: "Resolved", className: "bg-blue-100 text-blue-700" },
  };
  const badge = badges[delta.status];
  if (!badge) return null;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.className}`}>
      {badge.text}
    </span>
  );
}

export default function ActionPlanPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.userId;
  const planId = searchParams.get("planId");
  const router = useRouter();
  const { token } = useAuth();

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
        if (data.status === "ready") {
          setPlan(data);
          setError("");
        } else if (data.status === "pending" || data.status === "generating") {
          setError("Plan is still generating. You'll be notified when ready.");
        } else if (data.status === "failed") {
          setError(data.errorMessage || "Failed to generate plan");
        } else {
          setError("Plan not found");
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
          <div className="text-lg text-gray-500">Loading your action plan...</div>
        </div>
      </div>
    );
  }

  if (error && !plan) {
    return (
      <div className="min-h-screen bg-pageBackground flex flex-col">
        <Navbar backHref="/dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md text-center space-y-4">
            <div className="text-lg font-semibold text-gray-700">{error}</div>
            <button
              onClick={() => router.back()}
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-900"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const overview = plan?.overview || {};
  const healthReport = plan?.healthReport || {};
  const monitoredIssues = plan?.monitoredIssues || [];
  const protocol = plan?.protocol || {};
  const nextSteps = plan?.nextSteps || {};
  const categoryGrades = healthReport.categoryGrades || {};

  return (
    <div className="min-h-screen bg-pageBackground flex flex-col">
      <Navbar backHref="/dashboard" />

      {toast && (
        <div
          className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg text-white z-50 max-w-xs ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {toast.message}
        </div>
      )}

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-8">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Action Plan</h1>
          {plan?.generatedAt && (
            <p className="text-sm text-gray-500 mt-1">
              {new Date(plan.generatedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          )}
        </div>

        {/* Section 1: Overview */}
        <section>
          <SectionHeader
            number={1} total={5} title="Overview"
            gradient="bg-gradient-to-r from-orange-400 to-orange-300"
          />
          <div className="mt-4 space-y-3">
            <p className="text-gray-700">{overview.intro}</p>
            {overview.dataSources?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Data reviewed:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {overview.dataSources.map((ds, i) => (
                    <li key={i}>{ds}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Section 2: Health Report */}
        <section>
          <SectionHeader
            number={2} total={5} title="Health Report"
            gradient="bg-gradient-to-r from-slate-600 to-slate-500"
          />
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase">Cyborg Score</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {healthReport.cyborgScore ?? "—"}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase">Biological Age</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {healthReport.bioAge?.phenoAge ?? "—"}
                </p>
                {healthReport.bioAge?.delta != null && (
                  <p className="text-xs text-gray-500 mt-1">
                    {healthReport.bioAge.delta > 0
                      ? `${healthReport.bioAge.delta.toFixed(1)} years older`
                      : `${Math.abs(healthReport.bioAge.delta).toFixed(1)} years younger`}
                  </p>
                )}
              </div>
            </div>

            {healthReport.markerCounts && (
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-2">Biomarkers</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-bold text-gray-900">{healthReport.markerCounts.total} Total</span>
                  <span className="text-green-600">{healthReport.markerCounts.optimal} Optimal</span>
                  <span className="text-gray-600">{healthReport.markerCounts.inRange} Normal</span>
                  <span className="text-red-600">{healthReport.markerCounts.outOfRange} Out of Range</span>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden mt-2 bg-gray-100">
                  {healthReport.markerCounts.total > 0 && (
                    <>
                      <div
                        className="bg-blue-500"
                        style={{ width: `${(healthReport.markerCounts.optimal / healthReport.markerCounts.total) * 100}%` }}
                      />
                      <div
                        className="bg-green-400"
                        style={{ width: `${(healthReport.markerCounts.inRange / healthReport.markerCounts.total) * 100}%` }}
                      />
                      <div
                        className="bg-pink-400"
                        style={{ width: `${(healthReport.markerCounts.outOfRange / healthReport.markerCounts.total) * 100}%` }}
                      />
                    </>
                  )}
                </div>
              </div>
            )}

            {Object.keys(categoryGrades).length > 0 && (
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-3">Category Overview</p>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(categoryGrades).map(([key, val]) => (
                    <GradeCircle
                      key={key}
                      grade={val?.grade || "—"}
                      label={key}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Monitored Issues (Goals) */}
        <section>
          <SectionHeader
            number={3} total={5} title="Monitored Issues"
            gradient="bg-gradient-to-r from-teal-700 to-teal-600"
          />
          <div className="mt-4 space-y-2">
            <p className="text-gray-600 text-sm">
              We detected {monitoredIssues.length} monitored issue{monitoredIssues.length !== 1 ? "s" : ""} you should be aware of.
            </p>

            <div className="space-y-6 mt-4">
              {monitoredIssues.map((issue, idx) => (
                <div key={issue.goalId || idx} className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl font-bold text-gray-900">
                      {idx + 1}. {issue.title}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-sm font-semibold ${
                          issue.priority === "High"
                            ? "text-red-500"
                            : issue.priority === "Medium"
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {issue.priority} priority
                      </span>
                      <DeltaBadge delta={issue.delta} />
                    </div>
                  </div>

                  {issue.description && (
                    <p className="text-gray-700">{issue.description}</p>
                  )}

                  {issue.biomarkerEvidence?.length > 0 && (
                    <div className="space-y-2">
                      {issue.biomarkerEvidence.map((bm, i) => (
                        <BiomarkerBar key={i} biomarker={bm} />
                      ))}
                    </div>
                  )}

                  {issue.whatThisMeans && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">What this means:</h4>
                      <p className="text-gray-700 text-sm">{issue.whatThisMeans}</p>
                    </div>
                  )}

                  {issue.potentialCauses && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Potential Causes:</h4>
                      <p className="text-gray-700 text-sm">{issue.potentialCauses}</p>
                    </div>
                  )}

                  {issue.recommendedActions?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Recommended Actions:</h4>
                      <ol className="space-y-2">
                        {issue.recommendedActions.map((action, i) => (
                          <li key={i} className="text-sm text-gray-700">
                            <span className="text-orange-600 font-semibold">
                              {action.number}. {action.label}
                            </span>
                            <br />
                            <span className="ml-4">{action.detail}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {idx < monitoredIssues.length - 1 && (
                    <hr className="border-gray-200" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: Protocol */}
        <section>
          <SectionHeader
            number={4} total={5} title="Protocol"
            gradient="bg-gradient-to-r from-red-700 to-red-600"
          />
          <div className="mt-4 space-y-3">
            <p className="text-gray-600 text-sm">
              Cyborg has designed a personal protocol to help target your health goals and address your monitored issues.
            </p>

            <AccordionSection title="Lifestyle">
              <div className="space-y-4">
                {protocol.lifestyle?.sleep?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Sleep</h4>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {protocol.lifestyle.sleep.map((item, i) => (
                        <li key={i}>{item.text}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {protocol.lifestyle?.exercise?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Exercise</h4>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {protocol.lifestyle.exercise.map((item, i) => (
                        <li key={i}>{item.text}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {protocol.lifestyle?.stress?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Stress</h4>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {protocol.lifestyle.stress.map((item, i) => (
                        <li key={i}>{item.text}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AccordionSection>

            <AccordionSection title="Nutrition">
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {(protocol.nutrition || []).map((item, i) => (
                  <li key={i}>{item.text}</li>
                ))}
              </ul>
            </AccordionSection>

            <AccordionSection title="Supplements">
              <div className="space-y-4">
                {(protocol.supplements || []).map((supp, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-1">
                    <h4 className="font-bold text-gray-900">{supp.name}</h4>
                    {supp.whatItIs && (
                      <p className="text-sm text-gray-600">
                        <span className="text-orange-600 font-medium">What it is: </span>
                        {supp.whatItIs}
                      </p>
                    )}
                    {supp.whyItMatters && (
                      <p className="text-sm text-gray-600">
                        <span className="text-orange-600 font-medium">Why this matters: </span>
                        {supp.whyItMatters}
                      </p>
                    )}
                    {supp.howToTake && (
                      <p className="text-sm text-gray-600">
                        <span className="text-orange-600 font-medium">How to take it: </span>
                        {supp.howToTake}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </AccordionSection>

            <AccordionSection title="Diagnostic Tests">
              <div className="space-y-4">
                {(protocol.diagnosticTests || []).map((test, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-1">
                    <h4 className="font-bold text-gray-900">{test.name}</h4>
                    {test.whatItIs && (
                      <p className="text-sm text-gray-600">
                        <span className="text-orange-600 font-medium">What it is: </span>
                        {test.whatItIs}
                      </p>
                    )}
                    {test.whyTestIt && (
                      <p className="text-sm text-gray-600">
                        <span className="text-orange-600 font-medium">Why test it: </span>
                        {test.whyTestIt}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </AccordionSection>
          </div>
        </section>

        {/* Section 5: Next Steps */}
        <section>
          <SectionHeader
            number={5} total={5} title="Next Steps"
            gradient="bg-gradient-to-r from-amber-600 to-amber-500"
          />
          <div className="mt-4 space-y-4">
            {nextSteps.text && (
              <p className="text-gray-700">{nextSteps.text}</p>
            )}

            {nextSteps.followUpTimeline && (
              <p className="text-gray-700">
                <span className="font-semibold">Follow-up: </span>
                {nextSteps.followUpTimeline}
              </p>
            )}

            {nextSteps.checklist?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Your action checklist:</h4>
                <ul className="space-y-2">
                  {nextSteps.checklist.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-black font-bold mt-0.5">&#9632;</span>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {nextSteps.recommendedProducts?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">
                  {nextSteps.recommendedProducts.length} items recommended for you
                </h4>
                <div className="space-y-2">
                  {nextSteps.recommendedProducts.map((product, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-100"
                    >
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{product.productName}</p>
                        {product.price != null && (
                          <p className="text-sm text-gray-500">${product.price}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {nextSteps.disclaimer && (
              <p className="text-xs text-gray-400 mt-4">{nextSteps.disclaimer}</p>
            )}
          </div>
        </section>

        {/* Actions */}
        <div className="flex gap-3 pb-8">
          <button
            onClick={handleDownloadPDF}
            className="flex-1 bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-900"
          >
            Download as PDF
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 border border-gray-300 text-gray-800 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
