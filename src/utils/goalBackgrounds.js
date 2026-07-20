// Per-goal background art for the Goals list cards and the goal-detail hero.
// Three master textures (Figma export, extracted to WebP) assigned by goal
// category: fiery red = active/vital systems, deep red = organ/nutrient
// systems, blue = calm/regulatory systems. Swap or extend here only.

const RED_FIERY = "/assets/goals/goal-red-1.webp";
const RED_DEEP = "/assets/goals/goal-red-2.webp";
const BLUE = "/assets/goals/goal-blue.webp";

const DEFAULT_BACKGROUND = RED_DEEP;

const CATEGORY_BACKGROUNDS = {
  cardiovascular: RED_FIERY,
  inflammation: RED_FIERY,
  energy: RED_FIERY,
  body_composition: RED_FIERY,
  immune: RED_FIERY,
  metabolic: RED_DEEP,
  nutrient: RED_DEEP,
  liver: RED_DEEP,
  kidney: RED_DEEP,
  bone: RED_DEEP,
  hormonal: BLUE,
  thyroid: BLUE,
  cognitive: BLUE,
  sleep: BLUE,
  stress: BLUE,
};

// goalId slugs that differ from the template category name.
const GOAL_ID_SLUG_ALIASES = {
  body_comp: "body_composition",
};

/**
 * Resolve a goal's category. Goals generated before category persistence
 * (Goal.category was saved as "") fall back to parsing the engine goalId,
 * which is shaped `goal_<slug>_<n>`. Doctor-added goals ("dr-<id>") have
 * neither and resolve to null.
 */
export function goalCategory(goal) {
  if (goal?.category) return goal.category;
  const match = /^goal_(.+)_\d+$/.exec(goal?.goalId || "");
  if (!match) return null;
  return GOAL_ID_SLUG_ALIASES[match[1]] || match[1];
}

/** Background image path for a goal's list card / detail hero. */
export function goalBackground(goal) {
  const category = goalCategory(goal);
  return (category && CATEGORY_BACKGROUNDS[category]) || DEFAULT_BACKGROUND;
}
