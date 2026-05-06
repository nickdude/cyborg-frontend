"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Mock AI responses (backend endpoint doesn't exist yet)              */
/* ------------------------------------------------------------------ */

const MOCK_FOOD_RECS = [
  {
    name: "Lentil Soup",
    description: "High-protein recovery meal with iron and complex carbs",
    calories: 230,
    proteinG: 18,
    carbsG: 35,
    fatG: 3,
  },
  {
    name: "Greek Yogurt Bowl",
    description: "Probiotics + protein for muscle repair and gut health",
    calories: 180,
    proteinG: 22,
    carbsG: 12,
    fatG: 5,
  },
  {
    name: "Chicken & Rice",
    description: "Classic post-workout combo for glycogen replenishment",
    calories: 380,
    proteinG: 32,
    carbsG: 42,
    fatG: 8,
  },
  {
    name: "Banana Smoothie",
    description: "Quick potassium and natural sugars for immediate recovery",
    calories: 210,
    proteinG: 8,
    carbsG: 38,
    fatG: 4,
  },
];

const MOCK_INSIGHTS = [
  "Your average heart rate suggests moderate cardiovascular intensity.",
  "Duration was within the recommended range for this activity type.",
  "Consistent effort throughout the session - good pacing strategy.",
  "Calorie burn estimate aligns with your body composition goals.",
  "Heart rate recovery time is an important metric to track over sessions.",
  "Consider tracking RPE (Rate of Perceived Exertion) alongside HR data.",
];

const MOCK_RECOMMENDATIONS = [
  "Hydrate within 30 minutes post-workout with 500-750ml of water.",
  "Consume a protein-rich meal within 2 hours for optimal recovery.",
  "Include 5-10 minutes of static stretching to reduce muscle soreness.",
  "Aim for 7-9 hours of sleep tonight to support muscle repair.",
  "Consider active recovery (light walking) tomorrow instead of rest.",
  "Monitor any joint discomfort over the next 24 hours.",
];

const DIET_FILTERS = ["Veg", "Non-Veg", "Vegan"];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

/**
 * AIPostWorkoutSheet
 *
 * Bottom sheet overlay with 3 tabs:
 *   1. Food Recommendations (with diet filter chips)
 *   2. Insights (bulleted list)
 *   3. Recommendations (bulleted list)
 *
 * @param {object}   activity - Activity object
 * @param {string}   userId
 * @param {function} onClose
 */
export default function AIPostWorkoutSheet({ activity, userId, onClose }) {
  const [tab, setTab] = useState(0);
  const [dietFilter, setDietFilter] = useState("Non-Veg");
  const [loading, setLoading] = useState(true);

  const tabs = ["Food Recs", "Insights", "Recommendations"];

  // Simulate loading (backend doesn't exist yet)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="AI workout analysis">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center">
        <div className="w-full max-w-md rounded-t-3xl bg-white px-5 pt-5 pb-8 shadow-2xl animate-slide-up max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SparkleIcon />
              <h2 className="text-base font-semibold text-[#14151a]">AI Analysis</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sheet"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex rounded-xl bg-[#e8e9f0] p-1 mb-4">
            {tabs.map((t, idx) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(idx)}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                  tab === idx
                    ? "bg-white text-[#14151a] shadow-sm"
                    : "text-[#6d6f7b]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent" />
                <p className="text-sm text-[#6d6f7b]">Analyzing your workout...</p>
              </div>
            ) : (
              <>
                {tab === 0 && (
                  <FoodRecsTab
                    recs={MOCK_FOOD_RECS}
                    dietFilter={dietFilter}
                    onFilterChange={setDietFilter}
                  />
                )}
                {tab === 1 && <InsightsTab insights={MOCK_INSIGHTS} />}
                {tab === 2 && <RecommendationsTab recs={MOCK_RECOMMENDATIONS} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-tabs                                                            */
/* ------------------------------------------------------------------ */

function FoodRecsTab({ recs, dietFilter, onFilterChange }) {
  return (
    <div>
      {/* Diet filter chips */}
      <div className="mb-4 flex gap-2">
        {DIET_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onFilterChange(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              dietFilter === f
                ? "bg-black text-white"
                : "bg-[#f6f7fb] text-[#6d6f7b]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Food cards */}
      <div className="space-y-3">
        {recs.map((rec, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-borderColor bg-[#f6f7fb] p-3"
          >
            <p className="text-sm font-semibold text-[#14151a]">{rec.name}</p>
            <p className="mt-1 text-xs text-[#6d6f7b]">{rec.description}</p>
            <p className="mt-2 text-[10px] font-medium text-[#6d6f7b]">
              {rec.calories} Cal · {rec.proteinG}g P · {rec.carbsG}g C · {rec.fatG}g F
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightsTab({ insights }) {
  return (
    <div className="space-y-3">
      {insights.map((text, idx) => (
        <div key={idx} className="flex gap-2">
          <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">
            {idx + 1}
          </span>
          <p className="text-sm text-[#14151a] leading-relaxed">{text}</p>
        </div>
      ))}
    </div>
  );
}

function RecommendationsTab({ recs }) {
  return (
    <div className="space-y-3">
      {recs.map((text, idx) => (
        <div key={idx} className="flex gap-2">
          <span className="mt-0.5 flex h-2 w-2 flex-shrink-0 rounded-full bg-green-400" />
          <p className="text-sm text-[#14151a] leading-relaxed">{text}</p>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sparkle icon (AI indicator — lucide "Sparkles" alternative)         */
/* ------------------------------------------------------------------ */

function SparkleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-indigo-500"
      aria-hidden="true"
    >
      <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
