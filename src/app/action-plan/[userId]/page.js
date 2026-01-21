"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { userAPI } from "@/services/api";

export default function ActionPlan() {
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.userId;
  const reportId = searchParams.get("reportId");
  const router = useRouter();
  const { token } = useAuth();

  const [actionPlan, setActionPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      router.push("/login");
    } else if (reportId) {
      fetchActionPlan();
    }
  }, [token, reportId]);

  const fetchActionPlan = async () => {
    try {
      const response = await userAPI.getActionPlan(reportId);
      setActionPlan(response.data?.actionPlan);
    } catch (err) {
      setError("Failed to load action plan");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");

    try {
      const response = await userAPI.generateActionPlan(reportId);
      setActionPlan(response.data.actionPlan);
    } catch (err) {
      setError(err.message || "Failed to generate action plan");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    // Placeholder for PDF download functionality
    alert("PDF download functionality will be implemented");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl font-bold">Loading...</div>
      </div>
    );
  }

  if (!reportId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl font-bold text-red-600">No report selected</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-8">Action Plan</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {!actionPlan ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-6">
                No action plan generated yet. Click below to generate one based on
                your blood report.
              </p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="bg-blue-600 text-white px-8 py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {generating ? "Generating..." : "Generate Action Plan"}
              </button>
            </div>
          ) : (
            <div>
              <div className="bg-blue-50 p-6 rounded-lg mb-6">
                <div className="prose max-w-none">
                  {typeof actionPlan === "string" ? (
                    <div className="whitespace-pre-wrap">{actionPlan}</div>
                  ) : (
                    <div>{JSON.stringify(actionPlan, null, 2)}</div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleDownloadPDF}
                  className="bg-green-600 text-white px-6 py-2 rounded font-semibold hover:bg-green-700"
                >
                  Download as PDF
                </button>
                <button
                  onClick={() => router.back()}
                  className="bg-gray-600 text-white px-6 py-2 rounded font-semibold hover:bg-gray-700"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
