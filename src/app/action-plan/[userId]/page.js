"use client";

export const dynamic = "force-dynamic";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { actionPlanAPI } from "@/services/api";
import Navbar from "@/components/Navbar";
import Image from "next/image";

const SECTION_IMAGES = [
  "/images/action-plan/section-1.png",
  "/images/action-plan/section-2.png",
  "/images/action-plan/section-3.png",
  "/images/action-plan/section-4.png",
  "/images/action-plan/section-5.png",
];

const SECTION_FALLBACKS = [
  "from-[#F4A261] via-[#F9C49B] to-[#F5B8A0]",
  "from-[#C5B3CC] via-[#D9CDA5] to-[#D4C89B]",
  "from-[#5A4A3F] via-[#6B5B50] to-[#3D5A5A]",
  "from-[#8B0000] via-[#C41E1E] to-[#DC2626]",
  "from-[#F4A261] via-[#F9C49B] to-[#F5C89B]",
];

/* ── Section Banner Card (image includes text from Figma) ── */
function SectionBanner({ number, total, title, index = 0 }) {
  const [imgError, setImgError] = useState(false);

  if (!imgError) {
    return (
      <div className="rounded-2xl overflow-hidden">
        <Image
          src={SECTION_IMAGES[index]}
          alt={`${number} of ${total} — ${title}`}
          width={320}
          height={112}
          className="w-full h-auto rounded-2xl"
          onError={() => setImgError(true)}
          priority={index === 0}
        />
      </div>
    );
  }

  return (
    <div className={`rounded-2xl overflow-hidden h-28 bg-gradient-to-r ${SECTION_FALLBACKS[index]}`}>
      <div className="px-6 py-5 h-full flex flex-col justify-center">
        <p className="text-sm font-semibold text-white/80">{number} of {total}</p>
        <h2 className="text-2xl font-bold text-white mt-1">{title}</h2>
      </div>
    </div>
  );
}

/* ── Biomarker Evidence Card ─────────────────────────────── */
function BiomarkerCard({ biomarker }) {
  const { name, value, unit, flag, referenceMin, referenceMax, optimalMin, optimalMax } = biomarker;

  const flagColors = {
    "Out of range": { dot: "bg-red-500", text: "text-red-600" },
    "Elevated": { dot: "bg-amber-500", text: "text-amber-600" },
    "Low": { dot: "bg-red-500", text: "text-red-600" },
    "High": { dot: "bg-amber-500", text: "text-amber-600" },
    "Normal": { dot: "bg-emerald-500", text: "text-emerald-600" },
    "Optimal": { dot: "bg-blue-500", text: "text-blue-600" },
  };

  const style = flagColors[flag] || { dot: "bg-gray-400", text: "text-gray-500" };

  const lo = referenceMin ?? 0;
  const hi = referenceMax ?? (value * 2 || 100);
  const span = hi - lo || 1;
  const pct = Math.max(2, Math.min(98, ((value - lo) / span) * 100));

  const optLo = optimalMin != null ? Math.max(0, ((optimalMin - lo) / span) * 100) : null;
  const optHi = optimalMax != null ? Math.min(100, ((optimalMax - lo) / span) * 100) : null;

  return (
    <div className="rounded-xl bg-white border border-gray-100 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${style.dot} shrink-0`} />
          <span className="text-sm font-medium text-gray-900">{name}</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1 ml-4">{value} {unit}</p>
      <div className="relative h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
        {optLo != null && optHi != null && (
          <div
            className="absolute inset-y-0 bg-emerald-100 rounded-full"
            style={{ left: `${optLo}%`, width: `${optHi - optLo}%` }}
          />
        )}
        <div
          className={`absolute w-2.5 h-2.5 rounded-full ${style.dot} -top-[2px] ring-2 ring-white`}
          style={{ left: `calc(${pct}% - 5px)` }}
        />
      </div>
    </div>
  );
}

/* ── Grade Circle ────────────────────────────────────────── */
function GradeCircle({ grade, label }) {
  const colors = {
    A: { ring: "border-emerald-400", text: "text-emerald-600", bg: "bg-emerald-50" },
    B: { ring: "border-yellow-400", text: "text-yellow-600", bg: "bg-yellow-50" },
    C: { ring: "border-orange-400", text: "text-orange-600", bg: "bg-orange-50" },
    D: { ring: "border-red-400", text: "text-red-600", bg: "bg-red-50" },
    F: { ring: "border-red-600", text: "text-red-700", bg: "bg-red-50" },
  };
  const c = colors[grade] || { ring: "border-gray-300", text: "text-gray-500", bg: "bg-gray-50" };
  const displayLabel = label.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());

  return (
    <div className="flex items-center gap-3">
      <div className={`relative w-10 h-10 rounded-full ${c.bg} flex items-center justify-center`}>
        <div className={`absolute inset-0 rounded-full border-2 ${c.ring}`} />
        <span className={`text-sm font-bold ${c.text} relative z-10`}>{grade}</span>
      </div>
      <span className="text-sm text-gray-800">{displayLabel}</span>
    </div>
  );
}

