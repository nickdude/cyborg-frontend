"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, Pencil, Plus } from "lucide-react";
import EditItemSheet from "@/components/food/EditItemSheet";
import { MACRO_ICONS, MACRO_META, portionText } from "./food/macros";
import { mealAPI } from "@/services/api";
import {
  MEAL_TYPES,
  computeTotals,
  readDraft,
  suggestMealType,
  writeDraft,
} from "@/utils/mealDraft";

function formatDateTimeLocal(date) {
  // Convert a Date (or ISO string) into the format required by
  // <input type="datetime-local">: "YYYY-MM-DDTHH:mm" in local time.
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// "12:24 pm" — the time chip label per the Figma frame.
function formatChipTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  return d
    .toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase();
}

// "01 Feb 2026" — the date line under the time chip per the frame.
function formatChipDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// Score → band classes, mirroring ZoneScoreOverlay's bandFor thresholds
// (poor ≤4 / ok 5-7 / good ≥8). Colors are the biomarker status tokens —
// the same ones FoodDetailsCard uses for this exact semantic — instead of
// one-off hexes. The yellow token is too light for white text, so the middle
// band carries dark text.
function scoreBandClass(score) {
  if (score <= 4) return "bg-biomarkerOutOfRange text-white";
  if (score >= 8) return "bg-biomarkerOptimal text-white";
  return "bg-biomarkerNormal text-black";
}

// The framed destructive pill (see the Figma "Delete Log" frame): pink fill,
// red label, ~200px wide, centered. Shared by the saved-mode "delete the whole
// meal" button and the new-mode select-mode bulk remove so the two read as one
// control language — they are mutually exclusive by mode (see below).
const DELETE_PILL_CLASS =
  "inline-flex h-8 items-center justify-center rounded-md bg-red-200 px-16 text-sm font-semibold text-red-500 disabled:opacity-50";

/**
 * Review shell for a meal — rebuilt to the Figma "Log Food" frames.
 *
 * Modes:
 *   "new"   — unsaved draft. Items are editable (EditItemSheet / remove /
 *             multi-select). "Scan food" + "Add An Item"/"Add more" hand off
 *             to the parent flow; Save commits.
 *   "saved" — persisted meal. Items are read-only; title/type/time are still
 *             editable; Delete Log appears at the bottom.
 *
 * Props:
 *   mode, initialData, imagePreviews?, userId?, onSave, onDelete?, onBack,
 *   onAddMore?(current), onScanFood?(current), onDiscard?, isBusy?, error?
 *
 * onDelete vs onDiscard — both destructive, never both visible:
 *   onDelete  ("saved" only) removes the persisted meal from the server.
 *   onDiscard ("new" only)   throws away the unsaved draft basket.
 *
 * initialData shape:
 *   { title, consumedAt, mealType, totals, items, imageKeys, inputText,
 *     confidence, notes, tokensUsed }
 */
