"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/* ------------------------------------------------------------------ */
/* Hard-coded recovery content                                          */
/*                                                                      */
/* There is no AI recovery endpoint yet — every user sees the same      */
/* placeholder recommendations below (per product direction). Only the  */
/* greeting is personalized (name, duration, time of day).              */
/* ------------------------------------------------------------------ */

const FOOD_RECS = {
  Veg: [
    {
      name: "Lentil Soup with Whole Grain Bread",
      description:
        "A hearty lentil soup rich in protein and fiber, served with a slice of whole grain bread.",
      calories: 350, proteinG: 20, carbsG: 50, fatG: 8, fiberG: 15,
    },
    {
      name: "Paneer & Veggie Wrap",
      description:
        "Grilled paneer with crunchy vegetables in a whole wheat roti — protein and slow carbs for muscle repair.",
      calories: 380, proteinG: 22, carbsG: 42, fatG: 12, fiberG: 7,
    },
    {
      name: "Curd with Fruit & Honey",
      description:
        "Fresh dahi topped with seasonal fruit and a drizzle of honey — probiotics plus quick glycogen top-up.",
      calories: 240, proteinG: 12, carbsG: 38, fatG: 5, fiberG: 3,
    },
    {
      name: "Oats with Banana & Almonds",
      description:
        "A warm bowl of oats with sliced banana and a handful of almonds for sustained energy and recovery.",
      calories: 360, proteinG: 14, carbsG: 55, fatG: 10, fiberG: 8,
    },
  ],
  "Non-Veg": [
    {
      name: "Grilled Chicken with Rice",
      description:
        "Lean chicken breast over steamed rice — the classic post-workout combo for glycogen replenishment.",
      calories: 420, proteinG: 35, carbsG: 48, fatG: 10, fiberG: 3,
    },
    {
      name: "Egg Bhurji with Roti",
      description:
        "Spiced scrambled eggs with two whole wheat rotis — complete protein with steady carbohydrates.",
      calories: 390, proteinG: 24, carbsG: 36, fatG: 16, fiberG: 5,
    },
    {
      name: "Fish Curry with Rice",
      description:
        "Light fish curry with rice — omega-3s to ease post-workout inflammation and support recovery.",
      calories: 430, proteinG: 30, carbsG: 46, fatG: 13, fiberG: 4,
    },
  ],
  Vegan: [
    {
      name: "Tofu & Quinoa Bowl",
      description:
        "Stir-fried tofu over quinoa with greens — a complete plant protein with all nine essential amino acids.",
      calories: 400, proteinG: 24, carbsG: 44, fatG: 14, fiberG: 9,
    },
    {
      name: "Chana Chaat",
      description:
        "Boiled chickpeas with onion, tomato and lemon — fiber-rich plant protein that rebuilds energy stores.",
      calories: 300, proteinG: 15, carbsG: 45, fatG: 6, fiberG: 12,
    },
    {
      name: "Peanut Butter Banana Smoothie",
      description:
        "Banana blended with peanut butter and soy milk — quick potassium, protein and natural sugars.",
      calories: 340, proteinG: 16, carbsG: 40, fatG: 14, fiberG: 5,
    },
  ],
};

const INSIGHTS = [
  "Your average heart rate of 87 BPM indicates a moderate intensity workout, which is excellent for overall health.",
  "Engaging in activity early in the day can boost metabolism and energy levels for the rest of your day.",
  "Even a short, consistent workout like yours contributes significantly to cardiovascular health.",
  "Proper post-workout nutrition is key to replenishing energy stores and aiding muscle repair.",
  "Hydration is crucial, especially after workouts, to rebalance your body's fluids.",
  "Listen to your body for signs of fatigue or soreness to guide your next workout.",
  "Incorporating light stretching can improve flexibility and reduce muscle stiffness.",
  "Consistency in your workout routine, even for shorter durations, yields better long-term results.",
];

const RECOMMENDATIONS = [
  "Hydrate within 30 minutes with 500–750 ml of water; add electrolytes if you sweated heavily.",
  "Eat a protein-rich meal within 2 hours for optimal muscle protein synthesis.",
  "Do 5–10 minutes of light static stretching to reduce soreness and improve flexibility.",
  "Aim for 7–9 hours of sleep tonight to support muscle repair and hormonal recovery.",
  "Plan active recovery (a light walk or yoga) tomorrow instead of complete rest.",
  "Watch for any joint discomfort over the next 24 hours — early attention prevents chronic issues.",
];

