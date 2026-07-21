"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Clock } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
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
// (Matches the Figma chart vector's stroke exactly.)
const CHART_LINE_COLOR = "#541D7A";
// Theme `secondary` — for axis/tick text inside recharts SVG.
const CHART_MUTED_COLOR = "#717178";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** "12:00 AM" — uppercase meridiem, per the Figma header row. */
function formatTime(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

/** "12:00 am" — lowercase, per the Figma chart pills. */
const formatPillTime = (iso) => formatTime(iso).toLowerCase();

/** "12 am" — hour-only labels between the chart pills. */
function formatHourLabel(date) {
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", { hour: "numeric", hour12: true }).toLowerCase();
}

function formatHeaderDate(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Activity";
  return d.toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short" });
}

/** "30:00 m" — mm:ss per the Figma duration readout. */
function formatDuration(durationMin) {
  const totalSec = Math.round((Number(durationMin) || 0) * 60);
  const mm = Math.floor(totalSec / 60);
  const ss = String(totalSec % 60).padStart(2, "0");
  return `${mm}:${ss} m`;
}

/* Custom X-axis tick: black time pill for first & last, hour labels between. */
function PillTick({ x, y, payload, data, startLabel, endLabel, hourLabelFor }) {
  // Compare by value — with an explicit `ticks` array, payload.index counts
  // ticks (0..4), not data points, so an index check misses the last one.
  const isFirst = payload.value === data[0].minute;
  const isLast = payload.value === data[data.length - 1].minute;

  if (isFirst || isLast) {
    const label = isFirst ? startLabel : endLabel;
    const pillW = Math.max(52, label.length * 6.5 + 16);
    const pillH = 20;
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
          fontSize={11}
          fontWeight={500}
        >
          {label}
        </text>
      </g>
    );
  }

  return (
    <text x={x} y={y + 14} textAnchor="middle" fill={CHART_MUTED_COLOR} fontSize={12}>
      {hourLabelFor(payload.value)}
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

  const startLabel = formatPillTime(startTime) || "start";
  const endLabel = formatPillTime(endTime) || "end";

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

  // "12 am"-style label for a minute offset into the workout.
  const hourLabelFor = (minute) => {
    const start = new Date(startTime);
    if (isNaN(start.getTime())) return `${minute}m`;
    return formatHourLabel(new Date(start.getTime() + minute * 60000));
  };

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
    <div className="mx-auto min-h-screen w-full sm:max-w-md bg-pageBackground pb-24 font-sans lg:relative lg:grid lg:min-h-0 lg:max-w-[1000px] lg:grid-cols-2 lg:items-start lg:gap-x-10">
      {/* Header: back + centered date */}
      <div className="flex items-center justify-between px-3 pb-1 pt-[max(env(safe-area-inset-top,0px),12px)] lg:col-span-2 lg:row-start-1">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/60"
        >
          <ChevronLeft size={22} className="text-black" />
        </button>
        <h1 className="text-base font-medium text-black">{formatHeaderDate(startTime)}</h1>
        <div className="w-9" aria-hidden="true" />
      </div>

      {/* Time range + duration */}
      <div className="flex items-center gap-2 px-5 pt-2 text-xs text-secondary lg:col-start-1 lg:row-start-2">
        <Clock size={11} strokeWidth={2.25} />
        <span className="tracking-[-0.15px]">
          {formatTime(startTime)}-{formatTime(endTime)} • {formatDuration(durationMin)}
        </span>
      </div>

      {/* Activity name */}
      <h2 className="px-5 pt-1 text-2xl font-medium leading-8 text-black lg:col-start-1 lg:row-start-3">{name}</h2>

      {/* Average HR */}
      <div className="flex items-baseline px-5 pt-2 lg:col-start-1 lg:row-start-4">
        <span className="text-[60px] font-medium leading-[72px] tracking-[-1.68px] text-black">
          {avgHR}
        </span>
        <span className="ml-2 text-3xl font-normal tracking-[0.4px] text-black">BPM</span>
        <span className="ml-2 text-xs text-secondary">Average hr</span>
      </div>

      {/* Heart Rate chart — directly on the page background, per Figma */}
      <div className="px-4 pt-8 lg:col-start-2 lg:row-start-2 lg:row-span-4">
        <p className="pb-3 text-center text-sm font-medium text-black">HEART RATE</p>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hrData} margin={{ top: 10, right: 8, left: 0, bottom: 22 }}>
              <XAxis
                dataKey="minute"
                tick={
                  <PillTick
                    data={hrData}
                    startLabel={startLabel}
                    endLabel={endLabel}
                    hourLabelFor={hourLabelFor}
                  />
                }
                axisLine={false}
                tickLine={false}
                ticks={tickMinutes}
              />
              <YAxis
                domain={[70, 100]}
                ticks={[70, 80, 90, 100]}
                tick={{ fontSize: 12, fill: CHART_MUTED_COLOR }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <ReferenceLine
                y={avgHR}
                stroke={CHART_MUTED_COLOR}
                strokeOpacity={0.5}
                strokeDasharray="2 3"
                strokeWidth={1}
              />
              <Line
                type="monotone"
                dataKey="bpm"
                stroke={CHART_LINE_COLOR}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Post-Workout Hydration Summary */}
      <div className="px-5 pt-6 lg:col-start-1 lg:row-start-5">
        <h3 className="text-base font-medium leading-6 text-black">
          Post-Workout Hydration Summary
        </h3>
        <div className="mt-2 space-y-0.5 text-xs font-medium leading-4 tracking-[-0.3px] text-black">
          <p>
            Sweat Loss : <span className="font-normal">{DUMMY_SWEAT_LOSS}</span>
          </p>
          <p>
            Recommended Water Intake :{" "}
            <span className="font-normal">{DUMMY_WATER_INTAKE}</span>
          </p>
        </div>
        <p className="mt-3 text-xs font-normal leading-4 tracking-[-0.15px] text-black">
          Tip: Add electrolytes for better hydration and recovery!
        </p>
      </div>

      {/* Remove */}
      <div className="px-5 pb-8 pt-10 lg:col-span-2 lg:row-start-6">
        <button
          type="button"
          onClick={handleRemove}
          disabled={removing}
          className="text-base font-medium text-red-500 transition hover:opacity-70 disabled:opacity-50"
        >
          {removing ? "Removing…" : "Remove"}
        </button>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>

      {/* Floating AI button */}
      <button
        type="button"
        onClick={() => setShowAI(true)}
        aria-label="Post-workout recovery insights"
        className="fixed lg:absolute bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0px_0px_7.5px_rgba(0,0,0,0.1)] transition hover:scale-105 active:scale-95"
      >
        {/* Composite of the Figma gemini-logo assets (see design refs) */}
        <img src="/assets/insights/gemini-ai.webp" alt="" className="h-6 w-6" />
      </button>

      {showAI && (
        <AIPostWorkoutSheet activity={activity} userId={userId} onClose={() => setShowAI(false)} />
      )}
    </div>
  );
}
