"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import StatsGrid from "@/components/StatsGrid";
import ProgressBar from "@/components/ProgressBar";
import DropdownFilter from "@/components/DropdownFilter";
import SearchBar from "@/components/SearchBar";
import Link from "next/link";
import { transformPanel, computeSummary, extractScores } from "@/utils/biomarkerAdapter";
import { userAPI, biomarkerAPI, conciergeAPI, streamMessage } from "@/services/api";
import { BodyModelClient } from "@/components/data/BodyModelClient";
import { organKeyForCategory, categoryStatus, STATUS_COLORS } from "@/components/data/organStatus";
import dynamic from "next/dynamic";
import ScoreDetailModal from "@/components/data/ScoreDetailModal";
import LabUploadedCard from "@/components/data/LabUploadedCard";
import RecordsTable from "@/components/data/RecordsTable";
import AskCyborgAI from "@/components/data/AskCyborgAI";
import CategoryFilter from "@/components/data/CategoryFilter";

// Lazy-load the biomarker detail modal (drags in recharts + react-markdown) so
// those heavy libs stay out of the /data route's initial bundle until a marker
// is actually tapped.
const BiomarkerDetailModal = dynamic(
  () => import("@/components/data/BiomarkerDetailModal"),
  { ssr: false }
);

// Normalize any stored value ("Male"/"Female"/"female"/…) to the model key.
const normalizeSex = (v) => (String(v || "").toLowerCase().startsWith("f") ? "female" : "male");

// Male/Female segmented control that drives which digital-twin body is shown.
function SexToggle({ value, onChange, className = "" }) {
  const options = [
    { id: "male", label: "Male" },
    { id: "female", label: "Female" },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Digital twin body"
      className={`inline-flex items-center gap-1 rounded-full border border-borderColor bg-white p-1 shadow-[0_1px_2px_0_rgba(0,0,0,0.04)] ${className}`}
    >
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              active ? "bg-black text-white shadow-sm" : "text-secondary hover:text-blue"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// The full, fixed digital-twin category list (superpower's order + labels). These
// ALWAYS appear in the sidebar — whether or not a report has been uploaded, and even
// after one is added that doesn't include every category. Grades/colours fill in from
// the report when data exists; otherwise the category shows a neutral dot and a "—".
const TWIN_CATEGORIES = [
  "Heart & Vascular Health",
  "Metabolic Health",
  "Sex Hormones",
  "Thyroid Health",
  "Inflammation",
  "Liver Health",
  "Kidney Health",
  "Nutrients",
  "Energy",
  "Immune System",
  "DNA Health",
  "Brain Health",
  "Gut Health",
  "Toxin Exposure",
];
const catId = (label) => String(label).toLowerCase().replace(/\s+/g, "-");

const STATUS_META = {
  optimal: { color: "#05BC7E", label: "Optimal", text: "text-biomarkerOptimal" },
  normal: { color: "#D7D82E", label: "Normal", text: "text-biomarkerNormal" },
  out_of_range: { color: "#F865DD", label: "Out of range", text: "text-biomarkerOutOfRange" },
};

// Letter grade derived purely from this category's real optimal/total ratio.
function gradeFor(optimal, total) {
  if (!total) return { letter: "—", ratio: 0, color: "#A3A3AB" };
  const ratio = optimal / total;
  if (ratio >= 0.8) return { letter: "A", ratio, color: "#05BC7E" };
  if (ratio >= 0.6) return { letter: "B", ratio, color: "#34c77b" };
  if (ratio >= 0.4) return { letter: "C", ratio, color: "#D7D82E" };
  return { letter: "D", ratio, color: "#F865DD" };
}

// Circular progress ring with the grade letter centered (category header).
// The coloured arc DRAWS IN from empty -> target over ~0.9s ease-out whenever the
// ring mounts or its value changes. We start at the full offset ("empty") on the
// first paint, then flip to the target offset on the next frame so the CSS
// transition on strokeDashoffset animates the draw-in. A `key` on the parent
// (the category id) remounts this component so re-selecting a category replays it.
function GradeRing({ grade, size = 96, stroke = 6 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const target = c * (1 - Math.max(0.06, grade.ratio));

  // Start "empty" (full circumference offset = no arc drawn), then animate to target.
  const [offset, setOffset] = useState(c);
  useEffect(() => {
    // Reset to empty immediately, then on the next frame transition to the target.
    setOffset(c);
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setOffset(target));
    });
    return () => cancelAnimationFrame(raf);
  }, [c, target]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EFEFF1" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={grade.color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1)" }}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize={size * 0.34} fontWeight="600" fill={grade.color}>
        {grade.letter}
      </text>
    </svg>
  );
}

// Module-level cache of finished AI summaries, keyed by category label. Persists
// across re-mounts so re-selecting a category never re-hits the AI — we just replay
// the cached text with a fast char-by-char typing effect.
const categorySummaryCache = new Map();

// Build the AI prompt from the category's real biomarkers.
function buildCategorySummaryPrompt(label, items) {
  const lines = items.map((b) => {
    const word =
      b.status === "optimal" ? "optimal" : b.status === "normal" ? "borderline/normal" : "out of range";
    const range = formatOptimalRange(b);
    return `- ${b.name}: ${b.value ?? "N/A"} ${b.unit || ""} (${word}; optimal ${range})`;
  });
  return [
    `You are a friendly health concierge summarizing one health category for a user.`,
    `Category: "${label}".`,
    `Here are the user's real biomarkers in this category and how each reads:`,
    ...lines,
    ``,
    `Write a SHORT 2-4 sentence personalized summary of this category's health, naming the specific markers that are high, low, or reassuring. Then add ONE practical lifestyle tip (nutrition, movement, sleep, or stress).`,
    `Plain conversational text only — no markdown, no headings, no bullet points, no emojis, no preamble. Do not diagnose or prescribe medication.`,
  ].join("\n");
}

