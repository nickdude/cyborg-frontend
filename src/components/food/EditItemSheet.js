"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { MACRO_ICONS, MACRO_META } from "./macros";

const MACRO_KEYS = ["calories", "proteinG", "carbsG", "fatG", "fiberG", "sugarG"];

const round1 = (v) => Math.round((Number(v) || 0) * 10) / 10;

// Units offered to items that carry no servings[] table (photo scans, Quick
// Add, legacy drafts). Weight units are kept separate because they can only be
// offered when the opening portion has a real gram weight to scale off.
const GENERIC_UNITS = ["serving", "piece", "bowl", "cup", "plate", "tbsp", "tsp"];
const WEIGHT_UNITS = ["g", "ml"];

const UNIT_LABELS = {
  serving: "Serving",
  piece: "Piece",
  bowl: "Bowl",
  cup: "Cup",
  plate: "Plate",
  tbsp: "Tbsp",
  tsp: "Tsp",
  g: "g",
  ml: "ml",
};

const isWeightUnit = (u) => WEIGHT_UNITS.includes(String(u || "").toLowerCase());

const unitLabel = (u) => {
  const raw = String(u || "");
  return UNIT_LABELS[raw.toLowerCase()] || raw.charAt(0).toUpperCase() + raw.slice(1);
};

const hasServings = (it) =>
  Boolean(it?.per100g) && Array.isArray(it?.servings) && it.servings.length > 0;

/**
 * Unit options for the picker, as `{ id, label, unit, grams, idx }`.
 *
 * Items from the local food DB get their own servings[] (exact gram weights).
 * Everything else gets the generic list, always including — and never
 * duplicating — the portion's own unit, so the picker is live for every item
 * instead of a disabled single option.
 */
function buildOptions(base) {
  const dbServings = hasServings(base)
    ? base.servings.map((s, i) => ({
        id: `s${i}`,
        label: s.label || s.unit || `Serving ${i + 1}`,
        unit: s.unit || "serving",
        grams: Number(s.grams) || null,
        idx: i,
      }))
    : [];

  // Most INDB/IFCT foods ship exactly ONE serving, which would leave the
  // framed picker with nothing to pick. These items carry per100g, so generic
  // units re-base exactly — append them after the DB's own servings.
  if (dbServings.length) {
    const known = new Set(dbServings.map((o) => o.unit.toLowerCase()));
    const extras = [...GENERIC_UNITS, ...WEIGHT_UNITS]
      .filter((u) => !known.has(u))
      .map((u) => ({ id: `u:${u}`, label: unitLabel(u), unit: u, grams: null, idx: null }));
    return [...dbServings, ...extras];
  }

  const current = String(base?.portion?.unit || "").trim();
  const baseGrams = Number(base?.portion?.grams);
  // "g"/"ml" only appear when there's a gram weight to scale off — otherwise
  // picking them would produce macros for a weight nobody ever measured.
  const pool = [...GENERIC_UNITS, ...(baseGrams > 0 ? WEIGHT_UNITS : [])];

  let matched = false;
  const units = pool.map((u) => {
    if (current && u === current.toLowerCase()) {
      matched = true;
      return current; // keep the item's own spelling
    }
    return u;
  });
  if (current && !matched) units.unshift(current);

  return units.map((u) => ({ id: `u:${u}`, label: unitLabel(u), unit: u, grams: null, idx: null }));
}

const initialQty = (it) => String(it?.portion?.quantity ?? 1);

const initialOptionId = (it) => {
  const unit = String(it?.portion?.unit || "").trim();
  if (hasServings(it)) {
    // `null` means a generic unit was chosen last time — don't let Number(null)
    // silently resolve to serving 0 and reopen on the wrong unit.
    const idx = it.servingIdx == null ? NaN : Number(it.servingIdx);
    if (Number.isInteger(idx) && idx >= 0 && idx < it.servings.length) return `s${idx}`;
    const match = it.servings.findIndex(
      (s) => String(s.unit || "").toLowerCase() === unit.toLowerCase()
    );
    if (match >= 0) return `s${match}`;
    return unit ? `u:${unit.toLowerCase()}` : "s0";
  }
  return `u:${unit || "serving"}`;
};

