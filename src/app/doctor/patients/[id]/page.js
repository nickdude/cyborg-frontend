"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Cookie from "js-cookie";
import Chatbot from "@/components/Chatbot";
import { doctorAPI } from "@/services/api";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { orderRecommendedProducts } from "@/utils/products";
import {
  ChevronRight,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Pill,
} from "lucide-react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function PatientDetail() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const params = useParams();
  const patientId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patient, setPatient] = useState(null);
  const [latestReport, setLatestReport] = useState(null);
  const [goals, setGoals] = useState([]);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [planStatus, setPlanStatus] = useState(null);
  const [planGoalCount, setPlanGoalCount] = useState(0);

  // Escape-to-close the full-screen mobile chat modal
  useEffect(() => {
    if (!mobileChatOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setMobileChatOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileChatOpen]);

  // Auth guard: redirect non-doctors away
  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/login");
      return;
    }
    if (user?.userType !== "doctor") {
      router.push("/dashboard");
      return;
    }
  }, [authLoading, token, user, router]);

  const fetchPatientData = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const cookieToken = Cookie.get("authToken");
      if (!cookieToken) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${apiUrl}/api/doctor/patients/${patientId}`, {
        headers: { Authorization: `Bearer ${cookieToken}` },
      });

      if (!res.ok) throw new Error("Failed to fetch patient data");

      const json = await res.json();
      const data = json.data || json;
      setPatient(data.patient || null);
      setLatestReport(data.latestReport || null);
      setGoals(data.goals || []);

      try {
        const planRes = await doctorAPI.getPatientActionPlan(patientId);
        const planData = planRes?.data || planRes;
        setPlanStatus(planData.status || null);
        setPlanGoalCount((planData.goals || []).length);
      } catch {
        setPlanStatus(null);
      }
    } catch (err) {
      console.error("Error fetching patient:", err);
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [patientId, router]);

  useEffect(() => {
    if (authLoading || !token || user?.userType !== "doctor") return;
    if (patientId) fetchPatientData();
  }, [patientId, authLoading, token, user, fetchPatientData]);

  // Live refresh — patient uploads / plan status changes show without reloading.
  useAutoRefresh(
    useCallback(() => fetchPatientData({ silent: true }), [fetchPatientData]),
    { interval: 15000, enabled: !authLoading && !!token && user?.userType === "doctor" }
  );

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

  // Single source of truth: the goals' protocol items (which now include AMINO 9),
  // deduped + AMINO-9-first via the shared helper — so this card, the goals page,
  // and recommendedProducts all reflect the same set. Card shows the top few.
  const protocolItems = orderRecommendedProducts(goals.flatMap((g) => g.protocolItems || []));
  const topProtocolItems = protocolItems.slice(0, 5);
  const actionPlanItems = goals.map((g) => ({
    name: g.title,
    category: g.category || g.priority,
    achieved: g.status === "achieved",
  }));

  const patientName = patient
    ? `${patient.firstName || ""} ${patient.lastName || ""}`.trim()
    : "Patient";

  // --- Loading & Error States ---
  if (authLoading || loading) {
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
        color = "#e5e7eb";
      } else {
        color = "#f865dd";
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
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#f2f2f2]/95 backdrop-blur-sm">
        <div className="relative mx-auto flex h-14 max-w-[1400px] items-center justify-between px-5 md:px-6">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#541d7a]/40"
            aria-label="Go back"
          >
            <svg width="8" height="16" viewBox="0 0 8 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M7 1L1 8L7 15" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-[16px] font-medium text-black leading-[24px]">
            {patientName}
          </h1>
          <img
            src="/assets/avatars/avatar-1.webp"
            alt={patientName}
            className="h-8 w-8 rounded-full object-cover flex-shrink-0 z-10"
          />
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto flex max-w-[1400px]">
        {/* Left / Main Content */}
        <main className="w-full flex-1 lg:pr-[416px] xl:pr-[456px]">
          <div className="mx-auto max-w-[980px] space-y-5 px-4 py-4 md:px-6 lg:max-w-[980px] lg:space-y-6 lg:py-6">
            {/* Biological Age Card */}
            <div className="relative h-[176px] overflow-hidden rounded-2xl border border-borderColor shadow-sm ring-1 ring-black/5">
              <img
                src="/assets/doctor/bio-age-card-bg-figma.webp"
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
              className="group w-full rounded-2xl border border-borderColor bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-medium text-secondary">
                    Biomarkers
                  </p>
                  <p className="mt-0.5 text-[20px] font-semibold text-black">
                    {totalBiomarkers > 0 ? totalBiomarkers : "N/A"} biomarkers tested
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 transition-colors group-hover:text-gray-600" />
              </div>
              <ColorBar />
            </button>

            {/* Donut Chart Section */}
            <div className="rounded-2xl border border-borderColor bg-white p-5 shadow-sm ring-1 ring-black/5">
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
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00d4a1]" />
                  <span className="text-[12px] font-normal text-black">Optimal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#e5e7eb]" />
                  <span className="text-[12px] font-normal text-black">In range</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f865dd]" />
                  <span className="text-[12px] font-normal text-black">Out of range</span>
                </div>
              </div>
            </div>

            {/* Goals & Protocol */}
            <div className="rounded-2xl border border-borderColor bg-white p-5 shadow-sm ring-1 ring-black/5">
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

              {/* High priority goal card — only when a real high-priority goal exists */}
              {highPriorityGoal && (
                <div className="relative mb-4 h-[132px] overflow-hidden rounded-2xl border border-borderColor shadow-sm">
                  <img
                    src="/assets/doctor/goals-card-bg-figma.webp"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="relative z-10 p-3">
                    <span className="inline-block text-[12px] font-semibold bg-white/15 text-white px-3 py-1 rounded-[25px] mb-1">
                      High priority
                    </span>
                    <h3 className="text-[14px] font-semibold text-white leading-[20px] tracking-[-0.15px] mb-1">
                      {highPriorityGoal.title || highPriorityGoal.name}
                    </h3>
                    <p className="text-[12px] font-normal text-white leading-[16px] line-clamp-2">
                      {highPriorityGoal.description || highPriorityGoal.whatThisMeans || ""}
                    </p>
                  </div>
                </div>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 rounded-xl border border-borderColor bg-gray-50 p-3">
                  <p className="text-[12px] font-medium text-[#717178] leading-[16px]">
                    Total Goals
                  </p>
                  <p className="text-[16px] font-semibold text-black leading-[20px] mt-1">
                    {goals.length}
                  </p>
                </div>
                <div className="flex-1 rounded-xl border border-borderColor bg-gray-50 p-3">
                  <p className="text-[12px] font-medium text-[#717178] leading-[16px]">
                    Protocol Items
                  </p>
                  <p className="text-[16px] font-semibold text-black leading-[20px] mt-1">
                    {protocolItems.length}
                  </p>
                </div>
              </div>

              {/* Top Protocol Items */}
              <p className="text-[16px] font-medium text-black leading-[24px] mb-2">
                Top Protocol Items
              </p>
              <div className="space-y-2">
                {topProtocolItems.length > 0 ? (
                  topProtocolItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 rounded-xl border border-borderColor bg-white p-3 shadow-sm"
                    >
                      <div className="flex h-[40px] w-[40px] flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <Pill className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-[14px] font-medium text-black leading-[20px]">
                          {item.productName || item.name || "Protocol item"}
                        </p>
                        {(item.dose || item.dosing) && (
                          <p className="truncate text-[13px] font-medium text-[#71717b] leading-[18px]">
                            {item.dose || item.dosing}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[13px] text-[#71717b] py-2">No protocol items yet</p>
                )}
              </div>
            </div>

            {/* Review Status Card */}
            {planStatus && (
              <button
                type="button"
                onClick={() => router.push(`/doctor/patients/${patientId}/goals`)}
                className={`mb-6 w-full text-left cursor-pointer rounded-2xl border p-5 shadow-sm ring-1 ring-black/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#541d7a]/40 focus-visible:ring-offset-2 ${
                  planStatus === "pending_review"
                    ? "bg-amber-50 border-amber-200 hover:bg-amber-100"
                    : planStatus === "draft"
                    ? "bg-orange-50 border-orange-200 hover:bg-orange-100"
                    : planStatus === "approved"
                    ? "bg-green-50 border-green-200 hover:bg-green-100"
                    : "bg-white border-[#e6e6e8] hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {planStatus === "pending_review" && <Clock className="h-5 w-5 text-amber-600" />}
                    {planStatus === "draft" && <AlertCircle className="h-5 w-5 text-orange-600" />}
                    {planStatus === "approved" && <CheckCircle className="h-5 w-5 text-green-600" />}
                    {planStatus !== "pending_review" && planStatus !== "draft" && planStatus !== "approved" && (
                      <Clock className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <p className={`text-[15px] font-semibold ${
                        planStatus === "pending_review" ? "text-amber-800"
                        : planStatus === "draft" ? "text-orange-800"
                        : planStatus === "approved" ? "text-green-800"
                        : "text-gray-800"
                      }`}>
                        {planStatus === "pending_review" && "Review Pending"}
                        {planStatus === "draft" && "Draft — Review Incomplete"}
                        {planStatus === "approved" && "Approved"}
                        {planStatus !== "pending_review" && planStatus !== "draft" && planStatus !== "approved" && "Action Plan"}
                      </p>
                      <p className="text-[12px] text-gray-500 mt-0.5">
                        {planStatus === "pending_review" && `${planGoalCount} goal${planGoalCount !== 1 ? "s" : ""} awaiting your review`}
                        {planStatus === "draft" && "You have unsaved edits"}
                        {planStatus === "approved" && "Patient can see goals & protocol"}
                        {planStatus !== "pending_review" && planStatus !== "draft" && planStatus !== "approved" && "Tap to view"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`h-5 w-5 ${
                    planStatus === "pending_review" ? "text-amber-400"
                    : planStatus === "draft" ? "text-orange-400"
                    : planStatus === "approved" ? "text-green-400"
                    : "text-gray-400"
                  }`} />
                </div>
              </button>
            )}

            {/* Your Action Plan */}
            <div className="mb-6 rounded-2xl border border-borderColor bg-white px-5 pb-5 pt-5 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[18px] font-semibold text-[#0a0a0a] leading-[28px] tracking-[-0.44px]">
                  Your action plan
                </h2>
                <button
                  onClick={() => router.push(`/doctor/patients/${patientId}/goals`)}
                  className="text-[14px] font-medium text-[#541d7a] tracking-[-0.15px]"
                >
                  View
                </button>
              </div>
              <div className="space-y-3">
                {actionPlanItems.length > 0 ? (
                  actionPlanItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex h-[60px] cursor-pointer items-center gap-3 rounded-xl bg-gray-50 px-3"
                    >
                      <div className="flex items-center justify-center flex-shrink-0 w-6 h-6">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke={item.achieved ? "#00d4a1" : "#d1d5db"} strokeWidth="2" fill="none" />
                          {item.achieved && <path d="M8 12l3 3 5-5" stroke="#00d4a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />}
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[14px] font-medium leading-[20px] tracking-[-0.15px] ${item.achieved ? "line-through text-[#99a1af]" : "text-black"}`}>
                          {item.name}
                        </p>
                        <p className="text-[12px] font-normal text-[#6a7282] leading-[16px]">
                          {item.category}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-300 flex-shrink-0" />
                    </div>
                  ))
                ) : (
                  <p className="text-[13px] text-[#6a7282] py-2">No data yet</p>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Right Chatbot Sidebar -- Desktop */}
        <aside className="hidden lg:block fixed right-0 lg:right-[max(0px,calc((100vw_-_1400px)/2))] top-14 bottom-0 w-[400px] xl:w-[440px] bg-white z-30 border-l border-borderColor/80 shadow-[-8px_0_24px_rgba(0,0,0,0.03)]">
          <Chatbot
            patientId={patientId}
            patientName={patientName}
          />
        </aside>
      </div>

      {/* Mobile Chatbot Modal — full screen */}
      {mobileChatOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`AI assistant for ${patientName}`}
          className="lg:hidden fixed inset-0 z-50 bg-white flex flex-col"
        >
          <div className="flex items-center justify-between px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] border-b border-gray-100">
            <button
              onClick={() => setMobileChatOpen(false)}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#541d7a]/40"
              aria-label="Close chat"
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
        className="lg:hidden fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 h-14 w-14 rounded-full bg-[#541d7a] shadow-[0px_0px_5px_0px_rgba(0,0,0,0.05)] hover:bg-[#441566] transition-colors flex items-center justify-center z-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#541d7a]/50 focus-visible:ring-offset-2"
        aria-label="Open AI assistant"
        aria-haspopup="dialog"
        aria-expanded={mobileChatOpen}
      >
        <img src="/assets/doctor/cyborg-logo.png" alt="" className="w-6 h-6 object-cover" />
      </button>
    </div>
  );
}
