"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { actionPlanAPI } from "@/services/api";
import Navbar from "@/components/Navbar";

export default function ActionPlan() {
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.userId;
  const reportId = searchParams.get("reportId");
  const planId = searchParams.get("planId");
  const router = useRouter();
  const { token } = useAuth();

  const [actionPlan, setActionPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const fetchPlan = useCallback(async () => {
    try {
      // We expect planId from notification
      if (!planId) {
        setError("Plan not found. Please click the notification from the bell icon.");
        setLoading(false);
        return;
      }

      const response = await actionPlanAPI.get(planId);
      
      if (response.data) {
        const { status, planJson, errorMessage } = response.data;
        
        if (status === "ready" && planJson) {
          setActionPlan(planJson);
          setError("");
        } else if (status === "pending") {
          setError("Plan is still generating. You'll be notified when ready.");
        } else if (status === "failed") {
          setError(errorMessage || "Failed to generate plan");
        } else {
          setError("Plan not found");
        }
      }
    } catch (err) {
      setError("Failed to load plan: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    if (!token) {
      router.push("/login");
    } else if (reportId || planId) {
      fetchPlan();
    }
  }, [token, reportId, planId, fetchPlan, router]);

  const handleDownloadPDF = async () => {
    if (!planId) return;
    
    try {
      const blob = await actionPlanAPI.exportPDF(planId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `action-plan-${planId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setToast({ type: "success", message: "PDF downloaded successfully!" });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ type: "error", message: "Failed to download PDF" });
      console.error("PDF download error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pageBackground flex flex-col">
        <Navbar backHref={`/blood-reports/${userId}`} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xl font-semibold text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!reportId && !planId) {
    return (
      <div className="min-h-screen bg-pageBackground flex flex-col">
        <Navbar backHref={`/blood-reports/${userId}`} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xl font-semibold text-red-600">No plan selected</div>
        </div>
      </div>
    );
  }

  if (error && !actionPlan) {
    return (
      <div className="min-h-screen bg-pageBackground flex flex-col">
        <Navbar backHref={`/blood-reports/${userId}`} />
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-md text-center space-y-4">
            <div className="text-lg font-semibold text-red-600">{error}</div>
            <button
              onClick={() => router.back()}
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-900"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pageBackground flex flex-col">
      <Navbar backHref={`/blood-reports/${userId}`} />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg text-white z-auto animate-in fade-in slide-in-from-top-5 max-w-xs ${
            toast.type === "success"
              ? "bg-green-500"
              : toast.type === "error"
              ? "bg-red-500"
              : "bg-blue-500"
          }`}
        >
          {toast.message}
        </div>
      )}

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-6">
        {actionPlan && (
          <>
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              ✓ Your action plan is ready!
            </div>

            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 space-y-4">
              <div className="prose max-w-none">
                {typeof actionPlan === "string" ? (
                  <div className="whitespace-pre-wrap text-gray-800">{actionPlan}</div>
                ) : actionPlan.summary ? (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {actionPlan.summary}
                      </h2>
                    </div>

                    {actionPlan.recommendations && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-900">
                          Recommendations
                        </h3>
                        <div className="grid gap-4">
                          {actionPlan.recommendations.map((section, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200">
                              <h4 className="font-bold text-lg text-gray-800 mb-3">
                                {section.title}
                              </h4>
                              <ul className="space-y-2">
                                {section.items.map((item, i) => (
                                  <li key={i} className="flex gap-3 text-gray-700">
                                    <span className="text-green-600 font-bold">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {actionPlan.labsReviewed && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Report:</span> {actionPlan.labsReviewed.fileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          Uploaded: {new Date(actionPlan.labsReviewed.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>{JSON.stringify(actionPlan, null, 2)}</div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDownloadPDF}
                className="flex-1 bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-900"
              >
                Download as PDF
              </button>
              <button
                onClick={() => router.back()}
                className="flex-1 border border-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50"
              >
                Back
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
