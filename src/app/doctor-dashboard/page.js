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
      className="cursor-pointer overflow-hidden rounded-2xl border border-borderColor bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative h-[180px] overflow-hidden bg-gradient-to-b from-[#f6f1fb] to-white">
        <img
          src={`/assets/avatars/avatar-${(index % 5) + 1}.png`}
          alt={patient.firstName || "Patient"}
          className="relative h-full w-full object-contain object-center p-3"
        />
        <span
          className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${
            STATUS_STYLES[status] || STATUS_STYLES["Normal"]
          }`}
        >
          {status}
        </span>
      </div>

      <div className="px-4 pb-4 pt-4">
        <div>
          <h3 className="text-lg font-semibold text-black">
            {patient.firstName || "Unknown"} {patient.lastName || ""}
          </h3>
          <p className="mt-1 text-sm text-secondary">Age: {chronoAge || "N/A"}</p>
        </div>

        <div className="mt-4 rounded-xl border border-borderColor bg-gray-50 px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary">Biological Age</p>
              <p className="text-sm text-gray-500">
                {bioAgeDiff != null
                  ? `≈ ${Math.abs(bioAgeDiff)} calendar years`
                  : "Not available"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <BioAgeBar value={bioAgeBarValue} />
              <span className="text-2xl font-semibold text-black">
                {bioAge != null ? Math.round(bioAge) : "—"}
              </span>
              {bioAgeDiff != null && (
                <span className={bioAgeDiff > 0 ? "text-red-500" : "text-emerald-500"}>
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

        <div className="mt-3 rounded-xl border border-borderColor bg-gray-50 px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary">ApoB</p>
              <p className="text-[11px] text-gray-500">Lowest % for Age Range</p>
            </div>
            <div className="flex items-center gap-2">
              <Sparkline values={apobValue ? [60, 55, 58, 52, apobValue] : [60, 55, 58, 52, 55]} />
              <span className="text-lg font-semibold text-black">
                {apobValue != null ? Math.round(apobValue) : "—"}
              </span>
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-secondary">cyborg.com</p>
      </div>
    </div>
  );
}

// ─── Calendar Strip ───
function CalendarStrip() {
  // `today` is computed on the client only. Deriving it during SSR uses the
  // server's timezone/clock, which can differ from the browser's (e.g. server
  // 27th vs client 28th) and causes a React hydration mismatch. Starting null
  // makes the server render and first client render identical (placeholders).
  const [today, setToday] = useState(null);
  useEffect(() => {
    setToday(new Date());
  }, []);

  const days = useMemo(() => {
    if (!today) return [];
    const arr = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [today]);

  return (
    <div className="flex min-h-[320px] flex-col rounded-2xl border border-borderColor bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-black">Upcoming</h3>
        <p className="text-sm text-secondary">in the next 2 weeks</p>
      </div>
      <div className="flex-1" />
      <div className="grid grid-cols-7 gap-x-2 gap-y-3">
        {(today ? days : Array.from({ length: 14 })).map((d, i) => {
          const isToday = today && i === 0;
          return (
            <button
              key={i}
              className={`mx-auto flex h-[38px] w-[38px] items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                isToday
                  ? "bg-black text-white"
                  : "border border-borderColor bg-gray-50 text-gray-600 hover:bg-gray-100"
              }${!today ? " animate-pulse" : ""}`}
            >
              {today ? d.getDate() : ""}
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
    <div className="flex items-start gap-4 rounded-2xl border border-borderColor bg-white p-4 shadow-sm">
      <div className="flex-shrink-0 rounded-xl border border-borderColor bg-gray-50 px-3 py-2 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary">{date.split(" ")[0]}</p>
        <p className="text-xl font-semibold text-black">{date.split(" ")[1]}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-black">{title}</p>
        <p className="mt-1 text-xs text-secondary">{time}</p>
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
      <header className="sticky top-0 z-40 bg-[#f2f2f2]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 lg:px-8">
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
      <main className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="space-y-4 lg:w-[320px] lg:flex-shrink-0">
            <CalendarStrip />

            <div className="space-y-3">
              {MOCK_APPOINTMENTS.map((apt, i) => (
                <AppointmentItem key={i} {...apt} />
              ))}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-[20px] font-semibold text-[#000000]">Patients</h2>
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-[14px] font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-black text-white shadow-sm"
                      : "bg-white text-[#495565] border border-borderColor hover:bg-gray-100"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="mb-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-borderColor bg-white py-3 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 shadow-sm outline-none transition focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
                />
              </div>
            </div>

            {/* Patient Cards Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="rounded-2xl border border-borderColor bg-white p-12 text-center shadow-sm">
                <p className="text-gray-400 text-sm">
                  {patients.length === 0
                    ? "No patients linked yet. Share your referral code to get started."
                    : "No patients match this filter."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
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
