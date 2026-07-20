"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { activityAPI } from "@/services/api";

// No weight on the profile yet — estimates assume 70 kg (calories = MET × kg × hours).
const DEFAULT_WEIGHT_KG = 70;

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

// The pill shows "12:24 PM" like the frame; a short date prefix appears only
// when the picked date isn't today (the hidden datetime-local input can move it).
function formatPillTime(value) {
  const d = new Date(value);
  if (!value || isNaN(d.getTime())) return "--:--";
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (sameDay) return time;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${time}`;
}

// Label row + white pill control per the frame; the pill is a real
// datetime-local input laid invisibly over it so the native picker opens.
function TimeRow({ id, label, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="text-sm font-medium text-black">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="datetime-local"
          value={value}
          onChange={onChange}
          onClick={(e) => e.currentTarget.showPicker?.()}
          className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        />
        <div className="flex h-8 min-w-[78px] items-center justify-center rounded-full border border-borderColor bg-white px-3 text-xs font-semibold text-black peer-focus:border-black">
          {formatPillTime(value)}
        </div>
      </div>
    </div>
  );
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-pageBackground">
      <div className="mx-auto w-full max-w-md pb-8">
        {/* Header: back + black Save pill */}
        <div className="flex items-center justify-between px-3 pt-[max(env(safe-area-inset-top,0px),12px)]">
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/60"
          >
            <ChevronLeft size={22} className="text-black" />
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || durationMinutes == null}
            className="mr-2 flex h-8 items-center justify-center rounded-[5px] bg-black px-4 text-sm font-medium text-white transition hover:bg-black/85 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        <div className="px-5">
          {/* Activity name + eyebrow */}
          <h1 className="mt-10 text-base font-medium leading-6 text-black">
            {activity.name}
          </h1>
          <p className="mt-1 text-xs font-semibold uppercase text-secondary">
            EDIT ACTIVITY
          </p>

          {/* Time rows */}
          <div className="mt-7 space-y-3">
            <TimeRow
              id="start-time"
              label="Select Start Time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <TimeRow
              id="end-time"
              label="Select End Time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          {/* Retained duration + calorie estimate, compacted to fit the frame */}
          {durationMinutes != null ? (
            <p className="mt-5 text-xs font-medium text-secondary">
              {formatDuration(durationMinutes)}
              {estKcal != null && <> · ~{estKcal} kcal</>}
            </p>
          ) : startTime && endTime ? (
            // Only a genuine bad range — not the pre-hydration empty fields.
            <p className="mt-5 text-xs text-biomarkerOutOfRange">
              End time must be after the start time.
            </p>
          ) : null}

          {error && (
            <p className="mt-4 text-sm text-biomarkerOutOfRange">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
