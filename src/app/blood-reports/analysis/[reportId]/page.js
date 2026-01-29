"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { userAPI } from "@/services/api";
import Navbar from "@/components/Navbar";
import { Loader2, CheckCircle2, AlertCircle, Info, Calendar, FileText } from "lucide-react";

export default function BloodReportAnalysis() {
  const params = useParams();
  const reportId = params.reportId;
  const router = useRouter();
  const { token } = useAuth();

  const [report, setReport] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchReportAndAnalysis = async () => {
      try {
        setLoading(true);
        const response = await userAPI.getBloodReport(reportId);
        setReport(response.data);
        // New AI structure stores actionPlan directly in response
        const aiData = response.data?.actionPlan || response.data?.aiAnalysis;
        setAnalysis(aiData);
      } catch (err) {
        setError(err.message || "Failed to load analysis");
      } finally {
        setLoading(false);
      }
    };

    fetchReportAndAnalysis();
  }, [token, reportId, router]);

  const getStatusColor = (status) => {
    switch (status) {
      case "optimal":
        return "text-green-700 bg-green-50 border-green-200";
      case "near_boundary":
        return "text-blue-700 bg-blue-50 border-blue-200";
      case "out_of_range":
        return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "unknown":
        return "text-orange-700 bg-orange-50 border-orange-200";
      default:
        return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "optimal":
        return <CheckCircle2 className="h-5 w-5" />;
      case "near_boundary":
        return <Info className="h-5 w-5" />;
      case "out_of_range":
        return <AlertCircle className="h-5 w-5" />;
      case "unknown":
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case "A":
        return "bg-green-100 text-green-700";
      case "B":
        return "bg-blue-100 text-blue-700";
      case "C":
        return "bg-yellow-100 text-yellow-700";
      case "D":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getConfidenceBadgeColor = (confidence) => {
    switch (confidence) {
      case "high":
        return "bg-green-100 text-green-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "low":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pageBackground flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-pageBackground">
        <Navbar backHref="/dashboard" />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-pageBackground">
        <Navbar backHref="/dashboard" />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Analysis in Progress</h3>
            <p className="text-yellow-700">
              Your blood report is being analyzed. This typically takes 3-5 minutes. Please check back soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pageBackground">
      <Navbar backHref="/dashboard" />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-tertiary p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold mb-2">Blood Report Analysis</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>{report?.fileName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(report?.uploadedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Report ID:</span>
              <span className="font-mono text-xs ml-2">{analysis.report_id}</span>
            </div>
          </div>
        </div>

        {/* Biological Age Section */}
        {analysis.biological_age && (
          <div className="bg-white rounded-xl border border-tertiary p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Biological Age Assessment</h2>
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">Predicted Age</h3>
                    <span
                      className={`text-xs uppercase font-medium px-3 py-1 rounded-full ${getConfidenceBadgeColor(
                        analysis.biological_age.confidence
                      )}`}
                    >
                      {analysis.biological_age.confidence} confidence
                    </span>
                  </div>
                  <p className="text-4xl font-bold text-primary mb-3">
                    {analysis.biological_age.predicted_age} years
                  </p>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {analysis.biological_age.rationale}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Biomarkers Section */}
        {analysis.biomarkers && analysis.biomarkers.length > 0 && (
          <div className="bg-white rounded-xl border border-tertiary p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Blood Biomarkers Analysis</h2>
            <div className="space-y-4">
              {analysis.biomarkers.map((biomarker, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${getStatusColor(biomarker.status)}`}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(biomarker.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
                        <div>
                          <h3 className="font-semibold text-base">{biomarker.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg font-bold text-gray-900">
                              {biomarker.value}
                            </span>
                            <span className="text-sm text-gray-600">{biomarker.unit}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(
                              biomarker.grade
                            )}`}
                          >
                            Grade {biomarker.grade}
                          </span>
                          <span className="text-xs uppercase font-medium px-2 py-1 rounded bg-white/50">
                            {biomarker.status.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {biomarker.rationale}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Insights - derived from biomarkers */}
        {analysis.biomarkers && analysis.biomarkers.length > 0 && (
          <div className="bg-white rounded-xl border border-tertiary p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Key Insights</h2>
            <div className="space-y-3">
              {/* Show problematic biomarkers */}
              {analysis.biomarkers
                .filter((b) => b.status === "out_of_range" || b.status === "unknown")
                .map((biomarker, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                  >
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-yellow-900">{biomarker.name}</h4>
                      <p className="text-sm text-yellow-800">{biomarker.rationale}</p>
                    </div>
                  </div>
                ))}

              {/* Show near-boundary items */}
              {analysis.biomarkers
                .filter((b) => b.status === "near_boundary")
                .map((biomarker, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-blue-900">{biomarker.name}</h4>
                      <p className="text-sm text-blue-800">{biomarker.rationale}</p>
                    </div>
                  </div>
                ))}

              {/* Show optimal items */}
              {analysis.biomarkers
                .filter((b) => b.status === "optimal")
                .map((biomarker, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-green-900">{biomarker.name}</h4>
                      <p className="text-sm text-green-800">{biomarker.rationale}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="bg-white rounded-xl border border-tertiary p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Recommendations</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Next Steps</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Review your results with a licensed clinician for proper interpretation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Address any biomarkers marked as "out of range" with medical guidance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Monitor near-boundary markers and retest as recommended by your doctor</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  Maintain healthy lifestyle factors that support optimal biomarker levels
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimers */}
        {analysis.disclaimers && analysis.disclaimers.length > 0 && (
          <div className="bg-gray-50 rounded-lg border border-gray-300 p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Important Disclaimers</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              {analysis.disclaimers.map((disclaimer, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-gray-500 mt-0.5">•</span>
                  <span>{disclaimer}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Analysis Metadata */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-sm text-gray-600">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="font-medium">Analysis ID:</span> {analysis.report_id}
            </div>
            <div>
              <span className="font-medium">Generated:</span>{" "}
              {new Date(analysis.created_at).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Biomarkers Analyzed:</span>{" "}
              {analysis.biomarkers?.length || 0}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
