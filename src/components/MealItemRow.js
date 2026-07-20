"use client";

import { Pencil, Trash2, Utensils } from "lucide-react";
import { macroLine, portionText } from "./food/macros";

/**
 * Single row in a meal's items list — name over portion + macro line.
 *
 * Read-only by default (saved-meal view). Each affordance is gated on its own
 * callback: the pencil renders only with `onEdit`, the trash only with
 * `onRemove`. Serving edits themselves live in EditItemSheet
 * (components/food/EditItemSheet.js) — the pencil just signals intent upward,
 * and the owning screen decides what editing means.
 *
 * Props: { item, onEdit?, onRemove? }.
 */
export default function MealItemRow({ item, onEdit, onRemove }) {
  if (!item) return null;

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
        {(onEdit || onRemove) && (
          <div className="flex flex-shrink-0 items-center gap-1">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                aria-label={`Edit ${item.name}`}
                className="flex h-9 w-9 items-center justify-center rounded-full text-secondary transition-colors hover:bg-pageBackground"
              >
                <Pencil size={16} />
              </button>
            )}
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
    </div>
  );
}
