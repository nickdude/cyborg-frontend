"use client";

import { Info } from "lucide-react";

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
            <span className="text-[14px] font-medium leading-5 text-black">
              {time}{duration != null ? ` · ${duration} min` : ""}
            </span>
          </div>
          <Info size={16} className="text-[#717178]" />
        </div>

        <p className="mt-1.5 text-[14px] font-medium leading-5 text-[#717178]">
          Activity
        </p>
        <p className="text-[14px] font-medium leading-5 text-[#717178]">
          {entry.title}
        </p>
      </div>
    </button>
  );
}
