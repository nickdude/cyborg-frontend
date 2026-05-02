"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { goalsAPI, actionPlanAPI } from "@/services/api";
import GoalCard from "@/components/GoalCard";
import GoalDetail from "@/components/GoalDetail";

const TIMING_LABELS = {
  morning_fasted: "Morning (Fasted)",
  with_breakfast: "With Breakfast",
  with_food: "With Food",
  pre_workout: "Pre-Workout",
  post_workout: "Post-Workout",
  with_dinner: "With Dinner",
  bedtime: "Bedtime",
};

const PRIORITY_COLORS = {
  High: "bg-red-50 text-red-700 border-red-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-green-50 text-green-700 border-green-200",
};

function TimingBadge({ timing }) {
  const label = TIMING_LABELS[timing] || timing || "With Food";
  return (
    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
      {label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const colorClass = PRIORITY_COLORS[priority] || PRIORITY_COLORS.Medium;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${colorClass}`}>
      {priority || "Medium"}
    </span>
  );
}

function ProtocolItemCard({ item }) {
  const [expanded, setExpanded] = useState(false);
  const goalCount = item.drivingGoals?.length || 0;

  return (
    <div className="rounded-2xl border border-borderColor bg-white font-inter lg:px-5">
      <div className="px-4 py-4 lg:px-0 lg:py-5">
        {/* Main row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-black lg:text-base">{item.productName}</h3>
            {item.dosing && (
              <p className="mt-1 text-sm text-secondary">{item.dosing}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <TimingBadge timing={item.timing} />
              {goalCount > 0 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Supports {goalCount} goal{goalCount !== 1 ? "s" : ""}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <button className="flex-shrink-0 rounded-lg bg-black px-6 py-2 text-xs font-medium text-white hover:bg-gray-900 transition lg:px-7 lg:py-2.5 lg:text-sm">
            Buy
          </button>
        </div>

        {/* Expanded: driving goals */}
        {expanded && goalCount > 0 && (
          <div className="mt-3 border-t border-gray-100 pt-3">
            <p className="mb-2 text-xs font-medium text-secondary uppercase tracking-wide">Driving Goals</p>
            <div className="space-y-1.5">
              {item.drivingGoals.map((goal, i) => (
                <div key={goal.goalId || i} className="flex items-center gap-2">
                  <span className="text-sm text-gray-800">{goal.title}</span>
                  <PriorityBadge priority={goal.priority} />
                </div>
              ))}
            </div>
            {item.triggerBiomarkers?.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-secondary">
                  Biomarkers: {item.triggerBiomarkers.join(", ")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Protocol() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("protocol");
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [goals, setGoals] = useState([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalsError, setGoalsError] = useState("");
  const [goalsStatus, setGoalsStatus] = useState(null);

  // Protocol state
  const [protocolItems, setProtocolItems] = useState([]);
  const [protocolLoading, setProtocolLoading] = useState(false);
  const [protocolError, setProtocolError] = useState("");

  const fetchGoals = useCallback(async () => {
    try {
      setGoalsLoading(true);
      setGoalsError("");
      setGoalsStatus(null);
      const response = await goalsAPI.list();
      const data = response?.data || response;
      const meta = data?.meta || {};
      setGoals(data?.goals || []);
      setGoalsStatus(meta.status || null);
    } catch (err) {
      if (err?.statusCode === 404 || err?.message?.includes("No report")) {
        setGoalsError("Upload a blood report to see your health goals");
      } else {
        setGoalsError("Failed to load goals");
      }
    } finally {
      setGoalsLoading(false);
    }
  }, []);

  const fetchProtocol = useCallback(async () => {
    try {
      setProtocolLoading(true);
      setProtocolError("");
      const response = await actionPlanAPI.getLatest();
      const data = response?.data || response;
      setProtocolItems(data?.deduplicatedProtocol || []);
    } catch (err) {
      if (err?.statusCode === 404 || err?.message?.includes("No action plan")) {
        setProtocolError("Generate an action plan from your blood report first");
      } else {
        setProtocolError("Failed to load protocol items");
      }
    } finally {
      setProtocolLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "goals") {
      fetchGoals();
    }
  }, [activeTab, fetchGoals]);

  useEffect(() => {
    if (activeTab === "protocol") {
      fetchProtocol();
    }
  }, [activeTab, fetchProtocol]);

  const handleGoalClick = (goal) => {
    setSelectedGoal(goal);
  };

  // If a goal is selected, show the detail view
  if (selectedGoal) {
    return <GoalDetail goal={selectedGoal} onBack={() => setSelectedGoal(null)} />;
  }

  return (
    <div className="min-h-screen bg-pageBackground pb-24 font-inter lg:pb-10">
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        .animate-slide-in {
          animation: slideInLeft 0.3s ease-out;
        }
      `}</style>

      <div className="mx-auto w-full max-w-[1240px] px-4 pt-6 lg:px-8 lg:pt-8">
        {/* Header with Tabs */}
        <div className="pb-6 lg:pb-8">
          <div className="mb-6 flex items-center gap-4 lg:gap-6">
            <button
              onClick={() => setActiveTab("protocol")}
              className={`font-inter text-lg font-medium transition-colors duration-300 lg:text-xl ${
                activeTab === "protocol" ? "text-black" : "text-secondary hover:text-black"
              }`}
            >
              Protocol
            </button>
            <button
              onClick={() => setActiveTab("goals")}
              className={`font-inter text-lg font-medium transition-colors duration-300 lg:text-xl ${
                activeTab === "goals" ? "text-black" : "text-secondary hover:text-black"
              }`}
            >
              Goals
            </button>
          </div>

          {/* Tab content header */}
          {activeTab === "protocol" && (
            <h2 className="animate-fade-in font-inter text-2xl font-bold text-black lg:text-3xl">Your protocol items</h2>
          )}
        </div>

        {/* Goals Tab */}
        {activeTab === "goals" && (
          goalsLoading ? (
            <div className="py-12 text-center text-gray-500">Loading goals...</div>
          ) : goalsError ? (
            <div className="py-12 text-center text-gray-500">{goalsError}</div>
          ) : goalsStatus === "awaiting_review" ? (
            <div className="animate-fade-in py-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center max-w-md mx-auto">
                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Your doctor is reviewing your health plan</h3>
                <p className="text-sm text-gray-500">You&apos;ll be notified when your personalized goals are ready.</p>
              </div>
            </div>
          ) : goalsStatus === "generating" ? (
            <div className="animate-fade-in py-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center max-w-md mx-auto">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Generating your health goals</h3>
                <p className="text-sm text-gray-500">This may take a minute. We&apos;ll notify you when ready.</p>
              </div>
            </div>
          ) : goals.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No health goals yet</div>
          ) : (
            <div className="animate-fade-in grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
              {goals.map((goal, index) => (
                <div key={goal.goalId} style={{ animation: `fadeIn 0.4s ease-out ${index * 0.1}s both` }}>
                  <GoalCard goal={goal} onClick={() => handleGoalClick(goal)} />
                </div>
              ))}
            </div>
          )
        )}

        {/* Protocol Tab */}
        {activeTab === "protocol" && (
          protocolLoading ? (
            <div className="py-12 text-center text-gray-500">Loading protocol...</div>
          ) : protocolError ? (
            <div className="animate-fade-in py-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center max-w-md mx-auto">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">{protocolError}</h3>
                <p className="text-sm text-gray-500">Your personalized supplement protocol will appear here once your action plan is ready.</p>
              </div>
            </div>
          ) : protocolItems.length === 0 ? (
            <div className="animate-fade-in py-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center max-w-md mx-auto">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">No protocol items yet</h3>
                <p className="text-sm text-gray-500">Protocol items will appear once your action plan includes supplement recommendations.</p>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
              {protocolItems.map((item, index) => (
                <div key={item.productName + index} style={{ animation: `fadeIn 0.4s ease-out ${index * 0.05}s both` }}>
                  <ProtocolItemCard item={item} />
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
