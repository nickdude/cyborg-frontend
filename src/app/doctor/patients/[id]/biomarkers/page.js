"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Cookie from "js-cookie";
import { ArrowLeft, Search, ChevronDown } from "lucide-react";

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

function getStatusColor(flag, optimalFlag) {
  if (optimalFlag === "optimal") return "bg-biomarkerOptimal";
  if (flag === "normal") return "bg-biomarkerNormal";
  if (flag === "out_of_range" || flag === "high" || flag === "low")
    return "bg-biomarkerOutOfRange";
  // fallback for "normal" flag without optimal
  return "bg-biomarkerNormal";
}

function getStatusLabel(flag, optimalFlag) {
  if (optimalFlag === "optimal") return "optimal";
  if (flag === "normal") return "normal";
  return "out_of_range";
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
      <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center px-4">
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

  const bioAge = scores?.bioAge ?? "--";

  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      {/* Header */}
      <header className="bg-white border-b border-borderColor sticky top-0 z-40">
        <div className="max-w-3xl mx-auto flex items-center h-14 px-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="ml-2 text-lg font-bold text-black">Biomarkers</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        {/* Biological Age + Pace of Aging Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Biological Age Card */}
          <div className="rounded-2xl p-4 bg-gradient-to-br from-[#6B21A8] to-[#541D7A] text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_60%)]" />
            <p className="text-xs font-medium text-white/80 mb-1">
              Biological age
            </p>
            <p className="text-4xl font-bold leading-none mb-1">
              {bioAge !== "--" ? Math.round(bioAge) : "--"}
            </p>
            <p className="text-xs text-white/70">years</p>
          </div>

          {/* Pace of Aging Card — HARDCODED */}
          <div className="rounded-2xl p-4 bg-gradient-to-br from-[#059669] to-[#047857] text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_60%)]" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-white/80 mb-1">
                  Pace of aging
                </p>
                <p className="text-4xl font-bold leading-none mb-1">46</p>
                <p className="text-xs text-white/70">%</p>
              </div>
              <span className="bg-white/20 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                Optimal
              </span>
            </div>
          </div>
        </div>

        {/* Biomarker Stats */}
        <div>
          <h2 className="text-base font-bold text-black mb-3">Biomarkers</h2>
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white rounded-xl px-3 py-2.5 text-center border border-borderColor">
              <p className="text-lg font-bold text-black">{stats.total}</p>
              <p className="text-[10px] text-gray-500 font-medium">Total</p>
            </div>
            <div className="bg-white rounded-xl px-3 py-2.5 text-center border border-borderColor">
              <p className="text-lg font-bold text-biomarkerOptimal">
                {stats.optimal}
              </p>
              <p className="text-[10px] text-gray-500 font-medium">Optimal</p>
            </div>
            <div className="bg-white rounded-xl px-3 py-2.5 text-center border border-borderColor">
              <p className="text-lg font-bold text-biomarkerNormal">
                {stats.normal}
              </p>
              <p className="text-[10px] text-gray-500 font-medium">Normal</p>
            </div>
            <div className="bg-white rounded-xl px-3 py-2.5 text-center border border-borderColor">
              <p className="text-lg font-bold text-biomarkerOutOfRange">
                {stats.outOfRange}
              </p>
              <p className="text-[10px] text-gray-500 font-medium">
                Out of Range
              </p>
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-borderColor rounded-xl pl-9 pr-4 py-2.5 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex gap-2">
            {/* Range Filter */}
            <div className="relative flex-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRangeDropdownOpen(!rangeDropdownOpen);
                  setCategoryDropdownOpen(false);
                }}
                className="w-full bg-white border border-borderColor rounded-xl px-3 py-2.5 text-sm text-black flex items-center justify-between hover:border-gray-300 transition-colors"
              >
                <span className={rangeFilter === "all" ? "text-gray-500" : "text-black"}>
                  {rangeFilter === "all"
                    ? "All ranges"
                    : rangeFilter === "optimal"
                      ? "Optimal"
                      : rangeFilter === "normal"
                        ? "Normal"
                        : "Out of Range"}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
              {rangeDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-borderColor rounded-xl shadow-lg z-50 overflow-hidden">
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
                      className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
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
            <div className="relative flex-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCategoryDropdownOpen(!categoryDropdownOpen);
                  setRangeDropdownOpen(false);
                }}
                className="w-full bg-white border border-borderColor rounded-xl px-3 py-2.5 text-sm text-black flex items-center justify-between hover:border-gray-300 transition-colors"
              >
                <span
                  className={`truncate ${categoryFilter === "all" ? "text-gray-500" : "text-black"}`}
                >
                  {categoryFilter === "all" ? "Category" : categoryFilter}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 ml-1" />
              </button>
              {categoryDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-borderColor rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCategoryFilter("all");
                      setCategoryDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
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
                      className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
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

        {/* Biomarker Table */}
        <div className="bg-white rounded-2xl border border-borderColor overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-3 border-b border-borderColor bg-gray-50/50">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Name
            </span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-center w-16">
              Status
            </span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right w-24">
              Value
            </span>
          </div>

          {/* Table Body */}
          {filteredGrouped.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500">No biomarkers found</p>
            </div>
          ) : (
            filteredGrouped.map((group) => (
              <div key={group.category}>
                {/* Category Header */}
                <div className="px-4 py-2 bg-gray-50/80 border-b border-borderColor">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    {group.category}
                  </span>
                </div>

                {/* Biomarker Rows */}
                {group.biomarkers.map((b, idx) => {
                  const statusColor = getStatusColor(b.flag, b.optimalFlag);
                  const value =
                    b.numericValue != null
                      ? Number.isInteger(b.numericValue)
                        ? b.numericValue
                        : parseFloat(b.numericValue.toFixed(2))
                      : "--";

                  return (
                    <div
                      key={b.canonicalName || idx}
                      className={`grid grid-cols-[1fr_auto_auto] gap-2 items-center px-4 py-3 ${
                        idx < group.biomarkers.length - 1
                          ? "border-b border-borderColor/50"
                          : ""
                      }`}
                    >
                      {/* Name */}
                      <span className="text-sm text-black font-medium truncate">
                        {b.displayName || b.canonicalName}
                      </span>

                      {/* Status Dot */}
                      <div className="flex items-center justify-center w-16">
                        <span
                          className={`inline-block h-2.5 w-2.5 rounded-full ${statusColor}`}
                        />
                      </div>

                      {/* Value + Unit */}
                      <div className="text-right w-24">
                        <span className="text-sm font-semibold text-black">
                          {value}
                        </span>
                        {b.unit && (
                          <span className="text-[11px] text-gray-400 ml-1">
                            {b.unit}
                          </span>
                        )}
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
