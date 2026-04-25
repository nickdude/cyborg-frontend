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
      category: item.category,
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
    cyborgScore: scores.cyborgScore?.score ?? null,
    bioAge: scores.bioAge?.bioAge ?? null,
    paceOfAging: scores.paceOfAging?.pace ?? null,
    categoryGrades: scores.categoryGrades ?? {},
  };
}
