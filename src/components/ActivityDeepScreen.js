"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Sparkles, TriangleAlert } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
} from "recharts";
import { activityAPI } from "@/services/api";
import AIPostWorkoutSheet from "./AIPostWorkoutSheet";

/* ------------------------------------------------------------------ */
/* Dummy wearable data                                                  */
/*                                                                      */
/* Wearables aren't integrated yet — the heart-rate trace, sweat loss   */
/* and water-intake figures are hard-coded placeholders (identical for  */
/* every user) so the screen matches the final design. Replace with     */
/* device data when the wearables pipeline lands.                       */
/* ------------------------------------------------------------------ */

const DUMMY_AVG_BPM = 87;
const DUMMY_SWEAT_LOSS = "~450 ml";
const DUMMY_WATER_INTAKE = "600–750 ml over the next 2 hours";
// Fixed BPM samples spread across the workout — deterministic so the
// server and client render the identical chart (no Math.random()).
const DUMMY_HR_WAVE = [
  78, 80, 83, 86, 90, 92, 91, 89, 87, 85, 88, 91, 93, 92, 90,
  88, 86, 87, 89, 90, 88, 85, 83, 81, 79,
];
// Theme `primary` — recharts takes literal color values, not classes.
const CHART_LINE_COLOR = "#541D7A";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatTime(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase();
}

function formatHeaderDate(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Activity";
  return d.toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short" });
}

