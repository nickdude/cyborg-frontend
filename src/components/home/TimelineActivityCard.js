"use client";

import { Activity, Info } from "lucide-react";

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
}

export default function TimelineActivityCard({ entry, onClick }) {
  const time = formatTime(entry.time);
  const duration = entry.data?.durationMinutes;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-borderColor bg-white p-3 text-left transition hover:shadow-sm active:scale-[0.99]"
    >
      {/* Top row: time + duration + info icon */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-[#6d6f7b]" />
          <span className="text-xs font-medium text-[#6d6f7b]">
            {time}{duration != null ? ` · ${duration} min` : ""}
          </span>
        </div>
        <Info size={16} className="text-[#6d6f7b]" />
      </div>

      {/* Label + activity name */}
      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[#6d6f7b]">
        Activity
      </p>
      <p className="mt-0.5 truncate text-sm font-semibold text-[#1e2027]">
        {entry.title}
      </p>
    </button>
  );
}
