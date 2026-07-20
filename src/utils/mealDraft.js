// Canonical accessor for the in-flight meal draft (sessionStorage).
//
// Every reader/writer of the draft must go through this module — direct
// sessionStorage access is what previously let MealDetailsSheet clobber
// selections made elsewhere.
//
// v3 draft shape (flat):
//   {
//     v: 3,
//     items: [ { name, portion:{quantity,unit,grams}, calories, proteinG,
//                carbsG, fatG, fiberG, sugarG,
//                per100g?, servings?, servingIdx? } ],
//     imageKeys: [], imagePreviews: [],
//     title: null, inputText: null, confidence: null, notes: null,
//     mealType: null,        // null → review auto-suggests from time of day
//     consumedAt: null,      // null → review defaults to now
//     timePinned: false,     // true → the USER picked consumedAt (see below)
//     pickedAt: ISO string,
//   }
//
// `timePinned` separates "the user deliberately chose this timestamp" from
// "something stamped a time while building the draft". Only the latter is
// stale-reset on read: a draft abandoned overnight must not silently log at
// yesterday's clock time, but a meal the user explicitly back-dated has to
// survive navigating away to the search view and back.
//
// v3 adds the optional per-item portion-editing extras carried over from food
// search (per100g nutrition, servings[] of {label,unit,grams}, servingIdx).
// They let the serving-size editor re-base macros from per-100g truth instead
// of factor-scaling rounded numbers. AI-estimated and legacy items simply
// don't have them (v2 drafts normalize by leaving them undefined). The backend
// Meal schema doesn't know these fields — strip them with toCommitItems()
// when POSTing, never in the draft itself.
//
// Legacy v1 shape ({ estimate, imageKeys, imagePreviews, pickedAt }) is
// normalized on read so a deploy mid-flow doesn't strand anyone.

const DRAFT_KEY = "cyborg.mealDraft";

const CONFIDENCE_RANK = { low: 0, medium: 1, high: 2 };

export const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

// Hour-of-day buckets: 05-10 breakfast, 11-15 lunch, 16-18 snack, else dinner.
export function suggestMealType(date) {
  const d = date instanceof Date ? date : new Date(date || Date.now());
  const h = isNaN(d.getTime()) ? new Date().getHours() : d.getHours();
  if (h >= 5 && h < 11) return "breakfast";
  if (h >= 11 && h < 16) return "lunch";
  if (h >= 16 && h < 19) return "snack";
  return "dinner";
}

export function computeTotals(items) {
  const totals = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0, sugarG: 0 };
  for (const it of items || []) {
    for (const key of Object.keys(totals)) {
      totals[key] += Number(it?.[key]) || 0;
    }
  }
  for (const key of Object.keys(totals)) {
    totals[key] = Math.round(totals[key] * 10) / 10;
  }
  return totals;
}

function emptyDraft() {
  return {
    v: 3,
    items: [],
    imageKeys: [],
    imagePreviews: [],
    title: null,
    inputText: null,
    confidence: null,
    notes: null,
    mealType: null,
    consumedAt: null,
    timePinned: false,
    pickedAt: new Date().toISOString(),
  };
}

function normalize(raw) {
  if (!raw || typeof raw !== "object") return null;
  // v2 → v3 is additive (items may carry per100g/servings/servingIdx); v2
  // items just leave those fields undefined, so both shapes pass through.
  if (raw.v === 2 || raw.v === 3) {
    return {
      ...emptyDraft(),
      ...raw,
      items: Array.isArray(raw.items) ? raw.items : [],
      // A pin without a time is meaningless; v2 drafts predate the flag and
      // only ever stored a user-picked consumedAt, so they promote cleanly.
      timePinned: Boolean(raw.consumedAt) && raw.timePinned !== false,
    };
  }
  // v1: { estimate: { title, totals, items, confidence, notes, tokensUsed }, imageKeys, imagePreviews }
  if (raw.estimate && typeof raw.estimate === "object") {
    return {
      ...emptyDraft(),
      items: Array.isArray(raw.estimate.items) ? raw.estimate.items : [],
      imageKeys: raw.imageKeys || [],
      imagePreviews: raw.imagePreviews || [],
      title: raw.estimate.title || null,
      confidence: raw.estimate.confidence || null,
      notes: raw.estimate.notes || null,
      pickedAt: raw.pickedAt || new Date().toISOString(),
    };
  }
  return null;
}

