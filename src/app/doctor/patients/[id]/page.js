"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Cookie from "js-cookie";
import Chatbot from "@/components/Chatbot";
import {
  ArrowLeft,
  ChevronRight,
  MessageCircle,
  X,
  Target,
  Pill,
  FileText,
} from "lucide-react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

// Dummy protocol items
const PROTOCOL_ITEMS = [
  { name: "Zinc Bisglycinate 15 mg", price: "$14", icon: Pill },
  { name: "Magnesium Glycinate 400 mg", price: "$18", icon: Pill },
  { name: "Omega-3 Fish Oil 2000 mg", price: "$22", icon: Pill },
  { name: "Vitamin D3 5000 IU", price: "$12", icon: Pill },
];

// Dummy action plan items
const ACTION_PLAN_ITEMS = [
  { name: "Ashwagandha", category: "Adaptogen / Stress" },
  { name: "BHR12", category: "Hormonal Support" },
  { name: "Peptide RJY3", category: "Recovery / Repair" },
  { name: "Testosterone Replacement", category: "Hormone Therapy" },
];

export default function PatientDetail() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useParams();
  const patientId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patient, setPatient] = useState(null);
  const [latestReport, setLatestReport] = useState(null);
  const [goals, setGoals] = useState([]);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        const token = Cookie.get("authToken");
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await fetch(`${apiUrl}/api/doctor/patients/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch patient data");

        const json = await res.json();
        const data = json.data || json;
        setPatient(data.patient || null);
        setLatestReport(data.latestReport || null);
        setGoals(data.goals || []);
      } catch (err) {
        console.error("Error fetching patient:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) fetchPatientData();
  }, [patientId]);

  // Derive biomarker stats from latestReport
  const biomarkerPanel = latestReport?.biomarkerPanel || [];
  const totalBiomarkers = biomarkerPanel.length;
  const optimalCount = biomarkerPanel.filter(
    (b) => b.optimalFlag === "optimal" || b.flag === "normal"
  ).length;
  const outOfRangeCount = biomarkerPanel.filter(
    (b) => b.flag === "high" || b.flag === "low" || b.flag === "critical"
  ).length;
  const inRangeCount = totalBiomarkers - outOfRangeCount;

  // Scores
  const bioAge = latestReport?.scores?.bioAge;
  const chronologicalAge = patient?.dateOfBirth
    ? Math.floor(
        (Date.now() - new Date(patient.dateOfBirth).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;
  const ageDiff =
    bioAge != null && chronologicalAge != null
      ? chronologicalAge - bioAge
      : null;

  // Donut chart percentages
  const optimalPct = totalBiomarkers > 0 ? (optimalCount / totalBiomarkers) * 100 : 0;
  const inRangePct =
    totalBiomarkers > 0
      ? ((inRangeCount - optimalCount) / totalBiomarkers) * 100
      : 0;
  const outOfRangePct =
    totalBiomarkers > 0 ? (outOfRangeCount / totalBiomarkers) * 100 : 0;

  // High priority goal
  const highPriorityGoal = goals.find(
    (g) => g.priority === "high" || g.priority === "High"
  );

  const patientName = patient
    ? `${patient.firstName || ""} ${patient.lastName || ""}`.trim()
    : "Patient";

  const patientInitials = patient
    ? `${(patient.firstName || "?")[0]}${(patient.lastName || "?")[0]}`
    : "??";

  // --- Loading & Error States ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center max-w-sm w-full">
          <p className="text-red-500 font-medium mb-2">
            {error || "Patient not found"}
          </p>
          <button
            onClick={() => router.back()}
            className="text-sm text-purple-600 hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  // --- SVG Donut ---
  const DonutChart = () => {
    const size = 160;
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const optimalLen = (optimalPct / 100) * circumference;
    const inRangeLen = (inRangePct / 100) * circumference;
    const outOfRangeLen = (outOfRangePct / 100) * circumference;

    const gap = 4;
    const optimalOffset = 0;
    const inRangeOffset = optimalLen + gap;
    const outOfRangeOffset = optimalLen + inRangeLen + gap * 2;

    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Optimal - green */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#22C55E"
          strokeWidth={strokeWidth}
          strokeDasharray={`${optimalLen} ${circumference - optimalLen}`}
          strokeDashoffset={-optimalOffset}
          strokeLinecap="round"
        />
        {/* In Range - orange/yellow */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F59E0B"
          strokeWidth={strokeWidth}
          strokeDasharray={`${inRangeLen} ${circumference - inRangeLen}`}
          strokeDashoffset={-inRangeOffset}
          strokeLinecap="round"
        />
        {/* Out of Range - red */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#EF4444"
          strokeWidth={strokeWidth}
          strokeDasharray={`${outOfRangeLen} ${circumference - outOfRangeLen}`}
          strokeDashoffset={-outOfRangeOffset}
          strokeLinecap="round"
        />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-[#F2F2F2] font-inter">
      {/* ───── Header ───── */}
      <header className="bg-white sticky top-0 z-40 border-b border-gray-200">
        <div className="flex items-center justify-between h-14 px-4 md:px-6 max-w-[1400px] mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            <h1 className="text-base font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-none">
              {patientName}
            </h1>
          </div>
          <div className="h-9 w-9 rounded-full bg-purple-100 text-purple-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
            {patientInitials}
          </div>
        </div>
      </header>

      {/* ───── Body: two-column on desktop ───── */}
      <div className="flex max-w-[1400px] mx-auto">
        {/* Left / Main Content */}
        <main className="flex-1 w-full lg:pr-[400px] xl:pr-[440px]">
          <div className="px-4 md:px-6 py-5 space-y-5 max-w-2xl mx-auto lg:max-w-none">
            {/* ───── Biological Age Card ───── */}
            <div className="bg-gradient-to-br from-[#2D1B69] to-[#1A1A2E] rounded-2xl p-5 md:p-6 text-white">
              <p className="text-xs uppercase tracking-wider text-purple-300 mb-1">
                Biological Age
              </p>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-5xl md:text-6xl font-bold leading-none">
                  {bioAge != null ? Math.round(bioAge) : "--"}
                </span>
              </div>
              {ageDiff != null ? (
                <p className="text-sm text-purple-200">
                  {ageDiff > 0
                    ? `${ageDiff.toFixed(1)} years younger than your chronological age`
                    : ageDiff < 0
                    ? `${Math.abs(ageDiff).toFixed(1)} years older than your chronological age`
                    : "Same as your chronological age"}
                </p>
              ) : (
                <p className="text-sm text-purple-300/70">
                  Upload a report to calculate biological age
                </p>
              )}
              <div className="mt-3 flex items-center gap-4 text-xs text-purple-300">
                <span>Pace of aging: 0.92x</span>
                {latestReport?.reportDate && (
                  <span>
                    Report:{" "}
                    {new Date(latestReport.reportDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* ───── Biomarkers Summary Card ───── */}
            <button
              onClick={() =>
                router.push(`/doctor/patients/${patientId}/biomarkers`)
              }
              className="w-full text-left bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 md:p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Biomarkers
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {totalBiomarkers} biomarkers tested
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
              {/* Color distribution bar */}
              {totalBiomarkers > 0 && (
                <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                  {optimalPct > 0 && (
                    <div
                      className="bg-green-500 rounded-full"
                      style={{ width: `${optimalPct}%` }}
                    />
                  )}
                  {inRangePct > 0 && (
                    <div
                      className="bg-yellow-400 rounded-full"
                      style={{ width: `${inRangePct}%` }}
                    />
                  )}
                  {outOfRangePct > 0 && (
                    <div
                      className="bg-red-500 rounded-full"
                      style={{ width: `${outOfRangePct}%` }}
                    />
                  )}
                </div>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Optimal
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-yellow-400" />
                  Normal
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Out of range
                </span>
              </div>
            </button>

            {/* ───── Donut Chart Section ───── */}
            <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative flex-shrink-0">
                  <DonutChart />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">
                      {inRangeCount}
                    </span>
                    <span className="text-xs text-gray-500">in range</span>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="text-gray-700">
                      Optimal:{" "}
                      <span className="font-semibold text-gray-900">
                        {optimalCount}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-yellow-400" />
                    <span className="text-gray-700">
                      In range:{" "}
                      <span className="font-semibold text-gray-900">
                        {inRangeCount - optimalCount}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-gray-700">
                      Out of range:{" "}
                      <span className="font-semibold text-gray-900">
                        {outOfRangeCount}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ───── Goals & Protocol ───── */}
            <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">
                  Goals & Protocol
                </h2>
                <button
                  onClick={() =>
                    router.push(`/doctor/patients/${patientId}/goals`)
                  }
                  className="text-sm text-purple-600 font-medium hover:underline"
                >
                  View all
                </button>
              </div>

              {/* High priority goal card */}
              {highPriorityGoal ? (
                <div className="bg-gray-900 rounded-xl p-4 mb-4">
                  <span className="inline-block text-[10px] font-semibold uppercase tracking-wider bg-red-500 text-white px-2 py-0.5 rounded-full mb-2">
                    High priority
                  </span>
                  <h3 className="text-white font-semibold text-sm mb-1">
                    {highPriorityGoal.title || highPriorityGoal.name}
                  </h3>
                  <p className="text-gray-400 text-xs line-clamp-2">
                    {highPriorityGoal.description || highPriorityGoal.summary || ""}
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center">
                  <p className="text-sm text-gray-400">No high priority goals</p>
                </div>
              )}

              {/* Stats row */}
              <div className="flex items-center divide-x divide-gray-200">
                <div className="flex-1 text-center pr-4">
                  <p className="text-lg font-bold text-gray-900">
                    {goals.length}
                  </p>
                  <p className="text-xs text-gray-500">Total Goals</p>
                </div>
                <div className="flex-1 text-center pl-4">
                  <p className="text-lg font-bold text-gray-900">6</p>
                  <p className="text-xs text-gray-500">Protocol Items</p>
                </div>
              </div>
            </div>

            {/* ───── Top Protocol Items ───── */}
            <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Top Protocol Items
              </h2>
              <div className="space-y-3">
                {PROTOCOL_ITEMS.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Pill className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="flex-1 text-sm font-medium text-gray-800">
                      {item.name}
                    </span>
                    <span className="text-sm font-semibold text-gray-500">
                      {item.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ───── Your Action Plan ───── */}
            <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">
                  Your action plan
                </h2>
                <button className="text-sm text-purple-600 font-medium hover:underline">
                  View
                </button>
              </div>
              <div className="space-y-3">
                {ACTION_PLAN_ITEMS.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-400">{item.category}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* ───── Right Chatbot Sidebar — Desktop ───── */}
        <aside className="hidden lg:block fixed right-0 top-14 bottom-0 w-[400px] xl:w-[440px] bg-white border-l border-gray-200 z-30">
          <Chatbot
            patientId={patientId}
            patientName={patientName}
          />
        </aside>
      </div>

      {/* ───── Mobile Chatbot Modal ───── */}
      {mobileChatOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50">
          <div
            className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl"
            style={{ height: "85vh" }}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">AI Assistant</h3>
              <button
                onClick={() => setMobileChatOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="h-[calc(100%-4rem)]">
              <Chatbot
                patientId={patientId}
                patientName={patientName}
              />
            </div>
          </div>
        </div>
      )}

      {/* ───── Mobile Chatbot FAB ───── */}
      <button
        onClick={() => setMobileChatOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full bg-purple-700 text-white shadow-xl hover:bg-purple-800 transition-colors flex items-center justify-center z-40"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
}
