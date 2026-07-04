"use client";

import { useState, useEffect, useCallback } from "react";
import { goalsAPI } from "@/services/api";
import BiomarkerCard from "./BiomarkerCard";
import ProtocolItem from "./ProtocolItem";

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
      <div className="min-h-screen bg-pageBackground flex items-center justify-center">
        <p className="text-gray-500">Loading goal details...</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="min-h-screen bg-pageBackground pb-24">
        <div className="flex items-center gap-4 pt-6 px-4 pb-6 border-b border-borderColor">
          <button onClick={onBack} className="text-2xl text-black hover:text-secondary transition-colors">&#8249;</button>
          <h1 className="text-lg font-semibold font-inter text-black">Goals</h1>
        </div>
        <div className="px-4 pt-12 text-center text-red-500">{error || "Goal not found"}</div>
      </div>
    );
  }

  const goalIndex = details.goalId ? details.goalId.length : 0;
  const bgImage = goalIndex % 2 === 1 ? "/assets/goal-theme-1.png" : "/assets/goal-theme-2.png";

  const rawBiomarkers = details.biomarkerEvidence || details.biomarkersToImprove || [];
  const biomarkers = rawBiomarkers.map((b) => ({
    id: b.canonicalName,
    name: b.name || b.canonicalName,
    value: b.value != null ? String(b.value) : "—",
    unit: b.unit || "",
    status: b.flag === "normal" ? "normal" : "out_of_range",
    category: b.category || "",
    trend: [],
    optimalRange: { min: b.optimalMin ?? null, max: b.optimalMax ?? null },
  }));

  const prColor =
    details.priority === "High" ? "text-rose-600" : details.priority === "Medium" ? "text-amber-600" : "text-blue-600";
  const prGrad =
    details.priority === "High"
      ? "linear-gradient(135deg,#8c3527,#48160e)"
      : details.priority === "Low"
        ? "linear-gradient(135deg,#52799f,#274c6f)"
        : "linear-gradient(135deg,#7f2c3d,#46161f)";
  const productCount = details.protocolItems?.length || 0;

  return (
    <div className="min-h-screen overflow-x-hidden bg-pageBackground pb-24">
      <div className="border-b border-borderColor">
        <div className="mx-auto flex w-full max-w-[760px] items-center gap-4 px-4 pb-5 pt-6 lg:px-6">
          <button onClick={onBack} className="text-2xl text-black transition-colors hover:text-secondary">&#8249;</button>
          <h1 className="font-inter text-lg font-semibold text-black">Goals</h1>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[760px] px-4 lg:px-6">
        {/* Hero */}
        <div
          className="relative mt-6 overflow-hidden rounded-3xl p-6 lg:p-8"
          style={{ backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
        >
          <div className="absolute inset-0" style={{ background: prGrad, opacity: 0.82 }} />
          <div className="absolute inset-0 bg-black/25" />
          <div className="relative z-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Goal</p>
            <h2 className="mt-2 font-inter text-2xl font-bold leading-tight text-white lg:text-[32px]">{details.title}</h2>
            {details.description && (
              <p className="mt-3 max-w-[54ch] font-inter text-sm leading-relaxed text-white/85 lg:text-base">{details.description}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-borderColor bg-white p-4">
            <p className="font-inter text-xs text-secondary">Priority</p>
            <p className={`mt-1.5 font-inter text-sm font-semibold ${prColor}`}>{details.priority || "—"}</p>
          </div>
          <div className="rounded-2xl border border-borderColor bg-white p-4">
            <p className="font-inter text-xs text-secondary">Biomarkers</p>
            <p className="mt-1.5 font-inter text-sm font-semibold text-black">{biomarkers.length}</p>
          </div>
          <div className="rounded-2xl border border-borderColor bg-white p-4">
            <p className="font-inter text-xs text-secondary">Products</p>
            <p className="mt-1.5 font-inter text-sm font-semibold text-black">{productCount}</p>
          </div>
        </div>

        {/* Sections */}
        <div className="mt-8 space-y-8">
          {details.whatThisMeans && (
            <div>
              <h3 className="mb-3 font-inter text-lg font-semibold text-black">What this means:</h3>
              <p className="font-inter text-sm leading-relaxed text-black">{details.whatThisMeans}</p>
            </div>
          )}

          {details.potentialCauses && (
            <div>
              <h3 className="mb-3 font-inter text-lg font-semibold text-black">Potential Causes:</h3>
              <p className="font-inter text-sm leading-relaxed text-black">{details.potentialCauses}</p>
            </div>
          )}

          {biomarkers.length > 0 && (
            <div>
              <h3 className="mb-4 font-inter text-lg font-semibold text-black">Biomarkers to improve:</h3>
              <div className="space-y-4">
                {biomarkers.map((biomarker) => (
                  <BiomarkerCard key={biomarker.id} biomarker={biomarker} />
                ))}
              </div>
            </div>
          )}

          {details.recommendedActions?.length > 0 && (
            <div>
              <h3 className="mb-4 font-inter text-lg font-semibold text-black">Recommended Actions:</h3>
              <div className="space-y-4">
                {details.recommendedActions.map((action, index) => (
                  <div key={index}>
                    <p className="mb-2 font-inter text-sm font-semibold text-primary underline">
                      {action.number || index + 1}. {action.label}
                    </p>
                    <p className="ml-6 font-inter text-sm leading-relaxed text-black">{action.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {details.protocolItems?.length > 0 && (
            <div>
              <h3 className="mb-4 font-inter text-lg font-semibold text-black">Select your protocol items:</h3>
              <div className="space-y-4">
                {details.protocolItems.map((item, index) => (
                  <ProtocolItem
                    key={index}
                    item={{
                      name: item.productName,
                      description: item.dosing,
                      instruction: item.triggerBiomarkers?.length ? `Targets: ${item.triggerBiomarkers.join(", ")}` : "",
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
