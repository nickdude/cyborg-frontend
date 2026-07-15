"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clock, Plus } from "lucide-react";
import MealItemRow from "./MealItemRow";
import { MACRO_META } from "./food/macros";
import { MEAL_TYPES, computeTotals, suggestMealType } from "@/utils/mealDraft";

function formatDateTimeLocal(date) {
  // Convert a Date (or ISO string) into the format required by
  // <input type="datetime-local">: "YYYY-MM-DDTHH:mm" in local time.
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatHumanDateTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (sameDay) return `Today, ${time}`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + `, ${time}`;
}

/**
 * Review/Detail screen for a meal.
 *
 * Modes:
 *   "new"   — unsaved meal (draft). Items are editable; "Add more" returns to
 *             the Log Food hub; Save posts.
 *   "saved" — persisted meal. Save patches; Delete Log appears at bottom.
 *
 * Props:
 *   mode, initialData, imagePreviews?, dailySummary?, onSave, onDelete?,
 *   onBack, onAddMore?, isBusy?, error?
 *
 * initialData shape:
 *   { title, consumedAt, mealType, totals, items, imageKeys, inputText,
 *     confidence, notes, tokensUsed }
 */
export default function MealReviewScreen({
  mode = "new",
  initialData,
  imagePreviews = [],
  dailySummary,
  onSave,
  onDelete,
  onBack,
  onAddMore,
  isBusy = false,
  error = "",
}) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [consumedAt, setConsumedAt] = useState(() =>
    initialData?.consumedAt ? new Date(initialData.consumedAt) : new Date()
  );
  const [items, setItems] = useState(() => initialData?.items || []);
  const [mealType, setMealType] = useState(initialData?.mealType || null);
  // An explicit choice (or a stored value) must survive time edits; only the
  // auto-suggestion re-derives when the time changes.
  const typeTouched = useRef(Boolean(initialData?.mealType));
  const [timeEditing, setTimeEditing] = useState(false);
  // Defer time-dependent rendering to the client. `consumedAt` can default to
  // `new Date()` and `formatHumanDateTime` reads the current time + the runtime
  // locale, all of which differ between server and browser → hydration mismatch.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setTitle(initialData?.title || "");
    setConsumedAt(initialData?.consumedAt ? new Date(initialData.consumedAt) : new Date());
    setItems(initialData?.items || []);
    setMealType(initialData?.mealType || null);
    typeTouched.current = Boolean(initialData?.mealType);
  }, [initialData]);

  const editable = mode === "new";

  // Totals are always derived from the live items so add/remove/serving edits
  // stay consistent. Fall back to stored totals when there are no items to
  // derive from (defensive: shouldn't happen with the current parser).
  const totals = useMemo(() => {
    if (!items || items.length === 0) {
      return (
        initialData?.totals || { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, sugarG: 0 }
      );
    }
    return computeTotals(items);
  }, [items, initialData]);

  const effectiveMealType = typeTouched.current
    ? mealType
    : mounted
      ? suggestMealType(consumedAt)
      : null;

  const summaryStrip = useMemo(() => {
    const s = dailySummary || {};
    const n = (v) => Math.round(v || 0);
    return `${s.itemCount || 0} items · ${n(s.calories)} Cal ${n(s.proteinG)}P ${n(s.fatG)}F ${n(s.carbsG)}C`;
  }, [dailySummary]);

  const updateItem = (idx, next) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? next : it)));
  };
  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (isBusy) return;
    onSave?.({
      title: title.trim() || null,
      consumedAt: consumedAt.toISOString(),
      mealType: effectiveMealType,
      totals,
      items,
      imageKeys: initialData?.imageKeys,
      inputText: initialData?.inputText,
      confidence: initialData?.confidence,
      tokensUsed: initialData?.tokensUsed,
    });
  };

  const handleAddMore = () => {
    if (isBusy || !onAddMore) return;
    onAddMore({
      title: title.trim() || null,
      consumedAt: consumedAt.toISOString(),
      mealType: typeTouched.current ? mealType : null,
      items,
    });
  };

  const handleDelete = () => {
    if (isBusy || !onDelete) return;
    if (window.confirm("Delete this meal? This cannot be undone.")) {
      onDelete();
    }
  };

  const selectType = (value) => {
    typeTouched.current = true;
    setMealType(value);
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-pageBackground pb-24">
      {/* Daily summary strip */}
      <div className="px-5 pt-5 pb-3 text-center text-xs text-secondary">
        {summaryStrip}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Close"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white"
        >
          ×
        </button>
        <h1 className="text-base font-semibold tracking-tight text-blue">
          {mode === "saved" ? "Meal" : "Review"}
        </h1>
        <button
          type="button"
          onClick={handleSave}
          disabled={isBusy || items.length === 0}
          className="inline-flex h-9 items-center justify-center rounded-xl bg-black px-4 text-sm font-medium text-white disabled:opacity-50"
        >
          {isBusy ? "Saving…" : "Save meal"}
        </button>
      </div>

      {error && (
        <div className="mx-5 mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Macro split — 2x3 grid */}
      <div className="mx-5 mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary">
          Macro Split
        </p>
        <div className="grid grid-cols-3 gap-2">
          {MACRO_META.map(({ key, label, unit, Icon, color }) => (
            <div
              key={key}
              className="flex items-center gap-2 rounded-xl border border-borderColor bg-white p-3"
            >
              <Icon size={16} color={color} className="shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wide text-secondary">
                  {label}
                </p>
                <p className="text-[15px] font-semibold leading-none text-blue">
                  {Math.round(totals[key] || 0)}
                  {unit}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meal type chips */}
      <div className="mx-5 mt-5">
        <div className="mb-2 text-center text-xs font-medium uppercase tracking-wider text-secondary">
          Meal type
        </div>
        <div className="grid grid-cols-4 gap-2">
          {MEAL_TYPES.map(({ value, label }) => {
            const selected = effectiveMealType === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => selectType(value)}
                className={`rounded-full border px-2 py-2 text-xs font-medium transition-colors ${
                  selected
                    ? "border-primary bg-primary text-white"
                    : "border-borderColor bg-white text-secondary"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Adjust time */}
      <div className="mx-5 mt-4">
        <div className="mb-2 text-center text-xs font-medium uppercase tracking-wider text-secondary">
          Adjust time
        </div>
        {timeEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="datetime-local"
              value={formatDateTimeLocal(consumedAt)}
              onChange={(e) => {
                const next = new Date(e.target.value);
                if (!isNaN(next.getTime())) setConsumedAt(next);
              }}
              className="flex-1 rounded-xl border border-borderColor bg-white px-4 py-3 text-sm text-blue"
            />
            <button
              type="button"
              onClick={() => setTimeEditing(false)}
              className="rounded-xl bg-black px-3 py-2 text-xs font-medium text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setTimeEditing(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-borderColor bg-white px-4 py-3 text-sm font-medium text-blue"
          >
            <Clock size={16} />
            {mounted ? formatHumanDateTime(consumedAt) : "…"}
          </button>
        )}
      </div>

      {/* Title input + image thumb */}
      <div className="mx-5 mt-4 flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a meal title (optional)"
            className="w-full rounded-xl border border-borderColor bg-white px-4 py-3 pr-10 text-sm text-blue placeholder:text-secondary focus:border-primary focus:outline-none"
          />
          {title && (
            <button
              type="button"
              onClick={() => setTitle("")}
              aria-label="Clear title"
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-pageBackground text-xs text-secondary"
            >
              ×
            </button>
          )}
        </div>
        {imagePreviews?.length > 0 && (
          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-pageBackground">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreviews[0]} alt="Meal" className="h-full w-full object-cover" />
          </div>
        )}
      </div>

      <p className="mx-5 mt-2 text-xs leading-relaxed text-secondary">
        If a title is not specified, AI will create one automatically based on the food items below after saving.
      </p>

      {/* Items section */}
      <div className="mx-5 mt-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-secondary">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {items.map((it, idx) => (
            <MealItemRow
              key={`${it.name}-${idx}`}
              item={it}
              onUpdate={editable ? (next) => updateItem(idx, next) : undefined}
              onRemove={editable ? () => removeItem(idx) : undefined}
            />
          ))}
          {items.length === 0 && (
            <div className="rounded-xl border border-dashed border-borderColor bg-white px-4 py-6 text-center text-sm text-secondary">
              No food items yet — add something below.
            </div>
          )}
        </div>

        {editable && onAddMore && (
          <button
            type="button"
            onClick={handleAddMore}
            disabled={isBusy}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-black py-3.5 text-sm font-medium text-white disabled:opacity-50"
          >
            <Plus size={16} />
            Add more
          </button>
        )}

        {initialData?.notes && (
          <p className="mt-3 text-xs text-secondary">{initialData.notes}</p>
        )}

        {initialData?.confidence && initialData.confidence !== "high" && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-800">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            AI confidence: {initialData.confidence} — please double-check
          </div>
        )}
      </div>

      {/* Delete Log — only in saved mode */}
      {mode === "saved" && onDelete && (
        <div className="mx-5 mt-6">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isBusy}
            className="w-full rounded-xl bg-red-100 py-3 text-sm font-medium text-red-600 disabled:opacity-50"
          >
            Delete Log
          </button>
        </div>
      )}
    </div>
  );
}
