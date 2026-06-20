"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Mock AI responses (backend endpoint doesn't exist yet)              */
/* ------------------------------------------------------------------ */

const MOCK_FOOD_RECS = [
  {
    name: "Oatmeal with Banana & Almonds",
    description: "A hearty bowl of oatmeal topped with sliced banana and a handful of almonds for sustained energy and recovery.",
    calories: 360,
    proteinG: 20,
    carbsG: 50,
    fatG: 8,
    fiberG: 15,
  },
  {
    name: "Greek Yogurt Bowl",
    description: "Probiotics + protein for muscle repair and gut health, topped with berries and granola.",
    calories: 280,
    proteinG: 22,
    carbsG: 30,
    fatG: 6,
    fiberG: 4,
  },
  {
    name: "Chicken & Rice",
    description: "Classic post-workout combo for glycogen replenishment with lean protein.",
    calories: 420,
    proteinG: 35,
    carbsG: 48,
    fatG: 10,
    fiberG: 3,
  },
  {
    name: "Banana Smoothie",
    description: "Quick potassium and natural sugars for immediate recovery with whey protein.",
    calories: 310,
    proteinG: 18,
    carbsG: 42,
    fatG: 5,
    fiberG: 6,
  },
];

const MOCK_INSIGHTS = [
  "Your average heart rate of 87 BPM suggests moderate cardiovascular intensity — ideal for building aerobic base.",
  "Duration was within the recommended range for this activity type. Consistency matters more than intensity at this stage.",
  "Consistent effort throughout the session indicates good pacing strategy. Your heart rate variability stayed within a healthy range.",
  "Calorie burn estimate aligns with your body composition goals. You're on track for a 300-400 kcal deficit today.",
  "Heart rate recovery time is an important metric to track over sessions. Faster recovery = better cardiovascular fitness.",
  "Consider tracking RPE (Rate of Perceived Exertion) alongside HR data for a more complete picture of training load.",
];

const MOCK_RECOMMENDATIONS = [
  "Hydrate within 30 minutes post-workout with 500-750ml of water. Add electrolytes if you sweated heavily.",
  "Consume a protein-rich meal within 2 hours for optimal muscle protein synthesis.",
  "Include 5-10 minutes of static stretching to reduce muscle soreness and improve flexibility.",
  "Aim for 7-9 hours of sleep tonight to support muscle repair and hormonal recovery.",
  "Consider active recovery (light walking or yoga) tomorrow instead of complete rest.",
  "Monitor any joint discomfort over the next 24 hours — early attention prevents chronic issues.",
];

const DIET_FILTERS = ["Veg", "Non-Veg", "Vegan"];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function AIPostWorkoutSheet({ activity, userId, onClose }) {
  const [tab, setTab] = useState(0);
  const [dietFilter, setDietFilter] = useState("Non-Veg");
  const [loading, setLoading] = useState(true);

  const tabs = ["Food Recommendations", "Insights", "Recommendations"];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Post-workout recovery">
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
            <h2 className="text-lg font-bold text-black">Post-Workout Recovery</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sheet"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f2f2f2] text-[#3c3c43] hover:bg-[#e5e5e5] transition"
            >
              <X size={16} />
            </button>
          </div>

          {/* Intro text */}
          <p className="mb-4 text-sm leading-relaxed text-[#717178]">
            Hi Ateeb Shaikh! Your 30-minute activity this morning was a great start to your day. Let&apos;s focus on optimizing your recovery to help you perform better.
          </p>

          {/* Tab pills */}
          <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
            {tabs.map((t, idx) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(idx)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition ${
                  tab === idx
                    ? "bg-black text-white"
                    : "bg-white text-[#717178] border border-[#E6E6E8]"
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
                <p className="text-sm text-[#717178]">Analyzing your workout...</p>
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
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
              dietFilter === f
                ? "bg-black text-white"
                : "bg-white text-[#717178] border border-[#E6E6E8]"
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
            className="rounded-xl bg-white border border-[#E6E6E8] p-4"
            style={{ boxShadow: "0px 0px 10px rgba(0,0,0,0.05)" }}
          >
            <p className="text-sm font-bold text-black">{rec.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-[#717178]">{rec.description}</p>
            <p className="mt-2 text-xs font-medium text-[#717178]">
              {rec.calories} kcal{" "}
              <span className="text-[#c7c7cc]">&middot;</span> {rec.proteinG}g Protein{" "}
              <span className="text-[#c7c7cc]">&middot;</span> {rec.carbsG}g Carbs{" "}
              <span className="text-[#c7c7cc]">&middot;</span> {rec.fatG}g Fat{" "}
              <span className="text-[#c7c7cc]">&middot;</span> {rec.fiberG}g Fiber
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightsTab({ insights }) {
  return (
    <div className="space-y-4">
      {insights.map((text, idx) => (
        <div key={idx} className="flex gap-3">
          <span className="mt-1.5 flex h-2 w-2 flex-shrink-0 rounded-full bg-[#6366f1]" />
          <p className="text-sm text-black leading-relaxed">{text}</p>
        </div>
      ))}
    </div>
  );
}

function RecommendationsTab({ recs }) {
  return (
    <div className="space-y-4">
      {recs.map((text, idx) => (
        <div key={idx} className="flex gap-3">
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
            {idx + 1}
          </span>
          <p className="text-sm text-black leading-relaxed">{text}</p>
        </div>
      ))}
    </div>
  );
}
