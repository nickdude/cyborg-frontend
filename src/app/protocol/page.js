"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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

/**
 * Formats a price that may arrive as a number (45), a numeric string ("45"),
 * or an already-formatted string ("$45.00"). Returns null when absent.
 */
function formatPrice(price) {
  if (price == null || price === "") return null;
  if (typeof price === "number") return `$${price.toFixed(2).replace(/\.00$/, "")}`;
  const str = String(price).trim();
  if (!str) return null;
  return str.startsWith("$") ? str : `$${str}`;
}

/** Builds the supporting line under a product name from real protocol data. */
function buildSubtitle(item) {
  const parts = [];
  if (item.dosing) parts.push(item.dosing);
  const timing = TIMING_LABELS[item.timing] || item.timing;
  if (timing) parts.push(timing);
  return parts.join(" · ");
}

/** Small product icon (pill/capsule) used at the start of each protocol row. */
function ProductIcon() {
  return (
    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-borderColor bg-pageBackground lg:h-12 lg:w-12">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#71717B"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10.5 20.5 3.5 13.5a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7Z" />
        <path d="m8.5 8.5 7 7" />
      </svg>
    </div>
  );
}

/**
 * A single protocol row: [icon] [name + subtitle/price] [Buy button].
 * `item` comes from the action plan's deduplicatedProtocol array.
 */
function ProtocolRow({ item }) {
  const subtitle = buildSubtitle(item);
  const price = formatPrice(item.price);

  return (
    <div className="flex items-center gap-3 px-4 py-4 lg:gap-4 lg:px-5 lg:py-5">
      <ProductIcon />

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium text-black lg:text-base">
          {item.productName}
        </h3>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-secondary lg:text-sm">
          {price && <span className="font-medium text-blue">{price}</span>}
          {price && subtitle && <span className="text-borderColor">·</span>}
          {subtitle && <span className="truncate">{subtitle}</span>}
          {!price && !subtitle && <span>Recommended for you</span>}
        </div>
      </div>

      <Link
        href="/market-place"
        className="flex-shrink-0 rounded-full bg-black px-5 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-900 lg:px-6 lg:py-2.5 lg:text-sm"
      >
        Buy
      </Link>
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

  const fetchGoals = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setGoalsLoading(true);
      setGoalsError("");
      const response = await goalsAPI.list();
      const data = response?.data || response;
      const meta = data?.meta || {};
      setGoals(data?.goals || []);
      setGoalsStatus(meta.status || null);
    } catch (err) {
      if (err?.statusCode === 404 || err?.message?.includes("No report")) {
        setGoalsError("Upload a blood report to see your health goals");
      } else if (!silent) {
        setGoalsError("Failed to load goals");
      }
    } finally {
      if (!silent) setGoalsLoading(false);
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
        setProtocolError("Your protocol will appear here after your results are reviewed.");
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

  // While goals are still generating, poll silently so the page flips to the
  // finished goals the moment they're ready (generation runs in the background
  // on the server and can take ~1 min). Stops automatically once not generating.
  useEffect(() => {
    if (activeTab !== "goals") return;
    if (goalsStatus !== "generating" && goalsStatus !== "pending") return;
    const id = setInterval(() => fetchGoals({ silent: true }), 6000);
    return () => clearInterval(id);
  }, [activeTab, goalsStatus, fetchGoals]);

  const handleGoalClick = (goal) => {
    setSelectedGoal(goal);
  };

  // If a goal is selected, show the detail view
  if (selectedGoal) {
    return <GoalDetail goal={selectedGoal} onBack={() => setSelectedGoal(null)} />;
  }

  return (
    <div className="min-h-screen bg-pageBackground pb-24 font-inter lg:pb-16">
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
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>

      <div className="mx-auto w-full max-w-[1240px] px-4 pt-6 lg:px-8 lg:pt-10">
        {/* Page title */}
        <h1 className="mb-6 font-inter text-3xl font-semibold text-black lg:mb-8 lg:text-4xl">
          Protocol
        </h1>

        {/* Tabs */}
        <div className="mb-8 flex items-center gap-6 border-b border-borderColor lg:gap-8">
          <button
            onClick={() => setActiveTab("protocol")}
            className={`-mb-px border-b-2 pb-3 font-inter text-base font-medium transition-colors duration-300 lg:text-lg ${
              activeTab === "protocol"
                ? "border-black text-black"
                : "border-transparent text-secondary hover:text-black"
            }`}
          >
            Protocol
          </button>
          <button
            onClick={() => setActiveTab("goals")}
            className={`-mb-px border-b-2 pb-3 font-inter text-base font-medium transition-colors duration-300 lg:text-lg ${
              activeTab === "goals"
                ? "border-black text-black"
                : "border-transparent text-secondary hover:text-black"
            }`}
          >
            Goals
          </button>
        </div>

        {/* Protocol Tab */}
        {activeTab === "protocol" && (
          <div className="animate-fade-in mx-auto max-w-2xl">
            <h2 className="mb-4 font-inter text-xl font-semibold text-black lg:text-2xl">
              Your protocol items
            </h2>

            {protocolLoading ? (
              <div className="rounded-3xl border border-borderColor bg-white p-12 text-center text-sm text-secondary">
                Loading protocol...
              </div>
            ) : protocolItems.length === 0 ? (
              <div className="rounded-3xl border border-borderColor bg-white p-10 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-pageBackground">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#71717B"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h3 className="mb-1 text-base font-semibold text-black">
                  No protocol items yet
                </h3>
                <p className="mx-auto max-w-sm text-sm text-secondary">
                  {protocolError ||
                    "Your protocol will appear here after your results are reviewed."}
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-borderColor bg-white">
                <div className="divide-y divide-borderColor">
                  {protocolItems.map((item, index) => (
                    <div
                      key={item.productName + index}
                      style={{ animation: `fadeIn 0.4s ease-out ${index * 0.05}s both` }}
                    >
                      <ProtocolRow item={item} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === "goals" && (
          <div className="animate-fade-in">
            <h2 className="mb-4 font-inter text-xl font-semibold text-black lg:text-2xl">
              Goals
            </h2>

            {goalsLoading ? (
              <div className="py-12 text-center text-sm text-secondary">Loading goals...</div>
            ) : goalsError ? (
              <div className="py-12 text-center text-sm text-secondary">{goalsError}</div>
            ) : goalsStatus === "awaiting_review" ? (
              <div className="rounded-3xl border border-borderColor bg-white p-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <h3 className="mb-1 text-base font-semibold text-black">Your doctor is reviewing your health plan</h3>
                <p className="text-sm text-secondary">You&apos;ll be notified when your personalized goals are ready.</p>
              </div>
            ) : goalsStatus === "generating" ? (
              <div className="rounded-3xl border border-borderColor bg-white p-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                </div>
                <h3 className="mb-1 text-base font-semibold text-black">Generating your health goals</h3>
                <p className="text-sm text-secondary">This may take a minute. We&apos;ll notify you when ready.</p>
              </div>
            ) : goals.length === 0 ? (
              <div className="rounded-3xl border border-borderColor bg-white p-8 text-center">
                <h3 className="mb-1 text-base font-semibold text-black">No health goals yet</h3>
                <p className="text-sm text-secondary">
                  Your health goals will unlock once your test results are processed.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
                {goals.map((goal, index) => (
                  <div key={goal.goalId} style={{ animation: `fadeIn 0.4s ease-out ${index * 0.1}s both` }}>
                    <GoalCard goal={goal} onClick={() => handleGoalClick(goal)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
