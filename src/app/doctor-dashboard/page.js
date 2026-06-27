"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Cookie from "js-cookie";
import HeaderActions from "@/components/HeaderActions";
import DoctorBottomNav from "@/components/DoctorBottomNav";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import {
  Search,
  ArrowDownRight,
  ArrowUpRight,
  Users,
  AlertTriangle,
  ClipboardCheck,
  ChevronRight,
  FileText,
  CheckCircle2,
} from "lucide-react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

// ─── Status badge styles (soft, on-brand) ───
const STATUS_STYLES = {
  "Need Attention": { dot: "#ef4444", chip: "bg-red-50 text-red-600 ring-1 ring-red-100" },
  "Review Pending": { dot: "#f59e0b", chip: "bg-amber-50 text-amber-700 ring-1 ring-amber-100" },
  Normal: { dot: "#22c55e", chip: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" },
};

// ─── Helpers (all derived from real data) ───
function getInitials(p) {
  const a = (p?.firstName || "").trim()[0] || "";
  const b = (p?.lastName || "").trim()[0] || "";
  return (a + b).toUpperCase() || "?";
}

function fmtDate(d) {
  if (!d) return null;
  const date = new Date(d);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function gradeChip(grade) {
  if (!grade) return null;
  const g = String(grade).toUpperCase();
  if (g.startsWith("A") || g.startsWith("B")) return "bg-emerald-50 text-emerald-700";
  if (g.startsWith("C")) return "bg-amber-50 text-amber-700";
  return "bg-rose-50 text-rose-700";
}

// ─── Biological Age gauge (visualizes the real bioAge value) ───
function BioAgeBar({ value }) {
  const segments = 16;
  return (
    <div className="flex items-center gap-[2px]">
      {Array.from({ length: segments }).map((_, i) => {
        const ratio = i / segments;
        let color;
        if (ratio < 0.3) color = "bg-[#05bc7e]";
        else if (ratio < 0.5) color = "bg-[#d7d82e]";
        else color = "bg-[#f865dd]";
        const filled = i < Math.round((value / 100) * segments);
        return (
          <div
            key={i}
            className={`w-[2px] h-[18px] rounded-[1px] ${filled ? color : "bg-black/10"}`}
          />
        );
      })}
    </div>
  );
}

// ─── Initials monogram (from real patient name) ───
function Monogram({ patient, size = 40 }) {
  return (
    <span
      className="flex flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {getInitials(patient)}
    </span>
  );
}

// ─── Summary Stat Chip (live, derived from real patients) ───
function StatChip({ icon: Icon, label, value, loading }) {
  return (
    <div className="rounded-2xl bg-white/10 px-3 py-3 ring-1 ring-white/15 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white/15">
          <Icon className="h-[15px] w-[15px] text-white" />
        </span>
        <span className="text-[22px] font-semibold leading-none text-white">
          {loading ? <span className="inline-block h-5 w-5 animate-pulse rounded bg-white/20" /> : value}
        </span>
      </div>
      {/* full-width label below — wraps to 2 lines instead of truncating */}
      <p className="mt-2 text-[11px] font-medium leading-tight text-white/75">{label}</p>
    </div>
  );
}

// ─── Patient Card (every value is real, no fabricated trends) ───
function PatientCard({ patient, onClick }) {
  const status = patient.status || "Normal";
  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES["Normal"];
  const bioAge = patient.bioAge ?? patient.scores?.bioAge ?? null;
  const chronoAge = patient.age;
  const cyborgScore = patient.cyborgScore;
  const cyborgGrade = patient.cyborgGrade;
  const flaggedCount = patient.flaggedCount || 0;
  const biomarkerCount = patient.biomarkerCount || 0;
  const goalCount = patient.goalCount || 0;
  const reportDate = patient.reportDate;

  const bioAgeDiff = bioAge != null && chronoAge != null ? chronoAge - bioAge : null;
  const bioAgeBarValue = bioAge != null ? Math.min(100, Math.max(0, (bioAge / 80) * 100)) : 0;
  const gradeCls = gradeChip(cyborgGrade);

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-3xl border border-borderColor bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-200 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_18px_40px_-12px_rgba(84,29,122,0.22)]"
    >
      {/* Header — initials monogram (no stock photos) */}
      <div className="relative flex h-[112px] items-center justify-center bg-[radial-gradient(circle_at_50%_20%,#f3ecfb_0%,#faf7fe_60%,#ffffff_100%)]">
        <span
          className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-white text-[24px] font-semibold text-primary shadow-[0_6px_18px_-6px_rgba(84,29,122,0.4)] ring-1 ring-primary/10"
        >
          {getInitials(patient)}
        </span>
        <span
          className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${statusStyle.chip}`}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusStyle.dot }} />
          {status}
        </span>
      </div>

      <div className="px-4 pb-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-black">
              {patient.firstName || "Unknown"} {patient.lastName || ""}
            </h3>
            <p className="mt-0.5 text-sm text-secondary">Age: {chronoAge ?? "N/A"}</p>
          </div>
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors group-hover:bg-primary group-hover:text-white">
            <ChevronRight className="h-4 w-4" />
          </span>
        </div>

        {/* Biological Age — real value + gauge + real diff vs chrono age */}
        <div className="mt-4 rounded-2xl border border-borderColor bg-gray-50/70 px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary">Biological Age</p>
              <p className="text-sm text-gray-500">
                {bioAgeDiff != null
                  ? `${Math.abs(bioAgeDiff)} yrs ${bioAgeDiff > 0 ? "younger" : "older"} than age`
                  : "Awaiting report"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {bioAge != null && <BioAgeBar value={bioAgeBarValue} />}
              <span className="text-2xl font-semibold text-black">
                {bioAge != null ? Math.round(bioAge) : "—"}
              </span>
              {bioAgeDiff != null && (
                <span className={bioAgeDiff > 0 ? "text-emerald-500" : "text-red-500"}>
                  {bioAgeDiff > 0 ? (
                    <ArrowDownRight className="h-4 w-4" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4" />
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Real metrics: Cyborg Score + Biomarker flags */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-borderColor bg-gray-50/70 px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary">Cyborg Score</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-xl font-semibold text-black">
                {cyborgScore != null ? Math.round(cyborgScore) : "—"}
              </span>
              {gradeCls && (
                <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${gradeCls}`}>
                  {cyborgGrade}
                </span>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-borderColor bg-gray-50/70 px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary">Biomarkers</p>
            <p className="mt-1 text-xl font-semibold text-black">
              {biomarkerCount > 0 ? (
                <>
                  <span className={flaggedCount > 0 ? "text-red-500" : "text-emerald-600"}>{flaggedCount}</span>
                  <span className="text-sm font-medium text-gray-400"> / {biomarkerCount}</span>
                </>
              ) : (
                "—"
              )}
            </p>
          </div>
        </div>

        {/* Real footer: report date + goal count */}
        <div className="mt-3 flex items-center justify-between text-[12px] text-secondary">
          <span>{reportDate ? `Report ${fmtDate(reportDate)}` : "No report yet"}</span>
          {goalCount > 0 && <span>{goalCount} goal{goalCount !== 1 ? "s" : ""}</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Left-column list row (real patient) ───
function PatientRow({ patient, onClick, subtitle, accentDot }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-borderColor bg-white p-3 text-left shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition hover:border-primary/20 hover:shadow-md"
    >
      <Monogram patient={patient} size={40} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-black">
          {patient.firstName || "Unknown"} {patient.lastName || ""}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-secondary">
          {accentDot && (
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: accentDot }} />
          )}
          {subtitle}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300" />
    </button>
  );
}