export default function MealReviewScreen({
  mode = "new",
  initialData,
  imagePreviews = [],
  userId,
  onSave,
  onDelete,
  onBack,
  onAddMore,
  onScanFood,
  onDiscard,
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
  // auto-suggestion re-derives when the time changes. Same idea for the time:
  // only a user-touched time gets pinned into the draft.
  const typeTouched = useRef(Boolean(initialData?.mealType));
  const timeTouched = useRef(Boolean(initialData?.consumedAt));
  const [timeEditing, setTimeEditing] = useState(false);
  // Multi-select (Figma "Select" link): indices of selected rows.
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  // Index of the item open in the EditItemSheet (null = closed).
  const [editIdx, setEditIdx] = useState(null);
  // Live score-preview chip (enhancement beyond the frames).
  const [scorePreview, setScorePreview] = useState(null);
  const scoreSeq = useRef(0);
  // Defer time-dependent rendering to the client. `consumedAt` can default to
  // `new Date()` and the chip formatters read the runtime locale, all of which
  // differ between server and browser → hydration mismatch.
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
    timeTouched.current = Boolean(initialData?.consumedAt);
    setSelectMode(false);
    setSelected(new Set());
    setEditIdx(null);
  }, [initialData]);

  const editable = mode === "new";
  const hasItems = items.length > 0;

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

  // Continuously mirror review edits into the session draft (new mode only)
  // so leaving for the search view / a reload never loses work. All access
  // goes through mealDraft utils per that module's contract.
  useEffect(() => {
    if (mode !== "new" || !mounted) return;
    const current = readDraft();
    // Don't materialize a phantom draft on an untouched empty shell.
    if (!current && items.length === 0) return;
    writeDraft({
      ...(current || {}),
      items,
      title: title.trim() || null,
      mealType: typeTouched.current ? mealType : null,
      consumedAt: timeTouched.current ? consumedAt.toISOString() : (current?.consumedAt ?? null),
      // Mark the time as user-chosen so readDraft's stale-reset spares it.
      timePinned: timeTouched.current || Boolean(current?.timePinned),
    });
  }, [mode, mounted, items, title, mealType, consumedAt]);

  // Live Food Score preview — debounced ~600ms after item changes. The
  // endpoint may not exist yet (built in parallel); fail totally silent.
  useEffect(() => {
    if (mode !== "new" || !userId) return;
    if (!items || items.length === 0) {
      setScorePreview(null);
      return;
    }
    if (typeof mealAPI.scorePreview !== "function") return;
    const seq = ++scoreSeq.current;
    const timer = setTimeout(() => {
      mealAPI
        .scorePreview(userId, { items, totals: computeTotals(items) })
        .then((resp) => {
          if (seq !== scoreSeq.current) return;
          const s = Number(resp?.data?.foodScore);
          setScorePreview(Number.isFinite(s) ? Math.max(0, Math.min(10, Math.round(s))) : null);
        })
        .catch(() => {
          if (seq === scoreSeq.current) setScorePreview(null);
        });
    }, 600);
    return () => clearTimeout(timer);
  }, [mode, userId, items]);

  const updateItem = (idx, next) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? next : it)));
  };
  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
    // Indices shift — stale selections would point at the wrong rows.
    setSelected(new Set());
  };
  const removeSelected = () => {
    if (selected.size === 0) return;
    setItems((prev) => prev.filter((_, i) => !selected.has(i)));
    setSelected(new Set());
    setSelectMode(false);
  };
  const toggleSelected = (idx) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const currentState = () => ({
    title: title.trim() || null,
    consumedAt: timeTouched.current ? consumedAt.toISOString() : null,
    mealType: typeTouched.current ? mealType : null,
    items,
  });

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
    onAddMore(currentState());
  };

  const handleScanFood = () => {
    if (isBusy || !onScanFood) return;
    onScanFood(currentState());
  };

  const handleDelete = () => {
    if (isBusy || !onDelete) return;
    if (window.confirm("Delete this meal? This cannot be undone.")) {
      onDelete();
    }
  };

  // Throw away the unsaved draft basket. Same confirm pattern as the saved
  // meal's delete — without this, abandoned items silently ride along into
  // the user's next log.
  const handleDiscard = () => {
    if (isBusy || !onDiscard) return;
    const n = items.length;
    if (window.confirm(`Discard ${n} ${n === 1 ? "item" : "items"}? This log won't be saved.`)) {
      onDiscard();
    }
  };

  const selectType = (value) => {
    typeTouched.current = true;
    setMealType(value);
  };

  const handleTimeChange = (e) => {
    const next = new Date(e.target.value);
    if (!isNaN(next.getTime())) {
      timeTouched.current = true;
      setConsumedAt(next);
    }
  };

  return (
    <div className="mx-auto min-h-screen w-full sm:max-w-md bg-pageBackground px-5 pb-24 pt-[max(env(safe-area-inset-top,0px),20px)] lg:max-w-[1040px] lg:px-8 lg:pb-10">
      {/* Top bar: back arrow + Save pill */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-black transition hover:bg-black/5"
        >
          <ChevronLeft size={22} strokeWidth={2.25} />
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isBusy || items.length === 0}
          className="inline-flex h-8 items-center justify-center rounded-md bg-black px-4 text-sm font-medium text-white disabled:opacity-50"
        >
          {isBusy ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Title row: "Review" + editable time chip with date line below */}
      <div className="mt-6 flex items-start justify-between gap-3">
        <h1 className="pt-1 text-base font-medium leading-6 text-black">Review</h1>
        <div className="flex flex-col items-end gap-1.5">
          {timeEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                value={formatDateTimeLocal(consumedAt)}
                onChange={handleTimeChange}
                className="h-8 rounded-full border border-borderColor bg-white px-3 text-xs font-semibold text-black focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setTimeEditing(false)}
                className="inline-flex h-8 items-center rounded-full bg-black px-3 text-xs font-medium text-white"
              >
                Done
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setTimeEditing(true)}
              aria-label="Edit meal time"
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-borderColor bg-white px-3.5"
            >
              <Pencil size={10} className="text-black" />
              <span className="text-xs font-semibold text-black">
                {mounted ? formatChipTime(consumedAt) : "…"}
              </span>
            </button>
          )}
          <span className="text-xs font-medium text-secondary">
            {mounted ? formatChipDate(consumedAt) : ""}
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* On desktop, split into an items/details main column and a sticky
          macro-summary rail. The macro group stays FIRST in source so the
          MOBILE stacking order (summary → items → details) is byte-identical;
          explicit lg:col-start/row-start place it in column 2 on desktop. */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
        {/* Macro summary — right rail on desktop (col 2), first on mobile */}
        <div className="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-6 lg:self-start">
      {/* MACRO SPLIT heading (populated only, per the frames) + score chip */}
      {hasItems && (
        <div className="mt-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase text-black">Macro Split</h2>
          {scorePreview != null && (
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${scoreBandClass(scorePreview)}`}
            >
              Food Score {scorePreview}/10
            </span>
          )}
        </div>
      )}

      {/* Macro stat grid — 2 rows × 3 cols, "--" when the draft is empty */}
      <div className={`${hasItems ? "mt-2.5" : "mt-4"} grid grid-cols-3 gap-2`}>
        {MACRO_META.map(({ key, label, unit }) => (
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
                {hasItems ? `${Math.round(totals[key] || 0)}${unit}` : "--"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* AI notes on an EMPTY review — e.g. a photo the model couldn't read as
          food comes back with 0 items and an explanation. Without this the
          user just gets a blank shell. The populated/saved copy of this lives
          in the Details section below. */}
      {!hasItems && initialData?.notes && (
        <p className="mt-4 rounded-lg border border-borderColor bg-white px-4 py-3 text-xs leading-relaxed text-secondary">
          {initialData.notes}
        </p>
      )}

        </div>

        {/* Items + details — main column on desktop (col 1) */}
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
      {/* Empty state: the two black CTAs, centered */}
      {!hasItems && editable && (
        <div className="mt-12 flex items-center justify-center gap-2.5">
          {onScanFood && (
            <button
              type="button"
              onClick={handleScanFood}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-black px-4 text-sm font-medium text-white"
            >
              <Plus size={12} strokeWidth={2.5} />
              Scan food
            </button>
          )}
          {onAddMore && (
            <button
              type="button"
              onClick={handleAddMore}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-black px-4 text-sm font-medium text-white"
            >
              <Plus size={12} strokeWidth={2.5} />
              Add An Item
            </button>
          )}
        </div>
      )}

      {/* Items section */}
      {hasItems && (
        <div className="mt-7">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-black">
              {items.length} {items.length === 1 ? "Item" : "Items"}
            </span>
            {editable &&
              (selectMode ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectMode(false);
                    setSelected(new Set());
                  }}
                  className="text-xs font-semibold text-primary"
                >
                  Done
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectMode(true)}
                  className="text-xs font-semibold text-primary"
                >
                  Select
                </button>
              ))}
          </div>

          <div className="mt-3 flex flex-col gap-2.5">
            {items.map((it, idx) => (
              <ReviewItemRow
                key={`${it.name}-${idx}`}
                item={it}
                selectMode={editable && selectMode}
                selected={selected.has(idx)}
                onToggleSelect={() => toggleSelected(idx)}
                onEdit={editable ? () => setEditIdx(idx) : undefined}
                onRemove={editable ? () => removeItem(idx) : undefined}
              />
            ))}
          </div>

          {/* Bulk remove — the pink "Delete Log" pill from the select-mode
              frame, centered under the list. It only appears once something is
              selected (the frame with an empty radio shows no pill). `editable`
              gates it to mode="new", so it can never coexist with the saved
              meal's Delete Log below. */}
          {editable && selectMode && selected.size > 0 && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={removeSelected}
                aria-label={`Delete ${selected.size} selected ${selected.size === 1 ? "item" : "items"}`}
                className={DELETE_PILL_CLASS}
              >
                Delete Log
              </button>
            </div>
          )}

          {editable && !selectMode && onAddMore && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={handleAddMore}
                disabled={isBusy}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-black px-5 text-sm font-medium text-white disabled:opacity-50"
              >
                <Plus size={12} strokeWidth={2.5} />
                Add more
              </button>
            </div>
          )}
        </div>
      )}

      {/* Details — title + meal type. Not on the frames; folded into a compact
          section so the existing functionality survives the redesign. */}
      {(hasItems || mode === "saved") && (
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase text-black">Details</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Meal title (optional — AI names it)"
                className="w-full rounded-lg border border-borderColor bg-white px-4 py-3 pr-10 text-sm text-black placeholder:text-secondary focus:border-primary focus:outline-none"
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
              <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreviews[0]} alt="Meal" className="h-full w-full object-cover" />
              </div>
            )}
          </div>
          <div className="mt-2.5 grid grid-cols-4 gap-2">
            {MEAL_TYPES.map(({ value, label }) => {
              const isSelected = effectiveMealType === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => selectType(value)}
                  className={`rounded-full border px-2 py-2 text-xs font-medium transition-colors ${
                    isSelected
                      ? "border-primary bg-primary text-white"
                      : "border-borderColor bg-white text-secondary"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {hasItems && initialData?.notes && (
            <p className="mt-3 text-xs text-secondary">{initialData.notes}</p>
          )}
          {initialData?.confidence && initialData.confidence !== "high" && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-800">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              AI confidence: {initialData.confidence} — please double-check
            </div>
          )}

          {/* Discard the basket. The frames carry no such control, so it sits
              here as a quiet text button rather than competing with the framed
              Save / Add more / Delete Log buttons. Unsaved drafts only. */}
          {editable && hasItems && onDiscard && (
            <button
              type="button"
              onClick={handleDiscard}
              disabled={isBusy}
              className="mt-5 text-xs font-medium text-secondary underline underline-offset-2 transition hover:text-black disabled:opacity-50"
            >
              Discard this log
            </button>
          )}
        </div>
      )}

      {/* Delete Log — deletes the whole SAVED meal. mode="saved" only, so it is
          mutually exclusive with the select-mode bulk-delete pill above (that
          one requires editable === mode "new"). Same pill styling per frame. */}
      {mode === "saved" && onDelete && (
        <div className="mt-8 flex justify-center">
          <button type="button" onClick={handleDelete} disabled={isBusy} className={DELETE_PILL_CLASS}>
            Delete Log
          </button>
        </div>
      )}

        </div>
      </div>

      {/* Item editor — built in parallel; integration surface is exactly
          { item, index, onSave(nextItem), onRemove(), onClose() }. */}
      {editIdx != null && items[editIdx] && (
        <EditItemSheet
          item={items[editIdx]}
          index={editIdx}
          onSave={(nextItem) => {
            updateItem(editIdx, nextItem);
            setEditIdx(null);
          }}
          onRemove={() => {
            removeItem(editIdx);
            setEditIdx(null);
          }}
          onClose={() => setEditIdx(null)}
        />
      )}
    </div>
  );
}