/**
 * Full-screen per-item editor (Figma "Log Food - Edit Log" frame): item name,
 * live MACRO SPLIT grid, SERVING SIZE quantity + unit, red "Remove item".
 *
 * Props contract: { item, index, onSave(nextItem), onRemove(), onClose() }.
 * `index` is the item's position in the owning draft — the sheet only uses it
 * as an identity key (see below); the owning screen still decides what a save
 * means. The sheet never touches the draft itself.
 *
 * Portion models — the picker is always live, but what a unit change *means*
 * depends on what the item knows about itself, and nothing is ever invented:
 *  - Items carrying v3 extras (per100g + servings[] from the local food DB):
 *    the picker lists every serving and macros re-base from per100g × grams,
 *    so "katori" → "cup" is exact, not a scale of rounded numbers.
 *  - Everything else (AI scans, Quick Add, legacy drafts): a generic unit list.
 *    Quantity always scales the macros the item opened with. Switching to
 *    "g"/"ml" (offered only when the item has a known gram weight) scales by
 *    grams instead. Switching between count/volume units can't be derived, so
 *    macros stay put, quantity keeps driving them, and the stale gram weight is
 *    dropped rather than re-labelled.
 */
export default function EditItemSheet({ item, index, onSave, onRemove, onClose }) {
  // Snapshot the item as it was when editing began so repeated quantity edits
  // scale from one base instead of accumulating rounding drift. The snapshot
  // is keyed by item identity so a sheet left mounted across an item swap
  // re-bases (and resets its fields) instead of freezing on the first item.
  const identity = `${index ?? "-"}::${item?.name ?? ""}`;
  const baseRef = useRef(item);
  const [openedFor, setOpenedFor] = useState(identity);
  const [qtyStr, setQtyStr] = useState(() => initialQty(item));
  const [optionId, setOptionId] = useState(() => initialOptionId(item));

  if (openedFor !== identity) {
    baseRef.current = item;
    setOpenedFor(identity);
    setQtyStr(initialQty(item));
    setOptionId(initialOptionId(item));
  }

  const base = baseRef.current;
  const hasServingData = hasServings(base);

  const options = useMemo(() => buildOptions(base), [base]);
  const selected = options.find((o) => o.id === optionId) || options[0] || null;

  const qty = parseFloat(qtyStr);
  const validQty = Number.isFinite(qty) && qty >= 0.25;

  // The item as it would be saved — macro grid renders from this live.
  const next = useMemo(() => {
    if (!base || !validQty || !selected) return null;

    // Exact per-100g math is only available for the food DB's own servings
    // (known gram weight) or a weight unit (quantity IS the gram count).
    // A generic unit like "cup" has no gram bridge — assuming 100g would
    // invent a weight the user never measured, so it falls through below.
    if (hasServingData && (selected.idx != null || isWeightUnit(selected.unit))) {
      const grams = selected.idx != null ? qty * (selected.grams || 100) : qty;
      const scaled = {};
      for (const key of MACRO_KEYS) {
        scaled[key] = round1(((Number(base.per100g?.[key]) || 0) * grams) / 100);
      }
      return {
        ...base,
        ...scaled,
        portion: { quantity: qty, unit: selected.unit, grams: Math.round(grams) },
        servingIdx: selected.idx ?? null,
      };
    }

    const baseQty = Number(base.portion?.quantity) || 1;
    const baseGrams = Number(base.portion?.grams);
    const gramBasis = baseGrams > 0;
    let factor;
    let grams;
    if (selected.unit === String(base.portion?.unit || "")) {
      // Same unit: pure quantity scaling, gram weight rides along.
      factor = qty / baseQty;
      grams = gramBasis ? Math.round((baseGrams / baseQty) * qty) : null;
    } else if (isWeightUnit(selected.unit) && gramBasis) {
      // Quantity now *is* the gram/ml count — scale off the known weight.
      factor = qty / baseGrams;
      grams = Math.round(qty);
    } else {
      // No derivable bridge between the units: keep the macros the item opened
      // with, let quantity scale them, and drop the now-meaningless weight.
      factor = qty / baseQty;
      grams = null;
    }

    const scaled = {};
    for (const key of MACRO_KEYS) {
      scaled[key] = round1((Number(base[key]) || 0) * factor);
    }
    return {
      ...base,
      ...scaled,
      portion: { ...base.portion, quantity: qty, unit: selected.unit, grams },
      // A generic unit no longer corresponds to any servings[] entry — leaving
      // the old index would reopen the sheet on the wrong unit.
      servingIdx: null,
    };
  }, [base, validQty, hasServingData, qty, selected]);

  // Switching to/from a weight unit re-seeds the quantity box, so the macros
  // hold steady across the switch instead of collapsing to "1 g".
  const handleUnitChange = (id) => {
    setOptionId(id);
    const target = options.find((o) => o.id === id);
    // Applies to food-DB items too: they can now pick generic/weight units, and
    // without re-seeding, switching to "g" would read as 1 gram.
    if (!target || !selected) return;
    const wasWeight = isWeightUnit(selected.unit);
    const willBeWeight = isWeightUnit(target.unit);
    if (willBeWeight === wasWeight) return;
    if (willBeWeight) {
      const grams = Number(next?.portion?.grams ?? base?.portion?.grams);
      if (grams > 0) setQtyStr(String(Math.round(grams)));
    } else {
      setQtyStr(String(Number(base?.portion?.quantity) || 1));
    }
  };

  if (!item) return null;

  const shown = next || item;
  const fieldClass =
    "h-11 w-full rounded-lg border border-borderColor bg-white px-4 text-sm font-medium text-blue shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)] focus:border-primary focus:outline-none";

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-pageBackground">
      <div className="mx-auto w-full max-w-md px-5 pb-12 pt-[max(env(safe-area-inset-top,0px),16px)]">
        {/* Header: back + Save */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back"
            className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-blue transition hover:bg-white"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={() => next && onSave?.(next)}
            disabled={!next}
            className="inline-flex h-8 items-center justify-center rounded-[5px] bg-black px-4 text-sm font-medium text-white disabled:opacity-50"
          >
            Save
          </button>
        </div>

        {/* Item name */}
        <h1 className="mt-6 truncate text-base font-semibold text-black">{item.name}</h1>

        {/* Macro split — live 2x3 grid */}
        <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-black">
          Macro Split
        </p>
        <div className="grid grid-cols-3 gap-2">
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
                  {Math.round(shown[key] || 0)}
                  {unit}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Serving size — quantity + unit */}
        <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-black">
          Serving Size
        </p>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            inputMode="decimal"
            step="0.25"
            min="0.25"
            value={qtyStr}
            onChange={(e) => setQtyStr(e.target.value)}
            aria-label="Serving quantity"
            aria-invalid={!validQty}
            className={fieldClass}
          />
          <select
            value={selected?.id ?? ""}
            onChange={(e) => handleUnitChange(e.target.value)}
            aria-label="Serving unit"
            className={fieldClass}
          >
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        {!validQty && (
          <p className="mt-2 text-xs text-red-600">Enter a quantity of 0.25 or more.</p>
        )}

        {/* Remove */}
        <button
          type="button"
          onClick={() => onRemove?.()}
          className="mt-10 block text-sm font-semibold text-red-600"
        >
          Remove item
        </button>
      </div>
    </div>
  );
}
