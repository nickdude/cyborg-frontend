"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Plus, Utensils } from "lucide-react";
import { macroLine, portionText } from "./macros";

// Strip search metadata down to the Meal item schema before it enters the draft.
export function toMealItem(result) {
  return {
    name: result.name,
    portion: {
      quantity: result.portion?.quantity ?? null,
      unit: result.portion?.unit ?? null,
      grams: result.portion?.grams ?? null,
    },
    calories: Number(result.calories) || 0,
    proteinG: Number(result.proteinG) || 0,
    carbsG: Number(result.carbsG) || 0,
    fatG: Number(result.fatG) || 0,
    fiberG: Number(result.fiberG) || 0,
    sugarG: Number(result.sugarG) || 0,
  };
}

/**
 * Tap-to-add food row shared by search results and "From your past logs".
 * Shows a brief "added" confirmation after the + is tapped.
 */
export default function FoodResultRow({ food, subtitle, onAdd }) {
  const [added, setAdded] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleAdd = () => {
    onAdd(toMealItem(food));
    setAdded(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setAdded(false), 1500);
  };

  const pText = portionText(food.portion);
  const line = [pText, macroLine(food)].filter(Boolean).join(" · ");

  return (
    <button
      type="button"
      onClick={handleAdd}
      className="flex w-full items-center gap-3 rounded-xl border border-borderColor bg-white px-3 py-3 text-left transition hover:border-primary/40 active:scale-[0.99]"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-pageBackground text-secondary">
        <Utensils size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-blue">{food.name}</p>
        <p className="truncate text-xs text-secondary">{subtitle || line}</p>
      </div>
      <span
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
          added ? "bg-biomarkerOptimal text-white" : "bg-pageBackground text-secondary"
        }`}
        aria-hidden="true"
      >
        {added ? <Check size={15} /> : <Plus size={15} />}
      </span>
    </button>
  );
}