// AI category summary. Generated by a FAST one-shot endpoint (no tools/thinking),
// cached, and typed out quickly. Keyed by a stable string signature so the request
// is never restarted by parent re-renders mid-generation.
function CategorySummary({ label, items }) {
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState("loading"); // loading | typing | done | error

  const sig = `${label}::${items.map((b) => `${b.id || b.name}=${b.value}/${b.status}`).join("|")}`;

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    // Fast type-out: ~3 chars every 12ms.
    const typeOut = (full) => {
      setPhase("typing");
      setDisplayed("");
      let i = 0;
      timer = setInterval(() => {
        if (cancelled) return;
        i += 3;
        if (i >= full.length) {
          clearInterval(timer);
          setDisplayed(full);
          setPhase("done");
        } else {
          setDisplayed(full.slice(0, i));
        }
      }, 12);
    };

    if (!items.length) {
      setPhase("done");
      setDisplayed("");
      return () => {
        cancelled = true;
      };
    }

    const cached = categorySummaryCache.get(sig);
    if (cached) {
      typeOut(cached);
      return () => {
        cancelled = true;
        clearInterval(timer);
      };
    }

    setPhase("loading");
    setDisplayed("");
    (async () => {
      try {
        const res = await biomarkerAPI.categorySummary({
          category: label,
          biomarkers: items.map((b) => ({
            name: b.name,
            value: b.value,
            unit: b.unit,
            status: b.status,
            optimalRange: b.optimalRange,
          })),
        });
        const summary = (res?.data?.summary ?? res?.summary ?? "").trim();
        if (cancelled) return;
        if (summary) {
          categorySummaryCache.set(sig, summary);
          typeOut(summary);
        } else {
          setPhase("error");
        }
      } catch {
        if (!cancelled) setPhase("error");
      }
    })();

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  if (phase === "loading") {
    return (
      <div className="mx-auto mt-5 max-w-md">
        <div className="space-y-2">
          <div className="mx-auto h-3 w-11/12 animate-pulse rounded-full bg-borderColor" />
          <div className="mx-auto h-3 w-10/12 animate-pulse rounded-full bg-borderColor" />
          <div className="mx-auto h-3 w-8/12 animate-pulse rounded-full bg-borderColor" />
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-secondary">
        We couldn&apos;t generate a summary right now. Your {label} markers are listed below.
      </p>
    );
  }

  return (
    <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-secondary">
      {displayed}
      {phase === "typing" && <span className="ml-0.5 animate-pulse text-blue">▍</span>}
    </p>
  );
}

// Compact "where your value falls" history bar. A light track with a soft
// tinted band, a dot marker placed by the value's position relative to its
// range, and thin vertical end-ticks. Colour follows status. If trend history
// exists, a faint line is overlaid — but the value-vs-range bar is primary.
function HistoryBar({ bm, color }) {
  const w = 120;
  const h = 32;
  const pad = 6;
  const trackY = h / 2;
  const x0 = pad;
  const x1 = w - pad;
  const span = x1 - x0;

  // Build a numeric scale from reference/optimal bounds; fall back to trend.
  const val = parseFloat(bm.value);
  const oMin = bm.optimalRange?.min ?? null;
  const oMax = bm.optimalRange?.max ?? null;
  const rMin = bm.referenceMin ?? null;
  const rMax = bm.referenceMax ?? null;
  const trend = Array.isArray(bm.trend) ? bm.trend.filter((v) => !isNaN(v)) : [];

  const candidates = [val, oMin, oMax, rMin, rMax, ...trend]
    .map(Number)
    .filter((v) => !isNaN(v));

  if (candidates.length === 0) {
    return <span className="text-xs text-secondary">—</span>;
  }

  let lo = Math.min(...candidates);
  let hi = Math.max(...candidates);
  if (hi === lo) {
    const bump = Math.abs(hi) || 1;
    lo -= bump;
    hi += bump;
  }
  const pad10 = (hi - lo) * 0.1;
  lo -= pad10;
  hi += pad10;

  const toX = (v) => x0 + ((Number(v) - lo) / (hi - lo)) * span;

  // Soft tinted band = optimal range (or reference range when optimal absent).
  const bandLoVal = oMin != null ? oMin : rMin;
  const bandHiVal = oMax != null ? oMax : rMax;
  const bandX1 = bandLoVal != null ? toX(bandLoVal) : x0;
  const bandX2 = bandHiVal != null ? toX(bandHiVal) : x1;

  const dotX = !isNaN(val) ? Math.max(x0, Math.min(x1, toX(val))) : (bandX1 + bandX2) / 2;

  // Faint trend overlay (relative, normalised onto the track height).
  let trendPath = null;
  if (trend.length > 1) {
    const tMin = Math.min(...trend);
    const tMax = Math.max(...trend);
    const tRange = tMax - tMin || 1;
    trendPath = trend
      .map((v, i) => {
        const tx = x0 + (i / (trend.length - 1)) * span;
        const ty = h - pad - ((v - tMin) / tRange) * (h - 2 * pad);
        return `${tx.toFixed(1)},${ty.toFixed(1)}`;
      })
      .join(" ");
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="block">
      {/* Light track */}
      <line x1={x0} y1={trackY} x2={x1} y2={trackY} stroke="#E6E6E8" strokeWidth="3" strokeLinecap="round" />
      {/* Soft tinted band */}
      <rect
        x={Math.min(bandX1, bandX2)}
        y={trackY - 3}
        width={Math.max(2, Math.abs(bandX2 - bandX1))}
        height="6"
        rx="3"
        fill={color}
        fillOpacity="0.22"
      />
      {/* Thin vertical end-ticks */}
      <line x1={x0} y1={trackY - 5} x2={x0} y2={trackY + 5} stroke="#D4D4D8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1={x1} y1={trackY - 5} x2={x1} y2={trackY + 5} stroke="#D4D4D8" strokeWidth="1.5" strokeLinecap="round" />
      {/* Faint trend overlay */}
      {trendPath && (
        <polyline points={trendPath} fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.25" strokeLinejoin="round" strokeLinecap="round" />
      )}
      {/* Value marker */}
      <circle cx={dotX} cy={trackY} r="4" fill={color} stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}

// One biomarker row: a 4-col table row on desktop, compact stacked row on mobile.
// superpower-style optimal range label: "≥40", "≤100", or "40–100".
function formatOptimalRange(bm) {
  const r = bm.optimalRange || {};
  const min = r.min ?? bm.referenceMin ?? null;
  const max = r.max ?? bm.referenceMax ?? null;
  const minPos = min != null && Number(min) > 0;
  const maxSet = max != null;
  if (minPos && maxSet) return `${min}–${max}`;
  if (maxSet) return `≤${max}`;
  if (minPos) return `≥${min}`;
  return "—";
}

function BiomarkerRow({ bm, onSelect }) {
  const { name, value, unit, status } = bm;
  const meta = STATUS_META[status] || { color: "#71717B", label: status || "—", text: "text-secondary" };
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(bm)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(bm);
        }
      }}
      className="grid cursor-pointer grid-cols-[1fr_auto] items-center gap-3 px-4 py-3.5 transition hover:bg-pageBackground/60 focus:outline-none focus-visible:bg-pageBackground/60 lg:grid-cols-[1.7fr_1fr_1fr_1fr_1.3fr] lg:gap-4 lg:px-5 lg:py-4"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-blue lg:text-[15px]">{name || "N/A"}</p>
        <span className="mt-1 flex items-center gap-1.5 text-xs text-secondary lg:hidden">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
          <span className={meta.text}>{meta.label}</span>
          <span>· {value ?? "N/A"} {unit}</span>
        </span>
      </div>
      <div className="hidden items-center gap-2 text-sm font-medium lg:flex">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
        <span className={meta.text}>{meta.label}</span>
      </div>
      <div className="hidden text-sm tabular-nums text-blue lg:block">
        {value ?? "N/A"} <span className="text-secondary">{unit}</span>
      </div>
      <div className="hidden text-sm tabular-nums text-secondary lg:block">
        {formatOptimalRange(bm)}
      </div>
      <div className="justify-self-end lg:justify-self-start">
        <HistoryBar bm={bm} color={meta.color} />
      </div>
    </div>
  );
}

