"use client";

import { Utensils, Info, Flame, Leaf, Wheat, Beef, Droplet, Candy } from "lucide-react";

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
}

const MACRO_TILES = [
  { key: "calories", label: "Calories", icon: Flame, color: "text-orange-500", bg: "bg-orange-50" },
  { key: "fiber", label: "Fiber", icon: Leaf, color: "text-green-500", bg: "bg-green-50" },
  { key: "carbs", label: "Carbs", icon: Wheat, color: "text-blue-500", bg: "bg-blue-50" },
  { key: "protein", label: "Protein", icon: Beef, color: "text-purple-500", bg: "bg-purple-50" },
  { key: "fat", label: "Fat", icon: Droplet, color: "text-yellow-500", bg: "bg-yellow-50" },
  { key: "sugar", label: "Sugar", icon: Candy, color: "text-pink-500", bg: "bg-pink-50" },
];

export default function TimelineMealCard({ entry, onClick }) {
  const totals = entry.data?.totals || {};
  const time = formatTime(entry.time);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-borderColor bg-white p-3 text-left transition hover:shadow-sm active:scale-[0.99]"
    >
      {/* Top row: time + info icon */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Utensils size={14} className="text-[#6d6f7b]" />
          <span className="text-xs font-medium text-[#6d6f7b]">{time}</span>
        </div>
        <Info size={16} className="text-[#6d6f7b]" />
      </div>

      {/* Meal title */}
      <p className="mt-1.5 truncate text-sm font-semibold text-[#1e2027]">
        {entry.title}
      </p>

      {/* Macro split grid */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {MACRO_TILES.map(({ key, label, icon: Icon, color, bg }) => {
          const val = totals[key];
          return (
            <div
              key={key}
              className={`flex items-center gap-1.5 rounded-lg ${bg} px-2 py-1.5`}
            >
              <Icon size={13} className={color} />
              <div className="min-w-0">
                <p className="truncate text-[10px] text-[#6d6f7b]">{label}</p>
                <p className="text-xs font-semibold text-[#1e2027]">
                  {val != null ? Math.round(val) : "--"}
                  {key === "calories" ? "" : "g"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </button>
  );
}
