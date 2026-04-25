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
  "Need Attention": "bg-[#ef4444] text-white",
  "Review Pending": "bg-[#f59e0b] text-white",
  Normal: "bg-[#22c55e] text-white",
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
        if (ratio < 0.3) color = "bg-[#05bc7e]";
        else if (ratio < 0.5) color = "bg-[#d7d82e]";
        else color = "bg-[#f865dd]";
        const filled = i < Math.round((value / 100) * segments);
        return (
          <div
            key={i}
            className={`w-[2px] h-[18px] rounded-[1px] ${filled ? color : "bg-white/10"}`}
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
function PatientCard({ patient, index = 0, onClick }) {
  const status = patient.status || "Normal";
  const bioAge = patient.bioAge || patient.scores?.bioAge;
  const chronoAge = patient.age;
  const apobValue = patient.apobValue;

  const bioAgeDiff = bioAge && chronoAge ? chronoAge - bioAge : null;
  const bioAgeBarValue = bioAge ? Math.min(100, Math.max(0, (bioAge / 80) * 100)) : 50;

  return (
    <div
      onClick={onClick}
      className="rounded-3xl overflow-hidden bg-[#1a1a1a] cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all duration-200"
    >
      {/* Avatar area — image with gradient overlay */}
      <div className="relative h-[192px] overflow-hidden">
        {/* Purple gradient background behind avatar */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#541d7a] to-[#7a2fa0]" />
        <img
          src={`/assets/avatars/avatar-${(index % 5) + 1}.png`}
          alt={patient.firstName || "Patient"}
          className="relative w-full h-full object-cover"
        />
        {/* Bottom fade to card bg */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/20 to-transparent" />
        {/* Status badge */}
        <span
          className={`absolute top-3 right-3 px-3 py-1 rounded text-xs font-semibold ${
            STATUS_STYLES[status] || STATUS_STYLES["Normal"]
          }`}
        >
          {status}
        </span>
        {/* Name + Age badge at bottom-left over gradient */}
        <div className="absolute bottom-3 left-4">
          <h3 className="text-2xl font-bold text-white">
            {patient.firstName || "Unknown"} {patient.lastName || ""}
          </h3>
          <span className="inline-block mt-1 px-2 py-0.5 rounded bg-white/10 text-sm font-normal text-white">
            Age: {chronoAge || "N/A"}
          </span>
        </div>
      </div>

      {/* Info area */}
      <div className="px-4 pb-4">

        {/* Biological Age */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-white text-xs font-normal">Biological Age</p>
            <p className="text-[#717178] text-sm font-normal">
              {bioAgeDiff != null
                ? `≈ ${Math.abs(bioAgeDiff)} calendar years`
                : "Not available"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BioAgeBar value={bioAgeBarValue} />
            <span className="text-2xl font-light text-white">
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
            <p className="text-white text-xs font-normal">ApoB</p>
            <p className="text-[#717178] text-[10px] font-normal">Lowest % for Age Range</p>
          </div>
          <div className="flex items-center gap-2">
            <Sparkline values={apobValue ? [60, 55, 58, 52, apobValue] : [60, 55, 58, 52, 55]} />
            <span className="text-lg font-normal text-white">
              {apobValue != null ? Math.round(apobValue) : "—"}
            </span>
            <span className="w-2 h-2 rounded-full bg-[#f865dd]" />
          </div>
        </div>

        {/* Watermark */}
        <p className="text-xs text-[#717178] mt-3">cyborg.com</p>
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
    <div className="bg-[#333333] rounded-[16px] p-5">
      <div className="mb-4">
        <h3 className="text-[20px] font-medium text-white">Upcoming</h3>
        <p className="text-[14px] font-normal text-white/50">in the next 2 weeks</p>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((d, i) => {
          const isToday = i === 0;
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          return (
            <button
              key={i}
              className={`w-[30px] h-[30px] rounded-full text-[16px] font-bold flex items-center justify-center transition-colors mx-auto ${
                isToday
                  ? "bg-primary text-white"
                  : isWeekend
                  ? "bg-[#f59e0b]/20 text-[#f59e0b]"
                  : "bg-[#444444] text-white hover:bg-[#555555]"
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
    <div className="bg-white rounded-lg p-4 flex items-start gap-4">
      <div className="flex-shrink-0 text-center">
        <p className="text-[12px] font-medium text-[#717178]">{date.split(" ")[0]}</p>
        <p className="text-[20px] font-medium text-[#717178]">{date.split(" ")[1]}</p>
      </div>
      <div className="flex-1 min-w-0 border-l border-gray-200 pl-4">
        <p className="text-[14px] font-medium text-black">{title}</p>
        <p className="text-[12px] font-medium text-[#717178]">{time}</p>
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
    <div className="min-h-screen bg-[#f2f2f2] font-sans">
      {/* Header — no white bar per Figma, floats on gray bg */}
      <header className="sticky top-0 z-40 bg-[#f2f2f2]">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
          <div>
            <h1 className="text-[24px] font-semibold text-[#000000]">
              Dr. {user?.firstName || "Doctor"}
            </h1>
            <p className="text-[14px] font-normal text-[#717178]">Cyborg Longevity Physician</p>
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
            <div className="space-y-2">
              {MOCK_APPOINTMENTS.map((apt, i) => (
                <AppointmentItem key={i} {...apt} />
              ))}
            </div>
          </div>

          {/* Right Column — Patients */}
          <div className="flex-1">
            {/* Patients header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[20px] font-semibold text-[#000000]">Patients</h2>
            </div>

            {/* Tab filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-[14px] font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-[#000000] text-white"
                      : "bg-[#ffffff] text-[#495565] border border-[#e5e7eb] hover:bg-gray-100"
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
                {filteredPatients.map((patient, index) => (
                  <PatientCard
                    key={patient._id}
                    patient={patient}
                    index={index}
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