export default function DataDashboard() {
  const { user, updateUser } = useAuth();
  const userId = user?._id || user?.id;
  const userName = user?.firstName || "User";
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || userName;

  const [activeTab, setActiveTab] = useState("data");

  // Open the Records tab when arriving via /data?tab=records (e.g. from the
  // protocol page's "Upload a blood report" button).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("tab") === "records") setActiveTab("twin");
  }, []);

  // Which digital-twin body to show. Explicit user choice (localStorage) wins;
  // otherwise default from the profile's biologicalSex.
  // The body figure is locked to the patient's biological sex — not switchable.
  const [sex, setSex] = useState("male");
  useEffect(() => {
    if (user?.biologicalSex) setSex(normalizeSex(user.biologicalSex));
  }, [user?.biologicalSex]);

  const handleSexChange = useCallback(
    (next) => {
      if (next !== "male" && next !== "female") return;
      setSex(next);
      try {
        localStorage.setItem("twinSex", next);
      } catch {}
      const biologicalSex = next === "female" ? "Female" : "Male";
      if (user) updateUser({ ...user, biologicalSex });
      if (userId) userAPI.updateProfile(userId, { biologicalSex }).catch(() => {});
    },
    [user, userId, updateUser],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [rangeFilter, setRangeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  // Multi-select category filter (Summary view) — a Set of category labels.
  const [selectedCats, setSelectedCats] = useState(() => new Set());
  const toggleCat = useCallback((cat) => {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const [reportFilter, setReportFilter] = useState("all");
  const [reportSearch, setReportSearch] = useState("");
  const [reports, setReports] = useState([]);
  const [twinLoading, setTwinLoading] = useState(false);
  const [twinUploading, setTwinUploading] = useState(false);
  const [uploadElapsedSec, setUploadElapsedSec] = useState(0);
  const [twinError, setTwinError] = useState("");
  const [deletingReportId, setDeletingReportId] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const uploadRef = useRef(null);
  const pollingRef = useRef(null);

  const [biomarkers, setBiomarkers] = useState([]);
  const [bioLoading, setBioLoading] = useState(false);
  const [bioError, setBioError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [scores, setScores] = useState(null);
  const [selectedBiomarker, setSelectedBiomarker] = useState(null);
  const [showBioModal, setShowBioModal] = useState(false);
  const [detailTab, setDetailTab] = useState("score");
  const [showLabCard, setShowLabCard] = useState(false);

  // Upload elapsed timer
  useEffect(() => {
    if (!twinUploading) {
      setUploadElapsedSec(0);
      return;
    }
    const start = Date.now();
    setUploadElapsedSec(0);
    const id = setInterval(() => setUploadElapsedSec(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [twinUploading]);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
  const staticBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");

  const fetchBiomarkerPanel = useCallback(async () => {
    try {
      setBioLoading(true);
      setBioError("");
      const [panelRes, trendsRes] = await Promise.all([
        biomarkerAPI.panel(),
        biomarkerAPI.trends().catch(() => null),
      ]);
      const data = panelRes?.data || panelRes;
      if (data?.biomarkerPanel) {
        const panel = transformPanel(data.biomarkerPanel);
        const trends = trendsRes?.data?.trends || {};
        const withTrends = panel.map((bm) => {
          const history = trends[bm.id];
          if (history && history.length >= 1) {
            return { ...bm, trend: history.map((p) => p.value), trendDates: history.map((p) => p.date) };
          }
          return bm;
        });
        setBiomarkers(withTrends);
        setLastUpdated(data.lastUpdatedAt || data.reportDate);
        setScores(extractScores(data.scores));
      } else {
        setBiomarkers([]);
        setScores(null);
      }
    } catch (error) {
      const msg = error?.message || "";
      if (error?.statusCode === 404 || msg.includes("not found") || msg.includes("No ") || msg.includes("404")) {
        setBiomarkers([]);
      } else {
        setBioError("Failed to load biomarker data");
      }
    } finally {
      setBioLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "data") {
      fetchBiomarkerPanel();
    }
  }, [activeTab, fetchBiomarkerPanel]);

  // Show the "your past lab was uploaded" card whenever report data is present.
  // Dismissal is session-only (state) — it comes back on reload / a new report.
  useEffect(() => {
    setShowLabCard(!!lastUpdated && biomarkers.length > 0);
  }, [lastUpdated, biomarkers.length]);

  const dismissLabCard = useCallback(() => setShowLabCard(false), []);

  const rangeOptions = [
    { id: "all", label: "All ranges" },
    { id: "optimal", label: "Optimal" },
    { id: "normal", label: "Normal" },
    { id: "out_of_range", label: "Out of Range" },
  ];

  const categories = useMemo(() => {
    // Canonical list always shown; append any report categories not in the canon.
    const present = [...new Set(biomarkers.map((b) => b.category))];
    const extras = present.filter((c) => c && !TWIN_CATEGORIES.includes(c));
    const ordered = [...TWIN_CATEGORIES, ...extras];
    return [
      { id: "all", label: "Summary" },
      { id: "wearables", label: "Wearables" },
      ...ordered.map((cat) => ({ id: catId(cat), label: cat })),
    ];
  }, [biomarkers]);

  const filteredBiomarkers = useMemo(() => {
    return biomarkers.filter((biomarker) => {
      const matchesSearch = biomarker.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRange = rangeFilter === "all" || biomarker.status === rangeFilter;
      const matchesCategory =
        categoryFilter === "all" || biomarker.category.toLowerCase().replace(/\s+/g, "-") === categoryFilter;
      const matchesSelected = selectedCats.size === 0 || selectedCats.has(biomarker.category);

      return matchesSearch && matchesRange && matchesCategory && matchesSelected;
    });
  }, [biomarkers, searchQuery, rangeFilter, categoryFilter, selectedCats]);

  const stats = useMemo(() => {
    const base =
      selectedCats.size === 0 ? biomarkers : biomarkers.filter((b) => selectedCats.has(b.category));
    return computeSummary(base);
  }, [biomarkers, selectedCats]);

  // Per-category derived grade (from real optimal/total) for the nav icons.
  const categoryGrades = useMemo(() => {
    const counts = {};
    biomarkers.forEach((b) => {
      counts[b.category] = counts[b.category] || { optimal: 0, total: 0 };
      counts[b.category].total += 1;
      if (b.status === "optimal") counts[b.category].optimal += 1;
    });
    const out = {};
    Object.entries(counts).forEach(([cat, v]) => {
      out[cat] = gradeFor(v.optimal, v.total);
    });
    return out;
  }, [biomarkers]);

  // Per-category 3-level status (good / neutral / bad) for the sidebar dots + body colour.
  const categoryStatuses = useMemo(() => {
    const byCat = {};
    biomarkers.forEach((b) => {
      (byCat[b.category] = byCat[b.category] || []).push(b);
    });
    const out = {};
    Object.entries(byCat).forEach(([cat, items]) => {
      out[cat] = categoryStatus(items);
    });
    return out;
  }, [biomarkers]);

  // Header data for the currently-selected category (null = Summary view).
  const activeCategoryMeta = useMemo(() => {
    if (categoryFilter === "all") return null;
    const cat = categories.find((c) => c.id === categoryFilter);
    if (!cat) return null;
    if (cat.id === "wearables") {
      return { label: "Wearables", wearables: true, total: 0, optimal: 0, outOfRange: 0, grade: gradeFor(0, 0) };
    }
    const items = biomarkers.filter((b) => b.category === cat.label);
    const optimal = items.filter((b) => b.status === "optimal").length;
    const outOfRange = items.filter((b) => b.status === "out_of_range").length;
    return {
      label: cat.label,
      total: items.length,
      optimal,
      outOfRange,
      grade: gradeFor(optimal, items.length),
    };
  }, [categoryFilter, categories, biomarkers]);

  // Real biomarkers for the selected category — fed to the AI summary prompt.
  const activeCategoryItems = useMemo(() => {
    if (!activeCategoryMeta || activeCategoryMeta.wearables) return [];
    return biomarkers.filter((b) => b.category === activeCategoryMeta.label);
  }, [activeCategoryMeta, biomarkers]);

  // Which organ to light up on the 3D body, and in which status colour.
  const selectedCategoryLabel = activeCategoryMeta?.label || null;
  const organHighlight = useMemo(
    () => (selectedCategoryLabel ? organKeyForCategory(selectedCategoryLabel) : null),
    [selectedCategoryLabel],
  );
  const organStatusValue = useMemo(() => {
    if (!selectedCategoryLabel) return "good";
    return categoryStatuses[selectedCategoryLabel] || "good";
  }, [selectedCategoryLabel, categoryStatuses]);

  const fetchReports = useCallback(async ({ silent = false } = {}) => {
    if (!userId) return;

    try {
      if (!silent) setTwinLoading(true);
      if (!silent) setTwinError("");
      const response = await userAPI.getBloodReports(userId);
      setReports(response?.data || []);
    } catch (error) {
      if (!silent) setTwinError("Failed to load healthcare records");
    } finally {
      if (!silent) setTwinLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (activeTab === "twin") {
      fetchReports();
    }
  }, [activeTab, fetchReports]);

  // Auto-refresh polling: re-fetch reports every 10s while any are still processing.
  // Also refresh the biomarker panel once a report finishes so the body + table update.
  useEffect(() => {
    const hasProcessing = reports.some(
      (r) => r.status === "uploaded" || r.status === "analyzing"
    );
    if (hasProcessing && activeTab === "twin" && userId) {
      pollingRef.current = setInterval(() => {
        fetchReports({ silent: true });
      }, 10000);
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [reports, activeTab, userId, fetchReports]);

  // Refresh biomarker data whenever the set of ready reports CHANGES — a new report
  // becoming ready OR a report being deleted. On delete-to-zero the panel 404s and
  // biomarkers reset to [], so the twin returns to its default (green) state.
  const prevReadyCount = useRef(0);
  useEffect(() => {
    const readyCount = reports.filter((r) => !r.status || r.status === "ready").length;
    if (readyCount !== prevReadyCount.current) {
      fetchBiomarkerPanel();
    }
    prevReadyCount.current = readyCount;
  }, [reports, fetchBiomarkerPanel]);

  const handleUploadFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    try {
      setTwinUploading(true);
      setTwinError("");
      setUploadSuccess(false);

      const formData = new FormData();
      formData.append("file", file);

      await userAPI.uploadBloodReport(userId, formData);
      setTwinUploading(false);
      setUploadSuccess(true);
      await fetchReports();
      if (!user?.latestReportReady) {
        updateUser({ ...user, latestReportReady: true });
      }
      // Auto-dismiss the success message after 5 seconds
      setTimeout(() => setUploadSuccess(false), 5000);
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
      setTwinError(serverMsg || error?.message || "Failed to upload report");
      setTwinUploading(false);
    } finally {
      if (uploadRef.current) {
        uploadRef.current.value = "";
      }
    }
  };

  const triggerUpload = () => {
    uploadRef.current?.click();
  };

  const handleDeleteReport = async (reportId) => {
    if (!userId || !reportId) return;
    if (!window.confirm("Delete this report? This cannot be undone.")) return;
    try {
      setDeletingReportId(reportId);
      setTwinError("");
      await userAPI.deleteBloodReport(userId, reportId);
      await fetchReports();
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
      setTwinError(serverMsg || "Failed to delete report");
    } finally {
      setDeletingReportId(null);
    }
  };

  // Fetch the stored file with auth, re-wrap as a blob, open in a new tab.
  const handleViewReport = async (reportId) => {
    try {
      setTwinError("");
      const raw = await userAPI.getBloodReportFile(reportId);
      const bodyType =
        raw?.type && raw.type.startsWith("application/") && raw.type !== "application/json"
          ? raw.type
          : "application/pdf";
      const blob = new Blob([raw], { type: bodyType });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      setTwinError(error?.message || "Could not open this report");
    }
  };

  // Whether any reports have been uploaded at all. Search/filter within the records
  // table is handled inside RecordsTable, so the big empty state only shows when the
  // user genuinely has zero uploaded records (not just zero search matches).
  const hasReports = reports.length > 0;

  // Real backend-computed scores (Cyborg Score + PhenoAge biological age).
  const scoreVal = scores?.cyborgScore?.final ?? scores?.cyborgScore ?? null;
  const bioAgeVal = (() => {
    const v = scores?.bioAge && typeof scores.bioAge === "object" ? scores.bioAge.phenoAge : scores?.bioAge;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null; // guard: null/0 -> null (no "Age 0")
  })();
  const chronoAge = useMemo(() => {
    const dob = user?.dateOfBirth || user?.birthDate || user?.dob;
    if (!dob) return null;
    const d = new Date(dob);
    if (isNaN(d.getTime())) return null;
    return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
  }, [user]);
  // Fall back to the chronological age the backend baked into the score, so the
  // younger/older diff + slider show even before the auth user's DOB is refreshed.
  const effChrono = chronoAge ?? (scores?.bioAge && typeof scores.bioAge === "object" ? scores.bioAge.chronoAge : null) ?? null;

  return (
    <div
      className="min-h-screen bg-pageBackground pb-32 font-inter lg:pb-12"
      style={{ fontFamily: "'nbinternationalproboo', Inter, ui-sans-serif, system-ui, sans-serif" }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html:
            "@font-face{font-family:'nbinternationalproboo';src:url('/fonts/nbinternationalproboo.woff2') format('woff2');font-weight:400 700;font-style:normal;font-display:swap;}",
        }}
      />
      <div className="mx-auto w-full max-w-[1240px] px-4 pt-4 lg:px-8 lg:pt-5">
        {/* Twin / Records toggle */}
        <div className="flex items-center gap-3 pb-5 pt-3 lg:pt-4">
          <button
            type="button"
            onClick={() => setActiveTab("data")}
            className={`text-3xl font-semibold tracking-tight transition lg:text-[40px] ${
              activeTab === "data" ? "text-[#131316]" : "text-black/25"
            }`}
          >
            Twin
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("twin")}
            className={`text-3xl font-semibold tracking-tight transition lg:text-[40px] ${
              activeTab === "twin" ? "text-[#131316]" : "text-black/25"
            }`}
          >
            Records
          </button>
        </div>

        {activeTab === "data" ? (
          bioLoading ? (
            <div className="py-12 text-center text-gray-500">Loading biomarker data...</div>
          ) : bioError ? (
            <div className="py-12 text-center text-red-500">{bioError}</div>
          ) : (
            <section className="lg:grid lg:grid-cols-[210px_minmax(0,1fr)_minmax(0,1.3fr)] lg:items-start lg:gap-6">
              {/* Mobile category strip (horizontal scroll) — desktop uses the sidebar below */}
              <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-1 lg:hidden">
                {categories.map((cat) => {
                  const isAll = cat.id === "all";
                  const isWearables = cat.id === "wearables";
                  const isSpecial = isAll || isWearables;
                  const active = categoryFilter === cat.id;
                  const st = !isSpecial ? categoryStatuses[cat.label] : null;
                  const dotColor = st ? STATUS_COLORS[st] : STATUS_COLORS.good;
                  const grade = !isSpecial ? categoryGrades[cat.label] : null;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryFilter(cat.id)}
                      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition ${
                        active
                          ? "border-zinc-300 bg-white text-zinc-900 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]"
                          : "border-borderColor bg-white/70 text-zinc-500"
                      }`}
                    >
                      {isAll ? (
                        <svg className="h-3.5 w-3.5 text-zinc-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M12 4.5l1.8 4 4.4.4-3.3 2.9 1 4.3L12 13.9 8.1 16l1-4.3L5.8 8.9l4.4-.4L12 4.5z" />
                        </svg>
                      ) : isWearables ? (
                        <svg className="h-3.5 w-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="6" y="6" width="12" height="12" rx="3" />
                          <path d="M9 6V3h6v3M9 18v3h6v-3" />
                        </svg>
                      ) : (
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dotColor }} />
                      )}
                      <span className="whitespace-nowrap">{cat.label}</span>
                      {!isSpecial && (
                        <span className="text-[11px] font-semibold tabular-nums" style={{ color: grade?.color || "#c4c4cc" }}>
                          {grade?.letter || "—"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Left: category nav with 3-colour status dots */}
              <aside className="hidden lg:sticky lg:top-4 lg:block">
                <nav className="flex flex-col gap-0.5">
                  {categories.map((cat) => {
                    const isAll = cat.id === "all";
                    const isWearables = cat.id === "wearables";
                    const isSpecial = isAll || isWearables;
                    const active = categoryFilter === cat.id;
                    // status/grade exist only when the report has data for this category.
                    // Default (no data) stays GREEN — never grey/black.
                    const st = !isSpecial ? categoryStatuses[cat.label] : null;
                    const dotColor = st ? STATUS_COLORS[st] : STATUS_COLORS.good;
                    const grade = !isSpecial ? categoryGrades[cat.label] : null;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoryFilter(cat.id)}
                        className={`flex w-full items-center gap-2.5 self-start rounded-full border px-1 py-1 pr-3 text-left text-[15px] transition ${
                          active
                            ? "border-zinc-300 bg-white text-zinc-900 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]"
                            : "border-transparent text-zinc-600 hover:text-zinc-900"
                        }`}
                      >
                        <span
                          className="grid h-6 w-6 shrink-0 place-items-center rounded-full border"
                          style={{ borderColor: isSpecial ? "#d4d4d8" : dotColor }}
                        >
                          {isAll ? (
                            <svg className="h-3.5 w-3.5 text-zinc-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                              <path d="M12 4.5l1.8 4 4.4.4-3.3 2.9 1 4.3L12 13.9 8.1 16l1-4.3L5.8 8.9l4.4-.4L12 4.5z" />
                            </svg>
                          ) : isWearables ? (
                            <svg className="h-3.5 w-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <rect x="6" y="6" width="12" height="12" rx="3" />
                              <path d="M9 6V3h6v3M9 18v3h6v-3" />
                            </svg>
                          ) : (
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dotColor }} />
                          )}
                        </span>
                        <span className="flex-1 truncate">{cat.label}</span>
                        {!isSpecial && (
                          <span
                            className="ml-auto shrink-0 text-xs font-semibold tabular-nums"
                            style={{ color: grade?.color || "#c4c4cc" }}
                          >
                            {grade?.letter || "—"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </aside>

              {/* Center: 3D digital-twin body, organ coloured by the selected category status */}
              <div className="hidden lg:sticky lg:top-4 lg:block">
                <div className="relative h-[680px] w-full overflow-hidden rounded-2xl">
                  <BodyModelClient
                    highlight={organHighlight}
                    status={organStatusValue}
                    sex={sex}
                    className="h-full w-full"
                  />
                </div>
              </div>

              {/* Mobile-only digital twin (above the content panel), recolours with the selected category */}
              <div className="lg:hidden">
                <div className="relative h-[360px] w-full overflow-hidden rounded-2xl bg-white">
                  <BodyModelClient
                    highlight={organHighlight}
                    status={organStatusValue}
                    sex={sex}
                    className="h-full w-full"
                  />
                </div>
              </div>

              {/* Right: content panel */}
              <div className="min-w-0 pt-6 lg:pt-0">
                <div className="overflow-hidden rounded-3xl border border-borderColor bg-white">
                  {/* Header — Summary or Category */}
                  {activeCategoryMeta?.wearables ? (
                    <div className="border-b border-borderColor p-6 text-center lg:p-10">
                      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-borderColor bg-pageBackground/50 text-secondary">
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="6" y="6" width="12" height="12" rx="3" />
                          <path d="M9 6V3h6v3M9 18v3h6v-3" />
                        </svg>
                      </div>
                      <h2 className="text-xl font-semibold text-blue lg:text-[22px]">Wearables</h2>
                      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-secondary">
                        Connect a wearable to sync sleep, activity and heart-rate data into your digital twin. Coming soon.
                      </p>
                    </div>
                  ) : activeCategoryMeta ? (
                    <div className="border-b border-borderColor p-6 text-center lg:p-7">
                      <h2 className="text-left text-xl font-semibold text-blue lg:text-[22px]">{activeCategoryMeta.label}</h2>
                      <div className="mt-5 flex justify-center">
                        <GradeRing key={activeCategoryMeta.label} grade={activeCategoryMeta.grade} />
                      </div>
                      {activeCategoryMeta.total > 0 ? (
                        <CategorySummary
                          key={activeCategoryMeta.label}
                          label={activeCategoryMeta.label}
                          items={activeCategoryItems}
                        />
                      ) : (
                        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-secondary">
                          No {activeCategoryMeta.label} markers yet. Upload a report to see your results here.
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveTab("twin")}
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                      >
                        Update my health <span aria-hidden="true">↗</span>
                      </button>
                    </div>
                  ) : (
                    <div className="border-b border-borderColor p-6 lg:p-7">
                      <div className="flex items-start justify-between gap-4">
                        <h2 className="text-xl font-semibold text-blue lg:text-2xl">{fullName}</h2>
                        {lastUpdated && (
                          <span className="shrink-0 pt-1 text-xs text-secondary">
                            Last updated {new Date(lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm text-secondary">
                        {biomarkers.length > 0
                          ? `${fullName.split(" ")[0]}, here's a look at your latest results.`
                          : `${fullName.split(" ")[0]}, your twin is ready — upload a report to bring it to life.`}
                      </p>

                      {showLabCard && biomarkers.length > 0 && (
                        <div className="mt-5">
                          <LabUploadedCard
                            biomarkers={biomarkers}
                            onClose={dismissLabCard}
                            onViewData={dismissLabCard}
                          />
                        </div>
                      )}

                      {!showLabCard && biomarkers.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowLabCard(true)}
                          className="mt-4 inline-flex items-center gap-2 rounded-full border border-borderColor bg-white px-4 py-2 text-sm font-medium text-blue shadow-sm transition hover:bg-pageBackground"
                        >
                          <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M3 20h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            <path d="M5 15l4-5 3.5 3L19 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          View report graph
                        </button>
                      )}

                      {biomarkers.length > 0 && (scoreVal != null || bioAgeVal != null) && (
                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {scoreVal != null && (() => {
                            const sPos = Math.min(100, Math.max(0, Math.round(scoreVal)));
                            const status = scoreVal >= 60 ? "On Track" : "Needs attention";
                            return (
                              <Link
                                href="/dashboard?view=insights"
                                className="group relative flex min-h-[172px] flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-[#7b3ff2] via-[#6a27d8] to-[#3f1585] p-5 text-left text-white shadow-sm transition hover:brightness-105"
                              >
                                <img src="/assets/data/score.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" onError={(e) => e.currentTarget.remove()} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-black/5" />
                                <div className="relative z-10 flex items-start justify-between">
                                  <span className="text-[13px] font-medium text-white/85">Cyborg score</span>
                                  <svg className="h-4 w-4 text-white/70" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                                <div className="relative z-10 mt-auto">
                                  <div className="flex items-end justify-end text-right">
                                    <div>
                                      <p className="text-[34px] font-semibold leading-none">{Math.round(scoreVal)}</p>
                                      <p className="mt-1 text-[13px] text-white/85">{status}</p>
                                    </div>
                                  </div>
                                  <div className="relative mt-4">
                                    <div className="h-1 rounded-full bg-white/30"><div className="h-full rounded-full bg-white" style={{ width: `${sPos}%` }} /></div>
                                    <div className="absolute -top-[7px]" style={{ left: `${sPos}%`, transform: "translateX(-50%)" }}>
                                      <div className="h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-white" />
                                    </div>
                                    <div className="relative mt-1.5 h-3 text-[10px] text-white/70">
                                      <span className="absolute left-0">0</span>
                                      <span className="absolute" style={{ left: "60%", transform: "translateX(-50%)" }}>60</span>
                                      <span className="absolute" style={{ left: "80%", transform: "translateX(-50%)" }}>80</span>
                                      <span className="absolute right-0">100</span>
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            );
                          })()}
                          {(() => {
                            const hasBio = bioAgeVal != null;
                            const delta = hasBio && effChrono != null ? bioAgeVal - effChrono : 0; // negative = younger
                            const bPos = Math.min(100, Math.max(0, ((delta + 5) / 10) * 100));
                            const diffText = effChrono != null
                              ? (effChrono - bioAgeVal >= 0
                                  ? `${(effChrono - bioAgeVal).toFixed(1)} years younger`
                                  : `${Math.abs(effChrono - bioAgeVal).toFixed(1)} years older`)
                              : "PhenoAge estimate";
                            return (
                              <button
                                type="button"
                                onClick={() => { setDetailTab("bioage"); setShowBioModal(true); }}
                                className="group relative flex min-h-[172px] w-full flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-[#5fd08a] via-[#31b36a] to-[#1a7d46] p-5 text-left text-white shadow-sm transition hover:brightness-105"
                              >
                                <img src="/assets/data/bioage.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" onError={(e) => e.currentTarget.remove()} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/5" />
                                <div className="relative z-10 flex items-start justify-between">
                                  <span className="text-[13px] font-medium text-white/90">Biological age</span>
                                  <svg className="h-4 w-4 text-white/70" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                                <div className="relative z-10 mt-auto">
                                  {hasBio ? (
                                    <>
                                      <div className="flex items-end justify-end text-right">
                                        <div>
                                          <p className="text-[34px] font-semibold leading-none"><span className="mr-1 align-top text-[14px] font-normal text-white/80">Age</span>{Math.round(bioAgeVal)}</p>
                                          <p className="mt-1 text-[13px] text-white/90">{diffText}</p>
                                        </div>
                                      </div>
                                      <div className="relative mt-4">
                                        <div className="h-1 rounded-full bg-white/30"><div className="h-full rounded-full bg-white" style={{ width: `${bPos}%` }} /></div>
                                        <div className="absolute -top-[7px]" style={{ left: `${bPos}%`, transform: "translateX(-50%)" }}>
                                          <div className="h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-white" />
                                        </div>
                                        <div className="relative mt-1.5 h-3 text-[10px] text-white/75">
                                          <span className="absolute left-0">-5</span>
                                          <span className="absolute" style={{ left: `${bPos}%`, transform: "translateX(-50%)" }}>Current</span>
                                          <span className="absolute right-0">5</span>
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <p className="max-w-[22ch] text-[13px] font-medium leading-snug text-white/95">Add your date of birth in Settings to see your biological age.</p>
                                  )}
                                </div>
                              </button>
                            );
                          })()}
                        </div>
                      )}

                      {biomarkers.length > 0 ? (
                        <div className="mt-5 rounded-2xl border border-borderColor bg-pageBackground/50 p-5">
                          <p className="mb-4 text-sm font-semibold text-secondary">Biomarkers</p>
                          <StatsGrid stats={stats} />
                          <div className="mt-4">
                            <ProgressBar stats={stats} />
                          </div>
                        </div>
                      ) : (
                        <div className="mt-5 flex flex-col items-center rounded-2xl border border-borderColor bg-pageBackground/50 p-6 text-center">
                          <p className="max-w-sm text-sm leading-relaxed text-secondary">
                            All your health categories are listed on the left. Upload a blood report and your twin lights up with your real results.
                          </p>
                          <button
                            type="button"
                            onClick={() => setActiveTab("twin")}
                            className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-medium text-white transition hover:bg-black/90"
                          >
                            Upload a report
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {!activeCategoryMeta?.wearables && (
                    <>
                      {/* Search + range filter (category dropdown is mobile-only; desktop uses the nav) */}
                      <div className="flex flex-col gap-3 border-b border-borderColor p-4 sm:flex-row sm:items-center lg:px-5">
                        <div className="sm:flex-1">
                          <SearchBar placeholder="Search..." value={searchQuery} onChange={setSearchQuery} />
                        </div>
                        <div className="flex shrink-0 gap-3 sm:gap-2.5">
                          <DropdownFilter label="All ranges" options={rangeOptions} value={rangeFilter} onChange={setRangeFilter} />
                          {categoryFilter === "all" && (
                            <CategoryFilter
                              categories={TWIN_CATEGORIES}
                              selected={selectedCats}
                              onToggle={toggleCat}
                              onClear={() => setSelectedCats(new Set())}
                            />
                          )}
                        </div>
                      </div>

                      {/* Table */}
                      {filteredBiomarkers.length === 0 ? (
                        <div className="py-12 text-center text-sm text-secondary">
                          {biomarkers.length === 0
                            ? "Upload a report to populate your biomarkers."
                            : "No biomarkers found"}
                        </div>
                      ) : (
                        <div>
                          <div className="hidden grid-cols-[1.7fr_1fr_1fr_1fr_1.3fr] gap-4 border-b border-borderColor px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-secondary lg:grid">
                            <span>Name</span>
                            <span>Status</span>
                            <span>Value</span>
                            <span>Optimal Range</span>
                            <span>History</span>
                          </div>
                          <div className="divide-y divide-borderColor">
                            {filteredBiomarkers.map((bm) => (
                              <BiomarkerRow key={bm.id} bm={bm} onSelect={setSelectedBiomarker} />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </section>
          )
        ) : (
          <section className="mx-auto w-full max-w-[760px]">
            {twinError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {twinError}
              </div>
            )}

            {twinUploading && (
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#e4e6ef] bg-white px-4 py-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black opacity-40"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-black"></span>
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#1e2027]">Uploading your report…</div>
                  <div className="text-xs text-[#6d6f7b]">
                    {uploadElapsedSec}s elapsed · uploading your report
                  </div>
                </div>
              </div>
            )}

            {uploadSuccess && (
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <svg className="h-5 w-5 flex-shrink-0 text-green-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="flex-1">
                  <div className="text-sm font-medium text-green-800">Upload complete!</div>
                  <div className="text-xs text-green-700">
                    Feel free to explore other pages. We&apos;ll notify you when your report is ready.
                  </div>
                </div>
              </div>
            )}

            {twinLoading ? (
              <div className="rounded-2xl border border-borderColor bg-white p-8 text-center text-gray-500">
                Loading twin records...
              </div>
            ) : !hasReports ? (
              <div className="min-h-[70vh]">
                <div className="space-y-4">
                  <SearchBar placeholder="Search...." value={reportSearch} onChange={setReportSearch} />
                  <button
                    type="button"
                    onClick={() => setReportFilter("all")}
                    className="flex items-center gap-2 text-xl font-medium text-[#6c6d79] lg:text-[28px]"
                  >
                    All Files
                    <svg className="h-5 w-5 lg:h-6 lg:w-6" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M5 8L10 13L15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                <div className="mt-16 flex flex-col items-center justify-center px-2 text-center lg:mt-28">
                  <h3 className="text-[28px] font-semibold leading-tight text-[#14151a] sm:text-[36px] lg:text-[50px]">No healthcare records yet</h3>
                  <p className="mt-4 max-w-[36ch] text-[15px] leading-[1.5] text-[#6d6f7b] lg:mt-5 lg:max-w-[640px] lg:text-[20px]">
                    Integrate your healthcare records into Cyborg. Drop your files here or click to upload
                  </p>

                  <input
                    ref={uploadRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleUploadFile}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => triggerUpload()}
                    disabled={twinUploading}
                    className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-black px-6 text-base font-medium text-white disabled:opacity-60 lg:mt-8 lg:h-12 lg:text-[18px]"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 16V4M12 4L7 9M12 4L17 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M5 14V18C5 19.1046 5.89543 20 7 20H17C18.1046 20 19 19.1046 19 18V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {twinUploading ? "Uploading…" : "Upload"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pb-10">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-[#9ea3b1] bg-white px-4 py-2 text-[20px] font-medium text-[#2f3139]"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12.62 20.63C12.28 20.84 11.86 20.84 11.52 20.63C6.7 17.53 3.5 14.58 3.5 10.74C3.5 7.92 5.74 5.75 8.43 5.75C10.06 5.75 11.25 6.49 12.07 7.56C12.89 6.49 14.08 5.75 15.71 5.75C18.4 5.75 20.64 7.92 20.64 10.74C20.64 14.58 17.44 17.53 12.62 20.63Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Summary
                </button>

                <div className="rounded-2xl bg-white p-4">
                  <div className="relative h-[480px] w-full overflow-hidden rounded-xl bg-[#f7f7fa]">
                    <BodyModelClient highlight={null} status="good" sex={sex} className="h-full w-full" />
                  </div>
                </div>

                {/* Records table — superpower layout, real report data */}
                <RecordsTable
                  reports={reports}
                  search={reportSearch}
                  onSearchChange={setReportSearch}
                  filter={reportFilter}
                  onFilterChange={setReportFilter}
                  onUpload={triggerUpload}
                  uploading={twinUploading}
                  onView={handleViewReport}
                  onDelete={handleDeleteReport}
                  deletingReportId={deletingReportId}
                />

                <input
                  ref={uploadRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleUploadFile}
                  className="hidden"
                />
              </div>
            )}
          </section>
        )}
      </div>

      {selectedBiomarker && (
        <BiomarkerDetailModal
          biomarker={selectedBiomarker}
          onClose={() => setSelectedBiomarker(null)}
        />
      )}

      <ScoreDetailModal
        open={showBioModal}
        initialTab={detailTab}
        onClose={() => setShowBioModal(false)}
        scoreVal={scoreVal}
        bioAgeVal={bioAgeVal}
        effChrono={effChrono}
        userName={[user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.name || "You"}
      />

      <AskCyborgAI />
    </div>
  );
}
