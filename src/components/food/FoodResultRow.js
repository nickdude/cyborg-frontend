"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Plus, Utensils } from "lucide-react";
import { motion } from "motion/react";
import FoodDetailsCard from "./FoodDetailsCard";
import { macroLine, portionText } from "./macros";

// Search metadata → Meal item schema, keeping the v3 portion-editing extras
// (per100g/servings/servingIdx) on the draft item so EditItemSheet can re-base
// macros exactly. mealDraft.toCommitItems strips them again at POST time.
export function toMealItem(result) {
  const item = {
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
  if (result.per100g) item.per100g = result.per100g;
  if (Array.isArray(result.servings) && result.servings.length > 0) {
    item.servings = result.servings;
    // The search result's default portion is one of the servings — recover
    // its index so the edit sheet opens on the right unit.
    const idx = result.servings.findIndex(
      (s) => s.unit === result.portion?.unit && s.grams === result.portion?.grams
    );
    item.servingIdx = idx >= 0 ? idx : 0;
  }
  return item;
}

/**
 * Tap-to-add food row shared by search results and "From your past logs".
 *
 * The + always quick-adds (with a brief green-check confirmation). When a
 * `userId` is provided, tapping the row body expands the FoodDetailsCard
 * (macros + AI insight + its own Add button) inline underneath; without one
 * (recent logs) the body tap adds too, as before.
 *
 * The user now stays in the search view after adding, so the same row can be
 * tapped repeatedly. Every add re-pops the check (keyed remount) and, from the
 * second one on, the row states how many it has added this visit — otherwise a
 * repeat tap on an already-green row would look like nothing happened.
 */
export default function FoodResultRow({ food, subtitle, onAdd, userId }) {
  const [addCount, setAddCount] = useState(0);
  const [added, setAdded] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const expandable = Boolean(userId);

  const handleAdd = () => {
    onAdd(toMealItem(food));
    setAddCount((n) => n + 1);
    setAdded(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setAdded(false), 1500);
  };

  const handleBodyTap = () => {
    if (expandable) setExpanded((v) => !v);
    else handleAdd();
  };

  const pText = portionText(food.portion);
  const line = [pText, macroLine(food)].filter(Boolean).join(" · ");

  return (
    <div>
      <div className="flex w-full items-center rounded-xl border border-borderColor bg-white pr-2 transition hover:border-primary/40">
        <button
          type="button"
          onClick={handleBodyTap}
          aria-expanded={expandable ? expanded : undefined}
          className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left active:scale-[0.99]"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-pageBackground text-secondary">
            <Utensils size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-blue">{food.name}</p>
            <p className="truncate text-xs text-secondary">{subtitle || line}</p>
          </div>
        </button>
        <div className="flex flex-shrink-0 items-center gap-1.5">
          {added && addCount > 1 && (
            <span className="text-xs font-semibold text-biomarkerOptimal">{addCount}×</span>
          )}
          <button
            type="button"
            onClick={handleAdd}
            aria-label={added ? `Add another ${food.name}` : `Add ${food.name}`}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
              added ? "bg-biomarkerOptimal text-white" : "bg-pageBackground text-secondary"
            }`}
          >
            {added ? (
              // Keyed on the count so a repeat tap replays the pop — otherwise
              // adding twice would look like the second tap did nothing.
              <motion.span
                key={addCount}
                initial={{ scale: 0.4 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 520, damping: 18 }}
                className="flex items-center justify-center"
              >
                <Check size={15} />
              </motion.span>
            ) : (
              <Plus size={15} />
            )}
          </button>
        </div>
      </div>
      <span role="status" aria-live="polite" className="sr-only">
        {added ? `Added ${food.name}${addCount > 1 ? `, ${addCount} times` : ""}` : ""}
      </span>

      {expandable && expanded && (
        <div className="mt-1">
          <FoodDetailsCard userId={userId} food={food} onAdd={handleAdd} />
        </div>
      )}
    </div>
  );
}
