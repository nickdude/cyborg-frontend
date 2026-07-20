// Turn a raw category key (e.g. "heart_vascular", "dna_health") into a clean,
// human-readable label for display. Display-only — does not affect grouping/logic.
const CATEGORY_LABELS = {
  heart_vascular: "Heart & Vascular Health",
  metabolic: "Metabolic Health",
  sex_hormones: "Sex Hormones",
  inflammation: "Inflammation",
  liver: "Liver Health",
  nutrients: "Nutrients",
  kidney: "Kidney Health",
  thyroid: "Thyroid Health",
  energy: "Energy",
  immune: "Immune System",
  dna_health: "DNA Health",
  body_composition: "Body Composition",
};

export function humanizeCategory(key = "") {
  if (!key) return "";
  const mapped = CATEGORY_LABELS[key];
  if (mapped) return mapped;
  return String(key)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Canonical biomarker keys (e.g. "tg_hdl_ratio", "vldl") → display labels.
// Older Goal.biomarkerEvidence docs stored the canonical key as `name`.
const BIOMARKER_LABELS = {
  tg_hdl_ratio: "TG/HDL Ratio",
  glucose_fasting: "Fasting Glucose",
  insulin_fasting: "Fasting Insulin",
  lpa: "Lipoprotein (a)",
  lp_a: "Lipoprotein (a)",
  apob: "Apolipoprotein B",
  hscrp: "hs-CRP",
  hba1c: "HbA1c",
  homa_ir: "HOMA-IR",
  vitamin_d: "Vitamin D",
  vitamin_b12: "Vitamin B12",
  ldl: "LDL Cholesterol",
  hdl: "HDL Cholesterol",
  vldl: "VLDL",
  cholesterol_total: "Total Cholesterol",
};

const BIOMARKER_ACRONYMS = new Set([
  "ldl", "hdl", "vldl", "tg", "tsh", "shbg", "crp", "dhea", "egfr",
  "ggt", "alt", "ast", "bun", "rbc", "wbc", "psa", "igf1", "t3", "t4",
]);

export function humanizeBiomarkerName(name = "") {
  if (!name) return "";
  const key = String(name).trim().toLowerCase();
  if (BIOMARKER_LABELS[key]) return BIOMARKER_LABELS[key];
  // Already a display name ("LDL Cholesterol", "Lipoprotein (a)") — leave it.
  if (/[A-Z]/.test(name) && !/_/.test(name)) return name;
  return key
    .split(/[_-]+/)
    .map((t) => (BIOMARKER_ACRONYMS.has(t) ? t.toUpperCase() : t.charAt(0).toUpperCase() + t.slice(1)))
    .join(" ");
}

function mapStatus(item) {
  if (item.optimalFlag === "optimal") return "optimal";
  if (item.flag === "normal") return "normal";
  return "out_of_range";
}

export function transformPanel(biomarkerPanel) {
  if (!Array.isArray(biomarkerPanel)) return [];

  return biomarkerPanel
    .filter((item) => item.numericValue != null)
    .map((item) => ({
      id: item.canonicalName,
      name: item.displayName,
      value: String(item.numericValue),
      unit: item.unit,
      category: humanizeCategory(item.category),
      status: mapStatus(item),
      trend: [],
      optimalRange: {
        min: item.optimalMin ?? null,
        max: item.optimalMax ?? null,
      },
      referenceMin: item.referenceMin ?? null,
      referenceMax: item.referenceMax ?? null,
    }));
}

export function computeSummary(biomarkers) {
  if (!Array.isArray(biomarkers)) return { total: 0, optimal: 0, normal: 0, outOfRange: 0 };

  const total = biomarkers.length;
  let optimal = 0;
  let normal = 0;
  let outOfRange = 0;

  for (const b of biomarkers) {
    if (b.status === "optimal") optimal++;
    else if (b.status === "normal") normal++;
    else outOfRange++;
  }

  return { total, optimal, normal, outOfRange };
}

export function extractScores(scores) {
  if (!scores) return { cyborgScore: null, bioAge: null, paceOfAging: null, categoryGrades: {} };

  return {
    cyborgScore: scores.cyborgScore?.final ?? scores.cyborgScore?.score ?? scores.cyborgScore ?? null,
    bioAge: scores.bioAge?.bioAge ?? scores.bioAge?.phenoAge ?? scores.bioAge ?? null,
    paceOfAging: scores.paceOfAging?.pace ?? scores.paceOfAging ?? null,
    categoryGrades: scores.categoryGrades ?? {},
  };
}
