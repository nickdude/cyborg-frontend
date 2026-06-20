"use client";

/**
 * Single row in the Review/Detail items list.
 * Read-only display: name, portion summary, per-item macro line.
 *
 * Example render: "Watermelon · 3 pieces (150g) · 45 Cal 1P 0F 12C"
 */
export default function MealItemRow({ item }) {
  if (!item) return null;
  const { name, portion = {}, calories = 0, proteinG = 0, fatG = 0, carbsG = 0 } = item;

  const portionBits = [];
  if (portion.quantity != null && portion.unit) portionBits.push(`${portion.quantity} ${portion.unit}`);
  else if (portion.quantity != null) portionBits.push(String(portion.quantity));
  else if (portion.unit) portionBits.push(portion.unit);
  if (portion.grams != null) portionBits.push(`(${portion.grams}g)`);
  const portionText = portionBits.join(" ");

  const macroLine = `${Math.round(calories)} Cal ${Math.round(proteinG)}P ${Math.round(fatG)}F ${Math.round(carbsG)}C`;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#f6f7fb] px-3 py-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white text-[#636776]">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 4L18 4M6 20L18 20M4 6L4 18M20 6L20 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 8L16 16M16 8L8 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-[#1e2027]">{name}</div>
        <div className="text-xs text-[#6d6f7b]">
          {portionText ? `${portionText} · ${macroLine}` : macroLine}
        </div>
      </div>
    </div>
  );
}
