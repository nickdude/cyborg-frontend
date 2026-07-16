// Shared macro metadata for meal surfaces (review screen, timeline cards,
// search rows). Mirrors TIMELINE_MACROS in DigitalTwinHome and MACRO_ICONS in
// TimelineMealCard — single source going forward.
import { Flame, Leaf, Wheat, Beef, Droplet, Candy } from "lucide-react";

export const MACRO_META = [
  { key: "calories", label: "Calories", unit: "", Icon: Flame, color: "#EF1360" },
  { key: "fiberG", label: "Fiber", unit: "g", Icon: Leaf, color: "#34C759" },
  { key: "carbsG", label: "Carbs", unit: "g", Icon: Wheat, color: "#DE8E4E" },
  { key: "proteinG", label: "Protein", unit: "g", Icon: Beef, color: "#DD5F5F" },
  { key: "fatG", label: "Fat", unit: "g", Icon: Droplet, color: "#548ADE" },
  { key: "sugarG", label: "Sugar", unit: "g", Icon: Candy, color: "#4F378B" },
];

// Compact per-item macro line, e.g. "180 Cal · 12P 6F 20C"
export function macroLine(item) {
  if (!item) return "";
  const r = (v) => Math.round(v || 0);
  return `${r(item.calories)} Cal · ${r(item.proteinG)}P ${r(item.fatG)}F ${r(item.carbsG)}C`;
}

export function portionText(portion = {}) {
  // Gram-denominated portions read best as a bare weight ("100g"), not
  // "1 g (100g)".
  if (portion.unit === "g" && portion.grams != null) return `${portion.grams}g`;
  const bits = [];
  if (portion.quantity != null && portion.unit) bits.push(`${portion.quantity} ${portion.unit}`);
  else if (portion.quantity != null) bits.push(String(portion.quantity));
  else if (portion.unit) bits.push(portion.unit);
  if (portion.grams != null) bits.push(`(${portion.grams}g)`);
  return bits.join(" ");
}
