"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
} from "recharts";
import { mealAPI, foodScoreAPI } from "@/services/api";
import { computeTotals } from "@/utils/mealDraft";
import { MACRO_META } from "@/components/food/macros";
import MealItemRow from "@/components/MealItemRow";

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

function buildGlucoseCurve(predictedPeakDelta = 26) {
  const baseline = 90;
  const points = [];
  for (let m = 0; m <= 180; m += 10) {
    const t = m / 180;
    const y = baseline + predictedPeakDelta * Math.sin(Math.PI * t) * Math.exp(-0.5 * t);
    points.push({ minute: m, glucose: Math.round(y) });
  }
  return { points, baseline, peak: baseline + predictedPeakDelta };
}

export default function FoodScoreScreen({ meal: initialMeal, score: initialScore, userId, onBack }) {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [meal, setMeal] = useState(initialMeal);
  const [score, setScore] = useState(initialScore);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");

  const mealId = meal?._id || meal?.id;
  const scoreVal = score?.score ?? score?.foodScore ?? null;
  const predicted = score?.predictedGlucosePeak;
  const predictedDelta = predicted?.deltaMgDl ?? 26;

  const totals = meal?.totals || {};
  const items = meal?.items || [];
  const consumedAt = meal?.consumedAt;
  const mealTitle = items.map((i) => i.name).filter(Boolean).join(", ") || meal?.title || "Meal";

  const glucoseCurve = useMemo(() => buildGlucoseCurve(predictedDelta), [predictedDelta]);

  /* Persist an items change, then re-score in the background. */
  const applyItems = async (nextItems) => {
    const prev = meal;
    const nextTotals = computeTotals(nextItems);
    setMeal({ ...meal, items: nextItems, totals: nextTotals }); // optimistic
    setError("");
    try {
      await mealAPI.update(userId, mealId, { items: nextItems, totals: nextTotals });
      foodScoreAPI
        .compute(userId, mealId)
        .then(() => foodScoreAPI.get(userId, mealId))
        .then((r) => setScore(r?.data || r))
        .catch(() => {}); // stale score is acceptable; totals are saved
    } catch (err) {
      setMeal(prev);
      setError(err?.message || "Couldn't update the meal. Try again.");
    }
  };

  const handleRemoveMeal = async () => {
    if (removing) return;
    if (!window.confirm("Remove this meal from your log?")) return;
    setRemoving(true);
    setError("");
    try {
      await mealAPI.delete(userId, mealId);
      router.replace("/dashboard");
    } catch (err) {
      setError(err?.message || "Couldn't remove the meal. Try again.");
      setRemoving(false);
    }
  };

  const updateItem = (idx, next) =>
    applyItems(items.map((it, i) => (i === idx ? next : it)));
  const removeItem = (idx) => {
    // A meal can't be empty — removing the last item removes the meal.
    if (items.length <= 1) return handleRemoveMeal();
    return applyItems(items.filter((_, i) => i !== idx));
  };

  const handleEditMeal = () => router.push(`/meals/${mealId}`);

  const shared = { items, totals, consumedAt, mealTitle, updateItem, removeItem };

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-pageBackground pb-20 font-sans">
      {/* Back arrow */}
      <div className="px-5 pt-4 pb-2">
        <button type="button" onClick={onBack} aria-label="Go back">
          <ChevronLeft size={20} strokeWidth={2.5} className="text-black" />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-6 px-5">
        {["Food Score", "Predicted Glucose Peak"].map((label, idx) => (
          <button
            key={label}
            type="button"
            onClick={() => setTab(idx)}
            className={`text-[14px] leading-5 ${tab === idx ? "font-semibold text-black" : "font-medium text-secondary"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <ScoreHero scoreVal={scoreVal} predictedDelta={predictedDelta} variant={tab} onSwitch={setTab} />

      {tab === 0 ? (
        <FoodScoreTab
          {...shared}
          removing={removing}
          onEditMeal={handleEditMeal}
          onRemoveMeal={handleRemoveMeal}
        />
      ) : (
        <PredictedGlucoseTab {...shared} glucoseCurve={glucoseCurve} />
      )}

      {error && <p className="mt-3 px-5 text-sm text-biomarkerOutOfRange">{error}</p>}
    </div>
  );
}

/* Score hero + pagination dots (tap a dot to switch page). */
function ScoreHero({ scoreVal, predictedDelta, variant, onSwitch }) {
  return (
    <div className="px-5">
      <div className="relative mt-4 overflow-hidden rounded-lg" style={{ height: 160 }}>
        <Image
          src="/images/food-score/score-hero-bg.png"
          alt=""
          fill
          className="object-cover"
          style={variant === 1 ? { filter: "hue-rotate(200deg) saturate(1.3)" } : undefined}
          priority
        />
        <div className={`absolute inset-0 ${variant === 1 ? "bg-indigo-900/40" : "bg-black/20"}`} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[55px] font-bold text-white" style={{ fontFamily: "var(--font-arimo), Inter, sans-serif" }}>
            {scoreVal ?? "--"}
          </p>
          <p className="text-[15px] font-medium text-white">
            +{Math.round(predictedDelta)} mg/dL
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        {[0, 1].map((idx) => (
          <button
            key={idx}
            type="button"
            aria-label={idx === 0 ? "Food score" : "Predicted glucose"}
            onClick={() => onSwitch(idx)}
            className={`h-1 rounded-full transition-all ${variant === idx ? "w-4 bg-black" : "w-2 bg-borderColor"}`}
          />
        ))}
      </div>
    </div>
  );
}

function MealInfo({ mealTitle, consumedAt }) {
  return (
    <>
      <p className="mt-3 text-center text-[16px] font-medium leading-6 text-black">{mealTitle}</p>
      {consumedAt && (
        <p className="mt-1 text-center text-[12px] font-medium leading-4 text-secondary">
          {formatMealDateTime(consumedAt)}
        </p>
      )}
    </>
  );
}

function ItemList({ items, updateItem, removeItem }) {
  return (
    <div className="mt-2 space-y-2">
      {items.map((item, idx) => (
        <MealItemRow
          key={`${item.name}-${idx}`}
          item={item}
          onUpdate={(next) => updateItem(idx, next)}
          onRemove={() => removeItem(idx)}
        />
      ))}
    </div>
  );
}

function FoodScoreTab({ items, totals, consumedAt, mealTitle, updateItem, removeItem, removing, onEditMeal, onRemoveMeal }) {
  return (
    <div className="px-5">
      <MealInfo mealTitle={mealTitle} consumedAt={consumedAt} />

      <p className="mt-5 text-[12px] font-semibold uppercase text-black">Your Meal</p>
      <ItemList items={items} updateItem={updateItem} removeItem={removeItem} />

      <p className="mt-5 text-[12px] font-semibold uppercase text-black">Macro Split</p>
      <MacroGrid totals={totals} />

      {/* Actions */}
      <button
        type="button"
        onClick={onEditMeal}
        className="mt-8 block text-[16px] font-semibold leading-6 text-black transition hover:opacity-70"
      >
        Edit Meal
      </button>
      <button
        type="button"
        onClick={onRemoveMeal}
        disabled={removing}
        className="mt-3 block text-[16px] font-semibold leading-6 text-biomarkerOutOfRange transition hover:opacity-70 disabled:opacity-50"
      >
        {removing ? "Removing…" : "Remove the Meal"}
      </button>
    </div>
  );
}

function PredictedGlucoseTab({ items, totals, consumedAt, mealTitle, updateItem, removeItem, glucoseCurve }) {
  return (
    <div className="px-5">
      {/* Glucose chart */}
      <div className="mt-4 rounded-lg border border-borderColor bg-white p-4 shadow-sm">
        <p className="mb-3 text-[12px] font-semibold uppercase text-black">Predicted Response</p>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={glucoseCurve.points} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="glucFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#541D7A" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#541D7A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="minute" tick={{ fontSize: 10, fill: "#717178" }} tickFormatter={(v) => `${v}m`} axisLine={{ stroke: "#E6E6E8" }} tickLine={false} />
              <YAxis domain={["dataMin - 5", "dataMax + 5"]} tick={{ fontSize: 10, fill: "#717178" }} axisLine={false} tickLine={false} />
              <ReferenceLine y={glucoseCurve.baseline} stroke="#E6E6E8" strokeDasharray="4 4" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E6E6E8" }} formatter={(val) => [`${val} mg/dL`, "Glucose"]} labelFormatter={(v) => `${v} min`} />
              <Area type="monotone" dataKey="glucose" stroke="#541D7A" strokeWidth={2} fill="url(#glucFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <MealInfo mealTitle={mealTitle} consumedAt={consumedAt} />

      <p className="mt-5 text-[12px] font-semibold uppercase text-black">Your Meal</p>
      <ItemList items={items} updateItem={updateItem} removeItem={removeItem} />

      <p className="mt-5 text-[12px] font-semibold uppercase text-black">Macro Split</p>
      <MacroGrid totals={totals} />
    </div>
  );
}

function MacroGrid({ totals }) {
  return (
    <div className="mt-2 grid grid-cols-3 gap-1.5">
      {MACRO_META.map(({ key, label, unit, Icon, color }) => {
        const raw = totals[key];
        const val = raw != null ? Math.round(raw) : "--";
        return (
          <div key={key} className="rounded-lg border border-borderColor bg-white px-2.5 py-2 shadow-sm">
            <div className="flex items-center gap-1.5">
              <Icon size={12} color={color} className="shrink-0" />
              <span className="text-[9px] font-medium uppercase text-secondary">{label}</span>
            </div>
            <p className="mt-0.5 text-[14px] font-semibold leading-5 text-black">
              {val}
              {unit}
            </p>
          </div>
        );
      })}
    </div>
  );
}