/* ── Priority Badge ──────────────────────────────────────── */
function PriorityBadge({ priority }) {
  const styles = {
    High: "text-red-600 bg-red-50 border-red-200",
    Medium: "text-amber-600 bg-amber-50 border-amber-200",
    Low: "text-emerald-600 bg-emerald-50 border-emerald-200",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${styles[priority] || "text-gray-500 bg-gray-50 border-gray-200"}`}>
      {priority} priority
    </span>
  );
}

/* ── Delta Badge ─────────────────────────────────────────── */
function DeltaBadge({ delta }) {
  if (!delta || delta.status === "new") return null;
  const map = {
    improved: { text: "Improved", cls: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    worsened: { text: "Worsened", cls: "text-red-600 bg-red-50 border-red-200" },
    unchanged: { text: "Unchanged", cls: "text-gray-500 bg-gray-50 border-gray-200" },
    resolved: { text: "Resolved", cls: "text-blue-600 bg-blue-50 border-blue-200" },
  };
  const b = map[delta.status];
  if (!b) return null;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${b.cls}`}>
      {b.text}
    </span>
  );
}

/* ── Goal Status Badge ──────────────────────────────────── */
function GoalStatusBadge({ status }) {
  if (!status || status === "active") return null;
  const map = {
    achieved: { label: "Achieved", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    paused: { label: "Paused", cls: "text-amber-700 bg-amber-50 border-amber-200" },
    archived: { label: "Archived", cls: "text-gray-500 bg-gray-50 border-gray-200" },
  };
  const b = map[status];
  if (!b) return null;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${b.cls}`}>
      {b.label}
    </span>
  );
}

/* ── Clinical Thesis Card ───────────────────────────────── */
function ClinicalThesisCard({ clinicalThesis }) {
  if (!clinicalThesis?.title) return null;
  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#1a1f2e] via-[#1e293b] to-[#0f172a] p-6 shadow-lg">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400/80">Clinical Thesis</p>
      </div>
      <h3 className="text-lg font-bold text-white leading-snug mb-2">{clinicalThesis.title}</h3>
      {clinicalThesis.reasoning && (
        <p className="text-sm text-gray-300 leading-relaxed">{clinicalThesis.reasoning}</p>
      )}
    </div>
  );
}

/* ── Phased Timeline (Checkpoints) ──────────────────────── */
function PhasedTimeline({ checkpoints }) {
  const [activeIdx, setActiveIdx] = useState(null);
  const scrollRef = useRef(null);

  if (!checkpoints?.length) return null;

  const getStepColor = (idx) => {
    if (idx < 0) return { circle: "bg-gray-200 border-gray-300", text: "text-gray-400", line: "bg-gray-200" };
    // For now: first step = completed (green), second = current (amber), rest = future (gray)
    // In real usage, backend would provide a `completed` flag
    if (idx === 0) return { circle: "bg-emerald-500 border-emerald-600", text: "text-white", line: "bg-emerald-300" };
    if (idx === 1) return { circle: "bg-amber-400 border-amber-500", text: "text-white", line: "bg-gray-200" };
    return { circle: "bg-gray-200 border-gray-300", text: "text-gray-400", line: "bg-gray-200" };
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Progress Checkpoints</h3>
      <p className="text-sm text-gray-600 leading-relaxed">
        Your plan is broken into checkpoints. Tap a milestone to see target biomarkers.
      </p>

      {/* Horizontal Stepper */}
      <div ref={scrollRef} className="overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        <div className="flex items-start gap-0 min-w-max">
          {checkpoints.map((cp, idx) => {
            const colors = getStepColor(idx);
            const isActive = activeIdx === idx;
            return (
              <div key={idx} className="flex items-start">
                <button
                  onClick={() => setActiveIdx(isActive ? null : idx)}
                  className="flex flex-col items-center w-20 cursor-pointer group"
                >
                  <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${colors.circle} ${isActive ? "ring-2 ring-offset-2 ring-cyan-400" : ""} group-hover:scale-105`}>
                    <span className={`text-xs font-bold ${colors.text}`}>{cp.weekNumber || idx + 1}</span>
                  </div>
                  <p className="text-[11px] font-medium text-gray-700 mt-1.5 text-center leading-tight">
                    {cp.label || `Week ${cp.weekNumber}`}
                  </p>
                </button>
                {idx < checkpoints.length - 1 && (
                  <div className={`h-0.5 w-8 mt-[18px] ${colors.line} shrink-0`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded Detail */}
      {activeIdx != null && checkpoints[activeIdx] && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-900">
              {checkpoints[activeIdx].label || `Week ${checkpoints[activeIdx].weekNumber}`}
            </h4>
            <span className="text-xs text-gray-400">Week {checkpoints[activeIdx].weekNumber}</span>
          </div>
          {checkpoints[activeIdx].description && (
            <p className="text-sm text-gray-600 leading-relaxed">{checkpoints[activeIdx].description}</p>
          )}
          {checkpoints[activeIdx].targetBiomarkers?.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Target Biomarkers</p>
              <div className="grid grid-cols-1 gap-2">
                {checkpoints[activeIdx].targetBiomarkers.map((tb, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5">
                    <span className="text-xs font-medium text-gray-800">{tb.name}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500">{tb.currentValue}{tb.unit ? ` ${tb.unit}` : ""}</span>
                      <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span className="font-semibold text-emerald-600">{tb.targetValue}{tb.unit ? ` ${tb.unit}` : ""}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Daily Schedule Section ─────────────────────────────── */
function DailyScheduleSection({ dailySchedule }) {
  if (!dailySchedule) return null;

  const slots = [
    { key: "morningFasted", label: "Morning (Fasted)", icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ), gradient: "from-amber-50 to-orange-50", border: "border-amber-200", iconColor: "text-amber-500" },
    { key: "withBreakfast", label: "With Breakfast", icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18v2a4 4 0 01-4 4H7a4 4 0 01-4-4V3zm4 9h10m-5 0v8m-4 0h8" />
      </svg>
    ), gradient: "from-orange-50 to-yellow-50", border: "border-orange-200", iconColor: "text-orange-500" },
    { key: "preWorkout", label: "Pre-Workout", icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ), gradient: "from-yellow-50 to-lime-50", border: "border-yellow-200", iconColor: "text-yellow-600" },
    { key: "withDinner", label: "With Dinner", icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ), gradient: "from-blue-50 to-indigo-50", border: "border-blue-200", iconColor: "text-blue-500" },
    { key: "bedtime", label: "Bedtime", icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ), gradient: "from-indigo-50 to-slate-100", border: "border-indigo-200", iconColor: "text-indigo-500" },
  ];

  const filledSlots = slots.filter(s => dailySchedule[s.key]?.length > 0);
  if (filledSlots.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Your Daily Schedule</h3>
      <p className="text-sm text-gray-600 leading-relaxed">
        When and how to take your supplements for maximum absorption and effect.
      </p>
      <div className="space-y-3">
        {filledSlots.map((slot) => (
          <div key={slot.key} className={`rounded-xl border ${slot.border} bg-gradient-to-r ${slot.gradient} p-4`}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`w-7 h-7 rounded-lg bg-white/80 flex items-center justify-center ${slot.iconColor}`}>
                {slot.icon}
              </div>
              <h4 className="text-sm font-bold text-gray-900">{slot.label}</h4>
              <span className="text-[10px] text-gray-500 ml-auto">{dailySchedule[slot.key].length} item{dailySchedule[slot.key].length !== 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-2">
              {dailySchedule[slot.key].map((item, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/60 rounded-lg px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium text-gray-900">{item.productName}</span>
                      {item.dose && <span className="text-xs text-gray-500 shrink-0">{item.dose}</span>}
                    </div>
                    {item.reason && (
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.reason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Watch-Out Card ─────────────────────────────────────── */
function WatchOutCard({ watchOut }) {
  const severityMap = {
    critical: {
      bg: "bg-red-50",
      border: "border-red-200",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      titleColor: "text-red-900",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      titleColor: "text-amber-900",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      titleColor: "text-blue-900",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const s = severityMap[watchOut.severity] || severityMap.info;

  return (
    <div className={`rounded-xl border ${s.border} ${s.bg} p-4`}>
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg ${s.iconBg} flex items-center justify-center shrink-0 ${s.iconColor}`}>
          {s.icon}
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <h4 className={`text-sm font-bold ${s.titleColor}`}>{watchOut.title}</h4>
          {watchOut.risk && (
            <p className="text-xs text-gray-700 leading-relaxed">{watchOut.risk}</p>
          )}
          {watchOut.mitigation && (
            <div className="pt-1">
              <p className="text-xs font-semibold text-gray-800">What to do:</p>
              <p className="text-xs text-gray-600 leading-relaxed mt-0.5">{watchOut.mitigation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Training Protocol Section ──────────────────────────── */
function TrainingProtocolSection({ trainingProtocol }) {
  if (!trainingProtocol) return null;

  const hasPhases = trainingProtocol.phases?.length > 0;
  const hasZone2 = trainingProtocol.zone2?.protocol;
  const hasWarmUp = trainingProtocol.warmUp?.length > 0;
  const hasCoolDown = trainingProtocol.coolDown?.length > 0;

  if (!hasPhases && !hasZone2 && !hasWarmUp && !hasCoolDown && !trainingProtocol.goal) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Your Training Program</h3>

      {/* Goal & Weekly Summary */}
      {(trainingProtocol.goal || trainingProtocol.weeklySchedule) && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
          {trainingProtocol.goal && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Goal</p>
              <p className="text-sm text-gray-900 font-medium mt-0.5">{trainingProtocol.goal}</p>
            </div>
          )}
          {trainingProtocol.weeklySchedule && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Weekly Schedule</p>
              <p className="text-sm text-gray-700 mt-0.5">{trainingProtocol.weeklySchedule}</p>
            </div>
          )}
        </div>
      )}

      {/* Phase Cards */}
      {hasPhases && (
        <div className="space-y-0">
          {trainingProtocol.phases.map((phase, pIdx) => (
            <TrainingPhaseCard key={pIdx} phase={phase} isLast={pIdx === trainingProtocol.phases.length - 1} />
          ))}
        </div>
      )}

      {/* Zone 2 Cardio */}
      {hasZone2 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h4 className="text-sm font-bold text-gray-900">Zone 2 Cardio</h4>
          </div>
          <p className="text-sm text-gray-700">{trainingProtocol.zone2.protocol}</p>
          {trainingProtocol.zone2.intensity && (
            <p className="text-xs text-gray-500">Intensity: {trainingProtocol.zone2.intensity}</p>
          )}
          {trainingProtocol.zone2.options?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1.5">Options:</p>
              <div className="flex flex-wrap gap-1.5">
                {trainingProtocol.zone2.options.map((opt, i) => (
                  <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                    {opt}
                  </span>
                ))}
              </div>
            </div>
          )}
          {trainingProtocol.zone2.reasoning && (
            <p className="text-xs text-gray-500 leading-relaxed">{trainingProtocol.zone2.reasoning}</p>
          )}
        </div>
      )}

      {/* Warm-Up & Cool-Down */}
      {(hasWarmUp || hasCoolDown) && (
        <div className="grid grid-cols-1 gap-3">
          {hasWarmUp && (
            <div className="rounded-xl bg-gray-50 p-4">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Warm-Up</h4>
              <ul className="space-y-1">
                {trainingProtocol.warmUp.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                    <span className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                    {typeof item === "string" ? item : item.name || item.exercise || JSON.stringify(item)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {hasCoolDown && (
            <div className="rounded-xl bg-gray-50 p-4">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Cool-Down</h4>
              <ul className="space-y-1">
                {trainingProtocol.coolDown.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                    <span className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                    {typeof item === "string" ? item : item.name || item.exercise || JSON.stringify(item)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Training Phase Card (Collapsible) ──────────────────── */
function TrainingPhaseCard({ phase, isLast }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={!isLast ? "border-b border-gray-200" : ""}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-600">{phase.phaseNumber || "?"}</span>
          </div>
          <div className="text-left">
            <h4 className="text-sm font-semibold text-gray-900">
              Phase {phase.phaseNumber}{phase.weeks ? `: Weeks ${phase.weeks}` : ""}
            </h4>
            {phase.focus && <p className="text-xs text-gray-500">{phase.focus}</p>}
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? "max-h-[5000px] opacity-100 pb-4" : "max-h-0 opacity-0"}`}>
        {/* Phase meta */}
        {(phase.tempo || phase.rest) && (
          <div className="flex flex-wrap gap-3 mb-3">
            {phase.tempo && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">Tempo: {phase.tempo}</span>
            )}
            {phase.rest && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">Rest: {phase.rest}</span>
            )}
          </div>
        )}

        {/* Day cards */}
        {phase.days?.map((day, dIdx) => (
          <div key={dIdx} className="mb-3 last:mb-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-gray-800">{day.dayLabel}</span>
              {day.focus && <span className="text-xs text-gray-500">- {day.focus}</span>}
            </div>
            {day.exercises?.length > 0 && (
              <div className="rounded-lg border border-gray-100 overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-12 gap-1 bg-gray-50 px-3 py-1.5">
                  <span className="col-span-5 text-[10px] font-semibold text-gray-500 uppercase">Exercise</span>
                  <span className="col-span-2 text-[10px] font-semibold text-gray-500 uppercase text-center">Sets</span>
                  <span className="col-span-2 text-[10px] font-semibold text-gray-500 uppercase text-center">Reps</span>
                  <span className="col-span-3 text-[10px] font-semibold text-gray-500 uppercase">Cue</span>
                </div>
                {/* Table rows */}
                {day.exercises.map((ex, eIdx) => (
                  <div key={eIdx} className={`grid grid-cols-12 gap-1 px-3 py-2 ${eIdx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <span className="col-span-5 text-xs text-gray-900 font-medium">{ex.name}</span>
                    <span className="col-span-2 text-xs text-gray-600 text-center">{ex.sets || "-"}</span>
                    <span className="col-span-2 text-xs text-gray-600 text-center">{ex.reps || "-"}</span>
                    <span className="col-span-3 text-xs text-gray-500 truncate">{ex.cue || "-"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Achievement Criteria Display ───────────────────────── */
function AchievementCriteria({ criteria }) {
  if (!criteria?.length) return null;
  return (
    <div className="mt-2">
      <p className="text-xs font-bold text-gray-900 mb-1.5">Achievement Criteria:</p>
      <div className="space-y-1">
        {criteria.map((c, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${c.currentlyMet ? "bg-emerald-100" : "bg-gray-100"}`}>
              {c.currentlyMet ? (
                <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="w-1 h-1 rounded-full bg-gray-400" />
              )}
            </span>
            <span className={`${c.currentlyMet ? "text-emerald-700" : "text-gray-600"}`}>
              {c.biomarkerName} {c.operator} {c.threshold}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Accordion ───────────────────────────────────────────── */
function AccordionItem({ title, children, defaultOpen = false, isLast = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={!isLast ? "border-b border-gray-200" : ""}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 cursor-pointer"
      >
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <svg
          className={`w-3 h-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? "max-h-[2000px] opacity-100 pb-4" : "max-h-0 opacity-0"}`}>
        {children}
      </div>
    </div>
  );
}

/* ── Supplement Card ─────────────────────────────────────── */
function SupplementCard({ supplement }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4 space-y-1.5">
      <h4 className="font-bold text-gray-900 text-sm">{supplement.name}</h4>
      {supplement.whatItIs && (
        <p className="text-xs text-gray-600 leading-relaxed">
          <span className="font-semibold text-gray-800">What it is: </span>{supplement.whatItIs}
        </p>
      )}
      {supplement.whyItMatters && (
        <p className="text-xs text-gray-600 leading-relaxed">
          <span className="font-semibold text-gray-800">Why this matters: </span>{supplement.whyItMatters}
        </p>
      )}
      {supplement.howToTake && (
        <p className="text-xs text-gray-600 leading-relaxed">
          <span className="font-semibold text-gray-800">How to take it: </span>{supplement.howToTake}
        </p>
      )}
    </div>
  );
}

/* ── Product Card ────────────────────────────────────────── */
function ProductCard({ product }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{product.productName}</p>
        {product.price != null && (
          <p className="text-xs text-gray-500 mt-0.5">${product.price}</p>
        )}
      </div>
      <div className="w-11 h-11 rounded-lg bg-gray-100 shrink-0 ml-3 overflow-hidden">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.productName} width={44} height={44} className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full bg-gray-200 rounded-lg" />
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                */
/* ══════════════════════════════════════════════════════════ */

export default function ActionPlanPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.userId;
  const planId = searchParams.get("planId");
  const router = useRouter();
  const { token, user, loading: authLoading } = useAuth();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const fetchPlan = useCallback(async () => {
    try {
      let response;
      if (planId) {
        response = await actionPlanAPI.get(planId);
      } else {
        response = await actionPlanAPI.getLatest();
      }

      if (response.data) {
        const data = response.data;
        if (data.status === "ready" || data.status === "approved") {
          setPlan(data);
          setError("");
        } else if (data.status === "awaiting_review") {
          setPlan(data);
          setError("");
        } else if (data.status === "pending" || data.status === "generating") {
          setError("Your action plan is being generated. You'll be notified when it's ready.");
        } else if (data.status === "failed") {
          setError(data.errorMessage || "Failed to generate plan.");
        } else {
          setError("Plan not found.");
        }
      }
    } catch (err) {
      const msg = err.message || err.msg || "Unknown error";
      if (msg.includes("No action plan found")) {
        setError("No action plan yet. Upload a blood report to get started.");
      } else {
        setError("Failed to load plan: " + msg);
      }
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/login");
    } else {
      fetchPlan();
    }
  }, [token, authLoading, planId, fetchPlan, router]);

  const handleDownloadPDF = async () => {
    const id = planId || plan?._id;
    if (!id) return;
    try {
      const blob = await actionPlanAPI.exportPDF(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `action-plan-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setToast({ type: "success", message: "PDF downloaded!" });
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast({ type: "error", message: "PDF export not available yet" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  /* ── Loading ── */
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar backHref="/dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading your action plan...</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Error (no plan) ── */
  if (error && !plan) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar backHref="/dashboard" />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">{error}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-black text-white text-sm px-6 py-2.5 rounded-xl hover:bg-gray-900 transition-colors cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Data ── */
  const userName = user?.firstName || "Member";
  const overview = plan?.overview || {};
  const healthReport = plan?.healthReport || {};
  const monitoredIssues = plan?.monitoredIssues || [];
  const protocol = plan?.protocol || {};
  const nextSteps = plan?.nextSteps || {};
  const categoryGrades = healthReport.categoryGrades || {};
  const isPendingReview = plan?.status === "awaiting_review";
  const clinicalThesis = plan?.clinicalThesis || null;
  const checkpoints = plan?.checkpoints || [];
  const watchOuts = plan?.watchOuts || [];
  const dailySchedule = plan?.dailySchedule || null;
  const trainingProtocol = plan?.trainingProtocol || null;
  const totalProtocolItems = [
    ...(protocol.lifestyle?.sleep || []),
    ...(protocol.lifestyle?.exercise || []),
    ...(protocol.lifestyle?.stress || []),
    ...(protocol.nutrition || []),
    ...(protocol.supplements || []),
    ...(protocol.diagnosticTests || []),
  ].length;

  return (
    <div className="min-h-screen bg-white flex flex-col font-inter">
      <Navbar backHref="/dashboard" />

      {toast && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl shadow-lg text-white text-sm z-50 ${
            toast.type === "success" ? "bg-emerald-500" : "bg-red-500"
          }`}
        >
          {toast.message}
        </div>
      )}

      <main className="flex-1 max-w-md mx-auto w-full px-5 pt-6 pb-20 space-y-6">

        {/* ════ Page Header ════ */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {userName}&apos;s Action Plan
          </h1>
          {plan?.generatedAt && (
            <p className="text-sm text-gray-500 mt-1">
              {new Date(plan.generatedAt).toLocaleDateString("en-US", {
                year: "numeric", month: "short", day: "2-digit",
              })}
            </p>
          )}
        </div>

        {/* ════ Section 1: Overview ════ */}
        <section className="space-y-5">
          <SectionBanner number={1} total={5} title="Overview" index={0} />

          <p className="text-sm text-gray-700 leading-relaxed">
            {overview.intro || "At the core of your Cyborg Health experience is your personal report, which will step through:"}
          </p>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Health Report</h3>
              <p className="text-xs text-gray-600 leading-relaxed mt-0.5">
                An explanation of your Cyborg Score, biological age and biomarkers which track your health across 7 dimensions.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Monitored Issues</h3>
              <p className="text-xs text-gray-600 leading-relaxed mt-0.5">
                The core issues we are monitoring as part of your health based on your data, as well as a root cause analysis.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Protocol</h3>
              <p className="text-xs text-gray-600 leading-relaxed mt-0.5">
                Your custom recommendations and next steps you can take to superpower your health.
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-700 mb-2">Here&apos;s the data we reviewed to create your annual report:</p>
            <ul className="space-y-1.5">
              {(overview.dataSources || [
                "Latest and historical blood test results",
                "Messaging with your care team and Cyborg AI",
                "Your health intake survey responses",
              ]).map((ds, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 shrink-0" />
                  {ds}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ════ Section 2: Health Report ════ */}
        <section className="space-y-5">
          <SectionBanner number={2} total={5} title="Health Report" index={1} />

          <p className="text-sm text-gray-600 leading-relaxed">
            Your Health Report distills your Cyborg Score, Biological Age, and Biomarkers to show how your health tracks across 7 categories.
          </p>

          {/* Score Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500">Cyborg Score</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {healthReport.cyborgScore ?? "—"}
              </p>
              {healthReport.cyborgScore != null && healthReport.cyborgScore >= 80 && (
                <p className="text-[10px] text-emerald-600 mt-1">You&apos;re very healthy. Keep going!</p>
              )}
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500">Biological age</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {healthReport.bioAge?.phenoAge != null
                  ? healthReport.bioAge.phenoAge.toFixed(1)
                  : "—"}
              </p>
              {healthReport.bioAge?.delta != null && (
                <p className={`text-[10px] mt-1 ${healthReport.bioAge.delta <= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {healthReport.bioAge.delta <= 0
                    ? `${Math.abs(healthReport.bioAge.delta).toFixed(1)} years younger than your actual age`
                    : `${healthReport.bioAge.delta.toFixed(1)} years older than your actual age`}
                </p>
              )}
            </div>
          </div>

          {/* Biomarker Summary Bar */}
          {healthReport.markerCounts && (
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-800 mb-3">Biomarkers</p>
              <div className="flex items-baseline gap-6">
                {[
                  { label: "Total", value: healthReport.markerCounts.total, color: "" },
                  { label: "Optimal", value: healthReport.markerCounts.optimal, color: "text-blue-600" },
                  { label: "Normal", value: healthReport.markerCounts.inRange, color: "text-emerald-600" },
                  { label: "Out of Range", value: healthReport.markerCounts.outOfRange, color: "text-red-500" },
                ].map(({ label, value: v, color }) => (
                  <div key={label} className="text-center">
                    <p className={`text-xl font-bold ${color || "text-gray-900"}`}>{v}</p>
                    <p className="text-[10px] text-gray-500">{label}</p>
                  </div>
                ))}
              </div>
              <div className="flex h-1.5 rounded-full overflow-hidden mt-3 bg-gray-100">
                {healthReport.markerCounts.total > 0 && (
                  <>
                    <div className="bg-blue-500" style={{ width: `${(healthReport.markerCounts.optimal / healthReport.markerCounts.total) * 100}%` }} />
                    <div className="bg-emerald-500" style={{ width: `${(healthReport.markerCounts.inRange / healthReport.markerCounts.total) * 100}%` }} />
                    <div className="bg-red-500" style={{ width: `${(healthReport.markerCounts.outOfRange / healthReport.markerCounts.total) * 100}%` }} />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Overview + Category Grades */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Overview</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              We have processed {healthReport.markerCounts?.total || "100+"}  biomarkers to provide you with this comprehensive report.
            </p>

            {Object.keys(categoryGrades).length > 0 && (
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                {Object.entries(categoryGrades).map(([key, val]) => (
                  <GradeCircle key={key} grade={val?.grade || "—"} label={key} />
                ))}
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">Disclaimer</p>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              {nextSteps.disclaimer ||
                "The scores generated under Health Optimization, Nutrition, and Lifestyle are based on your self-reported data and biomarkers. They are not a diagnosis. Always consult your physician before making changes to your health regimen."}
            </p>
          </div>
        </section>

        {/* ════ Clinical Thesis ════ */}
        <ClinicalThesisCard clinicalThesis={clinicalThesis} />

        {/* ════ Section 3: Monitored Issues ════ */}
        <section className="space-y-5">
          <SectionBanner number={3} total={5} title="Monitored Issues" index={2} />

          {isPendingReview ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Your doctor is reviewing your health plan</h3>
              <p className="text-sm text-gray-500">You&apos;ll be notified when your personalized goals are ready.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 leading-relaxed">
                Monitored issues highlight potential health concerns based on your test results to focus on. Think of it as starting points for your health roadmap—pinpointing areas for proactive care.
              </p>

              <p className="text-sm text-gray-700">
                {monitoredIssues.length > 0
                  ? `We detected ${monitoredIssues.length} monitored issue${monitoredIssues.length !== 1 ? "s" : ""} you should be aware of.`
                  : "No monitored issues detected. Your biomarkers look healthy."}
              </p>

              <div className="space-y-6">
                {monitoredIssues.map((issue, idx) => (
                  <div key={issue.goalId || idx} className="space-y-4">
                    {idx > 0 && <hr className="border-gray-200" />}

                    {/* Issue Header */}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-bold text-gray-900 leading-snug flex-1">
                        {idx + 1}. {issue.title}
                      </h3>
                      <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
                        <PriorityBadge priority={issue.priority} />
                        <DeltaBadge delta={issue.delta} />
                        <GoalStatusBadge status={issue.status} />
                      </div>
                    </div>

                    {/* Your result */}
                    {issue.description && (
                      <div>
                        <p className="text-xs font-bold text-gray-900 mb-1">Your result:</p>
                        <p className="text-sm text-gray-600 leading-relaxed">{issue.description}</p>
                      </div>
                    )}

                    {/* Biomarker Evidence */}
                    {issue.biomarkerEvidence?.length > 0 && (
                      <div className="space-y-2">
                        {issue.biomarkerEvidence.map((bm, i) => (
                          <BiomarkerCard key={i} biomarker={bm} />
                        ))}
                      </div>
                    )}

                    {/* What this means */}
                    {issue.whatThisMeans && (
                      <div>
                        <p className="text-xs font-bold text-gray-900 mb-1">What this means:</p>
                        <p className="text-sm text-gray-600 leading-relaxed">{issue.whatThisMeans}</p>
                      </div>
                    )}

                    {/* Potential Causes */}
                    {issue.potentialCauses && (
                      <div>
                        <p className="text-xs font-bold text-gray-900 mb-1">Potential Causes:</p>
                        <p className="text-sm text-gray-600 leading-relaxed">{issue.potentialCauses}</p>
                      </div>
                    )}

                    {/* Recommended Actions */}
                    {issue.recommendedActions?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-gray-900 mb-2">Recommended Actions:</p>
                        <div className="space-y-3">
                          {issue.recommendedActions.map((action, i) => (
                            <div key={i} className="text-sm text-gray-700 leading-relaxed">
                              <span className="font-bold text-gray-900">
                                {action.label}:
                              </span>{" "}
                              {action.detail}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Achievement Criteria */}
                    <AchievementCriteria criteria={issue.achievementCriteria} />
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* ════ Phased Timeline ════ */}
        {!isPendingReview && checkpoints.length > 0 && (
          <section className="space-y-5">
            <PhasedTimeline checkpoints={checkpoints} />
          </section>
        )}

        {/* ════ Daily Supplement Schedule ════ */}
        {!isPendingReview && dailySchedule && (
          <section className="space-y-5">
            <DailyScheduleSection dailySchedule={dailySchedule} />
          </section>
        )}

        {/* ════ Clinical Watch-Outs ════ */}
        {!isPendingReview && watchOuts.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Important Watch-Outs</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Key interactions, contraindications, and things to monitor as you follow your protocol.
            </p>
            <div className="space-y-3">
              {watchOuts.map((wo, i) => (
                <WatchOutCard key={i} watchOut={wo} />
              ))}
            </div>
          </section>
        )}

        {/* ════ Training Protocol ════ */}
        {!isPendingReview && trainingProtocol && (
          <section className="space-y-5">
            <TrainingProtocolSection trainingProtocol={trainingProtocol} />
          </section>
        )}

        {/* ════ Section 4: Protocol ════ */}
        {!isPendingReview && (
          <section className="space-y-5">
            <SectionBanner number={4} total={5} title="Protocol" index={3} />

            <p className="text-sm text-gray-600 leading-relaxed">
              Cyborg has designed a personal protocol to help target your health goals and address your monitored issues. By following this protocol and re-testing your blood panel, you should see great progress.
            </p>

            <div>
              <AccordionItem title="Lifestyle" defaultOpen>
                <div className="space-y-4">
                  {protocol.lifestyle?.sleep?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">Sleep</h4>
                      <ul className="space-y-1.5">
                        {protocol.lifestyle.sleep.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                            <span className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                            {item.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {protocol.lifestyle?.exercise?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">Exercise</h4>
                      <ul className="space-y-1.5">
                        {protocol.lifestyle.exercise.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                            <span className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                            {item.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {protocol.lifestyle?.stress?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">Stress</h4>
                      <ul className="space-y-1.5">
                        {protocol.lifestyle.stress.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                            <span className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                            {item.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AccordionItem>

              <AccordionItem title="Nutrition">
                <ul className="space-y-1.5">
                  {(protocol.nutrition || []).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                      <span className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                      {item.text}
                    </li>
                  ))}
                </ul>
              </AccordionItem>

              <AccordionItem title="Supplements">
                <div className="space-y-3">
                  {(protocol.supplements || []).map((supp, i) => (
                    <SupplementCard key={i} supplement={supp} />
                  ))}
                  {(!protocol.supplements || protocol.supplements.length === 0) && (
                    <p className="text-xs text-gray-500">No supplements recommended based on your current biomarkers.</p>
                  )}
                </div>
              </AccordionItem>

              <AccordionItem title="Diagnostic Tests" isLast>
                <div className="space-y-3">
                  {(protocol.diagnosticTests || []).map((test, i) => (
                    <div key={i} className="rounded-xl bg-gray-50 p-4 space-y-1.5">
                      <h4 className="font-bold text-gray-900 text-sm">{test.name}</h4>
                      {test.whatItIs && (
                        <p className="text-xs text-gray-600 leading-relaxed">
                          <span className="font-semibold text-gray-800">What it is: </span>{test.whatItIs}
                        </p>
                      )}
                      {test.whyTestIt && (
                        <p className="text-xs text-gray-600 leading-relaxed">
                          <span className="font-semibold text-gray-800">Why test it: </span>{test.whyTestIt}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionItem>
            </div>
          </section>
        )}

        {/* ════ Section 5: Next Steps ════ */}
        {!isPendingReview && (
          <section className="space-y-5">
            <SectionBanner number={5} total={5} title="Next Steps" index={4} />

            <div className="space-y-4 text-sm text-gray-700">
              {nextSteps.text && <p className="leading-relaxed">{nextSteps.text}</p>}

              {nextSteps.followUpTimeline && (
                <p className="text-sm text-gray-600 leading-relaxed">
                  To review the steps and track improvements, schedule your follow-up blood panel in {nextSteps.followUpTimeline} ensuring interventions are effective and making adjustments as needed.
                </p>
              )}

              <p className="text-sm text-gray-600 leading-relaxed">
                Consider stocking up on the recommended supplements. You can either order through us at a discounted rate or source them on your own.
              </p>

              <p className="text-sm text-gray-600 leading-relaxed">
                If you have any additional questions, feel free to message your personal concierge or ask your Cyborg AI.
              </p>
            </div>

            {/* Recommended Products */}
            {nextSteps.recommendedProducts?.length > 0 && (
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-3">
                  {nextSteps.recommendedProducts.length} items recommended for you
                </h4>
                <div className="space-y-2">
                  {nextSteps.recommendedProducts.map((product, i) => (
                    <ProductCard key={i} product={product} />
                  ))}
                </div>
              </div>
            )}

            {/* View All Protocol Items */}
            {totalProtocolItems > 0 && (
              <button className="w-full py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer">
                View all {totalProtocolItems} protocol items
              </button>
            )}

            {/* Footer */}
            <div className="text-center space-y-1 pt-2">
              <p className="text-xs text-gray-500">Products cheaper than Amazon with member exclusive</p>
              <p className="text-xs text-gray-400">You can always order independently.</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleDownloadPDF}
                className="flex-1 bg-black text-white text-sm px-5 py-3 rounded-xl font-semibold hover:bg-gray-900 transition-colors cursor-pointer"
              >
                Download as PDF
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="flex-1 border border-gray-200 text-gray-800 text-sm px-5 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>

            {/* Cyborg Logo */}
            <div className="flex justify-center pt-6 pb-4">
              <Image
                src="/images/cyborg-logo-black.png"
                alt="Cyborg"
                width={87}
                height={15}
                className="opacity-40"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
