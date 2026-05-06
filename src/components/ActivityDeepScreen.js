"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Clock, Heart, Droplets, Sparkles, Trash2 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import AIPostWorkoutSheet from "./AIPostWorkoutSheet";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatTime(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
}

function formatDuration(minutes) {
  if (minutes == null) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

/** Generate sample HR data from an average BPM. */
function generateHRData(avgBPM = 87, durationMin = 60) {
  const points = [];
  const intervals = Math.max(10, Math.min(durationMin, 60));
  for (let i = 0; i <= intervals; i++) {
    const t = (i / intervals) * durationMin;
    // Simulate warmup -> peak -> cooldown curve with noise
    const phase = i / intervals;
    let bpm;
    if (phase < 0.15) {
      // Warmup
      bpm = avgBPM - 20 + (phase / 0.15) * 20;
    } else if (phase > 0.85) {
      // Cooldown
      bpm = avgBPM + 10 - ((phase - 0.85) / 0.15) * 25;
    } else {
      // Main workout
      bpm = avgBPM + Math.sin(phase * Math.PI * 3) * 12;
    }
    // Add small random noise
    bpm += (Math.random() - 0.5) * 8;
    points.push({
      minute: Math.round(t),
      bpm: Math.round(Math.max(60, Math.min(200, bpm))),
    });
  }
  return points;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

/**
 * ActivityDeepScreen
 *
 * Activity detail screen with:
 * - Activity name + category
 * - Time range + duration
 * - Heart Rate chart (recharts LineChart)
 * - Hydration summary
 * - Medical disclaimer
 * - Remove link
 * - Floating AI button -> AIPostWorkoutSheet
 *
 * @param {object}   activity - Full activity object
 * @param {string}   userId
 * @param {function} onBack
 */
export default function ActivityDeepScreen({ activity, userId, onBack }) {
  const [showAI, setShowAI] = useState(false);

  const name = activity?.name || "Activity";
  const category = activity?.category || "";
  const startTime = activity?.startTime;
  const endTime = activity?.endTime;
  const durationMin = activity?.durationMinutes;
  const avgHR = activity?.avgHeartRate || 87;
  const hydrationMl = activity?.hydrationMl;

  const hrData = useMemo(() => generateHRData(avgHR, durationMin || 60), [avgHR, durationMin]);

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-[#f4f5f9] pb-24 font-inter">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-3 pt-[max(env(safe-area-inset-top,0px),12px)]">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#f6f7fb]"
        >
          <ArrowLeft size={20} className="text-black" />
        </button>
        <h1 className="flex-1 text-base font-semibold text-[#14151a]">Activity Details</h1>
      </div>

      {/* Activity name + category */}
      <div className="px-4">
        <h2 className="text-2xl font-bold text-black">{name}</h2>
        {category && (
          <span className="mt-1 inline-block rounded-full bg-[#e8e9f0] px-3 py-0.5 text-xs font-medium text-[#6d6f7b]">
            {category}
          </span>
        )}
      </div>

      {/* Time range + duration */}
      <div className="mx-4 mt-4 flex items-center gap-4 rounded-2xl border border-borderColor bg-white p-4">
        <Clock size={18} className="text-[#6d6f7b]" />
        <div>
          <p className="text-sm font-medium text-[#14151a]">
            {startTime ? formatTime(startTime) : "--"} - {endTime ? formatTime(endTime) : "--"}
          </p>
          {durationMin != null && (
            <p className="text-xs text-[#6d6f7b]">
              Duration: {formatDuration(durationMin)}
            </p>
          )}
        </div>
      </div>

      {/* Heart Rate section */}
      <div className="mx-4 mt-4 rounded-2xl border border-borderColor bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart size={16} className="text-red-500" />
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6d6f7b]">
              Heart Rate
            </p>
          </div>
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-500">
            {avgHR} BPM avg
          </span>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hrData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="minute"
                tick={{ fontSize: 10, fill: "#6d6f7b" }}
                tickFormatter={(v) => `${v}m`}
              />
              <YAxis
                domain={["dataMin - 10", "dataMax + 10"]}
                tick={{ fontSize: 10, fill: "#6d6f7b" }}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(val) => [`${val} BPM`, "Heart Rate"]}
                labelFormatter={(v) => `${v} min`}
              />
              <Line
                type="monotone"
                dataKey="bpm"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#ef4444" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hydration summary */}
      <div className="mx-4 mt-4 rounded-2xl border border-borderColor bg-white p-4">
        <div className="flex items-center gap-2">
          <Droplets size={16} className="text-blue-500" />
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6d6f7b]">
            Hydration
          </p>
        </div>
        <p className="mt-2 text-sm text-[#14151a]">
          {hydrationMl != null
            ? `${hydrationMl} ml consumed during workout`
            : "No hydration data tracked for this session. Consider logging water intake next time."}
        </p>
      </div>

      {/* Medical disclaimer */}
      <div className="mx-4 mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs leading-relaxed text-amber-800">
          This data is for informational purposes only and should not be used as a substitute
          for professional medical advice. Always consult with a healthcare provider before
          making changes to your fitness or health routine.
        </p>
      </div>

      {/* Remove link */}
      <div className="mx-4 mt-5">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-red-500 transition hover:bg-red-50"
        >
          <Trash2 size={14} />
          Remove Activity
        </button>
      </div>

      {/* Floating AI button */}
      <button
        type="button"
        onClick={() => setShowAI(true)}
        aria-label="AI analysis"
        className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg transition hover:scale-105 active:scale-95"
      >
        <Sparkles size={22} className="text-white" />
      </button>

      {/* AI Post Workout Sheet */}
      {showAI && (
        <AIPostWorkoutSheet
          activity={activity}
          userId={userId}
          onClose={() => setShowAI(false)}
        />
      )}
    </div>
  );
}