/* Custom X-axis tick: black time pill for first & last, plain minutes between. */
function PillTick({ x, y, payload, data, startLabel, endLabel }) {
  // Compare by value — with an explicit `ticks` array, payload.index counts
  // ticks (0..4), not data points, so an index check misses the last one.
  const isFirst = payload.value === data[0].minute;
  const isLast = payload.value === data[data.length - 1].minute;

  if (isFirst || isLast) {
    const label = isFirst ? startLabel : endLabel;
    const pillW = Math.max(52, label.length * 6 + 16);
    const pillH = 22;
    // Keep the edge pills inside the plot area.
    const shift = isFirst ? pillW / 2 - 10 : -(pillW / 2 - 10);
    return (
      <g transform={`translate(${x + shift},${y + 10})`}>
        <rect x={-pillW / 2} y={-pillH / 2} width={pillW} height={pillH} rx={pillH / 2} fill="#000" />
        <text
          x={0}
          y={0}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize={10}
          fontWeight={600}
        >
          {label}
        </text>
      </g>
    );
  }

  return (
    <text x={x} y={y + 14} textAnchor="middle" fill="#9ca3af" fontSize={10}>
      {payload.value}m
    </text>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ActivityDeepScreen({ activity, userId, onBack }) {
  const router = useRouter();
  const [showAI, setShowAI] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");

  const name = activity?.name || "Activity";
  const startTime = activity?.startTime;
  const endTime = activity?.endTime;
  const durationMin = activity?.durationMinutes || 30;
  const avgHR = DUMMY_AVG_BPM;

  const startLabel = formatTime(startTime) || "start";
  const endLabel = formatTime(endTime) || "end";

  // Spread the fixed wave across the real workout duration.
  const hrData = useMemo(
    () =>
      DUMMY_HR_WAVE.map((bpm, i) => ({
        minute: Math.round((i / (DUMMY_HR_WAVE.length - 1)) * durationMin),
        bpm,
      })),
    [durationMin]
  );
  const tickMinutes = useMemo(() => {
    const last = hrData.length - 1;
    return [0, 0.25, 0.5, 0.75, 1].map((f) => hrData[Math.round(f * last)].minute);
  }, [hrData]);

  const handleRemove = async () => {
    if (removing) return;
    if (!window.confirm(`Remove "${name}" from your log?`)) return;
    setRemoving(true);
    setError("");
    try {
      await activityAPI.delete(userId, activity._id || activity.id);
      router.replace("/dashboard");
    } catch (err) {
      setError(err?.message || "Could not remove the activity. Try again.");
      setRemoving(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-pageBackground pb-24 font-sans">
      {/* Header: back + centered date */}
      <div className="flex items-center justify-between px-4 pb-2 pt-[max(env(safe-area-inset-top,0px),12px)]">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/60"
        >
          <ArrowLeft size={20} className="text-black" />
        </button>
        <h1 className="text-base font-bold text-black">{formatHeaderDate(startTime)}</h1>
        <div className="w-9" aria-hidden="true" />
      </div>

      {/* Time range + duration */}
      <div className="flex items-center gap-1.5 px-5 pt-1 text-xs text-secondary">
        <Clock size={13} />
        <span>
          {startLabel}–{endLabel} · {durationMin} min
        </span>
      </div>

      {/* Activity name */}
      <h2 className="px-5 pt-1 text-2xl font-semibold text-ink">{name}</h2>

      {/* Average HR */}
      <div className="flex items-baseline gap-2 px-5 pt-4">
        <span className="text-6xl font-bold tracking-tighter text-black">{avgHR}</span>
        <span className="text-2xl font-normal text-black">BPM</span>
        <span className="ml-1 text-xs text-secondary">Average hr</span>
      </div>

      {/* Heart Rate chart */}
      <div className="px-4 pt-8">
        <p className="pb-3 text-center text-xs font-bold uppercase tracking-[0.15em] text-black">
          Heart Rate
        </p>
        <div className="rounded-2xl bg-white p-4">
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hrData} margin={{ top: 10, right: 10, left: -4, bottom: 22 }}>
                <XAxis
                  dataKey="minute"
                  tick={<PillTick data={hrData} startLabel={startLabel} endLabel={endLabel} />}
                  axisLine={false}
                  tickLine={false}
                  ticks={tickMinutes}
                />
                <YAxis
                  domain={[70, 100]}
                  ticks={[70, 80, 90, 100]}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <ReferenceLine y={avgHR} stroke="#9ca3af" strokeDasharray="6 4" strokeWidth={1} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E6E6E8" }}
                  formatter={(val) => [`${val} BPM`, "Heart Rate"]}
                  labelFormatter={(v) => `${v} min`}
                />
                <Line
                  type="monotone"
                  dataKey="bpm"
                  stroke={CHART_LINE_COLOR}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: CHART_LINE_COLOR, stroke: "#fff", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Post-Workout Hydration Summary */}
      <div className="px-5 pt-8">
        <h3 className="text-base font-bold text-ink">Post-Workout Hydration Summary</h3>
        <div className="mt-2 space-y-1 text-sm text-ink">
          <p>
            <span className="font-bold">Sweat Loss :</span> {DUMMY_SWEAT_LOSS}
          </p>
          <p>
            <span className="font-bold">Recommended Water Intake :</span> {DUMMY_WATER_INTAKE}
          </p>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-ink">
          Tip: Add electrolytes for better hydration and recovery!
        </p>
        <div className="mt-5 flex items-start gap-1.5 text-[10px] italic text-secondary">
          <TriangleAlert size={12} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold not-italic">Disclaimer</p>
            <p>
              This is a predicted value and may not be 100% accurate. Individual hydration needs
              may vary.
            </p>
          </div>
        </div>
      </div>

      {/* Remove */}
      <div className="px-5 pb-8 pt-10">
        <button
          type="button"
          onClick={handleRemove}
          disabled={removing}
          className="text-lg font-semibold text-biomarkerOutOfRange transition hover:opacity-70 disabled:opacity-50"
        >
          {removing ? "Removing…" : "Remove"}
        </button>
        {error && <p className="mt-2 text-sm text-biomarkerOutOfRange">{error}</p>}
      </div>

      {/* Floating AI button */}
      <button
        type="button"
        onClick={() => setShowAI(true)}
        aria-label="Post-workout recovery insights"
        className="fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-borderColor bg-white shadow-lg transition hover:scale-105 active:scale-95"
      >
        <Sparkles size={22} className="text-primary" fill="currentColor" />
      </button>

      {showAI && (
        <AIPostWorkoutSheet activity={activity} userId={userId} onClose={() => setShowAI(false)} />
      )}
    </div>
  );
}
