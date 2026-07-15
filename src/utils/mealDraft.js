// Canonical accessor for the in-flight meal draft (sessionStorage).
//
// Every reader/writer of the draft must go through this module — direct
// sessionStorage access is what previously let MealDetailsSheet clobber
// selections made elsewhere.
//
// v2 draft shape (flat):
//   {
//     v: 2,
//     items: [ { name, portion:{quantity,unit,grams}, calories, proteinG,
//                carbsG, fatG, fiberG, sugarG } ],
//     imageKeys: [], imagePreviews: [],
//     title: null, inputText: null, confidence: null, notes: null,
//     mealType: null,        // null → review auto-suggests from time of day
//     consumedAt: null,      // null → review defaults to now
//     pickedAt: ISO string,
//   }
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
    v: 2,
    items: [],
    imageKeys: [],
    imagePreviews: [],
    title: null,
    inputText: null,
    confidence: null,
    notes: null,
    mealType: null,
    consumedAt: null,
    pickedAt: new Date().toISOString(),
  };
}

function normalize(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (raw.v === 2) {
    return { ...emptyDraft(), ...raw, items: Array.isArray(raw.items) ? raw.items : [] };
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
    return normalize(JSON.parse(raw));
  } catch (e) {
    console.warn("[mealDraft] Failed to read draft:", e?.message);
    return null;
  }
}

export function writeDraft(draft) {
  const next = { ...emptyDraft(), ...draft, v: 2 };
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
