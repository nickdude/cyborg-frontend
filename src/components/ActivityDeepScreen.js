"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
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

/** Generate sample HR data from an average BPM. */
function generateHRData(avgBPM = 87, durationMin = 24) {
  const points = [];
  const intervals = Math.max(10, Math.min(durationMin, 60));
  for (let i = 0; i <= intervals; i++) {
    const t = (i / intervals) * durationMin;
    const phase = i / intervals;
    let bpm;
    if (phase < 0.15) {
      bpm = avgBPM - 15 + (phase / 0.15) * 15;
    } else if (phase > 0.85) {
      bpm = avgBPM + 8 - ((phase - 0.85) / 0.15) * 20;
    } else {
      bpm = avgBPM + Math.sin(phase * Math.PI * 3) * 10;
    }
    bpm += (Math.random() - 0.5) * 6;
    points.push({
      minute: Math.round(t),
      bpm: Math.round(Math.max(60, Math.min(200, bpm))),
    });
  }
  return points;
}

/* ------------------------------------------------------------------ */
/* Custom X-axis tick: black pill for first & last, plain for others   */
/* ------------------------------------------------------------------ */

function PillTick({ x, y, payload, data }) {
  const isFirst = payload.index === 0;
  const isLast = payload.index === data.length - 1;
  const label = `${payload.value}m`;

  if (isFirst || isLast) {
    const pillW = 62;
    const pillH = 22;
    return (
      <g transform={`translate(${x},${y + 8})`}>
        <rect
          x={-pillW / 2}
          y={-pillH / 2}
          width={pillW}
          height={pillH}
          rx={pillH / 2}
          fill="#000"
        />
        <text
          x={0}
          y={0}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize={10}
          fontWeight={600}
        >
          {isFirst ? "12:00 am" : "12:24 am"}
        </text>
      </g>
    );
  }

  return (
    <text x={x} y={y + 12} textAnchor="middle" fill="#9ca3af" fontSize={10}>
      {label}
    </text>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ActivityDeepScreen({ activity, userId, onBack }) {
  const [showAI, setShowAI] = useState(false);

  const name = activity?.name || "Activity";
  const startTime = activity?.startTime;
  const endTime = activity?.endTime;
  const durationMin = activity?.durationMinutes || 24;
  const avgHR = activity?.avgHeartRate || 87;
  const sweatLoss = activity?.sweatLossMl || 450;
  const recommendedIntake = activity?.recommendedIntakeMl || 600;

  const hrData = useMemo(() => generateHRData(avgHR, durationMin), [avgHR, durationMin]);

  return (
    <div className="mx-auto min-h-screen w-full max-w-md pb-24 font-inter" style={{ backgroundColor: "#F2F2F2" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-2 pt-[max(env(safe-area-inset-top,0px),12px)]">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/60"
        >
          <ArrowLeft size={20} className="text-black" />
        </button>
        <h1 className="flex-1 text-base font-semibold text-black">{name}</h1>
      </div>

      {/* Large BPM display */}
      <div className="px-5 pt-4 pb-1 text-center">
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-[55px] font-bold leading-none text-black">{avgHR}</span>
          <span className="text-[28px] font-semibold text-black">BPM</span>
        </div>
        <p className="mt-1 text-sm text-[#9ca3af]">Average hr</p>
      </div>

      {/* HEART RATE header */}
      <div className="px-4 pt-5 pb-2">
        <p className="text-center text-xs font-bold uppercase tracking-[0.15em] text-black">
          Heart Rate
        </p>
      </div>

      {/* Heart Rate Chart */}
      <div className="mx-4 rounded-2xl bg-white p-4">
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hrData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <XAxis
                dataKey="minute"
                tick={<PillTick data={hrData} />}
                axisLine={false}
                tickLine={false}
                interval={Math.max(0, hrData.length - 2)}
                ticks={[hrData[0]?.minute, hrData[hrData.length - 1]?.minute]}
              />
              <YAxis
                domain={[70, 100]}
                ticks={[70, 80, 90, 100]}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <ReferenceLine
                y={avgHR}
                stroke="#9ca3af"
                strokeDasharray="6 4"
                strokeWidth={1}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                formatter={(val) => [`${val} BPM`, "Heart Rate"]}
                labelFormatter={(v) => `${v} min`}
              />
              <Line
                type="monotone"
                dataKey="bpm"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Post-Workout Hydration Summary */}
      <div className="px-5 pt-6">
        <h3 className="text-lg font-bold text-black">Post-Workout Hydration Summary</h3>
        <div className="mt-3 space-y-2">
          <p className="text-sm text-[#3c3c43]">
            <span className="font-semibold">Sweat Loss:</span>{" "}
            {sweatLoss} ml estimated
          </p>
          <p className="text-sm text-[#3c3c43]">
            <span className="font-semibold">Recommended Intake:</span>{" "}
            {recommendedIntake} ml of water within the next 2 hours to fully rehydrate.
          </p>
        </div>
      </div>

      {/* Remove link */}
      <div className="mx-4 mt-8">
        <button
          type="button"
          className="flex w-full items-center justify-center py-3 text-sm font-medium text-red-500 transition hover:opacity-70"
        >
          Remove
        </button>
      </div>

      {/* Floating Gemini AI button */}
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
