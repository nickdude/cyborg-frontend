"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Pencil, X, Flame, Leaf, Wheat, Beef, Droplet, Candy } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatMealDateTime(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
  }) + ", " + d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).toLowerCase();
}

function scoreColor(val) {
  if (val == null) return "from-gray-400 to-gray-500";
  if (val <= 3) return "from-red-500 to-red-600";
  if (val <= 5) return "from-orange-400 to-orange-500";
  if (val <= 7) return "from-yellow-400 to-yellow-500";
  return "from-green-400 to-green-500";
}

function scoreBgText(val) {
  if (val == null) return "text-gray-100";
  return "text-white";
}

/** Generate a mock glucose-prediction curve from a predicted peak. */
function buildGlucoseCurve(predictedPeakMgDl = 26) {
  const baseline = 90;
  const peak = baseline + predictedPeakMgDl;
  const points = [];
  for (let m = 0; m <= 180; m += 10) {
    // Bell-ish curve peaking around 45 min
    const t = m / 180;
    const y = baseline + predictedPeakMgDl * Math.sin(Math.PI * t) * Math.exp(-0.5 * t);
    points.push({ minute: m, glucose: Math.round(y) });
  }
  return { points, baseline, peak };
}

const MACRO_TILES = [
  { key: "calories", label: "Calories", icon: Flame, color: "text-orange-500", bg: "bg-orange-50", unit: "" },
  { key: "fiberG", label: "Fiber", icon: Leaf, color: "text-green-500", bg: "bg-green-50", unit: "g" },
  { key: "carbsG", label: "Carbs", icon: Wheat, color: "text-blue-500", bg: "bg-blue-50", unit: "g" },
  { key: "proteinG", label: "Protein", icon: Beef, color: "text-purple-500", bg: "bg-purple-50", unit: "g" },
  { key: "fatG", label: "Fat", icon: Droplet, color: "text-yellow-500", bg: "bg-yellow-50", unit: "g" },
  { key: "sugarG", label: "Sugar", icon: Candy, color: "text-pink-500", bg: "bg-pink-50", unit: "g" },
];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

/**
 * FoodScoreScreen
 *
 * Two-tab layout:
 *   Tab 1 "Food Score" — score hero, meal items, macro split
 *   Tab 2 "Predicted Glucose Peak" — glucose prediction chart
 *
 * @param {object}   meal   - Full meal object from mealAPI.get()
 * @param {object}   score  - MealScore from foodScoreAPI.get()
 * @param {string}   userId
 * @param {function} onBack
 */
