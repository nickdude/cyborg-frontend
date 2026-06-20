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
