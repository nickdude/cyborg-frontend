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
    const size = 150;
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

  const ColorBar = () => (
    <img
      src="/assets/doctor/biomarker-colorbar.svg"
      alt="Biomarker range"
      className="mt-3 w-full h-[24px]"
      style={{ display: 'block' }}
    />
  );

  return (
    <div className="min-h-screen bg-[#f2f2f2]">
      {/* Header */}
      <header className="bg-[#f2f2f2] sticky top-0 z-40">
        <div className="relative flex items-center justify-between h-14 px-5 md:px-6 max-w-[1400px] mx-auto">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors z-10"
          >
            <svg width="8" height="16" viewBox="0 0 8 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 1L1 8L7 15" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-[16px] font-medium text-black leading-[24px]">
            {patientName}
          </h1>
          <img
            src="/assets/avatars/avatar-1.png"
            alt={patientName}
            className="h-8 w-8 rounded-full object-cover flex-shrink-0 z-10"
          />
        </div>
      </header>

      {/* Body */}
      <div className="flex max-w-[1400px] mx-auto">
        {/* Left / Main Content */}
        <main className="flex-1 w-full lg:pr-[400px] xl:pr-[440px]">
          <div className="px-4 md:px-6 py-4 space-y-4 max-w-2xl mx-auto lg:max-w-none">
            {/* Biological Age Card */}
            <div className="relative rounded-[12px] overflow-hidden h-[176px] border border-[#e6e6e8] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)]">
              <img
                src="/assets/doctor/bio-age-card-bg-figma.png"
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="relative z-10 p-4 h-full flex flex-col justify-between">
                <p className="text-[14px] font-medium text-white">
                  Biological Age
                </p>
                <div>
                  <span className="text-[40px] font-medium text-white leading-[54px]">
                    {bioAge != null ? Math.round(bioAge) : "--"}
                  </span>
                </div>
                {ageDiff != null && ageDiff !== 0 ? (
                  <p className="text-[14px] font-normal text-white leading-[18px]">
                    {ageDiff > 0
                      ? `${ageDiff.toFixed(1)} years younger than your chronological age`
                      : `${Math.abs(ageDiff).toFixed(1)} years older than your chronological age`}
                  </p>
                ) : (
                  <p className="text-[14px] font-normal text-white/70 leading-[18px]">
                    Upload a report to calculate biological age
                  </p>
                )}
              </div>
            </div>

            {/* Biomarkers Summary Card */}
            <button
              onClick={() =>
                router.push(`/doctor/patients/${patientId}/biomarkers`)
              }
              className="w-full text-left bg-[#1a1a1a] rounded-[12px] border border-[#e6e6e8] shadow-[0px_0px_5px_0px_rgba(0,0,0,0.05)] p-5 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-normal text-[#99a1ae]">
                    Biomarkers
                  </p>
                  <p className="text-[20px] font-normal text-white mt-0.5">
                    {totalBiomarkers > 0 ? totalBiomarkers : "N/A"} biomarkers tested
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-300 transition-colors" />
              </div>
              <ColorBar />
            </button>

            {/* Donut Chart Section */}
            <div className="bg-white rounded-[12px] border border-[#e6e6e8] shadow-[0px_0px_5px_0px_rgba(0,0,0,0.05)] p-5">
              <h3 className="text-[18px] font-semibold text-black leading-[28px] tracking-[-0.44px]">
                {totalBiomarkers > 0 ? outOfRangeCount : "N/A"} out of range
              </h3>
              <p className="text-[16px] font-normal text-[#717178] leading-[24px] tracking-[-0.31px]">
                {totalBiomarkers > 0 ? inRangeCount : "N/A"} in range
              </p>
              <div className="flex justify-center my-4">
                <DonutChart />
              </div>
              {/* Legend */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="grid grid-cols-3 gap-[2px]">
                    {Array.from({ length: 18 }).map((_, i) => (
                      <span key={i} className="rounded-full bg-[#00d4a1]" style={{ width: 4, height: 4 }} />
                    ))}
                  </div>
                  <span className="text-[12px] font-normal text-black">
                    Optimal
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="grid grid-cols-3 gap-[2px]">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <span key={i} className="rounded-full bg-[#f865dd]" style={{ width: 4, height: 4 }} />
                    ))}
                  </div>
                  <span className="text-[12px] font-normal text-black">
                    In range
                  </span>
                </div>
              </div>
            </div>

            {/* Goals & Protocol */}
            <div className="bg-white rounded-[12px] border border-[#e6e6e8] shadow-[0px_0px_5px_0px_rgba(0,0,0,0.05)] p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[18px] font-semibold text-[#0a0a0a] leading-[28px] tracking-[-0.44px]">
                  Goals &amp; Protocol
                </h2>
                <button
                  onClick={() =>
                    router.push(`/doctor/patients/${patientId}/goals`)
                  }
                  className="text-[14px] font-medium text-[#541d7a] tracking-[-0.15px]"
                >
                  View all
                </button>
              </div>

              {/* High priority goal card */}
              <div className="relative rounded-[8px] overflow-hidden h-[132px] border border-[#e6e6e8] shadow-[0px_0px_5px_0px_rgba(0,0,0,0.05)] mb-4">
                <img
                  src="/assets/doctor/goals-card-bg-figma.png"
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="relative z-10 p-3">
                  <span className="inline-block text-[12px] font-semibold bg-white/15 text-white px-3 py-1 rounded-[25px] mb-1">
                    High priority
                  </span>
                  <h3 className="text-[14px] font-semibold text-white leading-[20px] tracking-[-0.15px] mb-1">
                    {highPriorityGoal?.title || highPriorityGoal?.name || "Protect your heart and arteries"}
                  </h3>
                  <p className="text-[12px] font-normal text-white leading-[16px] line-clamp-2">
                    {highPriorityGoal?.description || highPriorityGoal?.summary || "Your blood work shows a genetically high LP(a) with LDL/ApoB leaving extra cholesterol particles in circulation."}
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 bg-white border border-[#e6e6e8] rounded-[4px] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)] p-3">
                  <p className="text-[12px] font-medium text-[#717178] leading-[16px]">
                    Total Goals
                  </p>
                  <p className="text-[16px] font-semibold text-black leading-[20px] mt-1">
                    {goals.length}
                  </p>
                </div>
                <div className="flex-1 bg-white border border-[#e6e6e8] rounded-[4px] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)] p-3">
                  <p className="text-[12px] font-medium text-[#717178] leading-[16px]">
                    Protocol Items
                  </p>
                  <p className="text-[16px] font-semibold text-black leading-[20px] mt-1">
                    6
                  </p>
                </div>
              </div>

              {/* Top Protocol Items */}
              <p className="text-[16px] font-medium text-black leading-[24px] mb-2">
                Top Protocol Items
              </p>
              <div className="space-y-2">
                {PROTOCOL_ITEMS.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-[8px] bg-white border border-[#e6e6e8] shadow-[0px_0px_5px_0px_rgba(0,0,0,0.05)]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-black leading-[20px]">
                        {item.name}
                      </p>
                      <p className="text-[13px] font-medium text-[#71717b] leading-[18px]">
                        {item.price}
                      </p>
                    </div>
                    <div className="h-[44px] w-[44px] rounded flex-shrink-0 overflow-hidden">
                      <img
                        src="/assets/doctor/protocol-item.png"
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Your Action Plan */}
            <div className="bg-white rounded-[24px] border border-[#e6e6e8] shadow-[0px_0px_5px_0px_rgba(0,0,0,0.05)] pt-5 px-5 pb-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[18px] font-semibold text-[#0a0a0a] leading-[28px] tracking-[-0.44px]">
                  Your action plan
                </h2>
                <button className="text-[14px] font-medium text-[#541d7a] tracking-[-0.15px]">
                  View
                </button>
              </div>
              <div className="space-y-3">
                {ACTION_PLAN_ITEMS.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 px-3 h-[60px] rounded-[14px] bg-[#f9fafb] cursor-pointer"
                  >
                    <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke={idx === 0 ? "#00d4a1" : "#d1d5db"} strokeWidth="2" fill="none" />
                        {idx === 0 && <path d="M8 12l3 3 5-5" stroke="#00d4a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />}
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[14px] font-medium leading-[20px] tracking-[-0.15px] ${idx === 0 ? "line-through text-[#99a1af]" : "text-black"}`}>
                        {item.name}
                      </p>
                      <p className="text-[12px] font-normal text-[#6a7282] leading-[16px]">
                        {item.category}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300 flex-shrink-0" />
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

      {/* Mobile Chatbot Modal — full screen */}
      {mobileChatOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
            <button
              onClick={() => setMobileChatOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-gray-900">{patientName}</span>
            <div className="w-9" />
          </div>
          <div className="flex-1 min-h-0">
            <Chatbot
              patientId={patientId}
              patientName={patientName}
            />
          </div>
        </div>
      )}

      {/* Mobile Chatbot FAB */}
      <button
        onClick={() => setMobileChatOpen(true)}
        className="lg:hidden fixed bottom-5 right-5 h-14 w-14 rounded-full bg-[#541d7a] shadow-[0px_0px_5px_0px_rgba(0,0,0,0.05)] hover:bg-[#441566] transition-colors flex items-center justify-center z-40"
      >
        <img src="/assets/doctor/cyborg-logo.png" alt="Chat" className="w-6 h-6 object-cover" />
      </button>
    </div>
  );
}