// ─── Main Dashboard ───
export default function DoctorDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All patients");
  const [searchQuery, setSearchQuery] = useState("");

  const TABS = ["All patients", "Need Attention", "Review Pending"];

  useEffect(() => {
    if (user && user.userType !== "doctor") {
      router.push("/dashboard");
    }
  }, [user, router]);

  const fetchPatients = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const token = Cookie.get("authToken");
      if (!token) return;

      const res = await fetch(`${apiUrl}/api/doctor/patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        setPatients(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch patients:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Live refresh — new patients, new reports and status changes appear on their own.
  useAutoRefresh(
    useCallback(() => fetchPatients({ silent: true }), [fetchPatients]),
    { interval: 15000 }
  );

  // Live counts derived from real patient data (presentational only)
  const counts = useMemo(
    () => ({
      total: patients.length,
      needAttention: patients.filter((p) => p.status === "Need Attention").length,
      reviewPending: patients.filter((p) => p.status === "Review Pending").length,
    }),
    [patients]
  );

  // Real "needs review" list: flagged patients, worst first
  const needsReview = useMemo(
    () =>
      patients
        .filter((p) => p.status === "Need Attention" || p.status === "Review Pending")
        .sort((a, b) => (b.flaggedCount || 0) - (a.flaggedCount || 0))
        .slice(0, 6),
    [patients]
  );

  // Real "recent reports" list: by actual report date, newest first
  const recentReports = useMemo(
    () =>
      patients
        .filter((p) => p.reportDate)
        .sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime())
        .slice(0, 5),
    [patients]
  );

  const tabCount = (tab) =>
    tab === "All patients"
      ? counts.total
      : tab === "Need Attention"
      ? counts.needAttention
      : counts.reviewPending;

  const filteredPatients = useMemo(() => {
    let list = patients;

    if (activeTab !== "All patients") {
      list = list.filter((p) => p.status === activeTab);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          (p.firstName || "").toLowerCase().includes(q) ||
          (p.lastName || "").toLowerCase().includes(q) ||
          (p.email || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [patients, activeTab, searchQuery]);

  return (
    <div className="min-h-screen bg-pageBackground font-sans">
      {/* Top bar — kept light so HeaderActions stays legible */}
      <header className="sticky top-0 z-40 border-b border-borderColor/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white shadow-sm">
              C
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-black">Cyborg&nbsp;Clinic</span>
          </div>
          <HeaderActions />
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1400px] px-4 pt-6 pb-28 min-[1367px]:pb-6 lg:px-8">
        {/* Hero banner with live summary */}
        <section className="relative mb-6 overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_12%_-10%,#9a5cf0_0%,#541D7A_46%,#37105f_100%)] p-6 shadow-[0_20px_50px_-20px_rgba(84,29,122,0.55)] md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-fuchsia-400/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[13px] font-medium text-white/70">Welcome back</p>
              <h1 className="mt-1 text-[28px] font-semibold leading-tight text-white md:text-[32px]">
                Dr. {user?.firstName || "Doctor"}
              </h1>
              <p className="mt-1 text-[14px] text-white/75">Cyborg Longevity Physician</p>
            </div>

            <div className="grid w-full grid-cols-3 gap-3 lg:w-auto lg:min-w-[440px]">
              <StatChip icon={Users} label="Total patients" value={counts.total} loading={loading} />
              <StatChip icon={AlertTriangle} label="Need attention" value={counts.needAttention} loading={loading} />
              <StatChip icon={ClipboardCheck} label="Review pending" value={counts.reviewPending} loading={loading} />
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Left column — 100% real, derived from patient data */}
          <div className="space-y-4 lg:w-[340px] lg:flex-shrink-0">
            {/* Needs your review */}
            <div className="rounded-3xl border border-borderColor bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-black">Needs your review</h3>
                  <p className="text-sm text-secondary">Flagged from latest reports</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <AlertTriangle className="h-5 w-5" />
                </span>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-[58px] animate-pulse rounded-2xl bg-gray-100" />
                  ))}
                </div>
              ) : needsReview.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  <p className="text-sm font-medium text-gray-600">All caught up</p>
                  <p className="text-xs text-gray-400">No patients need review right now.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {needsReview.map((p) => (
                    <PatientRow
                      key={p._id}
                      patient={p}
                      accentDot={(STATUS_STYLES[p.status] || STATUS_STYLES.Normal).dot}
                      subtitle={`${p.status} · ${p.flaggedCount || 0} flagged`}
                      onClick={() => router.push(`/doctor/patients/${p._id}`)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Recent reports */}
            <div className="rounded-3xl border border-borderColor bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-black">Recent reports</h3>
                  <p className="text-sm text-secondary">Latest blood work</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </span>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-[58px] animate-pulse rounded-2xl bg-gray-100" />
                  ))}
                </div>
              ) : recentReports.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm font-medium text-gray-600">No reports yet</p>
                  <p className="text-xs text-gray-400">Reports appear here once patients upload blood work.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentReports.map((p) => (
                    <PatientRow
                      key={p._id}
                      patient={p}
                      subtitle={`${fmtDate(p.reportDate)} · ${p.biomarkerCount || 0} biomarkers`}
                      onClick={() => router.push(`/doctor/patients/${p._id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1">
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-[20px] font-semibold text-black">Patients</h2>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[13px] font-semibold text-primary">
                {counts.total}
              </span>
            </div>

            <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {TABS.map((tab) => {
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex flex-shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[14px] font-medium transition-colors ${
                      active
                        ? "bg-primary text-white shadow-sm shadow-primary/30"
                        : "border border-borderColor bg-white text-[#495565] hover:bg-gray-50"
                    }`}
                  >
                    {tab}
                    <span
                      className={`rounded-full px-1.5 text-[12px] font-semibold ${
                        active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {tabCount(tab)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mb-5">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-borderColor bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                />
              </div>
            </div>

            {/* Patient Cards Grid */}
            {loading ? (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[332px] animate-pulse rounded-3xl border border-borderColor bg-white"
                  >
                    <div className="h-[112px] rounded-t-3xl bg-gray-100" />
                    <div className="space-y-3 p-4">
                      <div className="h-5 w-1/2 rounded bg-gray-100" />
                      <div className="h-16 rounded-2xl bg-gray-100" />
                      <div className="h-16 rounded-2xl bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-borderColor bg-white p-12 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm font-medium text-gray-600">
                  {patients.length === 0
                    ? "No patients linked yet"
                    : "No patients match this filter"}
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  {patients.length === 0
                    ? "Share your referral code to get started."
                    : "Try a different tab or search term."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                {filteredPatients.map((patient) => (
                  <PatientCard
                    key={patient._id}
                    patient={patient}
                    onClick={() => router.push(`/doctor/patients/${patient._id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <DoctorBottomNav />
    </div>
  );
}
