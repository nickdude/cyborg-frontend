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
      {/* Timeline dot */}
      <div className="absolute left-0 top-[22px] h-2 w-2 rounded-full bg-black" />

      <div
        className="w-full rounded-lg border border-[#E6E6E8] bg-white p-4"
        style={{ boxShadow: "0px 0px 10px 0px rgba(0,0,0,0.05)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Activity icon - small running figure */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#717178" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 4a1 1 0 1 0 2 0 1 1 0 0 0-2 0M7.5 15.5l3-3 2 2 3-3" />
              <path d="M3.5 18.5l3-3" />
              <path d="M20.5 6.5l-3 3" />
            </svg>
            <span className="text-[14px] font-medium leading-5 text-black">
              {time}{duration != null ? ` · ${duration} min` : ""}
            </span>
          </div>
          <Info size={16} className="text-[#717178]" />
        </div>

        <p className="mt-1 text-[14px] font-medium leading-5 text-[#717178]">
          Activity
        </p>
        <p className="mt-0.5 text-[14px] font-medium leading-5 text-[#717178]">
          {entry.title}
        </p>
      </div>
    </button>
  );
}
