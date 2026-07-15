"use client";

import { useRef, useState } from "react";
import { Minus, Pencil, Plus, Trash2, Utensils } from "lucide-react";
import { macroLine, portionText } from "./food/macros";

function scale(base, factor) {
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

/**
 * Single row in the Review/Detail items list.
 *
 * Read-only by default (saved-meal view). When `onUpdate`/`onRemove` are
 * provided the row grows edit (serving stepper) and remove affordances.
 */
export default function MealItemRow({ item, onUpdate, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  // The serving stepper scales linearly from the item as it was when editing
  // began, so repeated +/- taps don't accumulate rounding drift.
  const baseRef = useRef(null);
  const factorRef = useRef(1);

  if (!item) return null;
  const editable = typeof onUpdate === "function";

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
    onUpdate(scale(baseRef.current, nextFactor));
  };

  const pText = portionText(item.portion);
  const mLine = macroLine(item);

  return (
    <div className="rounded-xl border border-borderColor bg-white">
      <div className="flex items-center gap-3 px-3 py-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-pageBackground text-secondary">
          <Utensils size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-blue">{item.name}</div>
          <div className="text-xs text-secondary">
            {pText ? `${pText} · ${mLine}` : mLine}
          </div>
        </div>
        {editable && (
          <div className="flex flex-shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={toggleEdit}
              aria-label={`Edit ${item.name}`}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                expanded ? "bg-blue text-white" : "text-secondary hover:bg-pageBackground"
              }`}
            >
              <Pencil size={16} />
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove ${item.name}`}
                className="flex h-9 w-9 items-center justify-center rounded-full text-secondary transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {editable && expanded && (
        <div className="flex items-center justify-between border-t border-borderColor px-3 py-2.5">
          <span className="text-xs font-medium uppercase tracking-wide text-secondary">
            Serving size
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Decrease serving"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-borderColor text-blue active:scale-95"
            >
              <Minus size={14} />
            </button>
            <span className="min-w-[52px] text-center text-sm font-semibold text-blue">
              {factorRef.current}×
            </span>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Increase serving"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-borderColor text-blue active:scale-95"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
