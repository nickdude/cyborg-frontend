"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Chatbot from "@/components/Chatbot";
import HeaderActions from "@/components/HeaderActions";
import {
  ArrowLeft,
  User,
  Heart,
  AlertCircle,
  Pill,
  Activity,
  Award,
  TrendingDown,
  MessageCircle,
  X,
} from "lucide-react";

// Mock patient data
const mockPatientData = {
  _id: "patient-001",
  firstName: "John",
  lastName: "Anderson",
  age: 45,
  phone: "555-0101",
  email: "john.anderson@mailinator.com",
  height: "5 ft 10 in",
  weight: "59 lbs",
  report_id: "6f343bdf-1e68-49b1-b66c-b96144d45e60",
  created_at: "2026-01-22T16:34:06.357663Z",
  biological_age: {
    predicted_age: 33.0,
    rationale:
      "Estimate integrates cardiometabolic labs, inflammatory markers, CBC, and lifestyle risks.",
    confidence: "medium",
  },
  biomarkers: [
    {
      name: "Hemoglobin",
      value: "14.8",
      unit: "g/dL",
      status: "optimal",
      grade: "A",
      rationale: "Within stated reference range (13.0–17.0), consistent with no anemia.",
    },
    {
      name: "RBC",
      value: "4.98",
      unit: "10^6/cu.mm",
      status: "optimal",
      grade: "A",
      rationale: "Within reference range (4.5–5.5), supporting normal red cell count.",
    },
    {
      name: "HCT",
      value: "44.3",
      unit: "%",
      status: "optimal",
      grade: "A",
      rationale: "Within reference range (40–50).",
    },
    {
      name: "Glucose - Fasting",
      value: "85",
      unit: "mg/dL",
      status: "optimal",
      grade: "A",
      rationale: "Within reference range (70–99), consistent with normal fasting glucose.",
    },
    {
      name: "HbA1c",
      value: "5.2",
      unit: "%",
      status: "optimal",
      grade: "A",
      rationale: "Within reference range and below prediabetes threshold.",
    },
    {
      name: "Cholesterol - Total",
      value: "112",
      unit: "mg/dL",
      status: "optimal",
      grade: "A",
      rationale: "Desirable per lab criteria (<200).",
    },
  ],
  monitored_issues: [
    {
      issue_id: "MI-001",
      title: "Underweight / possible malnutrition",
      priority: "high",
      summary: "Recorded weight is extremely low for stated height.",
    },
    {
      issue_id: "MI-002",
      title: "Tobacco use (daily smoking)",
      priority: "high",
      summary: "Daily cigarette use increases cardiometabolic risk.",
    },
    {
      issue_id: "MI-003",
      title: "Severe sleep disturbance",
      priority: "medium",
      summary: "Reported severe insomnia/unrestful sleep.",
    },
  ],
};

