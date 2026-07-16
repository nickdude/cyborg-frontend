"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Flame, Clock } from "lucide-react";
import { activityAPI } from "@/services/api";
import { MACRO_META } from "@/components/food/macros";

// No weight on the profile yet — estimates assume 70 kg (calories = MET × kg × hours).
const DEFAULT_WEIGHT_KG = 70;
const CALORIES_COLOR = MACRO_META.find((m) => m.key === "calories").color;

function toLocalDatetimeString(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m} min`;
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

  const { durationMinutes, estKcal } = useMemo(() => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return { durationMinutes: null, estKcal: null };
    }
    const mins = Math.round((end - start) / 60000);
    const met = Number(activity?.metPerHour);
    const kcal = Number.isFinite(met) && met > 0
      ? Math.round((met * DEFAULT_WEIGHT_KG * mins) / 60)
      : null;
    return { durationMinutes: mins, estKcal: kcal };
  }, [startTime, endTime, activity]);

  const handleSave = async () => {
    if (!userId || !activity) return;
    setSaving(true);
    setError("");
    try {
      await activityAPI.create(userId, {
        name: activity.name,
        category: activity.category || "other",
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        ...(estKcal != null ? { caloriesBurned: estKcal } : {}),
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
          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-pageBackground"
        >
          <ArrowLeft size={20} className="text-black" />
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || durationMinutes == null}
          className="rounded-xl bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-black/85 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <h1 className="mt-2 text-2xl font-bold text-black">{activity.name}</h1>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-secondary">
          Edit Activity
        </p>

        <div className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="start-time"
              className="mb-1.5 block text-sm font-medium text-secondary"
            >
              Select Start Time
            </label>
            <input
              id="start-time"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-xl border border-borderColor bg-pageBackground px-3 py-2.5 text-sm text-black outline-none focus:border-black"
            />
          </div>

          <div>
            <label
              htmlFor="end-time"
              className="mb-1.5 block text-sm font-medium text-secondary"
            >
              Select End Time
            </label>
            <input
              id="end-time"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-xl border border-borderColor bg-pageBackground px-3 py-2.5 text-sm text-black outline-none focus:border-black"
            />
          </div>

          {durationMinutes != null ? (
            <div className="flex items-center gap-4 rounded-xl bg-pageBackground px-3 py-3">
              <span className="flex items-center gap-1.5 text-sm text-ink">
                <Clock size={15} className="text-secondary" />
                {formatDuration(durationMinutes)}
              </span>
              {estKcal != null && (
                <span className="flex items-center gap-1.5 text-sm text-ink">
                  <Flame size={15} color={CALORIES_COLOR} />
                  ~{estKcal} kcal
                </span>
              )}
            </div>
          ) : startTime && endTime ? (
            // Only a genuine bad range — not the pre-hydration empty fields.
            <p className="text-sm text-biomarkerOutOfRange">
              End time must be after the start time.
            </p>
          ) : null}
        </div>

        {error && (
          <p className="mt-4 text-center text-sm text-biomarkerOutOfRange">{error}</p>
        )}
      </div>
    </div>
  );
}
