"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { activityAPI } from "@/services/api";

/* ------------------------------------------------------------------ */
/* Fallback recovery content                                           */
/*                                                                     */
/* The sheet is driven by GET /activities/:id/recovery (AI-generated,  */
/* cached server-side). When that call fails, the hardcoded content    */
/* below keeps the sheet functional instead of showing an error.       */
/* ------------------------------------------------------------------ */

const FALLBACK_FOODS = [
  {
    name: "Lentil Soup with Whole Grain Bread",
    description:
      "A hearty lentil soup rich in protein and fiber, served with a slice of whole grain bread.",
    macros: { calories: 350, proteinG: 20, carbsG: 50, fatG: 8, fiberG: 15 },
    dietTags: ["vegetarian"],
  },
  {
    name: "Paneer & Veggie Wrap",
    description:
      "Grilled paneer with crunchy vegetables in a whole wheat roti — protein and slow carbs for muscle repair.",
    macros: { calories: 380, proteinG: 22, carbsG: 42, fatG: 12, fiberG: 7 },
    dietTags: ["vegetarian"],
  },
  {
    name: "Curd with Fruit & Honey",
    description:
      "Fresh dahi topped with seasonal fruit and a drizzle of honey — probiotics plus quick glycogen top-up.",
    macros: { calories: 240, proteinG: 12, carbsG: 38, fatG: 5, fiberG: 3 },
    dietTags: ["vegetarian"],
  },
  {
    name: "Oats with Banana & Almonds",
    description:
      "A warm bowl of oats with sliced banana and a handful of almonds for sustained energy and recovery.",
    macros: { calories: 360, proteinG: 14, carbsG: 55, fatG: 10, fiberG: 8 },
    dietTags: ["vegan"],
  },
  {
    name: "Grilled Chicken with Rice",
    description:
      "Lean chicken breast over steamed rice — the classic post-workout combo for glycogen replenishment.",
    macros: { calories: 420, proteinG: 35, carbsG: 48, fatG: 10, fiberG: 3 },
    dietTags: ["non-veg"],
  },
  {
    name: "Egg Bhurji with Roti",
    description:
      "Spiced scrambled eggs with two whole wheat rotis — complete protein with steady carbohydrates.",
    macros: { calories: 390, proteinG: 24, carbsG: 36, fatG: 16, fiberG: 5 },
    dietTags: ["non-veg"],
  },
  {
    name: "Fish Curry with Rice",
    description:
      "Light fish curry with rice — omega-3s to ease post-workout inflammation and support recovery.",
    macros: { calories: 430, proteinG: 30, carbsG: 46, fatG: 13, fiberG: 4 },
    dietTags: ["non-veg"],
  },
  {
    name: "Tofu & Quinoa Bowl",
    description:
      "Stir-fried tofu over quinoa with greens — a complete plant protein with all nine essential amino acids.",
    macros: { calories: 400, proteinG: 24, carbsG: 44, fatG: 14, fiberG: 9 },
    dietTags: ["vegan"],
  },
  {
    name: "Chana Chaat",
    description:
      "Boiled chickpeas with onion, tomato and lemon — fiber-rich plant protein that rebuilds energy stores.",
    macros: { calories: 300, proteinG: 15, carbsG: 45, fatG: 6, fiberG: 12 },
    dietTags: ["vegan"],
  },
  {
    name: "Peanut Butter Banana Smoothie",
    description:
      "Banana blended with peanut butter and soy milk — quick potassium, protein and natural sugars.",
    macros: { calories: 340, proteinG: 16, carbsG: 40, fatG: 14, fiberG: 5 },
    dietTags: ["vegan"],
  },
];

const FALLBACK_INSIGHTS = [
  "Your average heart rate of 87 BPM indicates a moderate intensity workout, which is excellent for overall health.",
  "Engaging in activity early in the day can boost metabolism and energy levels for the rest of your day.",
  "Even a short, consistent workout like yours contributes significantly to cardiovascular health.",
  "Proper post-workout nutrition is key to replenishing energy stores and aiding muscle repair.",
  "Hydration is crucial, especially after workouts, to rebalance your body's fluids.",
  "Listen to your body for signs of fatigue or soreness to guide your next workout.",
  "Incorporating light stretching can improve flexibility and reduce muscle stiffness.",
  "Consistency in your workout routine, even for shorter durations, yields better long-term results.",
];