const DIET_FILTERS = ["Veg", "Non-Veg", "Vegan"];
const TABS = ["Food Recommendations", "Insights", "Recommendations"];

function timeOfDayPhrase(iso) {
  const h = new Date(iso).getHours();
  if (isNaN(h)) return "today";
  if (h < 12) return "this morning";
  if (h < 17) return "this afternoon";
  return "this evening";
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function AIPostWorkoutSheet({ activity, userId, onClose }) {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [dietFilter, setDietFilter] = useState("Veg");
  const [loading, setLoading] = useState(true);

  const firstName =
    user?.firstName || user?.fullName?.split(" ")?.[0] || user?.name?.split(" ")?.[0] || "there";
  const durationMin = activity?.durationMinutes || 30;

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Post-workout recovery">
      {/* Backdrop */}
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/50" />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center">
        <div className="flex max-h-[92vh] w-full max-w-md flex-col rounded-t-3xl bg-pageBackground px-6 pb-8 pt-5 shadow-2xl">
          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sheet"
            className="mb-4 flex h-8 w-8 items-center justify-center rounded-full text-ink transition hover:bg-white"
          >
            <X size={20} />
          </button>

          <h2 className="text-2xl font-bold text-ink">Post-Workout Recovery</h2>
          <p className="mt-3 text-sm leading-relaxed text-secondary">
            Hi {firstName}! Your {durationMin}-minute activity {timeOfDayPhrase(activity?.startTime)}{" "}
            was a great start to your day. Let&apos;s focus on optimizing your recovery to help you
            feel your best.
          </p>

          {/* Tab pills */}
          <div className="mb-4 mt-5 flex flex-wrap gap-2">
            {TABS.map((t, idx) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(idx)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                  tab === idx ? "bg-black text-white" : "bg-white text-ink shadow-sm"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="min-h-[200px] flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent" />
                <p className="text-sm text-secondary">Analyzing your workout...</p>
              </div>
            ) : (
              <>
                {tab === 0 && (
                  <FoodRecsTab dietFilter={dietFilter} onFilterChange={setDietFilter} />
                )}
                {tab === 1 && <BulletTab title="Insights" items={INSIGHTS} />}
                {tab === 2 && <BulletTab title="Recommendations" items={RECOMMENDATIONS} />}
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

function FoodRecsTab({ dietFilter, onFilterChange }) {
  const recs = FOOD_RECS[dietFilter] || [];
  return (
    <div>
      <h3 className="mb-3 text-lg font-bold text-ink">Food Recommendations</h3>

      {/* Diet filter chips */}
      <div className="mb-5 flex gap-2">
        {DIET_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onFilterChange(f)}
            className={`rounded-full px-5 py-1.5 text-sm font-medium transition ${
              dietFilter === f ? "bg-black text-white" : "bg-white text-ink shadow-sm"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Food cards */}
      <div className="space-y-4">
        {recs.map((rec) => (
          <div key={rec.name} className="rounded-2xl border border-borderColor bg-white p-5 shadow-sm">
            <p className="text-base font-bold leading-tight text-ink">{rec.name}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-secondary">{rec.description}</p>
            <p className="mt-4 text-[13px] font-medium text-ink">
              <span className="font-bold">{rec.calories} kcal</span>
              <span className="mx-1 text-secondary">·</span>
              {rec.proteinG}g Protein
              <span className="mx-1 text-secondary">·</span>
              {rec.carbsG}g Carbs
              <span className="mx-1 text-secondary">·</span>
              {rec.fatG}g Fat
              <span className="mx-1 text-secondary">·</span>
              {rec.fiberG}g Fiber
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BulletTab({ title, items }) {
  return (
    <div>
      <h3 className="mb-4 text-lg font-bold text-ink">{title}</h3>
      <ul className="space-y-4">
        {items.map((text) => (
          <li key={text} className="flex items-start gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
            <p className="text-sm leading-relaxed text-ink">{text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
