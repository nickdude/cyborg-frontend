"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Minus, Plus } from "lucide-react";
import { mealAPI, foodScoreAPI } from "@/services/api";
import { computeTotals } from "@/utils/mealDraft";
import { MACRO_META, portionText } from "@/components/food/macros";
import ZoneScoreOverlay from "@/components/insights/ZoneScoreOverlay";

const TABS = ["Food Score", "Predicted Glucose Peak"];

// Hardcoded hero gradients per tab — the design's red treatment for Food Score
// and teal for Predicted Glucose Peak. Same gradients as ZoneScoreOverlay's
// red/glucose bands, so each hero card matches the overlay it opens.
const HERO_GRADIENTS = [
  "linear-gradient(201.93deg, #EF5D68 1.67%, #ED5776 23.32%, #AE4976 49.02%, #843561 95.82%)",
  "linear-gradient(201.93deg, #047A8D 1.67%, #079696 23.32%, #80C49F 95.82%)",
];

// Soft white bokeh accents floated over the gradient, echoing the Figma hero
// frames. Positions are relative to the 268px-wide card.
const HERO_BOKEH = [
  { left: -18, top: -24, size: 96, alpha: 0.22, blur: 8 },
  { left: 44, top: 6, size: 70, alpha: 0.16, blur: 8 },
  { left: 210, top: 72, size: 120, alpha: 0.18, blur: 10 },
];

// Figma macro icons keyed by MACRO_META keys (colored circular glyphs).
const MACRO_ICONS = {
  calories: "/assets/insights/macro-calories.svg",
  fiberG: "/assets/insights/macro-fiber.svg",
  carbsG: "/assets/insights/macro-carbs.svg",
  proteinG: "/assets/insights/macro-protein.svg",
  fatG: "/assets/insights/macro-fat.svg",
  sugarG: "/assets/insights/macro-sugar.svg",
};

// Mirrors the backend's computeGlucoseScore (src/services/glucoseScoring.js):
// the Predicted Glucose Peak tab scores the predicted rise itself (1-10),
// which is a different number from the meal's food score (Figma: 3 vs 8).
const GLUCOSE_SCORE_STEPS = [
  [15, 10],
  [20, 9],
  [25, 8],
  [30, 7],
  [40, 6],
  [50, 5],
  [60, 4],
  [70, 3],
  [80, 2],
];

function glucoseScoreFromDelta(deltaMgDl) {
  if (typeof deltaMgDl !== "number") return null;
  const delta = Math.abs(deltaMgDl);
  for (const [limit, score] of GLUCOSE_SCORE_STEPS) {
    if (delta < limit) return score;
  }
  return 1;
}

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