const FALLBACK_RECOMMENDATIONS = [
  "Hydrate within 30 minutes with 500–750 ml of water; add electrolytes if you sweated heavily.",
  "Eat a protein-rich meal within 2 hours for optimal muscle protein synthesis.",
  "Do 5–10 minutes of light static stretching to reduce soreness and improve flexibility.",
  "Aim for 7–9 hours of sleep tonight to support muscle repair and hormonal recovery.",
  "Plan active recovery (a light walk or yoga) tomorrow instead of complete rest.",
  "Watch for any joint discomfort over the next 24 hours — early attention prevents chronic issues.",
];

const FALLBACK_ANALYSIS = {
  foodRecommendations: FALLBACK_FOODS,
  insights: FALLBACK_INSIGHTS,
  recommendations: FALLBACK_RECOMMENDATIONS,
};

const DIET_FILTERS = ["Veg", "Non-Veg", "Vegan"];
const TABS = ["Food Recommendations", "Insights", "Recommendations"];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function timeOfDayPhrase(iso) {
  const h = new Date(iso).getHours();
  if (isNaN(h)) return "today";
  if (h < 12) return "this morning";
  if (h < 17) return "this afternoon";
  return "this evening";
}

/** Coerce an API payload into the sheet's shape; null when unusable. */
function normalizeAnalysis(d) {
  if (!d || typeof d !== "object") return null;
  const foods = Array.isArray(d.foodRecommendations)
    ? d.foodRecommendations.filter((r) => r && r.name)
    : [];
  const insights = Array.isArray(d.insights) ? d.insights.filter(Boolean) : [];
  const recommendations = Array.isArray(d.recommendations)
    ? d.recommendations.filter(Boolean)
    : [];
  if (!foods.length) return null;
  return {
    foodRecommendations: foods,
    insights: insights.length ? insights : FALLBACK_INSIGHTS,
    recommendations: recommendations.length
      ? recommendations
      : FALLBACK_RECOMMENDATIONS,
  };
}

/* Diet classification from the AI's freeform dietTags, with a keyword
 * fallback on the food name/description when tags are inconclusive. */
const MEAT_RE =
  /(chicken|fish|egg|mutton|lamb|beef|pork|prawn|shrimp|seafood|meat|turkey|salmon|tuna|keema|bacon|ham|sausage|sardine|anchov|crab|squid|oyster)/i;
const DAIRY_RE =
  /(paneer|curd|dahi|yogurt|yoghurt|milk|cheese|butter|ghee|whey|honey|lassi)/i;

function classifyDiet(rec) {
  const tags = (rec.dietTags || []).map((t) => String(t).toLowerCase());
  const compactTags = tags.map((t) => t.replace(/[^a-z]/g, ""));
  if (compactTags.some((t) => t.includes("nonveg"))) return "Non-Veg";
  if (tags.some((t) => t.includes("vegan"))) return "Vegan";
  if (compactTags.some((t) => t === "veg" || t.includes("vegetarian"))) return "Veg";
  const text = `${rec.name || ""} ${rec.description || ""}`;
  if (MEAT_RE.test(text)) return "Non-Veg";
  if (DAIRY_RE.test(text)) return "Veg";
  return "Vegan"; // plant-based with no dairy cues
}

function matchesFilter(rec, filter) {
  const diet = classifyDiet(rec);
  if (filter === "Veg") return diet === "Veg" || diet === "Vegan";
  if (filter === "Vegan") return diet === "Vegan";
  return diet === "Non-Veg";
}

