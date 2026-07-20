"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { foodSearchAPI } from "@/services/api";
import { MACRO_META, portionText } from "./macros";

// Same colored macro glyphs FoodScoreScreen/EditItemSheet use.
const MACRO_ICONS = {
  calories: "/assets/insights/macro-calories.svg",
  fiberG: "/assets/insights/macro-fiber.svg",
  carbsG: "/assets/insights/macro-carbs.svg",
  proteinG: "/assets/insights/macro-protein.svg",
  fatG: "/assets/insights/macro-fat.svg",
  sugarG: "/assets/insights/macro-sugar.svg",
};

const fmtDelta = (d) => `${d >= 0 ? "+" : ""}${Math.round(d)}`;

// Food scores run 1-10 (see FoodScoreScreen) — reuse the biomarker greens/
// yellows/pinks as the good/ok/poor signal.
function scoreDotClass(score) {
  if (score >= 7) return "bg-biomarkerOptimal";
  if (score >= 4) return "bg-biomarkerNormal";
  return "bg-biomarkerOutOfRange";
}

/**
 * Inline detail card for a search-result food: the 6-macro line plus the AI
 * insight strip (food score, GI, typical glucose delta, community stats) from
 * POST /api/users/:userId/foods/insight. The insight section shows a skeleton
 * while loading and disappears silently if the endpoint errors or isn't
 * deployed yet — the macros and Add button never depend on it.
 *
 * Props: { userId, food, onAdd() } — onAdd is the same handler as the row's +
 * so the green-check feedback stays in one place.
 */
export default function FoodDetailsCard({ userId, food, onAdd }) {
  // null = loading, false = hidden (error/absent), object = render
  const [insight, setInsight] = useState(null);

  useEffect(() => {
    if (!userId || !food?.name) {
      setInsight(false);
      return;
    }
    let active = true;
    setInsight(null);
    const body = {
      name: food.name,
      grams: food.portion?.grams ?? null,
      calories: Number(food.calories) || 0,
      proteinG: Number(food.proteinG) || 0,
      carbsG: Number(food.carbsG) || 0,
      fatG: Number(food.fatG) || 0,
      fiberG: Number(food.fiberG) || 0,
      sugarG: Number(food.sugarG) || 0,
    };
    // Optional call: resolves undefined (→ hidden) until the api.js fn lands.
    Promise.resolve()
      .then(() => foodSearchAPI.itemInsight?.(userId, body))
      .then((resp) => {
        if (active) setInsight(resp?.data || false);
      })
      .catch(() => {
        if (active) setInsight(false);
      });
    return () => {
      active = false;
    };
  }, [userId, food]);

  if (!food) return null;
  const pText = portionText(food.portion);

  return (
    <div className="rounded-xl border border-borderColor bg-white px-3 py-3">
      {pText && <p className="mb-2 text-xs text-secondary">Per {pText}</p>}

      {/* 6-macro line */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {MACRO_META.map(({ key, label, unit }) => (
          <span key={key} className="flex items-center gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={MACRO_ICONS[key]} alt="" className="h-4 w-4 shrink-0" />
            <span className="text-xs font-semibold text-blue">
              {Math.round(food[key] || 0)}
              {unit}
            </span>
            <span className="text-[10px] uppercase text-secondary">{label}</span>
          </span>
        ))}
      </div>

      {/* AI insight strip */}
      {insight === null && (
        <div className="mt-3 animate-pulse space-y-2" aria-hidden="true">
          <div className="h-6 w-2/3 rounded-full bg-pageBackground" />
          <div className="h-3.5 w-1/2 rounded-full bg-pageBackground" />
        </div>
      )}
      {insight && (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {typeof insight.foodScore === "number" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-borderColor bg-pageBackground px-2.5 py-1 text-xs font-medium text-blue">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${scoreDotClass(insight.foodScore)}`}
                />
                Food Score {insight.foodScore}/10
              </span>
            )}
            {insight.gi?.gi != null && (
              <span className="inline-flex items-center rounded-full border border-borderColor bg-pageBackground px-2.5 py-1 text-xs font-medium text-blue">
                GI {insight.gi.gi}
              </span>
            )}
            {insight.typical?.deltaMgDl != null && (
              <span className="inline-flex items-center rounded-full border border-borderColor bg-pageBackground px-2.5 py-1 text-xs font-medium text-blue">
                Typically {fmtDelta(insight.typical.deltaMgDl)} mg/dL
              </span>
            )}
          </div>
          {insight.community?.count > 0 && (
            <p className="mt-2 text-xs text-secondary">
              {insight.community.count} member {insight.community.count === 1 ? "log" : "logs"}
              {insight.community.avgScore != null &&
                ` · avg score ${Math.round(insight.community.avgScore * 10) / 10}`}
              {insight.community.avgDeltaMgDl != null &&
                ` · avg ${fmtDelta(insight.community.avgDeltaMgDl)} mg/dL`}
            </p>
          )}
        </>
      )}

      <button
        type="button"
        onClick={() => onAdd?.()}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-black py-2.5 text-sm font-medium text-white transition active:scale-[0.99]"
      >
        <Plus size={15} />
        Add to meal
      </button>
    </div>
  );
}
