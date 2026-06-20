"use client";

export const dynamic = "force-dynamic";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { actionPlanAPI } from "@/services/api";
import Navbar from "@/components/Navbar";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Share2,
  Brain,
  AlertTriangle,
  Info,
  AlertCircle,
  Check,
  Circle,
  Sun,
  Coffee,
  Zap,
  Clock,
  Moon,
  Heart,
  Dumbbell,
  Target,
  Activity,
  FileText,
  Beaker,
  Shield,
  Pill,
  Utensils,
  BedDouble,
  Flame,
  ArrowRight,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════
   DESIGN SYSTEM TOKENS
   ══════════════════════════════════════════════════════════════ */

const FLAG_COLORS = {
  "Out of range": { dot: "bg-red-500", text: "text-red-600", ring: "ring-red-500/20" },
  Elevated:       { dot: "bg-amber-500", text: "text-amber-600", ring: "ring-amber-500/20" },
  Low:            { dot: "bg-red-500", text: "text-red-600", ring: "ring-red-500/20" },
  High:           { dot: "bg-amber-500", text: "text-amber-600", ring: "ring-amber-500/20" },
  Normal:         { dot: "bg-yellow-500", text: "text-yellow-600", ring: "ring-yellow-500/20" },
  Optimal:        { dot: "bg-emerald-500", text: "text-emerald-600", ring: "ring-emerald-500/20" },
};

const GRADE_COLORS = {
  A: { bg: "bg-emerald-500", text: "text-white", ring: "ring-emerald-400/30", label: "text-emerald-700" },
  B: { bg: "bg-yellow-400", text: "text-yellow-900", ring: "ring-yellow-400/30", label: "text-yellow-700" },
  C: { bg: "bg-orange-500", text: "text-white", ring: "ring-orange-400/30", label: "text-orange-700" },
  D: { bg: "bg-red-500", text: "text-white", ring: "ring-red-400/30", label: "text-red-700" },
  F: { bg: "bg-red-700", text: "text-white", ring: "ring-red-600/30", label: "text-red-800" },
};

const PRIORITY_BORDERS = {
  High: "border-l-red-500",
  Medium: "border-l-amber-500",
  Low: "border-l-emerald-500",
};

/* ══════════════════════════════════════════════════════════════
   SHARED ACCORDION COMPONENT
   ══════════════════════════════════════════════════════════════ */