export default function FoodScoreScreen({ meal, score, userId, onBack }) {
  const [tab, setTab] = useState(0);

  const tabs = ["Food Score", "Predicted Glucose Peak"];

  const scoreVal = score?.score ?? score?.foodScore ?? null;
  const predictedPeak = score?.predictedGlucosePeak ?? score?.predictedPeakMgDl ?? 26;

  const totals = meal?.totals || {};
  const items = meal?.items || [];
  const consumedAt = meal?.consumedAt;

  const glucoseCurve = useMemo(() => buildGlucoseCurve(predictedPeak), [predictedPeak]);

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-[#f4f5f9] pb-24 font-inter">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-3 pt-[max(env(safe-area-inset-top,0px),12px)]">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#f6f7fb]"
        >
          <ArrowLeft size={20} className="text-black" />
        </button>
        <h1 className="flex-1 text-base font-semibold text-[#14151a]">Meal Score</h1>
      </div>

      {/* Tab bar */}
      <div className="mx-4 flex rounded-xl bg-[#e8e9f0] p-1">
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
      {tab === 0 ? (
        <FoodScoreTab
          scoreVal={scoreVal}
          predictedPeak={predictedPeak}
          items={items}
          totals={totals}
          consumedAt={consumedAt}
        />
      ) : (
        <PredictedGlucoseTab
          scoreVal={scoreVal}
          predictedPeak={predictedPeak}
          glucoseCurve={glucoseCurve}
          items={items}
          consumedAt={consumedAt}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tab 1: Food Score                                                    */
/* ------------------------------------------------------------------ */

function FoodScoreTab({ scoreVal, predictedPeak, items, totals, consumedAt }) {
  return (
    <div className="px-4 pt-4">
      {/* Score hero */}
      <div
        className={`relative flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br ${scoreColor(
          scoreVal
        )} px-6 py-8`}
      >
        <p className={`text-6xl font-bold ${scoreBgText(scoreVal)}`}>
          {scoreVal ?? "--"}
        </p>
        <p className="mt-1 text-sm font-medium text-white/80">/10</p>

        {/* Predicted glucose badge */}
        {predictedPeak != null && (
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 backdrop-blur">
            <span className="text-xs font-semibold text-white">
              +{Math.round(predictedPeak)} mg/dL
            </span>
            <span className="text-[10px] text-white/70">predicted peak</span>
          </div>
        )}
      </div>

      {/* YOUR MEAL header */}
      <div className="mt-6 mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6d6f7b]">
          YOUR MEAL
        </p>
        {consumedAt && (
          <p className="mt-0.5 text-xs text-[#6d6f7b]">
            {formatMealDateTime(consumedAt)}
          </p>
        )}
      </div>

      {/* Food items */}
      <div className="space-y-2">
        {items.map((item, idx) => (
          <FoodItemCard key={idx} item={item} />
        ))}
        {items.length === 0 && (
          <p className="py-4 text-center text-sm text-[#6d6f7b]">
            No food items in this meal.
          </p>
        )}
      </div>

      {/* MACRO SPLIT */}
      <div className="mt-6 mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6d6f7b]">
          MACRO SPLIT
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MACRO_TILES.map(({ key, label, icon: Icon, color, bg, unit }) => {
          const raw = totals[key];
          const val = raw != null ? Math.round(raw) : "--";
          return (
            <div key={key} className={`flex items-center gap-1.5 rounded-xl ${bg} p-3`}>
              <Icon size={14} className={color} />
              <div>
                <p className="text-[10px] text-[#6d6f7b]">{label}</p>
                <p className="text-sm font-semibold text-[#14151a]">
                  {val}{unit}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action links */}
      <div className="mt-6 flex items-center gap-4 border-t border-borderColor pt-4">
        <button
          type="button"
          className="flex-1 rounded-xl border border-borderColor py-2.5 text-center text-sm font-medium text-[#14151a]"
        >
          Edit Meal
        </button>
        <button
          type="button"
          className="flex-1 rounded-xl py-2.5 text-center text-sm font-medium text-red-500"
        >
          Remove the Meal
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tab 2: Predicted Glucose Peak                                       */
/* ------------------------------------------------------------------ */

function PredictedGlucoseTab({ scoreVal, predictedPeak, glucoseCurve, items, consumedAt }) {
  return (
    <div className="px-4 pt-4">
      {/* Score hero (slightly different styling for glucose) */}
      <div className="relative flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 px-6 py-6">
        <p className="text-xs font-medium text-white/70">Predicted Glucose Peak</p>
        <p className="mt-1 text-4xl font-bold text-white">
          +{Math.round(predictedPeak)} mg/dL
        </p>
        <p className="mt-1 text-xs text-white/60">
          above baseline (~{glucoseCurve.baseline} mg/dL)
        </p>
      </div>

      {/* Glucose chart */}
      <div className="mt-5 rounded-2xl border border-borderColor bg-white p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6d6f7b]">
          Predicted Glucose Response
        </p>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={glucoseCurve.points} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="glucoseFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="minute"
                tick={{ fontSize: 10, fill: "#6d6f7b" }}
                tickFormatter={(v) => `${v}m`}
              />
              <YAxis
                domain={["dataMin - 5", "dataMax + 5"]}
                tick={{ fontSize: 10, fill: "#6d6f7b" }}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(val) => [`${val} mg/dL`, "Glucose"]}
                labelFormatter={(v) => `${v} min`}
              />
              <Area
                type="monotone"
                dataKey="glucose"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#glucoseFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Meal items that triggered this */}
      {consumedAt && (
        <p className="mt-5 text-xs text-[#6d6f7b]">
          Based on meal at {formatMealDateTime(consumedAt)}
        </p>
      )}
      <div className="mt-2 space-y-2">
        {items.map((item, idx) => (
          <FoodItemCard key={idx} item={item} compact />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared: Food item card                                              */
/* ------------------------------------------------------------------ */

function FoodItemCard({ item, compact = false }) {
  if (!item) return null;
  const { name, portion = {}, calories = 0, proteinG = 0, fatG = 0, carbsG = 0 } = item;

  const portionBits = [];
  if (portion.quantity != null && portion.unit) portionBits.push(`${portion.quantity} ${portion.unit}`);
  else if (portion.quantity != null) portionBits.push(String(portion.quantity));
  else if (portion.unit) portionBits.push(portion.unit);
  if (portion.grams != null) portionBits.push(`(${portion.grams}g)`);
  const portionText = portionBits.join(" ");

  const macroLine = `${Math.round(calories)} Cal ${Math.round(proteinG)}P ${Math.round(fatG)}F ${Math.round(carbsG)}C`;

  return (
    <div className={`flex items-center gap-3 rounded-xl bg-white ${compact ? "px-3 py-2" : "px-3 py-3"} border border-borderColor`}>
      {/* Icon placeholder */}
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#f6f7fb] text-[#636776]">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 4L18 4M6 20L18 20M4 6L4 18M20 6L20 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 8L16 16M16 8L8 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#1e2027]">{name}</p>
        <p className="text-xs text-[#6d6f7b]">
          {portionText ? `${portionText} · ${macroLine}` : macroLine}
        </p>
      </div>
      {!compact && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Edit item"
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#6d6f7b] hover:bg-[#f6f7fb]"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            aria-label="Delete item"
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#6d6f7b] hover:bg-red-50 hover:text-red-400"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