/**
 * Item row per the frames: light lilac card, utensil tile, name over
 * portion + macro line, pen + remove circles. In select mode a radio circle
 * sits to the left of the card and the whole row toggles selection.
 */
function ReviewItemRow({ item, selectMode, selected, onToggleSelect, onEdit, onRemove }) {
  if (!item) return null;
  const r = (v) => Math.round(v || 0);
  const pText = portionText(item.portion);

  const card = (
    // bg #f9f8fd: deliberately accepted arbitrary value — this pale lilac is
    // frame-sanctioned, has no equivalent in theme.extend.colors, and matches
    // the macro icon circle fill baked into the exported SVGs. Per CLAUDE.md a
    // token would be used if one existed; inventing one for a single surface
    // isn't worth a theme change. Every other color here is a named token.
    // basis-auto: in the column layout `flex-1` alone would zero the basis and
    // collapse the framed 60px row height.
    <div className="flex h-[60px] min-w-0 flex-1 basis-auto items-center gap-3 rounded-lg border border-borderColor bg-[#f9f8fd] px-3 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/insights/meal-item.svg" alt="" className="h-[30px] w-[30px] shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium leading-4 text-black">{item.name}</p>
        <div className="mt-1 flex items-center gap-2 overflow-hidden whitespace-nowrap text-[12px] font-medium leading-4 text-secondary">
          {pText && (
            <>
              <span className="shrink-0">{pText}</span>
              <span aria-hidden="true" className="shrink-0 text-[8px] leading-none">
                •
              </span>
            </>
          )}
          <span className="shrink-0">{r(item.calories)} Cal</span>
          <span className="shrink-0">{r(item.proteinG)}P</span>
          <span>{r(item.fatG)}F</span>
          <span>{r(item.carbsG)}C</span>
        </div>
      </div>
      {(onEdit || onRemove) && (
        <div className="flex shrink-0 items-center gap-1">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              aria-label={`Edit ${item.name}`}
              className="flex h-8 w-8 items-center justify-center transition hover:opacity-70"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/insights/row-edit.svg" alt="" className="h-4 w-4" />
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              aria-label={`Remove ${item.name}`}
              className="-mr-1 flex h-8 w-8 items-center justify-center transition hover:opacity-70"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/insights/row-remove.svg" alt="" className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (!selectMode) return card;

  return (
    <div
      onClick={onToggleSelect}
      className="flex cursor-pointer items-center gap-2"
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggleSelect();
        }
      }}
    >
      <span
        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
          selected ? "border-primary" : "border-borderColor bg-white"
        }`}
        aria-hidden="true"
      >
        {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
      </span>
      {card}
    </div>
  );
}
