// 3-colour organ status for the digital twin body:
//   good    -> green   (all biomarkers in the category optimal)
//   neutral -> yellow  (some normal-but-not-optimal)
//   bad     -> pink    (any out of range)
export const STATUS_COLORS = {
  good: "#11c182",
  neutral: "#f5c518",
  bad: "#ff5d8f",
};

export const DEFAULT_STATUS = "good";

// Map a biomarker category label (whatever the backend provides) to the organ-overlay
// key used by organ-placements.json. Keyword-matched so it's resilient to naming.
export function organKeyForCategory(label = "") {
  const l = String(label).toLowerCase();
  if (/heart|vascular|cardio|cholesterol|lipid|blood pressure/.test(l)) return "Heart & Vascular Health";
  if (/metabol|glucose|diabet|insulin|sugar|a1c|hba1c/.test(l)) return "Metabolic Health";
  if (/liver|hepat/.test(l)) return "Liver Health";
  if (/kidney|renal/.test(l)) return "Kidney Health";
  if (/thyroid/.test(l)) return "Thyroid Health";
  if (/inflamm/.test(l)) return "Inflammation";
  if (/hormone|sex|reproduct|fertility|testosterone|estrogen|estradiol/.test(l)) return "Sex Hormones";
  if (/immune/.test(l)) return "Immune System";
  if (/dna|genetic|methyl|homocyst/.test(l)) return "DNA Health";
  if (/brain|cogn|neuro|mental|mood/.test(l)) return "Brain Health";
  if (/nutrient|vitamin|mineral|iron|folate|nutrition/.test(l)) return "Nutrients";
  return null; // no organ overlay for this category (e.g. energy, body composition)
}

// Reduce a category's biomarkers to one of the 3 status levels.
// biomarker.status is "optimal" | "normal" | "out_of_range".
export function categoryStatus(items = []) {
  if (!items.length) return "good";
  if (items.some((b) => b.status === "out_of_range")) return "bad";
  if (items.some((b) => b.status === "normal")) return "neutral";
  return "good";
}