export default function PatientDetail() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const params = useParams();
  const patientId = params.id;

  const [activeTab, setActiveTab] = useState("biomarkers");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const patient = mockPatientData;

  const getGradeColor = (grade) => {
    switch (grade) {
      case "A":
        return "bg-green-100 text-green-800";
      case "B":
        return "bg-yellow-100 text-yellow-800";
      case "C":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "optimal":
        return "✓";
      case "near_boundary":
        return "⚠";
      case "out_of_range":
        return "✕";
      default:
        return "−";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "border-l-4 border-red-500 bg-red-50";
      case "medium":
        return "border-l-4 border-yellow-500 bg-yellow-50";
      case "low":
        return "border-l-4 border-blue-500 bg-blue-50";
      default:
        return "border-l-4 border-gray-500 bg-gray-50";
    }
  };

  return (
    <div className="min-h-screen bg-white font-inter">
      {/* Header */}
      <header className="border-b border-borderColor bg-white sticky top-0 z-40 shadow-sm">
        <div className="relative flex items-center h-16 px-4 md:px-8">
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-base md:text-xl font-bold text-black">Patient Details</h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                {patient.firstName} {patient.lastName}
              </p>
            </div>
          </div>

          {/* Right section - Absolute positioned */}
          <div className="absolute right-4 md:right-8">
            <HeaderActions />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Main Content */}
        <main className="flex-1 w-full lg:max-w-[calc(100%-30vw)]">
          {/* Patient Info Card */}
          <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-8">
            <div className="bg-white border border-borderColor rounded-xl shadow-sm p-4 md:p-6 mb-6 md:mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div>
                  <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                    <div className="h-12 w-12 md:h-16 md:w-16 rounded-full bg-primary/10 text-primary text-xl md:text-2xl font-bold flex items-center justify-center">
                      {patient.firstName[0]}
                      {patient.lastName[0]}
                    </div>
                    <div>
                      <h2 className="text-lg md:text-2xl font-bold text-black">
                        {patient.firstName} {patient.lastName}
                      </h2>
                      <p className="text-xs md:text-sm text-gray-500">ID: {patient._id}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 text-sm font-medium min-w-24">
                        Age:
                      </span>
                      <span className="text-black text-sm">{patient.age} years</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 text-sm font-medium min-w-24">
                        Height:
                      </span>
                      <span className="text-black text-sm">{patient.height}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 text-sm font-medium min-w-24">
                        Weight:
                      </span>
                      <span className="text-black text-sm">{patient.weight}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 text-sm font-medium min-w-24">
                        Phone:
                      </span>
                      <span className="text-black text-sm">{patient.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 text-sm font-medium min-w-24">
                        Email:
                      </span>
                      <span className="text-black text-sm">{patient.email}</span>
                    </div>
                  </div>
                </div>

                {/* Right Column - Biological Age */}
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-4 md:p-6 border border-primary/20">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-black">
                      Biological Age
                    </h3>
                  </div>

                  <div className="mb-4 md:mb-6">
                    <div className="text-3xl md:text-5xl font-bold text-primary mb-2">
                      {patient.biological_age.predicted_age.toFixed(0)}
                      <span className="text-base md:text-lg text-gray-500"> years</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary"></div>
                      <span className="text-sm text-gray-600">
                        Confidence: {patient.biological_age.confidence}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    {patient.biological_age.rationale.substring(0, 150)}...
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 md:gap-4 mb-4 md:mb-6 border-b border-borderColor overflow-x-auto scrollbar-hide">
              {["biomarkers", "issues", "supplements", "lifestyle"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 md:px-4 py-2 md:py-3 font-medium text-xs md:text-sm transition-all duration-200 border-b-2 whitespace-nowrap ${
                    activeTab === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-600 hover:text-black"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Biomarkers Tab */}
            {activeTab === "biomarkers" && (
              <div>
                <div className="grid gap-4">
                  {patient.biomarkers.map((marker) => (
                    <div
                      key={marker.name}
                      className="border border-borderColor rounded-lg p-3 md:p-4 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 md:gap-3 flex-1">
                          <div className="flex items-center justify-center h-7 w-7 md:h-8 md:w-8 rounded-full bg-primary/10 flex-shrink-0">
                            <span className="text-xs md:text-sm font-bold text-primary">
                              {getStatusIcon(marker.status)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm md:text-base text-black truncate">
                              {marker.name}
                            </h4>
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {marker.rationale.substring(0, 80)}...
                            </p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full font-bold text-sm ${getGradeColor(marker.grade)}`}>
                          {marker.grade}
                        </div>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xl md:text-2xl font-bold text-black">
                          {marker.value}{" "}
                          <span className="text-xs md:text-sm text-gray-500 font-normal">
                            {marker.unit}
                          </span>
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {marker.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Issues Tab */}
            {activeTab === "issues" && (
              <div className="space-y-4">
                {patient.monitored_issues.map((issue) => (
                  <div
                    key={issue.issue_id}
                    className={`rounded-lg p-4 md:p-5 ${getPriorityColor(issue.priority)}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-black mb-1">
                            {issue.title}
                          </h4>
                          <p className="text-sm text-gray-700">
                            {issue.summary}
                          </p>
                        </div>
                      </div>
                      <div className="px-2 py-1 bg-white bg-opacity-70 rounded text-xs font-medium text-gray-700">
                        {issue.priority.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Supplements Tab */}
            {activeTab === "supplements" && (
              <div className="grid gap-4">
                {[
                  {
                    name: "Magnesium Glycinate",
                    reason: "May support sleep quality",
                    dosage: "200–400 mg nightly",
                  },
                  {
                    name: "Omega-3 Complex",
                    reason: "Support cardiometabolic health",
                    dosage: "1,000 mg/day combined EPA+DHA",
                  },
                ].map((supplement) => (
                  <div
                    key={supplement.name}
                    className="border border-borderColor rounded-lg p-4 md:p-5 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <Pill className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-black">
                          {supplement.name}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {supplement.reason}
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-xs font-medium text-gray-600">
                        Dosage: {supplement.dosage}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Lifestyle Tab */}
            {activeTab === "lifestyle" && (
              <div className="grid gap-4">
                {[
                  {
                    section: "Sleep",
                    icon: Activity,
                    tips: [
                      "Set consistent sleep schedule (8-9 hours)",
                      "Use CBT-I techniques for insomnia",
                      "Reduce sleep-disrupting substances",
                    ],
                  },
                  {
                    section: "Exercise",
                    icon: Heart,
                    tips: [
                      "Start with 10-15 min daily walking",
                      "Add strength training 2x/week",
                      "Progress cardio to 150 min/week",
                    ],
                  },
                  {
                    section: "Nutrition",
                    icon: Activity,
                    tips: [
                      "Confirm weight and start restoration plan",
                      "Increase protein intake",
                      "Support glucose control with balanced meals",
                    ],
                  },
                ].map((section) => {
                  const Icon = section.icon;
                  return (
                    <div
                      key={section.section}
                      className="border border-borderColor rounded-lg p-4 md:p-5 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <h4 className="font-semibold text-black">
                          {section.section}
                        </h4>
                      </div>
                      <ul className="space-y-2">
                        {section.tips.map((tip, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm text-gray-700"
                          >
                            <span className="text-primary font-bold mt-0.5">
                              •
                            </span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* Right Chatbot Sidebar - Desktop Only */}
        <aside className="hidden lg:block w-[30vw] bg-white border-l border-borderColor fixed right-0 top-16 bottom-0 z-30">
          <Chatbot patientId={patient._id} patientName={`${patient.firstName} ${patient.lastName}`} />
        </aside>

        {/* Mobile Chatbot Modal */}
        {mobileChatOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200">
            <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-300" style={{ height: '85vh' }}>
              <div className="flex items-center justify-between p-4 border-b border-borderColor">
                <h3 className="font-semibold text-black">AI Assistant</h3>
                <button
                  onClick={() => setMobileChatOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-all"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              <div className="h-[calc(100%-4rem)]">
                <Chatbot patientId={patient._id} patientName={`${patient.firstName} ${patient.lastName}`} />
              </div>
            </div>
          </div>
        )}

        {/* Mobile Chatbot Floating Button */}
        <button
          onClick={() => setMobileChatOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-white shadow-2xl hover:bg-purple-800 transition-all duration-200 flex items-center justify-center z-40 animate-bounce"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
