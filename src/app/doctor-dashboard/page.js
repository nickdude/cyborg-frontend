"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Cookie from "js-cookie";
import HeaderActions from "@/components/HeaderActions";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

// ─── Status badge colors ───
const STATUS_STYLES = {
  "Need Attention": "bg-[#FF6B35] text-white",
  "Review Pending": "bg-[#FF6B35] text-white",
  Normal: "bg-[#22C55E] text-white",
};

// ─── Placeholder appointments (no backend yet) ───
const MOCK_APPOINTMENTS = [
  { date: "Mar 22", title: "1-1 Advisory call with Sahil", time: "11:00 am" },
  { date: "Mar 22", title: "Appointment scheduled with Sushrut", time: "12:00 pm" },
  { date: "Mar 22", title: "Appointment with Ateeb", time: "01:00 pm" },
];

// ─── Biological Age Bar ───
function BioAgeBar({ value }) {
  const segments = 16;
  return (
    <div className="flex items-center gap-[2px]">
      {Array.from({ length: segments }).map((_, i) => {
        const ratio = i / segments;
        let color;
        if (ratio < 0.3) color = "bg-green-500";
        else if (ratio < 0.5) color = "bg-yellow-400";
        else if (ratio < 0.7) color = "bg-orange-400";
        else color = "bg-pink-500";
        const filled = i < Math.round((value / 100) * segments);
        return (
          <div
            key={i}
            className={`w-[6px] h-4 rounded-[1px] ${filled ? color : "bg-white/10"}`}
          />
        );
      })}
    </div>
  );
}

// ─── ApoB Sparkline ───
function Sparkline({ values, color = "#F59E0B" }) {
  if (!values || values.length < 2) {
    return <div className="w-20 h-8 bg-white/5 rounded" />;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 80;
  const h = 32;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Patient Card ───
function PatientCard({ patient, onClick }) {
  const status = patient.status || "Normal";
  const bioAge = patient.scores?.bioAge;
  const chronoAge = patient.age;
  const apob = patient.biomarkerPanel?.find(
    (b) => b.canonicalName === "ApoB" || b.displayName?.includes("ApoB")
  );

  const bioAgeDiff = bioAge && chronoAge ? chronoAge - bioAge : null;
  const bioAgeBarValue = bioAge ? Math.min(100, Math.max(0, (bioAge / 80) * 100)) : 50;

  return (
    <div
      onClick={onClick}
      className="rounded-2xl overflow-hidden bg-[#1A1A2E] cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all duration-200"
    >
      {/* Avatar area */}
      <div className="relative h-44 bg-gradient-to-b from-[#2D1B69] to-[#1A1A2E] flex items-end justify-center overflow-hidden">
        <div className="w-28 h-28 rounded-full bg-white/10 flex items-center justify-center mb-2">
          <span className="text-4xl font-bold text-white/40">
            {(patient.firstName?.[0] || "?").toUpperCase()}
          </span>
        </div>
        {/* Status badge */}
        <span
          className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${
            STATUS_STYLES[status] || STATUS_STYLES["Normal"]
          }`}
        >
          {status}
        </span>
      </div>

      {/* Info area */}
      <div className="px-4 pb-4 -mt-2">
        <h3 className="text-white text-xl font-bold">
          {patient.firstName || "Unknown"} {patient.lastName || ""}
        </h3>
        <span className="inline-block mt-1 px-2 py-0.5 rounded bg-white/10 text-white/80 text-xs font-medium">
          Age: {chronoAge || "N/A"}
        </span>

        {/* Biological Age */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-white/50 text-xs font-medium">Biological Age</p>
            <p className="text-white/30 text-[10px]">
              {bioAgeDiff != null
                ? `≈ ${Math.abs(bioAgeDiff)} calendar years`
                : "Not available"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BioAgeBar value={bioAgeBarValue} />
            <span className="text-white text-xl font-bold">
              {bioAge != null ? Math.round(bioAge) : "—"}
            </span>
            {bioAgeDiff != null && (
              <span className={bioAgeDiff > 0 ? "text-red-400" : "text-green-400"}>
                {bioAgeDiff > 0 ? (
                  <ArrowDownRight className="w-4 h-4" />
                ) : (
                  <ArrowUpRight className="w-4 h-4" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* ApoB */}
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-white/50 text-xs font-medium">ApoB</p>
            <p className="text-white/30 text-[10px]">Lowest % for Age Range</p>
          </div>
          <div className="flex items-center gap-2">
            <Sparkline values={apob ? [60, 55, 58, 52, apob.numericValue || 55] : [60, 55, 58, 52, 55]} />
            <span className="text-white text-xl font-bold">
              {apob?.numericValue != null ? Math.round(apob.numericValue) : "—"}
            </span>
            <span className="w-2 h-2 rounded-full bg-orange-400" />
          </div>
        </div>

        {/* Watermark */}
        <p className="text-white/15 text-[10px] mt-3">cyborg.com</p>
      </div>
    </div>
  );
}

// ─── Calendar Strip ───
function CalendarStrip() {
  const today = new Date();
  const days = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-[#1A1A2E] rounded-2xl p-4 shadow-sm">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-white">Upcoming</h3>
        <p className="text-xs text-white/50">in the next 2 weeks</p>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d, i) => {
          const isToday = i === 0;
          return (
            <button
              key={i}
              className={`w-9 h-9 rounded-full text-xs font-semibold flex items-center justify-center transition-colors mx-auto ${
                isToday
                  ? "bg-primary text-white ring-2 ring-primary/30"
                  : d.getDay() === 0 || d.getDay() === 6
                  ? "bg-orange-500/20 text-orange-400"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Appointment Item ───
function AppointmentItem({ date, title, time }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-shrink-0 text-center">
        <p className="text-[10px] text-gray-400 uppercase">{date.split(" ")[0]}</p>
        <p className="text-xl font-bold text-gray-900">{date.split(" ")[1]}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
        <p className="text-xs text-gray-400">{time}</p>
      </div>
    </div>
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

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
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
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

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
    <div className="min-h-screen bg-[#F2F2F2] font-inter">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Dr. {user?.firstName || "Doctor"}
            </h1>
            <p className="text-xs text-gray-400">Cyborg Longevity Physician</p>
          </div>
          <HeaderActions />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        {/* Desktop: two columns. Mobile: single column */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column — Calendar + Appointments */}
          <div className="lg:w-[340px] lg:flex-shrink-0 space-y-4">
            <CalendarStrip />

            {/* Appointments */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="px-0">
                {MOCK_APPOINTMENTS.map((apt, i) => (
                  <AppointmentItem key={i} {...apt} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column — Patients */}
          <div className="flex-1">
            {/* Patients header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Patients</h2>
            </div>

            {/* Tab filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search (desktop) */}
            <div className="hidden lg:block mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Patient Cards Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                <p className="text-gray-400 text-sm">
                  {patients.length === 0
                    ? "No patients linked yet. Share your referral code to get started."
                    : "No patients match this filter."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
    </div>
  );
}