export default function FoodScoreScreen({ meal: initialMeal, score: initialScore, userId, onBack }) {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [meal, setMeal] = useState(initialMeal);
  const [score, setScore] = useState(initialScore);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const [overlayOpen, setOverlayOpen] = useState(false);
  // Rapid stepper taps: serialize PATCHes so they can't land out of order,
  // and drop score responses that a newer edit has superseded.
  const editQueueRef = useRef(Promise.resolve());
  const editSeqRef = useRef(0);

  const mealId = meal?._id || meal?.id;
  const scoreVal = score?.score ?? score?.foodScore ?? null;
  const predicted = score?.predictedGlucosePeak;
  // No fabricated numbers: without a prediction there is no delta.
  const predictedDelta =
    typeof predicted?.deltaMgDl === "number" ? predicted.deltaMgDl : null;
  // Per the Figma frames the hero number differs by tab: food score on tab 0,
  // glucose (predicted-rise) score on tab 1 — the delta line is shared.
  const glucoseScore = glucoseScoreFromDelta(predictedDelta);
  const heroScore = tab === 1 ? glucoseScore ?? scoreVal : scoreVal;

  const totals = meal?.totals || {};
  const items = meal?.items || [];
  const consumedAt = meal?.consumedAt;
  const mealTitle = items.map((i) => i.name).filter(Boolean).join(", ") || meal?.title || "Meal";

  /* Persist an items change, then re-score in the background. */
  const applyItems = (nextItems) => {
    const prev = meal;
    const nextTotals = computeTotals(nextItems);
    setMeal({ ...meal, items: nextItems, totals: nextTotals }); // optimistic
    setError("");
    const seq = ++editSeqRef.current;
    editQueueRef.current = editQueueRef.current.then(async () => {
      try {
        await mealAPI.update(userId, mealId, { items: nextItems, totals: nextTotals });
        // Re-score only for the LATEST edit — the AI compute takes seconds,
        // and superseded edits recomputing would just stall the queue.
        if (seq === editSeqRef.current) {
          // compute returns the fresh score doc — no follow-up GET needed.
          const r = await foodScoreAPI.compute(userId, mealId).catch(() => null);
          if (r && seq === editSeqRef.current) setScore(r?.data || r);
        }
      } catch (err) {
        if (seq === editSeqRef.current) {
          setMeal(prev);
          setError(err?.message || "Couldn't update the meal. Try again.");
        }
      }
    });
    return editQueueRef.current;
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
  // The stable story is only truthful for genuinely stable responses — gate on
  // the same score the tab-1 overlay displays (glucose score), so Details
  // never contradicts the overlay's own headline.
  const handleOverlayDetails = () =>
    router.push(
      tab === 1 && heroScore != null && heroScore >= 8
        ? `/meals/${mealId}/review?variant=stable`
        : `/meals/${mealId}/review`
    );

  return (
    <div className="mx-auto min-h-screen w-full sm:max-w-md lg:max-w-[900px] bg-pageBackground pb-20 font-sans">
      {/* Back arrow */}
      <div className="px-5 pt-7">
        <button type="button" onClick={onBack} aria-label="Go back">
          <ChevronLeft size={20} strokeWidth={2.5} className="text-black" />
        </button>
      </div>

      {/* Tab bar — spans the hero card width, one tab at each edge */}
      <div className="mx-auto mt-3 flex w-[268px] max-w-full lg:w-[400px] items-center justify-between">
        {TABS.map((label, idx) => (
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

      {/* Score hero — tappable, opens the zone overlay for the active tab */}
      <div className="mt-[17px] flex justify-center px-5">
        <button
          type="button"
          onClick={() => setOverlayOpen(true)}
          aria-label={tab === 1 ? "View predicted glucose peak" : "View zone score"}
          className="relative block h-40 w-[268px] lg:h-52 lg:w-[400px] cursor-pointer overflow-hidden rounded-lg"
          style={{ background: HERO_GRADIENTS[tab] }}
        >
          {HERO_BOKEH.map((b, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="pointer-events-none absolute rounded-full"
              style={{
                left: b.left,
                top: b.top,
                width: b.size,
                height: b.size,
                background: `rgba(255,255,255,${b.alpha})`,
                filter: `blur(${b.blur}px)`,
              }}
            />
          ))}
          <span className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[55px] font-bold leading-none text-white">
              {heroScore ?? "--"}
            </span>
            {predictedDelta != null && (
              <span className="mt-1.5 text-[15px] font-medium leading-none text-white">
                {predictedDelta >= 0 ? "+" : ""}
                {Math.round(predictedDelta)} mg/dL
              </span>
            )}
          </span>
        </button>
      </div>

      {/* Pagination dots (tap a dot to switch page) */}
      <div className="mt-4 flex items-center justify-center gap-1">
        {[0, 1].map((idx) => (
          <button
            key={idx}
            type="button"
            aria-label={idx === 0 ? "Food score" : "Predicted glucose"}
            onClick={() => setTab(idx)}
            className={`h-1 rounded-full transition-all ${tab === idx ? "w-4 bg-black" : "w-2 bg-lightGray"}`}
          />
        ))}
      </div>

      {/* Both tabs share the same body per the Figma frames */}
      <div className="px-5">
        <p className="mt-6 text-center text-[16px] font-medium leading-6 text-black">{mealTitle}</p>
        {consumedAt && (
          <p className="mt-1 text-center text-[12px] font-medium leading-4 text-secondary">
            {formatMealDateTime(consumedAt)}
          </p>
        )}

        <p className="mt-5 text-[12px] font-semibold uppercase leading-4 text-black">Your Meal</p>
        <div className="mt-3 space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {items.map((item, idx) => (
            <ItemRow
              key={`${item.name}-${idx}`}
              item={item}
              onUpdate={(next) => updateItem(idx, next)}
              onRemove={() => removeItem(idx)}
            />
          ))}
        </div>

        <p className="mt-5 text-[12px] font-semibold uppercase leading-4 text-black">Macro Split</p>
        <MacroGrid totals={totals} />

        {/* Actions */}
        <button
          type="button"
          onClick={handleEditMeal}
          className="mt-10 block text-[16px] font-semibold leading-6 text-black transition hover:opacity-70"
        >
          Edit Meal
        </button>
        <button
          type="button"
          onClick={handleRemoveMeal}
          disabled={removing}
          className="mt-4 block text-[16px] font-semibold leading-6 text-biomarkerOutOfRange transition hover:opacity-70 disabled:opacity-50"
        >
          {removing ? "Removing…" : "Remove the Meal"}
        </button>

        {error && <p className="mt-3 text-sm text-biomarkerOutOfRange">{error}</p>}
      </div>

      {overlayOpen && (
        <ZoneScoreOverlay
          entry={{
            id: mealId,
            time: consumedAt,
            data: { foodScore: heroScore, deltaMgDl: predictedDelta },
          }}
          userId={userId}
          variant={tab === 1 ? "glucose" : undefined}
          onClose={() => setOverlayOpen(false)}
          onDetails={handleOverlayDetails}
        />
      )}
    </div>
  );
}

/* Linear scaling from the item as it was when editing began, so repeated
 * +/- taps don't accumulate rounding drift. (Mirrors MealItemRow.) */
function scaleItem(base, factor) {
  const r = (v) => Math.round((Number(v) || 0) * factor * 10) / 10;
  return {
    ...base,
    portion: {
      ...base.portion,
      quantity:
        base.portion?.quantity != null
          ? Math.round(base.portion.quantity * factor * 100) / 100
          : null,
      grams: base.portion?.grams != null ? Math.round(base.portion.grams * factor) : null,
    },
    calories: r(base.calories),
    proteinG: r(base.proteinG),
    carbsG: r(base.carbsG),
    fatG: r(base.fatG),
    fiberG: r(base.fiberG),
    sugarG: r(base.sugarG),
  };
}

/* Figma-styled meal item row: utensil tile, name + portion/macro line, and
 * circular edit (serving stepper) / remove buttons. */
function ItemRow({ item, onUpdate, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const baseRef = useRef(null);
  const factorRef = useRef(1);

  if (!item) return null;

  const toggleEdit = () => {
    if (!expanded) {
      baseRef.current = JSON.parse(JSON.stringify(item));
      factorRef.current = 1;
    }
    setExpanded((v) => !v);
  };

  const step = (dir) => {
    const nextFactor = Math.max(0.25, Math.round((factorRef.current + dir * 0.25) * 100) / 100);
    if (nextFactor === factorRef.current) return;
    factorRef.current = nextFactor;
    onUpdate(scaleItem(baseRef.current, nextFactor));
  };

  const r = (v) => Math.round(v || 0);
  const pText = portionText(item.portion);

  return (
    <div className="rounded-lg border border-borderColor bg-white shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)]">
      <div className="flex h-[60px] items-center gap-3 px-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/insights/meal-item.svg" alt="" className="h-[30px] w-[30px] shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium leading-4 text-black">{item.name}</p>
          <div className="mt-1 flex items-center gap-2 overflow-hidden whitespace-nowrap text-[12px] font-medium leading-4 text-secondary">
            {pText && (
              <>
                <span className="shrink-0">{pText}</span>
                <span aria-hidden="true" className="shrink-0 text-[8px] leading-none">•</span>
              </>
            )}
            <span className="shrink-0">{r(item.calories)} Cal</span>
            <span className="shrink-0">{r(item.proteinG)}P</span>
            <span>{r(item.fatG)}F</span>
            <span>{r(item.carbsG)}C</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={toggleEdit}
            aria-label={`Edit ${item.name}`}
            className="flex h-8 w-8 items-center justify-center transition hover:opacity-70"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/insights/row-edit.svg" alt="" className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${item.name}`}
            className="-mr-1 flex h-8 w-8 items-center justify-center transition hover:opacity-70"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/insights/row-remove.svg" alt="" className="h-4 w-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="flex items-center justify-between border-t border-borderColor px-3 py-2.5">
          <span className="text-xs font-medium uppercase tracking-wide text-secondary">
            Serving size
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Decrease serving"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-borderColor text-black active:scale-95"
            >
              <Minus size={14} />
            </button>
            <span className="min-w-[52px] text-center text-sm font-semibold text-black">
              {factorRef.current}×
            </span>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Increase serving"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-borderColor text-black active:scale-95"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MacroGrid({ totals }) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-1 lg:grid-cols-6">
      {MACRO_META.map(({ key, label, unit }) => {
        const raw = totals[key];
        const val = raw != null ? Math.round(raw) : "--";
        return (
          <div
            key={key}
            className="flex h-[50px] gap-2 rounded-lg border border-borderColor bg-white px-[7px] pt-2 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={MACRO_ICONS[key]} alt="" className="h-5 w-5 shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-[10px] font-medium uppercase leading-3 text-black">
                {label}
              </p>
              <p className="mt-1 text-[14px] font-semibold leading-[18px] text-black">
                {val}
                {unit}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
