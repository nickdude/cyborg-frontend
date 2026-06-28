"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { activityAPI } from "@/services/api";

function toLocalDatetimeString(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function ActivityDetailScreen({ activity, userId, onSave, onBack }) {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Defer current-time defaults to the client to avoid hydration mismatch
  // (server time != client time when computed during render).
  useEffect(() => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    setStartTime(toLocalDatetimeString(now));
    setEndTime(toLocalDatetimeString(oneHourLater));
  }, []);

  const handleSave = async () => {
    if (!userId || !activity) return;
    setSaving(true);
    setError("");
    try {
      await activityAPI.create(userId, {
        name: activity.name,
        category: activity.category || "Other",
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      });
      onSave?.();
    } catch (err) {
      setError(err?.message || "Could not save activity. Try again.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-3 pt-[max(env(safe-area-inset-top,0px),12px)]">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#f6f7fb]"
        >
          <ArrowLeft size={20} className="text-black" />
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-black/85 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <h1 className="mt-2 text-2xl font-bold text-black">{activity.name}</h1>
        {activity.category && (
          <span className="mt-1 inline-block rounded-full bg-[#f6f7fb] px-3 py-0.5 text-xs font-medium text-[#6d6f7b]">
            {activity.category}
          </span>
        )}

        <div className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="start-time"
              className="mb-1.5 block text-sm font-medium text-[#6d6f7b]"
            >
              Start Time
            </label>
            <input
              id="start-time"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-xl border border-borderColor bg-[#f6f7fb] px-3 py-2.5 text-sm text-black outline-none focus:border-black"
            />
          </div>

          <div>
            <label
              htmlFor="end-time"
              className="mb-1.5 block text-sm font-medium text-[#6d6f7b]"
            >
              End Time
            </label>
            <input
              id="end-time"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-xl border border-borderColor bg-[#f6f7fb] px-3 py-2.5 text-sm text-black outline-none focus:border-black"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 text-center text-sm text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
}
