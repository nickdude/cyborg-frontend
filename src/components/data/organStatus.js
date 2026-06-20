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

// Map a biomarker category label (whatever the backend provides) to the digital-twin
// organ texture key. These keys match superpower's pre-baked UV textures stored under
// /models/{sex}/textures/{organ}_{status}.jpg — keyword-matched so it's resilient to
// naming variations. Returns null for categories with no body texture (energy, toxin
// exposure, blood & oxygen, sleep, wearables) — those show the plain base body.
export function organKeyForCategory(label = "") {
  const l = String(label).toLowerCase();
  if (/heart|vascular|cardio|cholesterol|lipid|blood pressure/.test(l)) return "heart";
  if (/metabol|glucose|diabet|insulin|sugar|a1c|hba1c/.test(l)) return "metabolic";
  if (/liver|hepat/.test(l)) return "liver";
  if (/kidney|renal/.test(l)) return "kidney";
  if (/thyroid/.test(l)) return "thyroid";
  if (/inflamm/.test(l)) return "inflammation";
  if (/hormone|sex|reproduct|fertility|testosterone|estrogen|estradiol/.test(l)) return "sex";
  if (/immune|infectious/.test(l)) return "immune";
  if (/dna|genetic|methyl|homocyst/.test(l)) return "dna";
  if (/brain|cogn|neuro|mental|mood|nervous/.test(l)) return "brain";
  if (/nutrient|vitamin|mineral|iron|folate|nutrition/.test(l)) return "nutrients";
  if (/gut|digest|microbiome|gastro/.test(l)) return "gut";
  if (/skin|derma/.test(l)) return "skin";
  if (/body|composition|weight|bmi|muscle|fat/.test(l)) return "body";
  return null; // energy, toxin exposure, blood & oxygen, sleep, wearables -> base body
}

// Reduce a category's biomarkers to one of the 3 status levels.
// biomarker.status is "optimal" | "normal" | "out_of_range".
export function categoryStatus(items = []) {
  if (!items.length) return "good";
  if (items.some((b) => b.status === "out_of_range")) return "bad";
  if (items.some((b) => b.status === "normal")) return "neutral";
  return "good";
}