export function readDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = normalize(JSON.parse(raw));
    // A resumed old draft shouldn't silently log the meal under a stale
    // AUTO-STAMPED time — drop consumedAt so the review re-suggests "now".
    // A time the user picked themselves (timePinned) is never dropped, or a
    // deliberately back-dated meal would snap back to now the moment the user
    // stepped into the search view and returned.
    if (draft?.consumedAt && !draft.timePinned) {
      const pinnedAge = Date.now() - new Date(draft.pickedAt || 0).getTime();
      const pinnedDay = String(draft.consumedAt).slice(0, 10);
      const today = new Date().toISOString().slice(0, 10);
      if (pinnedAge > 12 * 60 * 60 * 1000 || pinnedDay < today) {
        draft.consumedAt = null;
      }
    }
    return draft;
  } catch (e) {
    console.warn("[mealDraft] Failed to read draft:", e?.message);
    return null;
  }
}

export function writeDraft(draft) {
  const next = { ...emptyDraft(), ...draft, v: 3 };
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next));
  } catch (e) {
    // Quota exceeded (data-URL previews are big) — retry without previews.
    console.warn("[mealDraft] Write failed, retrying without previews:", e?.message);
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...next, imagePreviews: [] }));
    } catch (e2) {
      console.warn("[mealDraft] Write failed permanently:", e2?.message);
    }
  }
  return next;
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch (_) {
    /* noop */
  }
}

/**
 * Items as the backend Meal schema expects them. The v3 portion-editing
 * extras (per100g/servings/servingIdx) stay on the draft so serving edits
 * remain re-basable, but must not reach mealAPI.commit — call this in the
 * commit payload builder.
 */
export function toCommitItems(items) {
  return (items || []).map((it) => {
    const rest = { ...it };
    delete rest.per100g;
    delete rest.servings;
    delete rest.servingIdx;
    return rest;
  });
}

function lowerConfidence(a, b) {
  if (!a) return b;
  if (!b) return a;
  return CONFIDENCE_RANK[a] <= CONFIDENCE_RANK[b] ? a : b;
}

/**
 * Append items to the draft (creating one if needed). Used by search
 * results, recent logs, and analyze responses alike.
 */
export function addItems(items, extras = {}) {
  const draft = readDraft() || emptyDraft();
  const next = {
    ...draft,
    items: [...draft.items, ...(items || [])],
    imageKeys: [...(draft.imageKeys || []), ...(extras.imageKeys || [])],
    imagePreviews: [...(draft.imagePreviews || []), ...(extras.imagePreviews || [])],
    confidence: lowerConfidence(draft.confidence, extras.confidence || null),
    notes: extras.notes ? [draft.notes, extras.notes].filter(Boolean).join(" ") : draft.notes,
  };
  return writeDraft(next);
}

/**
 * Merge an /analyze response (photo scan or text quick-add) into the draft
 * without clobbering items already picked from search/recents.
 */
export function mergeAnalysis(estimate, imageKeys = [], imagePreviews = []) {
  const draft = readDraft();
  const merged = addItems(estimate?.items || [], {
    imageKeys,
    imagePreviews,
    confidence: estimate?.confidence || null,
    notes: estimate?.notes || null,
  });
  // Keep the AI title only when nothing else set one.
  if (!draft?.title && estimate?.title) {
    return writeDraft({ ...merged, title: estimate.title });
  }
  return merged;
}
