"use client";

import { useState, useEffect, useCallback } from "react";
import { goalsAPI } from "@/services/api";
import GoalCard from "./GoalCard";
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

  const biomarkers = (details.biomarkersToImprove || []).map((b) => ({
    id: b.canonicalName,
    name: b.displayName || b.canonicalName,
    value: b.numericValue != null ? `${b.numericValue} ${b.unit || ""}`.trim() : "—",
    status: b.optimalFlag === "optimal" ? "optimal" : b.flag === "normal" ? "normal" : "out_of_range",
    category: b.category || "",
    trend: [],
    optimalRange: { min: b.optimalMin ?? null, max: b.optimalMax ?? null },
  }));

  return (
    <div className="min-h-screen bg-pageBackground pb-24">
      <div className="flex items-center gap-4 pt-6 px-4 pb-6 border-b border-borderColor">
        <button onClick={onBack} className="text-2xl text-black hover:text-secondary transition-colors">&#8249;</button>
        <h1 className="text-lg font-semibold font-inter text-black">Goals</h1>
      </div>

      <div className="px-4 pt-6 pb-6 flex justify-center">
        <div className="w-full max-w-sm">
          <GoalCard goal={goal} onClick={() => {}} showCTA={false} />
        </div>
      </div>

      <div className="px-4 pb-6 grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4">
          <p className="text-xs text-secondary font-inter mb-2">Health Impact</p>
          <p className="text-sm font-semibold font-inter text-black">{details.healthImpact}</p>
        </div>
        <div className="bg-white rounded-2xl p-4">
          <p className="text-xs text-secondary font-inter mb-2">Recovery Time</p>
          <p className="text-sm font-semibold font-inter text-black">
            {details.recoveryTimeWeeks ? `${details.recoveryTimeWeeks} weeks` : "—"}
          </p>
        </div>
      </div>

      <div className="px-4 space-y-8">
        {details.whatThisMeans && (
          <div>
            <h3 className="text-lg font-semibold font-inter text-black mb-3">What this means:</h3>
            <p className="text-sm font-inter text-black leading-relaxed">{details.whatThisMeans}</p>
          </div>
        )}

        {details.potentialCauses && (
          <div>
            <h3 className="text-lg font-semibold font-inter text-black mb-3">Potential Causes:</h3>
            <p className="text-sm font-inter text-black leading-relaxed">{details.potentialCauses}</p>
          </div>
        )}

        {biomarkers.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold font-inter text-black mb-4">Biomarkers to improve:</h3>
            <div className="space-y-4">
              {biomarkers.map((biomarker) => (
                <BiomarkerCard key={biomarker.id} biomarker={biomarker} />
              ))}
            </div>
          </div>
        )}

        {details.recommendedActions?.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold font-inter text-black mb-4">Recommended Actions:</h3>
            <div className="space-y-4">
              {details.recommendedActions.map((action, index) => (
                <div key={index}>
                  <p className="text-sm font-semibold font-inter text-primary mb-2">
                    {index + 1}. {action.title}
                  </p>
                  <p className="text-sm font-inter text-black leading-relaxed ml-6">{action.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {details.protocolItems?.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold font-inter text-black mb-4">Select your protocol items:</h3>
            <div className="space-y-4">
              {details.protocolItems.map((item, index) => (
                <ProtocolItem key={index} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
