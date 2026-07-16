"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

function formatLabel(dateStr, today) {
  if (today) {
    if (dateStr === today) return "Today";

    const yesterday = new Date(new Date(today + "T00:00:00Z").getTime() - 86400000)
      .toISOString()
      .slice(0, 10);
    if (dateStr === yesterday) return "Yesterday";
  }

  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function TimelineDateNav({ date, onChange }) {
  const [today, setToday] = useState(null);

  useEffect(() => {
    setToday(new Date().toISOString().slice(0, 10));
  }, []);

  const isToday = today !== null && date === today;

  const shift = (days) => {
    // All math in UTC — parsing local midnight and serializing with
    // toISOString() skips/repeats days for any UTC+ timezone (IST users
    // could never navigate back to today).
    const d = new Date(date + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + days);
    onChange(d.toISOString().slice(0, 10));
  };

  return (
    <div className="mt-3 flex items-center justify-between">
      <button
        type="button"
        onClick={() => shift(-1)}
        aria-label="Previous day"
        className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-[#f6f7fb]"
      >
        <ChevronLeft size={18} className="text-[#6d6f7b]" />
      </button>

      <span className="text-sm font-medium text-black">{formatLabel(date, today)}</span>

      <button
        type="button"
        onClick={() => shift(1)}
        disabled={isToday}
        aria-label="Next day"
        className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-[#f6f7fb] disabled:opacity-30"
      >
        <ChevronRight size={18} className="text-[#6d6f7b]" />
      </button>
    </div>
  );
}
