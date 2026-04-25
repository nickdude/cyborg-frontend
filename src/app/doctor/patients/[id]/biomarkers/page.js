"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Cookie from "js-cookie";
import { Search, ChevronDown } from "lucide-react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

// Ordered category list for consistent grouping
const CATEGORY_ORDER = [
  "Heart & Vascular Health",
  "Metabolic Health",
  "Liver Health",
  "Kidney Health",
  "Thyroid Health",
  "Blood Health",
  "Bone & Joint Health",
  "Immune Health",
  "Hormonal Health",
  "Nutritional Health",
  "Inflammation",
  "Electrolytes",
  "Other",
];

function getStatusDotColor(flag, optimalFlag) {
  if (optimalFlag === "optimal") return "#05bc7e";
  if (flag === "normal") return "#d7d82e";
  if (flag === "out_of_range" || flag === "high" || flag === "low")
    return "#f865dd";
  return "#d7d82e";
}

function getStatusLabel(flag, optimalFlag) {
  if (optimalFlag === "optimal") return "optimal";
  if (flag === "normal") return "normal";
  return "out_of_range";
}

/* Mini gauge SVG for the top cards — semicircular arc with needle, bottom-right */
function MiniGauge({ value, max = 100, color = "#05bc7e" }) {
  const clamped = Math.min(Math.max(value || 0, 0), max);
  const pct = clamped / max;
  // Arc from -135deg to +135deg (270deg sweep)
  const startAngle = -135;
  const sweep = 270;
  const angle = startAngle + sweep * pct;
  const r = 22;
  const cx = 30;
  const cy = 28;
  const toRad = (d) => (d * Math.PI) / 180;

  // Arc path
  const arcStart = {
    x: cx + r * Math.cos(toRad(startAngle)),
    y: cy + r * Math.sin(toRad(startAngle)),
  };
  const arcEnd = {
    x: cx + r * Math.cos(toRad(startAngle + sweep)),
    y: cy + r * Math.sin(toRad(startAngle + sweep)),
  };
  // Needle position
  const needle = {
    x: cx + r * Math.cos(toRad(angle)),
    y: cy + r * Math.sin(toRad(angle)),
  };

  return (
    <svg width="64" height="48" viewBox="0 0 64 48" fill="none">
      {/* Track */}
      <path
        d={`M ${arcStart.x} ${arcStart.y} A ${r} ${r} 0 1 1 ${arcEnd.x} ${arcEnd.y}`}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Filled arc up to value */}
      {pct > 0 && (
        <path
          d={(() => {
            const end = {
              x: cx + r * Math.cos(toRad(angle)),
              y: cy + r * Math.sin(toRad(angle)),
            };
            const largeArc = sweep * pct > 180 ? 1 : 0;
            return `M ${arcStart.x} ${arcStart.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
          })()}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      )}
      {/* Needle dot */}
      <circle cx={needle.x} cy={needle.y} r="3.5" fill="white" />
      {/* Labels */}
      <text x="7" y="44" fontSize="7" fill="rgba(255,255,255,0.4)" fontFamily="sans-serif">
        {"< 10"}
      </text>
      <text x="38" y="14" fontSize="7" fill="rgba(255,255,255,0.4)" fontFamily="sans-serif">
        100
      </text>
    </svg>
  );
}

/* Mini sparkline SVG for history column — line with dots and vertical end bar */
function MiniSparkline({ dotColor }) {
  // Decorative sparkline with a few data points
  const points = [12, 10, 14, 11, 13, 12, 14];
  const sparkW = 52;
  const barGap = 10;
  const barW = 3;
  const totalW = sparkW + barGap + barW;
  const h = 28;
  const maxVal = 18;
  const minVal = 6;
  const range = maxVal - minVal;
  const step = sparkW / (points.length - 1);

  const pathD = points
    .map((v, i) => {
      const x = i * step;
      const y = h - 4 - ((v - minVal) / range) * (h - 8);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const lastX = (points.length - 1) * step;
  const lastY = h - 4 - ((points[points.length - 1] - minVal) / range) * (h - 8);

  return (
    <svg width={totalW} height={h} viewBox={`0 0 ${totalW} ${h}`} fill="none">
      {/* Sparkline path */}
      <path d={pathD} stroke={dotColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.45" />
      {/* Small dots at each data point */}
      {points.map((v, i) => {
        const x = i * step;
        const y = h - 4 - ((v - minVal) / range) * (h - 8);
        return (
          <circle key={i} cx={x} cy={y} r={i === points.length - 1 ? 3 : 1.5} fill={dotColor} opacity={i === points.length - 1 ? 1 : 0.4} />
        );
      })}
      {/* Vertical colored bar on far right */}
      <rect
        x={sparkW + barGap}
        y={4}
        width={barW}
        height={h - 8}
        rx={1.5}
        fill={dotColor}
        opacity="0.6"
      />
    </svg>
  );
}

export default function BiomarkersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const patientId = params.id;

  const [biomarkerPanel, setBiomarkerPanel] = useState([]);
  const [scores, setScores] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [rangeFilter, setRangeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [rangeDropdownOpen, setRangeDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  // Fetch patient data
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const token = Cookie.get("authToken");
        const res = await fetch(`${apiUrl}/api/doctor/patients/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch patient data");
        const json = await res.json();
        const data = json.data || json;
        setBiomarkerPanel(data.latestReport?.biomarkerPanel || []);
        setScores(data.latestReport?.scores || null);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, user, patientId, router]);

  // Compute stats from real data
  const stats = useMemo(() => {
    const total = biomarkerPanel.length;
    let optimal = 0;
    let normal = 0;
    let outOfRange = 0;

    biomarkerPanel.forEach((b) => {
      const status = getStatusLabel(b.flag, b.optimalFlag);
      if (status === "optimal") optimal++;
      else if (status === "normal") normal++;
      else outOfRange++;
    });

    return { total, optimal, normal, outOfRange };
  }, [biomarkerPanel]);

  // Get unique categories from biomarker data
  const categories = useMemo(() => {
    const cats = new Set(biomarkerPanel.map((b) => b.category || "Other"));
    return CATEGORY_ORDER.filter((c) => cats.has(c));
  }, [biomarkerPanel]);

  // Filter and group biomarkers
  const filteredGrouped = useMemo(() => {
    let filtered = biomarkerPanel;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          (b.displayName || b.canonicalName || "").toLowerCase().includes(q) ||
          (b.category || "").toLowerCase().includes(q)
      );
    }

    // Range filter
    if (rangeFilter !== "all") {
      filtered = filtered.filter((b) => {
        const status = getStatusLabel(b.flag, b.optimalFlag);
        return status === rangeFilter;
      });
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((b) => (b.category || "Other") === categoryFilter);
    }

    // Group by category
    const groups = {};
    filtered.forEach((b) => {
      const cat = b.category || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(b);
    });

    // Sort groups by CATEGORY_ORDER
    const ordered = [];
    CATEGORY_ORDER.forEach((cat) => {
      if (groups[cat]) {
        ordered.push({ category: cat, biomarkers: groups[cat] });
      }
    });
    // Any categories not in the order list
    Object.keys(groups).forEach((cat) => {
      if (!CATEGORY_ORDER.includes(cat)) {
        ordered.push({ category: cat, biomarkers: groups[cat] });
      }
    });

    return ordered;
  }, [biomarkerPanel, searchQuery, rangeFilter, categoryFilter]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClick = () => {
      setRangeDropdownOpen(false);
      setCategoryDropdownOpen(false);
    };
    if (rangeDropdownOpen || categoryDropdownOpen) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [rangeDropdownOpen, categoryDropdownOpen]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f2f2f2] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f2f2f2] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="text-primary text-sm font-medium"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const bioAgeRaw = scores?.bioAge;
  const bioAge = typeof bioAgeRaw === 'object' ? bioAgeRaw?.phenoAge : bioAgeRaw;
  const paceRaw = scores?.paceOfAging;
  const paceValue = typeof paceRaw === 'object' ? paceRaw?.pace : paceRaw;
  // Convert pace to percentage: 1.02 → 102, 0.92 → 92, fallback to 46
  const paceOfAging = paceValue != null ? Math.round(paceValue * 100) : 46;

  // Compute progress bar widths
  const barTotal = stats.total || 1;
  const optimalPct = (stats.optimal / barTotal) * 100;
  const normalPct = (stats.normal / barTotal) * 100;
  const outOfRangePct = (stats.outOfRange / barTotal) * 100;

  return (
    <div className="min-h-screen bg-[#f2f2f2]">
      {/* Header */}
      <header className="bg-white sticky top-0 z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-center h-14 px-4 relative">
          <button
            onClick={() => router.back()}
            className="absolute left-4 p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {/* Back arrow: 6x11 left angle, stroke #000000 */}
            <svg width="6" height="11" viewBox="0 0 6 11" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.5 1L1 5.5L5.5 10" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {/* 16px/500 black, centered */}
          <h1 className="text-[16px] font-medium text-black">Biomarkers</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        {/* Biological Age + Pace of Aging Cards — full-width stacked, dark bg */}
        <div className="space-y-3">
          {/* Biological Age Card */}
          <div className="rounded-2xl p-5 bg-[#1e1e2a] text-white relative overflow-hidden min-h-[140px]">
            <div className="relative z-10">
              <div className="flex items-start justify-between">
                <p className="text-[14px] font-medium text-white/80">
                  Biological age
                </p>
                {/* Optimal badge — top-right, white pill with green dot */}
                <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-[12px] font-semibold px-3 py-1 rounded-full">
                  <span className="inline-block w-[7px] h-[7px] rounded-full bg-[#05bc7e]" />
                  Optimal
                </span>
              </div>
              <div className="flex items-end justify-between mt-3">
                <div className="flex items-baseline gap-2">
                  <p className="text-[44px] font-semibold leading-none tracking-tight">
                    {bioAge != null ? Math.round(bioAge) : "--"}
                  </p>
                  <p className="text-[16px] text-white/50 font-normal">years</p>
                </div>
                <div className="mb-[-2px]">
                  <MiniGauge value={bioAge != null ? bioAge : 26} color="#05bc7e" />
                </div>
              </div>
            </div>
          </div>

          {/* Pace of Aging Card */}
          <div className="rounded-2xl p-5 bg-[#1e1e2a] text-white relative overflow-hidden min-h-[140px]">
            <div className="relative z-10">
              <div className="flex items-start justify-between">
                <p className="text-[14px] font-medium text-white/80">
                  Pace of aging
                </p>
                {/* Optimal badge — top-right, white pill with green dot */}
                <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-[12px] font-semibold px-3 py-1 rounded-full">
                  <span className="inline-block w-[7px] h-[7px] rounded-full bg-[#05bc7e]" />
                  Optimal
                </span>
              </div>
              <div className="flex items-end justify-between mt-3">
                <div className="flex items-baseline gap-1">
                  <p className="text-[44px] font-semibold leading-none tracking-tight">
                    {paceOfAging}
                  </p>
                  <p className="text-[16px] text-white/50 font-normal">%</p>
                </div>
                <div className="mb-[-2px]">
                  <MiniGauge value={paceOfAging} color="#05bc7e" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Biomarker Stats + Search + Filters — white card container */}
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <div>
            {/* 18px/600 */}
            <h2 className="text-[18px] font-semibold text-black mb-3">Biomarkers</h2>
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="px-1 py-1">
                {/* 24px/700 black */}
                <p className="text-[24px] font-bold text-black leading-tight">{stats.total}</p>
                {/* 12px/400 #717178 */}
                <p className="text-[12px] font-normal text-[#717178] mt-0.5">Total</p>
              </div>
              <div className="px-1 py-1">
                {/* 24px/700 #05bc7e */}
                <p className="text-[24px] font-bold text-[#05bc7e] leading-tight">
                  {stats.optimal}
                </p>
                <p className="text-[12px] font-normal text-[#717178] mt-0.5">Optimal</p>
              </div>
              <div className="px-1 py-1">
                {/* 24px/700 #d7d82e */}
                <p className="text-[24px] font-bold text-[#d7d82e] leading-tight">
                  {stats.normal}
                </p>
                <p className="text-[12px] font-normal text-[#717178] mt-0.5">Normal</p>
              </div>
              <div className="px-1 py-1">
                {/* 24px/700 #f865dd */}
                <p className="text-[24px] font-bold text-[#f865dd] leading-tight">
                  {stats.outOfRange}
                </p>
                <p className="text-[12px] font-normal text-[#717178] mt-0.5">
                  Out of Range
                </p>
              </div>
            </div>
            {/* Colored progress bar — proportional segments */}
            <div className="flex h-[6px] rounded-full overflow-hidden">
              <div className="rounded-l-full" style={{ width: `${optimalPct}%`, backgroundColor: "#05bc7e" }} />
              <div style={{ width: `${normalPct}%`, backgroundColor: "#d7d82e" }} />
              <div className="rounded-r-full" style={{ width: `${outOfRangePct}%`, backgroundColor: "#f865dd" }} />
            </div>
          </div>

          {/* Search + Filters */}
          <div className="space-y-3">
            {/* Search Input: r=8, border #e5e7eb */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-[#e5e7eb] rounded-lg pl-9 pr-4 py-2.5 text-[14px] text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>

            {/* Filter Dropdowns: 14px/400, r=8 */}
            <div className="flex gap-2">
              {/* Range Filter */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRangeDropdownOpen(!rangeDropdownOpen);
                    setCategoryDropdownOpen(false);
                  }}
                  className="border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-[14px] font-normal text-black flex items-center gap-1.5 hover:border-gray-300 transition-colors"
                >
                  {/* Grey dot before label */}
                  <span className="inline-block w-[6px] h-[6px] rounded-full bg-[#d1d5db]" />
                  <span className={rangeFilter === "all" ? "text-gray-500" : "text-black"}>
                    {rangeFilter === "all"
                      ? "All ranges"
                      : rangeFilter === "optimal"
                        ? "Optimal"
                        : rangeFilter === "normal"
                          ? "Normal"
                          : "Out of Range"}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                </button>
                {rangeDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-[#e5e7eb] rounded-lg shadow-lg z-50 overflow-hidden min-w-[140px]">
                    {[
                      { value: "all", label: "All ranges" },
                      { value: "optimal", label: "Optimal" },
                      { value: "normal", label: "Normal" },
                      { value: "out_of_range", label: "Out of Range" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={(e) => {
                          e.stopPropagation();
                          setRangeFilter(opt.value);
                          setRangeDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 text-[14px] hover:bg-gray-50 transition-colors ${
                          rangeFilter === opt.value
                            ? "text-primary font-medium bg-primary/5"
                            : "text-black"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Category Filter */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCategoryDropdownOpen(!categoryDropdownOpen);
                    setRangeDropdownOpen(false);
                  }}
                  className="border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-[14px] font-normal text-black flex items-center gap-1.5 hover:border-gray-300 transition-colors"
                >
                  <span
                    className={`truncate ${categoryFilter === "all" ? "text-gray-500" : "text-black"}`}
                  >
                    {categoryFilter === "all" ? "Category" : categoryFilter}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                </button>
                {categoryDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-[#e5e7eb] rounded-lg shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto min-w-[180px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCategoryFilter("all");
                        setCategoryDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-[14px] hover:bg-gray-50 transition-colors ${
                        categoryFilter === "all"
                          ? "text-primary font-medium bg-primary/5"
                          : "text-black"
                      }`}
                    >
                      All categories
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCategoryFilter(cat);
                          setCategoryDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 text-[14px] hover:bg-gray-50 transition-colors ${
                          categoryFilter === cat
                            ? "text-primary font-medium bg-primary/5"
                            : "text-black"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Biomarker Table */}
        <div className="overflow-hidden">
          {/* Table Header: 12px/600 #717178 */}
          <div className="flex items-center px-4 py-3">
            <span className="text-[12px] font-semibold text-[#717178]">
              Name
            </span>
            <span className="text-[12px] font-semibold text-[#717178] ml-12">
              Status
            </span>
            <span className="text-[12px] font-semibold text-[#717178] ml-auto">
              History
            </span>
          </div>

          {/* Table Body */}
          {filteredGrouped.length === 0 ? (
            <div className="bg-white rounded-2xl px-4 py-8 text-center">
              <p className="text-sm text-gray-500">No biomarkers found</p>
            </div>
          ) : (
            filteredGrouped.map((group) => (
              <div key={group.category}>
                {/* Biomarker Rows */}
                {group.biomarkers.map((b, idx) => {
                  const dotColor = getStatusDotColor(b.flag, b.optimalFlag);
                  const value =
                    b.numericValue != null
                      ? Number.isInteger(b.numericValue)
                        ? b.numericValue
                        : parseFloat(b.numericValue.toFixed(2))
                      : "--";

                  return (
                    <div
                      key={b.canonicalName || idx}
                      className="bg-white rounded-2xl px-4 py-3.5 mb-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                    >
                      {/* Category label: small gray text at top */}
                      <p className="text-[10px] font-medium text-[#9ca3af] mb-1.5 tracking-wide">
                        {group.category}
                      </p>
                      <div className="flex items-center">
                        {/* Status dot + Name + Value */}
                        <div className="flex-1 flex items-start gap-2.5 min-w-0">
                          <span
                            className="inline-block rounded-full flex-shrink-0 mt-1.5"
                            style={{
                              width: "8px",
                              height: "8px",
                              backgroundColor: dotColor,
                            }}
                          />
                          <div className="min-w-0">
                            <span className="text-[14px] font-medium text-black truncate block leading-snug">
                              {b.displayName || b.canonicalName}
                            </span>
                            {/* Value + unit below name in gray */}
                            <span className="text-[13px] font-normal text-[#717178] leading-snug">
                              {value}
                              {b.unit && (
                                <span className="text-[11px] text-[#9ca3af] ml-1">
                                  {b.unit}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Mini sparkline + vertical bar */}
                        <div className="flex-shrink-0 ml-2">
                          <MiniSparkline dotColor={dotColor} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Bottom spacer for mobile */}
        <div className="h-6" />
      </div>
    </div>
  );
}
