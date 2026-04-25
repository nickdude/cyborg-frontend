"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Cookie from "js-cookie";
import Chatbot from "@/components/Chatbot";
import {
  ChevronRight,
  X,
} from "lucide-react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

// Dummy protocol items (only 2 shown in Figma)
const PROTOCOL_ITEMS = [
  { name: "Zinc Bisglycinate 15 mg", price: "$14" },
  { name: "Zinc Bisglycinate 15 mg", price: "$14" },
];

// Dummy action plan items
const ACTION_PLAN_ITEMS = [
  { name: "Ashwagandha", category: "Stress reduction supplement" },
  { name: "BHR12", category: "Metabolic function" },
  { name: "Peptide RJY3", category: "Muscle stress protocol" },
  { name: "Testosterone Replacement", category: "Hormone therapy" },
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
  const bioAgeRaw = latestReport?.scores?.bioAge;
  const bioAge = typeof bioAgeRaw === 'object' ? bioAgeRaw?.phenoAge : bioAgeRaw;
  const bioAgeConfidence = typeof bioAgeRaw === 'object' ? bioAgeRaw?.confidence : null;
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
  const optimalPct =
    totalBiomarkers > 0 ? (optimalCount / totalBiomarkers) * 100 : 0;
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

  // --- Loading & Error States ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2f2f2] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-[#f2f2f2] flex items-center justify-center px-4">
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

  // --- Segmented Donut Chart ---
  const DonutChart = () => {
    const size = 140;
    const strokeWidth = 14;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const totalSegments = 24;
    const segmentAngle = 360 / totalSegments;
    const gapAngle = 4;
    const arcAngle = segmentAngle - gapAngle;

    // Calculate how many segments for each category
    const optimalSegments = totalBiomarkers > 0
      ? Math.round((optimalCount / totalBiomarkers) * totalSegments)
      : Math.round(totalSegments * 0.7);
    const inRangeSegments = totalBiomarkers > 0
      ? Math.round(((inRangeCount - optimalCount) / totalBiomarkers) * totalSegments)
      : Math.round(totalSegments * 0.2);
    const outOfRangeSegments = totalSegments - optimalSegments - inRangeSegments;

    const segments = [];
    for (let i = 0; i < totalSegments; i++) {
      let color;
      if (i < optimalSegments) {
        color = "#00d4a1";
      } else if (i < optimalSegments + inRangeSegments) {
        color = "#f865dd";
      } else {
        color = "#e5e7eb";
      }

      const startAngle = i * segmentAngle - 90;
      const endAngle = startAngle + arcAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const cx = size / 2;
      const cy = size / 2;

      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);

      const largeArc = arcAngle > 180 ? 1 : 0;

      segments.push(
        <path
          key={i}
          d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      );
    }

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments}
      </svg>
    );
  };

  // Color bar segments for biomarkers card
  const ColorBar = () => {
    const segmentCount = totalBiomarkers > 0
      ? Math.min(Math.max(Math.round(totalBiomarkers / 20), 8), 20)
      : 12;
    const greenSegments = totalBiomarkers > 0
      ? Math.round((optimalCount / totalBiomarkers) * segmentCount)
      : segmentCount;

    return (
      <div className="flex gap-[2px] mt-3">
        {Array.from({ length: segmentCount }).map((_, i) => (
          <div
            key={i}
            className="rounded-[1px]"
            style={{
              width: 15,
              height: 18,
              backgroundColor: i < greenSegments ? "#05bc7e" : "#374151",
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f2f2f2]">
      {/* Header */}
      <header className="bg-white sticky top-0 z-40">
        <div className="flex items-center justify-between h-14 px-4 md:px-6 max-w-[1400px] mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg width="6" height="11" viewBox="0 0 6 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 1L1 5.5L5 10" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <h1 className="text-[16px] font-medium text-[#000000] truncate max-w-[200px] sm:max-w-none">
              {patientName}
            </h1>
          </div>
          <img
            src="/assets/avatars/avatar-1.png"
            alt={patientName}
            className="h-8 w-8 rounded-full object-cover flex-shrink-0"
          />
        </div>
      </header>

      {/* Body */}
      <div className="flex max-w-[1400px] mx-auto">
        {/* Left / Main Content */}
        <main className="flex-1 w-full lg:pr-[400px] xl:pr-[440px]">
          <div className="px-4 md:px-6 py-4 space-y-4 max-w-2xl mx-auto lg:max-w-none">
            {/* Biological Age Card */}
            <div className="relative rounded-lg overflow-hidden p-5 text-white bg-gradient-to-br from-[#6B2FA0] via-[#4A1F7A] to-[#1A1A2E]">
              <p className="text-[14px] font-medium text-white mb-1">
                Biological Age
              </p>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-[40px] font-medium text-white leading-none">
                  {bioAge != null ? Math.round(bioAge) : "--"}
                </span>
              </div>
              {ageDiff != null ? (
                <p className="text-[14px] font-normal text-white">
                  {ageDiff > 0
                    ? `${ageDiff.toFixed(1)} years younger than your chronological age`
                    : ageDiff < 0
                    ? `${Math.abs(ageDiff).toFixed(1)} years older than your chronological age`
                    : "Same as your chronological age"}
                </p>
              ) : (
                <p className="text-[14px] font-normal text-white/70">
                  Upload a report to calculate biological age
                </p>
              )}
            </div>

            {/* Biomarkers Summary Card */}
            <button
              onClick={() =>
                router.push(`/doctor/patients/${patientId}/biomarkers`)
              }
              className="w-full text-left bg-[#1a1a1a] rounded-xl p-5 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-normal text-[#99a1ae]">
                    Biomarkers
                  </p>
                  <p className="text-[20px] font-normal text-white mt-0.5">
                    {totalBiomarkers || 345} biomarkers tested
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-300 transition-colors" />
              </div>
              <ColorBar />
            </button>

            {/* Donut Chart Section */}
            <div className="bg-white rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div className="pt-2">
                  <p className="text-[20px] font-normal text-black">
                    {outOfRangeCount || 12} out of range
                  </p>
                  <p className="text-[20px] font-normal text-black mt-1">
                    {inRangeCount || 71} in range
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <DonutChart />
                </div>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#00d4a1]" />
                  <span className="text-[12px] font-normal text-black">
                    Optimal
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#f865dd]" />
                  <span className="text-[12px] font-normal text-black">
                    In range
                  </span>
                </div>
              </div>
            </div>

            {/* Goals & Protocol */}
            <div className="bg-white rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[18px] font-semibold text-[#0a0a0a]">
                  Goals &amp; Protocol
                </h2>
                <button
                  onClick={() =>
                    router.push(`/doctor/patients/${patientId}/goals`)
                  }
                  className="text-[14px] font-medium text-[#541d7a] hover:underline"
                >
                  View all
                </button>
              </div>

              {/* High priority goal card */}
              {highPriorityGoal ? (
                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-xl p-4 mb-4">
                  <span className="inline-block text-[12px] font-semibold bg-red-500 text-white px-3 py-1 rounded-full mb-2">
                    High priority
                  </span>
                  <h3 className="text-[14px] font-semibold text-white mb-1">
                    {highPriorityGoal.title || highPriorityGoal.name}
                  </h3>
                  <p className="text-[12px] font-normal text-gray-400 line-clamp-2">
                    {highPriorityGoal.description || highPriorityGoal.summary || ""}
                  </p>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] rounded-xl p-4 mb-4">
                  <span className="inline-block text-[12px] font-semibold bg-red-500 text-white px-3 py-1 rounded-full mb-2">
                    High priority
                  </span>
                  <h3 className="text-[14px] font-semibold text-white mb-1">
                    Protect your heart and arteries
                  </h3>
                  <p className="text-[12px] font-normal text-gray-400 line-clamp-2">
                    Your blood work shows a genetically high LP(a) with LDL/ApoB leaving extra cholesterol particles in circulation.
                  </p>
                </div>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white border border-gray-200 rounded p-3 text-center">
                  <p className="text-[12px] font-medium text-[#717178]">
                    Total Goals
                  </p>
                  <p className="text-[16px] font-semibold text-black mt-0.5">
                    {goals.length || 4}
                  </p>
                </div>
                <div className="flex-1 bg-white border border-gray-200 rounded p-3 text-center">
                  <p className="text-[12px] font-medium text-[#717178]">
                    Protocol Items
                  </p>
                  <p className="text-[16px] font-semibold text-black mt-0.5">
                    6
                  </p>
                </div>
              </div>
            </div>

            {/* Top Protocol Items */}
            <div>
              <h2 className="text-[16px] font-medium text-black mb-3">
                Top Protocol Items
              </h2>
              <div className="space-y-3">
                {PROTOCOL_ITEMS.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white"
                  >
                    <div className="h-[44px] w-[44px] rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="8" y="2" width="8" height="20" rx="3" fill="#d4b5f0"/>
                        <rect x="8" y="2" width="8" height="8" rx="3" fill="#9b59b6"/>
                        <rect x="6" y="9" width="12" height="2" rx="1" fill="#7d3c98"/>
                      </svg>
                    </div>
                    <span className="flex-1 text-[14px] font-medium text-black">
                      {item.name}
                    </span>
                    <span className="text-[13px] font-medium text-[#71717b]">
                      {item.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Your Action Plan */}
            <div className="bg-white rounded-3xl p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[18px] font-semibold text-[#0a0a0a]">
                  Your action plan
                </h2>
                <button className="text-[14px] font-medium text-[#541d7a] hover:underline">
                  View
                </button>
              </div>
              <div className="space-y-3">
                {ACTION_PLAN_ITEMS.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-[14px] bg-[#f9fafb] cursor-pointer"
                  >
                    <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <div className="h-4 w-4 rounded-full bg-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-black truncate">
                        {item.name}
                      </p>
                      <p className="text-[12px] font-normal text-gray-400">
                        {item.category}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Right Chatbot Sidebar -- Desktop */}
        <aside className="hidden lg:block fixed right-0 top-14 bottom-0 w-[400px] xl:w-[440px] bg-white border-l border-gray-200 z-30">
          <Chatbot
            patientId={patientId}
            patientName={patientName}
          />
        </aside>
      </div>

      {/* Mobile Chatbot Modal */}
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

      {/* Mobile Chatbot FAB */}
      <button
        onClick={() => setMobileChatOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full bg-[#541d7a] text-white shadow-xl hover:bg-[#441566] transition-colors flex items-center justify-center z-40"
      >
        <span className="text-[20px] font-bold">C</span>
      </button>
    </div>
  );
}