function Accordion({ title, children, defaultOpen = false, icon }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3.5 cursor-pointer group"
      >
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-slate-400 group-hover:text-cyan-600 transition-colors duration-200">{icon}</span>}
          <span className="text-[15px] font-semibold text-slate-900">{title}</span>
        </div>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-[8000px] opacity-100 pb-5" : "max-h-0 opacity-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECTION HEADER
   ══════════════════════════════════════════════════════════════ */

function SectionHeader({ icon, label, title, subtitle }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {icon && <span className="text-cyan-600">{icon}</span>}
        {label && (
          <span className="text-xs font-semibold text-cyan-600 uppercase tracking-wider">{label}</span>
        )}
      </div>
      {title && <h2 className="text-xl font-bold text-slate-900">{title}</h2>}
      {subtitle && <p className="text-[15px] text-slate-500 leading-relaxed">{subtitle}</p>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   HERO SECTION
   ══════════════════════════════════════════════════════════════ */

function HeroSection({ userName, plan, healthReport }) {
  const cyborgScore = healthReport.cyborgScore;
  const bioAge = healthReport.bioAge;
  const markerCounts = healthReport.markerCounts;

  return (
    <div className="-mx-5 px-5 pt-8 pb-8 bg-white border-b border-gray-100">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {userName}&apos;s Action Plan
        </h1>
        {plan?.generatedAt && (
          <p className="text-sm text-gray-500 mt-1.5">
            Generated{" "}
            {new Date(plan.generatedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* Cyborg Score */}
        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Cyborg Score</p>
          <p className="text-[32px] font-bold text-gray-900 leading-none tracking-tight">
            {cyborgScore ?? "--"}
          </p>
          {cyborgScore != null && cyborgScore >= 80 && (
            <p className="text-xs text-emerald-600 mt-1.5">Excellent</p>
          )}
          {cyborgScore != null && cyborgScore < 80 && cyborgScore >= 60 && (
            <p className="text-xs text-amber-600 mt-1.5">Good</p>
          )}
          {cyborgScore != null && cyborgScore < 60 && (
            <p className="text-xs text-red-600 mt-1.5">Needs work</p>
          )}
        </div>

        {/* Bio-Age */}
        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Bio-Age</p>
          <div className="flex items-end gap-2">
            <p className="text-[32px] font-bold text-gray-900 leading-none tracking-tight">
              {bioAge?.phenoAge != null ? bioAge.phenoAge.toFixed(1) : "--"}
            </p>
            {bioAge?.delta != null && (
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full mb-1 ${
                  bioAge.delta <= 0
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {bioAge.delta <= 0 ? "-" : "+"}
                {Math.abs(bioAge.delta).toFixed(1)}y
              </span>
            )}
          </div>
          {bioAge?.delta != null && (
            <p className="text-xs text-gray-500 mt-1.5">
              {bioAge.delta <= 0 ? "Younger than actual" : "Older than actual"}
            </p>
          )}
        </div>
      </div>

      {/* Biomarker Summary Bar */}
      {markerCounts && markerCounts.total > 0 && (
        <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3.5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Biomarkers</p>
            <p className="text-xs text-gray-400">{markerCounts.total} tested</p>
          </div>
          <div className="flex items-center gap-5">
            {[
              { label: "Optimal", value: markerCounts.optimal, color: "text-emerald-600" },
              { label: "Normal", value: markerCounts.inRange, color: "text-yellow-600" },
              { label: "Out of Range", value: markerCounts.outOfRange, color: "text-red-600" },
            ].map(({ label, value: v, color }) => (
              <div key={label}>
                <p className={`text-lg font-bold ${color}`}>{v}</p>
                <p className="text-[11px] text-gray-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="flex h-1.5 rounded-full overflow-hidden mt-3 bg-gray-200">
            <div
              className="bg-emerald-500 transition-all duration-500"
              style={{ width: `${(markerCounts.optimal / markerCounts.total) * 100}%` }}
            />
            <div
              className="bg-yellow-500 transition-all duration-500"
              style={{ width: `${(markerCounts.inRange / markerCounts.total) * 100}%` }}
            />
            <div
              className="bg-red-500 transition-all duration-500"
              style={{ width: `${(markerCounts.outOfRange / markerCounts.total) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CLINICAL THESIS CARD
   ══════════════════════════════════════════════════════════════ */

function ClinicalThesisCard({ clinicalThesis }) {
  if (!clinicalThesis?.title) return null;
  return (
    <div className="rounded-2xl bg-white border-l-4 border-l-cyan-500 border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <Brain size={18} className="text-cyan-600" />
        <span className="text-xs font-semibold text-cyan-600 uppercase tracking-wider">
          Treatment Strategy
        </span>
      </div>
      <h3 className="text-[17px] font-bold text-slate-900 leading-snug mb-2">
        {clinicalThesis.title}
      </h3>
      {clinicalThesis.reasoning && (
        <p className="text-[15px] text-slate-500 leading-relaxed">{clinicalThesis.reasoning}</p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CATEGORY GRADE PILLS (horizontal scroll)
   ══════════════════════════════════════════════════════════════ */

function CategoryGradePills({ categoryGrades }) {
  if (!categoryGrades || Object.keys(categoryGrades).length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Category Grades</p>
      <div className="flex gap-3 overflow-x-auto pt-2 pb-2 -mx-5 px-5 scrollbar-hide">
        {Object.entries(categoryGrades).map(([key, val]) => {
          const grade = val?.grade || "--";
          const c = GRADE_COLORS[grade] || { bg: "bg-gray-300", text: "text-gray-700", ring: "ring-gray-300/30", label: "text-gray-600" };
          const displayLabel = key.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
          return (
            <div key={key} className="flex flex-col items-center gap-1.5 shrink-0 min-w-[56px]">
              <div className={`w-11 h-11 rounded-full ${c.bg} ring-4 ${c.ring} flex items-center justify-center`}>
                <span className={`text-sm font-bold ${c.text}`}>{grade}</span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 text-center leading-tight max-w-[64px]">
                {displayLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PRIORITY / DELTA / STATUS BADGES
   ══════════════════════════════════════════════════════════════ */

function PriorityBadge({ priority }) {
  const styles = {
    High: "text-red-700 bg-red-50 border-red-200",
    Medium: "text-amber-700 bg-amber-50 border-amber-200",
    Low: "text-emerald-700 bg-emerald-50 border-emerald-200",
  };
  return (
    <span
      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
        styles[priority] || "text-slate-500 bg-slate-50 border-slate-200"
      }`}
    >
      {priority}
    </span>
  );
}

function DeltaBadge({ delta }) {
  if (!delta || delta.status === "new") return null;
  const map = {
    improved: { text: "Improved", cls: "text-emerald-700 bg-emerald-50 border-emerald-200", Icon: TrendingDown },
    worsened: { text: "Worsened", cls: "text-red-700 bg-red-50 border-red-200", Icon: TrendingUp },
    unchanged: { text: "Unchanged", cls: "text-slate-500 bg-slate-50 border-slate-200", Icon: null },
    resolved: { text: "Resolved", cls: "text-cyan-700 bg-cyan-50 border-cyan-200", Icon: Check },
  };
  const b = map[delta.status];
  if (!b) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${b.cls}`}>
      {b.Icon && <b.Icon size={10} />}
      {b.text}
    </span>
  );
}

function GoalStatusBadge({ status }) {
  if (!status || status === "active") return null;
  const map = {
    achieved: { label: "Achieved", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    paused: { label: "Paused", cls: "text-amber-700 bg-amber-50 border-amber-200" },
    archived: { label: "Archived", cls: "text-slate-500 bg-slate-50 border-slate-200" },
  };
  const b = map[status];
  if (!b) return null;
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${b.cls}`}>{b.label}</span>
  );
}

/* ══════════════════════════════════════════════════════════════
   MONITORED ISSUE CARD (Goal Card)
   ══════════════════════════════════════════════════════════════ */

function MonitoredIssueCard({ issue, index }) {
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const borderColor = PRIORITY_BORDERS[issue.priority] || "border-l-gray-300";

  return (
    <div className={`rounded-2xl bg-white shadow-sm border border-gray-100 border-l-4 ${borderColor} overflow-hidden`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-[17px] font-bold text-slate-900 leading-snug flex-1">
            {issue.title}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
            <PriorityBadge priority={issue.priority} />
          </div>
        </div>

        {/* Badge row */}
        <div className="flex items-center gap-2 mb-3">
          <DeltaBadge delta={issue.delta} />
          <GoalStatusBadge status={issue.status} />
        </div>

        {/* Description */}
        {issue.description && (
          <p className="text-[15px] text-slate-500 leading-relaxed mb-4">{issue.description}</p>
        )}

        {/* Biomarker evidence rows */}
        {issue.biomarkerEvidence?.length > 0 && (
          <div className="rounded-xl bg-slate-50 overflow-hidden mb-4">
            {issue.biomarkerEvidence.map((bm, i) => {
              const flagStyle = FLAG_COLORS[bm.flag] || { dot: "bg-gray-400", text: "text-gray-500" };
              const target =
                bm.optimalMin != null && bm.optimalMax != null
                  ? `${bm.optimalMin}–${bm.optimalMax}`
                  : bm.optimalMax != null
                  ? `< ${bm.optimalMax}`
                  : bm.optimalMin != null
                  ? `> ${bm.optimalMin}`
                  : null;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    i < issue.biomarkerEvidence.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${flagStyle.dot} shrink-0`} />
                  <span className="text-[13px] font-medium text-slate-800 flex-1 min-w-0 truncate">
                    {bm.name}
                  </span>
                  <span className={`text-[13px] font-semibold ${flagStyle.text} shrink-0`}>
                    {bm.value}
                    {bm.unit ? ` ${bm.unit}` : ""}
                  </span>
                  {target && (
                    <>
                      <ArrowRight size={12} className="text-slate-300 shrink-0" />
                      <span className="text-[13px] text-emerald-600 font-medium shrink-0">
                        {target}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Achievement criteria */}
        {issue.achievementCriteria?.length > 0 && (
          <div className="mb-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Criteria
            </p>
            <div className="space-y-1.5">
              {issue.achievementCriteria.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                      c.currentlyMet
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {c.currentlyMet ? <Check size={10} /> : <Circle size={8} />}
                  </div>
                  <span
                    className={`text-[13px] ${
                      c.currentlyMet ? "text-emerald-700" : "text-slate-500"
                    }`}
                  >
                    {c.biomarkerName} {c.operator} {c.threshold}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Expandable sections */}
      <div className="border-t border-gray-100">
        {issue.whatThisMeans && (
          <button
            onClick={() => toggleSection("what")}
            className="w-full flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-slate-50 transition-colors duration-200"
          >
            <span className="text-[13px] font-semibold text-slate-700">What this means</span>
            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform duration-200 ${
                expandedSections.what ? "rotate-180" : ""
              }`}
            />
          </button>
        )}
        {expandedSections.what && issue.whatThisMeans && (
          <div className="px-5 pb-4">
            <p className="text-[14px] text-slate-500 leading-relaxed">{issue.whatThisMeans}</p>
          </div>
        )}

        {issue.potentialCauses && (
          <button
            onClick={() => toggleSection("causes")}
            className="w-full flex items-center justify-between px-5 py-3 border-t border-gray-100 cursor-pointer hover:bg-slate-50 transition-colors duration-200"
          >
            <span className="text-[13px] font-semibold text-slate-700">Potential causes</span>
            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform duration-200 ${
                expandedSections.causes ? "rotate-180" : ""
              }`}
            />
          </button>
        )}
        {expandedSections.causes && issue.potentialCauses && (
          <div className="px-5 pb-4">
            <p className="text-[14px] text-slate-500 leading-relaxed">{issue.potentialCauses}</p>
          </div>
        )}

        {issue.recommendedActions?.length > 0 && (
          <button
            onClick={() => toggleSection("actions")}
            className="w-full flex items-center justify-between px-5 py-3 border-t border-gray-100 cursor-pointer hover:bg-slate-50 transition-colors duration-200"
          >
            <span className="text-[13px] font-semibold text-slate-700">Recommended actions</span>
            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform duration-200 ${
                expandedSections.actions ? "rotate-180" : ""
              }`}
            />
          </button>
        )}
        {expandedSections.actions && issue.recommendedActions?.length > 0 && (
          <div className="px-5 pb-4 space-y-2.5">
            {issue.recommendedActions.map((action, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <ChevronRight size={14} className="text-cyan-500 mt-0.5 shrink-0" />
                <p className="text-[14px] text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-800">{action.label}: </span>
                  {action.detail}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PHASED TIMELINE (vertical)
   ══════════════════════════════════════════════════════════════ */

function PhasedTimeline({ checkpoints }) {
  const [expandedIdx, setExpandedIdx] = useState(null);

  if (!checkpoints?.length) return null;

  const getStepStyle = (idx) => {
    if (idx === 0)
      return {
        circle: "bg-emerald-500 border-emerald-500 text-white",
        line: "bg-emerald-300",
        label: "text-emerald-700",
        badge: "Completed",
      };
    if (idx === 1)
      return {
        circle: "bg-cyan-500 border-cyan-500 text-white",
        line: "bg-slate-200",
        label: "text-cyan-700",
        badge: "Current",
      };
    return {
      circle: "bg-slate-100 border-slate-300 text-slate-400",
      line: "bg-slate-200",
      label: "text-slate-500",
      badge: null,
    };
  };

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-5">
      <SectionHeader
        icon={<Target size={20} />}
        label="Timeline"
        title="Progress Checkpoints"
        subtitle="Your plan is broken into checkpoints. Tap a milestone to see target biomarkers."
      />

      <div className="mt-5 space-y-0">
        {checkpoints.map((cp, idx) => {
          const style = getStepStyle(idx);
          const isExpanded = expandedIdx === idx;
          const isLast = idx === checkpoints.length - 1;

          return (
            <div key={idx} className="flex gap-4">
              {/* Rail */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all duration-200 ${style.circle} ${
                    isExpanded ? "ring-4 ring-cyan-400/20 scale-110" : "hover:scale-105"
                  }`}
                >
                  {idx === 0 ? (
                    <Check size={14} />
                  ) : (
                    <span className="text-xs font-bold">{cp.weekNumber || idx + 1}</span>
                  )}
                </button>
                {!isLast && (
                  <div className={`w-0.5 flex-1 min-h-[24px] ${style.line}`} />
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 ${!isLast ? "pb-5" : "pb-0"}`}>
                <button
                  onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  className="text-left w-full cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <h4 className="text-[15px] font-bold text-slate-900">
                      {cp.label || `Week ${cp.weekNumber}`}
                    </h4>
                    {style.badge && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          style.badge === "Completed"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-cyan-50 text-cyan-600"
                        }`}
                      >
                        {style.badge}
                      </span>
                    )}
                  </div>
                  {cp.description && (
                    <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed">{cp.description}</p>
                  )}
                </button>

                {/* Expanded biomarkers */}
                {isExpanded && cp.targetBiomarkers?.length > 0 && (
                  <div className="mt-3 rounded-xl bg-slate-50 p-3 space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Target Biomarkers
                    </p>
                    {cp.targetBiomarkers.map((tb, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5">
                        <span className="text-[13px] font-medium text-slate-800">{tb.name}</span>
                        <div className="flex items-center gap-2 text-[13px]">
                          <span className="text-slate-400">
                            {tb.currentValue}
                            {tb.unit ? ` ${tb.unit}` : ""}
                          </span>
                          <ArrowRight size={12} className="text-slate-300" />
                          <span className="font-semibold text-emerald-600">
                            {tb.targetValue}
                            {tb.unit ? ` ${tb.unit}` : ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DAILY SCHEDULE
   ══════════════════════════════════════════════════════════════ */

function DailyScheduleSection({ dailySchedule }) {
  if (!dailySchedule) return null;

  const slots = [
    {
      key: "morningFasted",
      label: "Morning (Fasted)",
      Icon: Sun,
      accent: "border-l-amber-400",
      iconColor: "text-amber-500",
    },
    {
      key: "withBreakfast",
      label: "With Breakfast",
      Icon: Coffee,
      accent: "border-l-orange-400",
      iconColor: "text-orange-500",
    },
    {
      key: "preWorkout",
      label: "Pre-Workout",
      Icon: Zap,
      accent: "border-l-yellow-500",
      iconColor: "text-yellow-600",
    },
    {
      key: "withDinner",
      label: "With Dinner",
      Icon: Clock,
      accent: "border-l-blue-400",
      iconColor: "text-blue-500",
    },
    {
      key: "bedtime",
      label: "Bedtime",
      Icon: Moon,
      accent: "border-l-indigo-400",
      iconColor: "text-indigo-500",
    },
  ];

  const filledSlots = slots.filter((s) => dailySchedule[s.key]?.length > 0);
  if (filledSlots.length === 0) return null;

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<Pill size={20} />}
        label="Schedule"
        title="Your Daily Schedule"
        subtitle="When and how to take your supplements for maximum absorption and effect."
      />

      <div className="space-y-3">
        {filledSlots.map((slot) => {
          const SlotIcon = slot.Icon;
          const items = dailySchedule[slot.key];
          return (
            <div
              key={slot.key}
              className={`rounded-2xl bg-white shadow-sm border border-gray-100 border-l-4 ${slot.accent} p-4`}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <SlotIcon size={16} className={slot.iconColor} />
                <h4 className="text-[15px] font-bold text-slate-900 flex-1">{slot.label}</h4>
                <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                  {items.length} item{items.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 py-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[14px] font-semibold text-slate-800">
                          {item.productName}
                        </span>
                        {item.dose && (
                          <span className="text-[13px] text-slate-400 shrink-0">{item.dose}</span>
                        )}
                      </div>
                      {item.reason && (
                        <p className="text-[13px] text-slate-400 italic mt-0.5 leading-relaxed">
                          {item.reason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   WATCH-OUT CARDS
   ══════════════════════════════════════════════════════════════ */

function WatchOutCard({ watchOut }) {
  const [expanded, setExpanded] = useState(false);

  const severityMap = {
    critical: {
      bg: "bg-red-50",
      border: "border-red-200",
      iconColor: "text-red-600",
      titleColor: "text-red-900",
      Icon: AlertTriangle,
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      iconColor: "text-amber-600",
      titleColor: "text-amber-900",
      Icon: AlertCircle,
    },
    info: {
      bg: "bg-cyan-50",
      border: "border-cyan-200",
      iconColor: "text-cyan-600",
      titleColor: "text-cyan-900",
      Icon: Info,
    },
  };

  const s = severityMap[watchOut.severity] || severityMap.info;
  const SeverityIcon = s.Icon;
  const hasDetails = watchOut.risk || watchOut.mitigation;

  return (
    <div className={`rounded-2xl border ${s.border} ${s.bg} overflow-hidden`}>
      <button
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={`w-full flex items-center gap-3 p-4 ${hasDetails ? "cursor-pointer" : ""}`}
      >
        <SeverityIcon size={18} className={s.iconColor} />
        <span className={`text-[14px] font-semibold ${s.titleColor} flex-1 text-left`}>
          {watchOut.title}
        </span>
        {hasDetails && (
          <ChevronDown
            size={14}
            className={`text-slate-400 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        )}
      </button>
      {expanded && hasDetails && (
        <div className="px-4 pb-4 pt-0 space-y-2.5">
          {watchOut.risk && (
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Risk</p>
              <p className="text-[14px] text-slate-600 leading-relaxed">{watchOut.risk}</p>
            </div>
          )}
          {watchOut.mitigation && (
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">What to do</p>
              <p className="text-[14px] text-slate-600 leading-relaxed">{watchOut.mitigation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TRAINING PROTOCOL
   ══════════════════════════════════════════════════════════════ */

function TrainingProtocolSection({ trainingProtocol }) {
  if (!trainingProtocol) return null;

  const hasPhases = trainingProtocol.phases?.length > 0;
  const hasZone2 = trainingProtocol.zone2?.protocol;
  const hasWarmUp = trainingProtocol.warmUp?.length > 0;
  const hasCoolDown = trainingProtocol.coolDown?.length > 0;

  if (!hasPhases && !hasZone2 && !hasWarmUp && !hasCoolDown && !trainingProtocol.goal) return null;

  /* Day name abbreviations for the visual week grid */
  const DAY_ABBREVS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  /* Build a simple week view from phases if we can */
  const weekDays = [];
  if (hasPhases && trainingProtocol.phases[0]?.days) {
    trainingProtocol.phases[0].days.forEach((day) => {
      weekDays.push({
        label: day.dayLabel,
        focus: day.focus || "Training",
        hasExercises: day.exercises?.length > 0,
      });
    });
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-5 space-y-5">
      <SectionHeader
        icon={<Dumbbell size={20} />}
        label="Training"
        title="Your Training Program"
      />

      {/* Goal + Schedule */}
      {(trainingProtocol.goal || trainingProtocol.weeklySchedule) && (
        <div className="rounded-xl bg-slate-50 p-4 space-y-2">
          {trainingProtocol.goal && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Goal</p>
              <p className="text-[15px] text-slate-800 font-medium mt-0.5">
                {trainingProtocol.goal}
              </p>
            </div>
          )}
          {trainingProtocol.weeklySchedule && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Weekly Schedule
              </p>
              <p className="text-[14px] text-slate-600 mt-0.5">{trainingProtocol.weeklySchedule}</p>
            </div>
          )}
        </div>
      )}

      {/* Visual week grid */}
      {weekDays.length > 0 && (
        <div className="grid grid-cols-7 gap-1">
          {DAY_ABBREVS.map((abbrev, i) => {
            const dayData = weekDays.find(
              (d) => d.label?.toLowerCase().includes(abbrev.toLowerCase())
            );
            return (
              <div
                key={abbrev}
                className={`rounded-lg py-2 text-center ${
                  dayData?.hasExercises
                    ? "bg-cyan-50 border border-cyan-200"
                    : "bg-slate-50 border border-slate-100"
                }`}
              >
                <p className="text-[10px] font-semibold text-slate-500 uppercase">{abbrev}</p>
                {dayData?.hasExercises && (
                  <Activity size={12} className="text-cyan-500 mx-auto mt-1" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Phases as accordions */}
      {hasPhases &&
        trainingProtocol.phases.map((phase, pIdx) => (
          <Accordion
            key={pIdx}
            title={`Phase ${phase.phaseNumber}${phase.weeks ? `: Weeks ${phase.weeks}` : ""}${
              phase.focus ? ` - ${phase.focus}` : ""
            }`}
            icon={<Flame size={16} />}
          >
            {/* Phase meta */}
            {(phase.tempo || phase.rest) && (
              <div className="flex flex-wrap gap-2 mb-3">
                {phase.tempo && (
                  <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                    Tempo: {phase.tempo}
                  </span>
                )}
                {phase.rest && (
                  <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                    Rest: {phase.rest}
                  </span>
                )}
              </div>
            )}

            {/* Day cards */}
            {phase.days?.map((day, dIdx) => (
              <div key={dIdx} className="mb-4 last:mb-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[13px] font-bold text-slate-800">{day.dayLabel}</span>
                  {day.focus && (
                    <span className="text-[13px] text-slate-400">- {day.focus}</span>
                  )}
                </div>
                {day.exercises?.length > 0 && (
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-12 gap-1 bg-slate-50 px-3 py-2">
                      <span className="col-span-5 text-[11px] font-semibold text-slate-400 uppercase">
                        Exercise
                      </span>
                      <span className="col-span-2 text-[11px] font-semibold text-slate-400 uppercase text-center">
                        Sets
                      </span>
                      <span className="col-span-2 text-[11px] font-semibold text-slate-400 uppercase text-center">
                        Reps
                      </span>
                      <span className="col-span-3 text-[11px] font-semibold text-slate-400 uppercase">
                        Cue
                      </span>
                    </div>
                    {day.exercises.map((ex, eIdx) => (
                      <div
                        key={eIdx}
                        className={`grid grid-cols-12 gap-1 px-3 py-2.5 ${
                          eIdx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                        }`}
                      >
                        <span className="col-span-5 text-[13px] text-slate-900 font-medium">
                          {ex.name}
                        </span>
                        <span className="col-span-2 text-[13px] text-slate-500 text-center">
                          {ex.sets || "-"}
                        </span>
                        <span className="col-span-2 text-[13px] text-slate-500 text-center">
                          {ex.reps || "-"}
                        </span>
                        <span className="col-span-3 text-[13px] text-slate-400 truncate">
                          {ex.cue || "-"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </Accordion>
        ))}

      {/* Zone 2 Cardio */}
      {hasZone2 && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <Heart size={16} className="text-emerald-600" />
            <h4 className="text-[14px] font-bold text-emerald-900">Zone 2 Cardio</h4>
          </div>
          <p className="text-[14px] text-emerald-800/80">{trainingProtocol.zone2.protocol}</p>
          {trainingProtocol.zone2.intensity && (
            <p className="text-[13px] text-emerald-600">
              Intensity: {trainingProtocol.zone2.intensity}
            </p>
          )}
          {trainingProtocol.zone2.options?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {trainingProtocol.zone2.options.map((opt, i) => (
                <span
                  key={i}
                  className="text-[12px] bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200"
                >
                  {opt}
                </span>
              ))}
            </div>
          )}
          {trainingProtocol.zone2.reasoning && (
            <p className="text-[13px] text-emerald-600/70 leading-relaxed">
              {trainingProtocol.zone2.reasoning}
            </p>
          )}
        </div>
      )}

      {/* Warm-Up / Cool-Down */}
      {(hasWarmUp || hasCoolDown) && (
        <div className="grid grid-cols-1 gap-3">
          {hasWarmUp && (
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Warm-Up
              </p>
              <ul className="space-y-1.5">
                {trainingProtocol.warmUp.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-slate-600">
                    <span className="w-1 h-1 rounded-full bg-slate-400 mt-2 shrink-0" />
                    {typeof item === "string"
                      ? item
                      : item.name || item.exercise || JSON.stringify(item)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {hasCoolDown && (
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Cool-Down
              </p>
              <ul className="space-y-1.5">
                {trainingProtocol.coolDown.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-slate-600">
                    <span className="w-1 h-1 rounded-full bg-slate-400 mt-2 shrink-0" />
                    {typeof item === "string"
                      ? item
                      : item.name || item.exercise || JSON.stringify(item)}
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

/* ══════════════════════════════════════════════════════════════
   PROTOCOL SECTION (Tabbed: Lifestyle/Nutrition/Supplements/Tests)
   ══════════════════════════════════════════════════════════════ */

function ProtocolSection({ protocol }) {
  const tabs = [];

  const sleepItems = protocol.lifestyle?.sleep || [];
  const exerciseItems = protocol.lifestyle?.exercise || [];
  const stressItems = protocol.lifestyle?.stress || [];
  const nutritionItems = protocol.nutrition || [];
  const supplementItems = protocol.supplements || [];
  const testItems = protocol.diagnosticTests || [];

  if (sleepItems.length > 0) tabs.push({ key: "sleep", label: "Sleep", Icon: BedDouble, items: sleepItems });
  if (exerciseItems.length > 0) tabs.push({ key: "exercise", label: "Exercise", Icon: Dumbbell, items: exerciseItems });
  if (stressItems.length > 0) tabs.push({ key: "stress", label: "Stress", Icon: Shield, items: stressItems });
  if (nutritionItems.length > 0) tabs.push({ key: "nutrition", label: "Nutrition", Icon: Utensils, items: nutritionItems });
  if (supplementItems.length > 0) tabs.push({ key: "supplements", label: "Supplements", Icon: Pill, items: supplementItems });
  if (testItems.length > 0) tabs.push({ key: "tests", label: "Tests", Icon: Beaker, items: testItems });

  const [activeTab, setActiveTab] = useState(tabs[0]?.key || "sleep");

  if (tabs.length === 0) return null;

  const currentTab = tabs.find((t) => t.key === activeTab) || tabs[0];

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<FileText size={20} />}
        label="Protocol"
        title="Your Protocol"
        subtitle="Custom recommendations to target your health goals and address monitored issues."
      />

      {/* Tab bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-hide">
        {tabs.map((tab) => {
          const TabIcon = tab.Icon;
          const isActive = currentTab.key === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-semibold shrink-0 cursor-pointer transition-all duration-200 ${
                isActive
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              <TabIcon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-5">
        {currentTab.key === "supplements" ? (
          <div className="space-y-3">
            {currentTab.items.map((supp, i) => (
              <SupplementItem key={i} supplement={supp} />
            ))}
          </div>
        ) : currentTab.key === "tests" ? (
          <div className="space-y-3">
            {currentTab.items.map((test, i) => (
              <div key={i} className="rounded-xl bg-slate-50 p-4 space-y-1.5">
                <h4 className="text-[15px] font-bold text-slate-900">{test.name}</h4>
                {test.whatItIs && (
                  <p className="text-[13px] text-slate-500 leading-relaxed">
                    <span className="font-semibold text-slate-700">What it is: </span>
                    {test.whatItIs}
                  </p>
                )}
                {test.whyTestIt && (
                  <p className="text-[13px] text-slate-500 leading-relaxed">
                    <span className="font-semibold text-slate-700">Why test it: </span>
                    {test.whyTestIt}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <ul className="space-y-2.5">
            {currentTab.items.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-[14px] text-slate-600 leading-relaxed">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" />
                {item.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── Supplement Item (expandable) ── */

function SupplementItem({ supplement }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = supplement.whatItIs || supplement.whyItMatters || supplement.howToTake;

  return (
    <div className="rounded-xl bg-slate-50 overflow-hidden">
      <button
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={`w-full flex items-center gap-3 p-4 text-left ${hasDetails ? "cursor-pointer" : ""}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold text-slate-900">{supplement.name}</span>
            {supplement.timing && (
              <span className="text-[10px] font-semibold text-cyan-600 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full uppercase shrink-0">
                {supplement.timing}
              </span>
            )}
          </div>
          {supplement.dose && (
            <p className="text-[13px] text-slate-500 mt-0.5">{supplement.dose}</p>
          )}
        </div>
        {hasDetails && (
          <ChevronDown
            size={14}
            className={`text-slate-400 shrink-0 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        )}
      </button>
      {expanded && hasDetails && (
        <div className="px-4 pb-4 space-y-2">
          {supplement.whatItIs && (
            <p className="text-[13px] text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-700">What it is: </span>
              {supplement.whatItIs}
            </p>
          )}
          {supplement.whyItMatters && (
            <p className="text-[13px] text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-700">Why this matters: </span>
              {supplement.whyItMatters}
            </p>
          )}
          {supplement.howToTake && (
            <p className="text-[13px] text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-700">How to take it: </span>
              {supplement.howToTake}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   NEXT STEPS SECTION
   ══════════════════════════════════════════════════════════════ */

function NextStepsSection({ nextSteps, protocol, onDownloadPDF, router }) {
  const totalProtocolItems = [
    ...(protocol.lifestyle?.sleep || []),
    ...(protocol.lifestyle?.exercise || []),
    ...(protocol.lifestyle?.stress || []),
    ...(protocol.nutrition || []),
    ...(protocol.supplements || []),
    ...(protocol.diagnosticTests || []),
  ].length;

  return (
    <div className="space-y-5">
      <SectionHeader
        icon={<Sparkles size={20} />}
        label="Next Steps"
        title="What to Do Next"
      />

      {/* Checklist */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-5 space-y-3">
        {[
          nextSteps.text,
          "Review your daily supplement schedule and order recommended products.",
          "Message your personal concierge or Cyborg AI with any questions.",
        ]
          .filter(Boolean)
          .map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                <Circle size={8} className="text-slate-300" />
              </div>
              <p className="text-[14px] text-slate-600 leading-relaxed">{step}</p>
            </div>
          ))}
      </div>

      {/* Follow-up callout */}
      {nextSteps.followUpTimeline && (
        <div className="rounded-2xl bg-cyan-50 border border-cyan-100 p-5">
          <div className="flex items-start gap-3">
            <Clock size={18} className="text-cyan-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-[14px] font-semibold text-cyan-900">Follow-up Blood Panel</p>
              <p className="text-[14px] text-cyan-700/80 leading-relaxed mt-1">
                Schedule your next blood panel in{" "}
                <span className="font-semibold">{nextSteps.followUpTimeline}</span> to track
                improvements and adjust your protocol.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommended Products */}
      {nextSteps.recommendedProducts?.length > 0 && (
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-5">
          <p className="text-[15px] font-bold text-slate-900 mb-3">
            {nextSteps.recommendedProducts.length} items recommended for you
          </p>
          <div className="space-y-2">
            {nextSteps.recommendedProducts.map((product, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-slate-900 truncate">
                    {product.productName}
                  </p>
                  {product.price != null && (
                    <p className="text-[13px] text-slate-400 mt-0.5">${product.price}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-slate-400 text-center mt-3">
            Member-exclusive pricing. You can always order independently.
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="text-[12px] text-slate-400 leading-relaxed">
          {nextSteps.disclaimer ||
            "The scores generated under Health Optimization, Nutrition, and Lifestyle are based on your self-reported data and biomarkers. They are not a diagnosis. Always consult your physician before making changes to your health regimen."}
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   STICKY BOTTOM BAR
   ══════════════════════════════════════════════════════════════ */

function BottomActionBar({ onDownloadPDF }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 px-5 py-3 z-40">
      <div className="max-w-lg mx-auto flex gap-3">
        <button
          onClick={onDownloadPDF}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white text-[14px] font-semibold px-5 py-3 rounded-xl hover:bg-gray-800 transition-all duration-200 cursor-pointer"
        >
          <Download size={16} />
          Download PDF
        </button>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: "My Action Plan", url: window.location.href });
            }
          }}
          className="flex items-center justify-center gap-2 border border-gray-100 text-slate-700 text-[14px] font-semibold px-5 py-3 rounded-xl hover:bg-slate-50 transition-all duration-200 cursor-pointer"
        >
          <Share2 size={16} />
          Share
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════════ */

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

  /* ── Loading state ── */
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar backHref="/dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 border-2 border-gray-100 rounded-full" />
              <div className="absolute inset-0 w-10 h-10 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-[14px] text-gray-500">Loading your action plan...</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Error state (no plan) ── */
  if (error && !plan) {
    return (
      <div className="min-h-screen bg-[#F8FAFB] flex flex-col">
        <Navbar backHref="/dashboard" />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-sm text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
              <FileText size={28} className="text-slate-400" />
            </div>
            <p className="text-[15px] text-slate-500 leading-relaxed">{error}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-gray-900 text-white text-[14px] font-semibold px-6 py-3 rounded-xl hover:bg-gray-800 transition-all duration-200 cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Extract data ── */
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
  const isReady = plan?.status === "ready" || plan?.status === "approved";

  return (
    <div className="min-h-screen bg-[#F8FAFB] flex flex-col">
      <Navbar backHref="/dashboard" />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-16 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl shadow-lg text-white text-[14px] font-medium z-50 transition-all duration-300 ${
            toast.type === "success" ? "bg-emerald-500" : "bg-red-500"
          }`}
        >
          {toast.message}
        </div>
      )}

      <main className="flex-1 max-w-lg mx-auto w-full">
        {/* ════ Hero Section ════ */}
        <div className="px-5">
          <HeroSection userName={userName} plan={plan} healthReport={healthReport} />
        </div>

        {/* ════ Content Sections ════ */}
        <div className="px-5 pb-28 space-y-8 mt-8">
          {/* ── Clinical Thesis ── */}
          <ClinicalThesisCard clinicalThesis={clinicalThesis} />

          {/* ── Category Grades ── */}
          <CategoryGradePills categoryGrades={categoryGrades} />

          {/* ── Monitored Issues / Goals ── */}
          <section className="space-y-4">
            <SectionHeader
              icon={<Activity size={20} />}
              label="Goals"
              title="Monitored Issues"
              subtitle={
                isPendingReview
                  ? undefined
                  : monitoredIssues.length > 0
                  ? `${monitoredIssues.length} issue${monitoredIssues.length !== 1 ? "s" : ""} identified from your biomarkers.`
                  : "No monitored issues detected. Your biomarkers look healthy."
              }
            />

            {isPendingReview ? (
              <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-8 text-center">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Clock size={24} className="text-amber-500" />
                </div>
                <h3 className="text-[16px] font-bold text-slate-900 mb-1.5">
                  Your doctor is reviewing your plan
                </h3>
                <p className="text-[14px] text-slate-500">
                  You&apos;ll be notified when your personalized goals are ready.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {monitoredIssues.map((issue, idx) => (
                  <MonitoredIssueCard key={issue.goalId || idx} issue={issue} index={idx} />
                ))}
              </div>
            )}
          </section>

          {/* ── Phased Timeline ── */}
          {!isPendingReview && checkpoints.length > 0 && (
            <PhasedTimeline checkpoints={checkpoints} />
          )}

          {/* ── Daily Schedule ── */}
          {!isPendingReview && dailySchedule && (
            <DailyScheduleSection dailySchedule={dailySchedule} />
          )}

          {/* ── Watch-Outs ── */}
          {!isPendingReview && watchOuts.length > 0 && (
            <section className="space-y-4">
              <SectionHeader
                icon={<Shield size={20} />}
                label="Watch-Outs"
                title="Important Watch-Outs"
                subtitle="Key interactions, contraindications, and things to monitor."
              />
              <div className="space-y-3">
                {watchOuts.map((wo, i) => (
                  <WatchOutCard key={i} watchOut={wo} />
                ))}
              </div>
            </section>
          )}

          {/* ── Training Protocol ── */}
          {!isPendingReview && trainingProtocol && (
            <TrainingProtocolSection trainingProtocol={trainingProtocol} />
          )}

          {/* ── Protocol (tabbed) ── */}
          {!isPendingReview && <ProtocolSection protocol={protocol} />}

          {/* ── Next Steps ── */}
          {!isPendingReview && (
            <NextStepsSection
              nextSteps={nextSteps}
              protocol={protocol}
              onDownloadPDF={handleDownloadPDF}
              router={router}
            />
          )}
        </div>
      </main>

      {/* ── Sticky Bottom Bar ── */}
      {isReady && <BottomActionBar onDownloadPDF={handleDownloadPDF} />}
    </div>
  );
}