const fmtG = (v) => (v == null || isNaN(Number(v)) ? null : `${Math.round(Number(v))}g`);

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function AIPostWorkoutSheet({ activity, userId, onClose }) {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [dietFilter, setDietFilter] = useState("Veg");
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(FALLBACK_ANALYSIS);

  const firstName =
    user?.firstName || user?.fullName?.split(" ")?.[0] || user?.name?.split(" ")?.[0] || "there";
  const durationMin = activity?.durationMinutes || 30;
  const activityId = activity?._id || activity?.id;

  useEffect(() => {
    if (!userId || !activityId) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    activityAPI
      .recovery(userId, activityId)
      .then((resp) => {
        if (cancelled) return;
        const normalized = normalizeAnalysis(resp?.data);
        if (normalized) setAnalysis(normalized);
      })
      .catch(() => {
        /* fall back to the hardcoded content — never show a broken sheet */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, activityId]);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Post-workout recovery">
      {/* Backdrop */}
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/50" />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center">
        <div className="flex max-h-[92vh] w-full max-w-md flex-col rounded-t-3xl bg-pageBackground px-5 pb-8 pt-6 shadow-2xl">
          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sheet"
            className="-ml-1 flex h-8 w-8 items-center justify-center rounded-full text-black transition hover:bg-white"
          >
            <X size={22} strokeWidth={2.5} />
          </button>

          <h2 className="mt-4 text-xl font-medium text-black">Post-Workout Recovery</h2>
          <p className="mt-3 text-sm font-medium leading-[18px] text-secondary">
            Hi {firstName}! Your {durationMin}-minute activity {timeOfDayPhrase(activity?.startTime)}{" "}
            was a great start to your day. Let&apos;s focus on optimizing your recovery to help you
            feel your best.
          </p>

          {/* Tab pills */}
          <div className="mt-5 flex flex-wrap gap-3">
            {TABS.map((t, idx) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(idx)}
                className={`flex h-8 items-center whitespace-nowrap rounded-full px-3 text-sm font-medium shadow-sm transition ${
                  tab === idx
                    ? "bg-black text-white"
                    : "border border-borderColor bg-white text-black"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="mt-4 min-h-[200px] flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent" />
                <p className="text-sm text-secondary">Analyzing your workout...</p>
              </div>
            ) : (
              <>
                {tab === 0 && (
                  <FoodRecsTab
                    foods={analysis.foodRecommendations}
                    dietFilter={dietFilter}
                    onFilterChange={setDietFilter}
                  />
                )}
                {tab === 1 && <BulletTab title="Insights" items={analysis.insights} />}
                {tab === 2 && (
                  <BulletTab title="Recommendations" items={analysis.recommendations} />
                )}
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

function FoodRecsTab({ foods, dietFilter, onFilterChange }) {
  const recs = foods.filter((rec) => matchesFilter(rec, dietFilter));
  return (
    <div>
      <h3 className="text-base font-medium text-black">Food Recommendations</h3>

      {/* Diet filter chips */}
      <div className="mt-3 flex gap-2">
        {DIET_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onFilterChange(f)}
            className={`flex h-7 items-center rounded-full px-3 text-sm font-medium shadow-sm transition ${
              dietFilter === f
                ? "bg-black text-white"
                : "border border-borderColor bg-white text-black"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Food cards */}
      <div className="mt-3 space-y-2 pb-2">
        {recs.length === 0 ? (
          <p className="py-6 text-center text-sm text-secondary">
            No {dietFilter} picks in this analysis — try another filter.
          </p>
        ) : (
          recs.map((rec) => <FoodCard key={rec.name} rec={rec} />)
        )}
      </div>
    </div>
  );
}

function FoodCard({ rec }) {
  const m = rec.macros || {};
  const parts = [
    fmtG(m.proteinG) && `${fmtG(m.proteinG)} Protein`,
    fmtG(m.carbsG) && `${fmtG(m.carbsG)} Carbs`,
    fmtG(m.fatG) && `${fmtG(m.fatG)} Fat`,
    fmtG(m.fiberG) && `${fmtG(m.fiberG)} Fiber`,
  ].filter(Boolean);
  const kcal = m.calories == null || isNaN(Number(m.calories)) ? null : Math.round(Number(m.calories));

  return (
    <div className="rounded-2xl border border-borderColor bg-white p-5 shadow-sm">
      <p className="text-base font-medium leading-6 text-black">{rec.name}</p>
      {rec.description ? (
        <p className="mt-1 text-sm font-medium leading-5 text-secondary">{rec.description}</p>
      ) : null}
      {(kcal != null || parts.length > 0) && (
        <p className="mt-6 text-sm leading-5 text-black">
          {kcal != null && <span className="font-semibold">{kcal} kcal </span>}
          <span className="font-normal">{parts.map((p) => `• ${p}`).join(" ")}</span>
        </p>
      )}
    </div>
  );
}

function BulletTab({ title, items }) {
  return (
    <div>
      <h3 className="text-base font-medium text-black">{title}</h3>
      <ul className="mt-3 space-y-4 pb-2">
        {items.map((text) => (
          <li key={text} className="flex items-start">
            <span className="w-[19px] shrink-0 text-base leading-6 text-secondary">•</span>
            <p className="text-sm leading-[23px] tracking-[-0.15px] text-black">{text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
