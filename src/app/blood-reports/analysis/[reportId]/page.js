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
        setAnalysis(response.data?.aiAnalysis);
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
      case "excellent":
        return "text-green-700 bg-green-50 border-green-200";
      case "good":
        return "text-blue-700 bg-blue-50 border-blue-200";
      case "attention":
        return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "needs-improvement":
        return "text-red-700 bg-red-50 border-red-200";
      default:
        return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "excellent":
      case "good":
        return <CheckCircle2 className="h-5 w-5" />;
      case "attention":
        return <Info className="h-5 w-5" />;
      case "needs-improvement":
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      high: "bg-red-100 text-red-700",
      medium: "bg-yellow-100 text-yellow-700",
      low: "bg-green-100 text-green-700",
    };
    return colors[priority] || colors.medium;
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
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Confidence:</span>
              <span className="font-semibold text-primary">
                {Math.round(analysis.aiMetadata.confidence * 100)}%
              </span>
            </div>
          </div>

          {/* Overview */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Overview</h3>
            <p className="text-blue-800">{analysis.insights.overview}</p>
          </div>
        </div>

        {/* Key Findings */}
        <div className="bg-white rounded-xl border border-tertiary p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Key Findings</h2>
          <div className="space-y-4">
            {analysis.insights.keyFindings.map((finding, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${getStatusColor(finding.status)}`}
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(finding.status)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{finding.category}</h3>
                      <span className="text-xs uppercase font-medium px-2 py-1 rounded">
                        {finding.status.replace("-", " ")}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{finding.description}</p>
                    <p className="text-sm font-medium">
                      <span className="opacity-75">Recommendation:</span> {finding.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Factors */}
        {analysis.insights.riskFactors && analysis.insights.riskFactors.length > 0 && (
          <div className="bg-white rounded-xl border border-tertiary p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Risk Factors to Monitor</h2>
            <ul className="space-y-2">
              {analysis.insights.riskFactors.map((risk, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700">
                  <span className="text-yellow-600 mt-0.5">⚠️</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Personalized Recommendations */}
        <div className="bg-white rounded-xl border border-tertiary p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Personalized Recommendations</h2>
          <div className="space-y-6">
            {analysis.insights.personalizedRecommendations.map((rec, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">{rec.title}</h3>
                  <span
                    className={`text-xs uppercase font-medium px-3 py-1 rounded-full ${getPriorityBadge(
                      rec.priority
                    )}`}
                  >
                    {rec.priority} priority
                  </span>
                </div>
                <ul className="space-y-2">
                  {rec.actions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <span className="text-primary mt-1">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* AI Metadata */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-sm text-gray-600">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="font-medium">Analysis Model:</span> {analysis.aiMetadata.model}
            </div>
            <div>
              <span className="font-medium">Data Points Analyzed:</span>{" "}
              {analysis.aiMetadata.dataPointsAnalyzed.bloodMarkers} blood markers,{" "}
              {analysis.aiMetadata.dataPointsAnalyzed.questionnaireAnswers} questionnaire answers
            </div>
            <div>
              <span className="font-medium">Processed:</span>{" "}
              {new Date(analysis.processedAt).toLocaleString()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
