"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Cookie from "js-cookie";
import StatsGrid from "@/components/StatsGrid";
import ProgressBar from "@/components/ProgressBar";
import BiomarkersList from "@/components/BiomarkersList";
import DropdownFilter from "@/components/DropdownFilter";
import SearchBar from "@/components/SearchBar";
import { transformPanel, computeSummary } from "@/utils/biomarkerAdapter";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

function MiniGauge({ value, max = 100, color = "#05bc7e" }) {
  const clamped = Math.min(Math.max(value || 0, 0), max);
  const pct = clamped / max;
  const size = 48;
  const strokeWidth = 3.5;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const filled = circumference * pct;
  const gap = circumference - filled;
  const toRad = (d) => (d * Math.PI) / 180;
  const startAngle = -90;
  const endAngle = startAngle + 360 * pct;
  const dotX = cx + r * Math.cos(toRad(endAngle));
  const dotY = cy + r * Math.sin(toRad(endAngle));

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <circle
        cx={cx}
        cy={cy}
        r={r}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {pct > 0 && (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${gap}`}
          strokeDashoffset={0}
          fill="none"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      )}
      <circle cx={dotX} cy={dotY} r="3" fill="white" />
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
  const [patientName, setPatientName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [rangeFilter, setRangeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

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
        const p = data.patient;
        if (p) setPatientName(`${p.firstName || ""} ${p.lastName || ""}`.trim());
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, user, patientId, router]);

  // Transform panel same as user view — filters null values
  const biomarkers = useMemo(() => transformPanel(biomarkerPanel), [biomarkerPanel]);

  const stats = useMemo(() => computeSummary(biomarkers), [biomarkers]);

  const rangeOptions = [
    { id: "all", label: "All ranges" },
    { id: "optimal", label: "Optimal" },
    { id: "normal", label: "Normal" },
    { id: "out_of_range", label: "Out of Range" },
  ];

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(biomarkers.map((b) => b.category))];
    return [
      { id: "all", label: "Category" },
      ...uniqueCategories.map((cat) => ({
        id: cat.toLowerCase().replace(/\s+/g, "-"),
        label: cat,
      })),
    ];
  }, [biomarkers]);

  const filteredBiomarkers = useMemo(() => {
    return biomarkers.filter((biomarker) => {
      const matchesSearch = biomarker.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesRange =
        rangeFilter === "all" || biomarker.status === rangeFilter;
      const matchesCategory =
        categoryFilter === "all" ||
        biomarker.category.toLowerCase().replace(/\s+/g, "-") === categoryFilter;
      return matchesSearch && matchesRange && matchesCategory;
    });
  }, [biomarkers, searchQuery, rangeFilter, categoryFilter]);

  const groupedBiomarkers = useMemo(() => {
    const groups = {};
    filteredBiomarkers.forEach((biomarker) => {
      if (!groups[biomarker.category]) {
        groups[biomarker.category] = [];
      }
      groups[biomarker.category].push(biomarker);
    });
    return groups;
  }, [filteredBiomarkers]);

  // Scores
  const bioAgeRaw = scores?.bioAge;
  const bioAge = typeof bioAgeRaw === "object" ? bioAgeRaw?.phenoAge : bioAgeRaw;
  const bioAgeGrade = typeof bioAgeRaw === "object" ? bioAgeRaw?.grade : null;
  const paceRaw = scores?.paceOfAging;
  const paceValue = typeof paceRaw === "object" ? paceRaw?.pace : paceRaw;
  const paceGrade = typeof paceRaw === "object" ? paceRaw?.grade : null;

  function gradeToLabel(grade) {
    if (!grade) return null;
    if (grade === "A") return "Optimal";
    if (grade === "B") return "Good";
    if (grade === "C") return "Normal";
    if (grade === "D") return "Low";
    return "Critical";
  }
  function gradeToColor(grade) {
    if (!grade) return "#71717b";
    if (grade === "A") return "#05bc7e";
    if (grade === "B") return "#05bc7e";
    if (grade === "C") return "#d7d82e";
    if (grade === "D") return "#f865dd";
    return "#ef4444";
  }

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

  return (
    <div className="min-h-screen bg-pageBackground pb-24 font-inter lg:pb-10">
      {/* Header */}
      <header className="bg-white sticky top-0 z-40">
        <div className="max-w-[1240px] mx-auto flex items-center justify-center h-14 px-4 relative">
          <button
            onClick={() => router.back()}
            className="absolute left-4 p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg width="8" height="16" viewBox="0 0 8 16" fill="none">
              <path d="M7 1L1 8L7 15" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-[16px] font-medium text-black">
            {patientName ? `${patientName} — Biomarkers` : "Biomarkers"}
          </h1>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1240px] px-4 pt-6 lg:px-8 lg:pt-10">
        {/* Bio Age + Pace of Aging Cards */}
        <div className="space-y-3 mb-6">
          <div className="rounded-2xl p-5 bg-[#1e1e2a] text-white relative overflow-hidden min-h-[140px]">
            <div className="relative z-10">
              <div className="flex items-start justify-between">
                <p className="text-[14px] font-medium text-white/80">Biological age</p>
                {bioAgeGrade && (
                  <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-[12px] font-semibold px-3 py-1 rounded-full">
                    <span className="inline-block w-[7px] h-[7px] rounded-full" style={{ backgroundColor: gradeToColor(bioAgeGrade) }} />
                    {gradeToLabel(bioAgeGrade)}
                  </span>
                )}
              </div>
              <div className="flex items-end justify-between mt-3">
                <div className="flex items-baseline gap-2">
                  <p className="text-[44px] font-semibold leading-none tracking-tight">
                    {bioAge != null ? Math.round(bioAge) : "--"}
                  </p>
                  <p className="text-[16px] text-white/50 font-normal">years</p>
                </div>
                <div className="mb-[-2px]">
                  <MiniGauge value={bioAge != null ? Math.min(bioAge, 100) : 0} color={gradeToColor(bioAgeGrade)} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-5 bg-[#1e1e2a] text-white relative overflow-hidden min-h-[140px]">
            <div className="relative z-10">
              <div className="flex items-start justify-between">
                <p className="text-[14px] font-medium text-white/80">Pace of aging</p>
                {paceGrade && (
                  <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-[12px] font-semibold px-3 py-1 rounded-full">
                    <span className="inline-block w-[7px] h-[7px] rounded-full" style={{ backgroundColor: gradeToColor(paceGrade) }} />
                    {gradeToLabel(paceGrade)}
                  </span>
                )}
              </div>
              <div className="flex items-end justify-between mt-3">
                <div className="flex items-baseline gap-1">
                  <p className="text-[44px] font-semibold leading-none tracking-tight">
                    {paceValue != null ? paceValue.toFixed(2) : "--"}
                  </p>
                  <p className="text-[16px] text-white/50 font-normal">x</p>
                </div>
                <div className="mb-[-2px]">
                  <MiniGauge value={paceValue != null ? Math.min(paceValue * 50, 100) : 0} color={gradeToColor(paceGrade)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Biomarkers Section — same layout as user view */}
        {biomarkers.length === 0 ? (
          <div className="py-12 text-center">
            <h3 className="text-2xl font-semibold text-gray-900">No biomarker data yet</h3>
            <p className="mt-2 text-gray-500">Upload a blood report to see biomarkers</p>
          </div>
        ) : (
          <section className="lg:grid lg:grid-cols-12 lg:gap-7 lg:items-start">
            {/* Sidebar: Stats + Filters */}
            <div className="bg-white rounded-2xl p-6 space-y-4 lg:col-span-3 lg:sticky lg:top-24 lg:p-8">
              <div className="space-y-5">
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Biomarkers</h2>
                <StatsGrid stats={stats} />
                <ProgressBar stats={stats} />
              </div>

              <div className="border-t border-borderColor pt-5 space-y-3">
                <SearchBar placeholder="Search..." value={searchQuery} onChange={setSearchQuery} />

                <div className="grid grid-cols-2 gap-3 lg:gap-2.5">
                  <DropdownFilter
                    label="All ranges"
                    options={rangeOptions}
                    value={rangeFilter}
                    onChange={setRangeFilter}
                  />
                  <DropdownFilter
                    label="Category"
                    options={categories}
                    value={categoryFilter}
                    onChange={setCategoryFilter}
                  />
                </div>
              </div>
            </div>

            {/* Biomarker Cards — same as user view */}
            <div className="space-y-8 pt-6 lg:col-span-9 lg:pt-0">
              {Object.entries(groupedBiomarkers).map(([category, items]) => (
                <BiomarkersList key={category} title={category} biomarkers={items} />
              ))}

              {filteredBiomarkers.length === 0 && (
                <div className="py-12 text-center text-gray-500">No biomarkers found</div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
