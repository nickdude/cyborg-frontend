"use client";

import { useEffect, useMemo, useState } from "react";
import MealItemRow from "./MealItemRow";

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
 *   "new"   — unsaved meal from /analyze. Save button posts; no Delete Log.
 *   "saved" — persisted meal. Save button patches; Delete Log appears at bottom.
 *
 * Props:
 *   mode, initialData, imagePreviews?, dailySummary?, onSave, onDelete?, onBack, isBusy?, error?
 *
 * initialData shape:
 *   { title, consumedAt, totals, items, imageKeys, inputText, confidence, notes, tokensUsed }
 */
export default function MealReviewScreen({
  mode = "new",
  initialData,
  imagePreviews = [],
  dailySummary,
  onSave,
  onDelete,
  onBack,
  isBusy = false,
  error = "",
}) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [consumedAt, setConsumedAt] = useState(() =>
    initialData?.consumedAt ? new Date(initialData.consumedAt) : new Date()
  );
  const [timeEditing, setTimeEditing] = useState(false);

  useEffect(() => {
    setTitle(initialData?.title || "");
    setConsumedAt(initialData?.consumedAt ? new Date(initialData.consumedAt) : new Date());
  }, [initialData]);

  const totals = initialData?.totals || {
    calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, sugarG: 0,
  };
  const items = initialData?.items || [];

  const summaryStrip = useMemo(() => {
    const s = dailySummary || {};
    const n = (v) => Math.round(v || 0);
    return `${s.itemCount || 0} items · ${n(s.calories)} Cal ${n(s.proteinG)}P ${n(s.fatG)}F ${n(s.carbsG)}C`;
  }, [dailySummary]);

  const handleSave = () => {
    if (isBusy) return;
    onSave?.({
      title: title.trim() || null,
      consumedAt: consumedAt.toISOString(),
      totals: initialData?.totals,
      items: initialData?.items,
      imageKeys: initialData?.imageKeys,
      inputText: initialData?.inputText,
      confidence: initialData?.confidence,
      tokensUsed: initialData?.tokensUsed,
    });
  };

  const handleDelete = () => {
    if (isBusy || !onDelete) return;
    if (window.confirm("Delete this meal? This cannot be undone.")) {
      onDelete();
    }
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-[#f4f5f9] pb-24">
      {/* Daily summary strip */}
      <div className="px-5 pt-5 pb-3 text-center text-xs text-[#6d6f7b]">
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
        <h1 className="text-base font-semibold text-[#14151a]">
          {mode === "saved" ? "Meal" : "Review"}
        </h1>
        <button
          type="button"
          onClick={handleSave}
          disabled={isBusy}
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

      {/* Macro cards — 2x3 grid */}
      <div className="mx-5 mt-4 grid grid-cols-3 gap-3">
        <MacroCard icon="🔥" label="CALORIES" value={Math.round(totals.calories)} />
        <MacroCard icon="🌿" label="FIBER" value={`${Math.round(totals.fiberG)}g`} />
        <MacroCard icon="🍬" label="SUGAR" value={`${Math.round(totals.sugarG)}g`} />
        <MacroCard icon="💪" label="PROTEIN" value={`${Math.round(totals.proteinG)}g`} />
        <MacroCard icon="🥑" label="FAT" value={`${Math.round(totals.fatG)}g`} />
        <MacroCard icon="🌾" label="CARBS" value={`${Math.round(totals.carbsG)}g`} />
      </div>

      {/* Adjust time */}
      <div className="mx-5 mt-5">
        <div className="mb-2 text-center text-xs font-medium uppercase tracking-wider text-[#6d6f7b]">Adjust time</div>
        {timeEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="datetime-local"
              value={formatDateTimeLocal(consumedAt)}
              onChange={(e) => {
                const next = new Date(e.target.value);
                if (!isNaN(next.getTime())) setConsumedAt(next);
              }}
              className="flex-1 rounded-xl border border-[#e4e6ef] bg-white px-4 py-3 text-sm text-[#1e2027]"
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
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-[#1e2027] shadow-sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {formatHumanDateTime(consumedAt)}
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
            className="w-full rounded-xl border border-[#e4e6ef] bg-white px-4 py-3 pr-10 text-sm text-[#1e2027] placeholder:text-[#9ea3b1] focus:border-[#9ea3b1] focus:outline-none"
          />
          {title && (
            <button
              type="button"
              onClick={() => setTitle("")}
              aria-label="Clear title"
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-600"
            >
              ×
            </button>
          )}
        </div>
        {imagePreviews?.length > 0 && (
          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreviews[0]} alt="Meal" className="h-full w-full object-cover" />
          </div>
        )}
      </div>

      <p className="mx-5 mt-2 text-xs leading-relaxed text-[#6d6f7b]">
        If a title is not specified, AI will create one automatically based on the food items below after saving.
      </p>

      {/* Items section */}
      <div className="mx-5 mt-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-[#6d6f7b]">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="cursor-not-allowed text-xs font-medium text-[#b197fc] opacity-60"
          >
            Add Item
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {items.map((it, idx) => (
            <MealItemRow key={idx} item={it} />
          ))}
          {items.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#d5d9e6] bg-white px-4 py-6 text-center text-sm text-[#6d6f7b]">
              No food items detected.
            </div>
          )}
        </div>

        {initialData?.notes && (
          <p className="mt-3 text-xs text-[#6d6f7b]">{initialData.notes}</p>
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

function MacroCard({ icon, label, value }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-white p-3 shadow-sm">
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#6d6f7b]">
        <span aria-hidden="true">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="text-xl font-semibold text-[#14151a]">{value}</div>
    </div>
  );
}
