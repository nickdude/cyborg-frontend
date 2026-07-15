"use client";

import { Flame, Leaf, Wheat, Beef, Droplet, Candy, Info } from "lucide-react";

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
}

const MACRO_ICONS = {
  calories: { icon: Flame, color: "#EF1360", label: "CALORIES" },
  fiberG: { icon: Leaf, color: "#34C759", label: "FIBER" },
  carbsG: { icon: Wheat, color: "#DE8E4E", label: "CARBS" },
  proteinG: { icon: Beef, color: "#DD5F5F", label: "PROTEIN" },
  fatG: { icon: Droplet, color: "#548ADE", label: "FAT" },
  sugarG: { icon: Candy, color: "#4F378B", label: "SUGAR" },
};

const MACRO_ORDER = ["calories", "fiberG", "carbsG", "proteinG", "fatG", "sugarG"];

export default function TimelineMealCard({ entry, onClick }) {
  const totals = entry.data?.totals || {};
  const time = formatTime(entry.time);
  const itemNames = (entry.data?.items || []).map((i) => i.name).filter(Boolean).join(", ");
  const displayName = itemNames || entry.title || "Meal";

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full pl-8 text-left"
    >
      <div className="absolute left-0 top-[22px] h-2 w-2 rounded-full bg-black" />

      <div className="w-full rounded-xl bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-black">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-[14px] font-medium leading-5 text-black">{time}</span>
            {entry.data?.mealType && (
              <span className="rounded-full bg-pageBackground px-2 py-0.5 text-[10px] font-medium capitalize text-secondary">
                {entry.data.mealType}
              </span>
            )}
          </div>
          <Info size={16} className="text-[#717178]" />
        </div>

        <p className="mt-1 truncate text-[14px] font-medium leading-5 text-[#717178]">
          {displayName}
        </p>

        {Object.keys(totals).length > 0 && (
          <>
            <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-black">
              MACRO SPLIT
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {MACRO_ORDER.map((key) => {
                const { icon: Icon, color, label } = MACRO_ICONS[key];
                const val = totals[key];
                const unit = key === "calories" ? "" : "g";
                return (
                  <div
                    key={key}
                    className="flex items-center gap-1.5 rounded-lg bg-[#F8F8FA] px-2 py-2"
                  >
                    <Icon size={16} color={color} className="shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-medium uppercase text-[#717178]">{label}</p>
                      <p className="text-[13px] font-semibold leading-4 text-black">
                        {val != null ? Math.round(val) : "--"}{unit}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </button>
  );
}
