"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import StatsGrid from "@/components/StatsGrid";
import ProgressBar from "@/components/ProgressBar";
import BiomarkersList from "@/components/BiomarkersList";
import DropdownFilter from "@/components/DropdownFilter";
import SearchBar from "@/components/SearchBar";
import { biomarkersData } from "@/data/biomarkersData";
import { userAPI } from "@/services/api";

export default function DataDashboard() {
  const { user } = useAuth();
  const userId = user?._id || user?.id;
  const userName = user?.firstName || "User";

  const [activeTab, setActiveTab] = useState("data");

  const [searchQuery, setSearchQuery] = useState("");
  const [rangeFilter, setRangeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [reportFilter, setReportFilter] = useState("all");
  const [reportSearch, setReportSearch] = useState("");
  const [reports, setReports] = useState([]);
  const [twinLoading, setTwinLoading] = useState(false);
  const [twinUploading, setTwinUploading] = useState(false);
  const [uploadElapsedSec, setUploadElapsedSec] = useState(0);
  const [twinError, setTwinError] = useState("");
  const [deletingReportId, setDeletingReportId] = useState(null);
  const uploadRef = useRef(null);

  // Phased progress: parsing a report via streaming AI takes ~60-120s.
  // We surface that honestly instead of a silent "Uploading..." freeze.
  useEffect(() => {
    if (!twinUploading) {
      setUploadElapsedSec(0);
      return;
    }
    const start = Date.now();
    setUploadElapsedSec(0);
    const id = setInterval(() => setUploadElapsedSec(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [twinUploading]);

  const uploadPhaseLabel = useMemo(() => {
    if (!twinUploading) return null;
    const s = uploadElapsedSec;
    if (s < 3) return "Uploading your file";
    if (s < 15) return "Reading the document";
    if (s < 60) return "Extracting biomarkers with AI";
    if (s < 120) return "Analyzing your results";
    return "Still working — almost there";
  }, [twinUploading, uploadElapsedSec]);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
  const staticBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");

  const rangeOptions = [
    { id: "all", label: "All ranges" },
    { id: "optimal", label: "Optimal" },
    { id: "normal", label: "Normal" },
    { id: "out_of_range", label: "Out of Range" },
  ];

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(biomarkersData.map((b) => b.category))];
    return [
      { id: "all", label: "Category" },
      ...uniqueCategories.map((cat) => ({ id: cat.toLowerCase().replace(/\s+/g, "-"), label: cat })),
    ];
  }, []);

  const filteredBiomarkers = useMemo(() => {
    return biomarkersData.filter((biomarker) => {
      const matchesSearch = biomarker.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRange = rangeFilter === "all" || biomarker.status === rangeFilter;
      const matchesCategory =
        categoryFilter === "all" || biomarker.category.toLowerCase().replace(/\s+/g, "-") === categoryFilter;

      return matchesSearch && matchesRange && matchesCategory;
    });
  }, [searchQuery, rangeFilter, categoryFilter]);

  const stats = useMemo(() => {
    return {
      total: biomarkersData.length,
      optimal: biomarkersData.filter((b) => b.status === "optimal").length,
      normal: biomarkersData.filter((b) => b.status === "normal").length,
      outOfRange: biomarkersData.filter((b) => b.status === "out_of_range").length,
    };
  }, []);

  const groupedBiomarkers = useMemo(() => {
    const groups = {};
    filteredBiomarkers.forEach((biomarker) => {
      if (!groups[biomarker.category]) {
        groups[biomarker.category] = [];
      }
      groups[biomarker.category].push(biomarker);
    });
    return groups;
  }, [filteredBiomarkers]);

  const fetchReports = useCallback(async () => {
    if (!userId) return;

    try {
      setTwinLoading(true);
      setTwinError("");
      const response = await userAPI.getBloodReports(userId);
      setReports(response?.data || []);
    } catch (error) {
      setTwinError("Failed to load healthcare records");
    } finally {
      setTwinLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (activeTab === "twin") {
      fetchReports();
    }
  }, [activeTab, fetchReports]);

  const handleUploadFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    try {
      setTwinUploading(true);
      setTwinError("");

      const formData = new FormData();
      formData.append("file", file);

      await userAPI.uploadBloodReport(userId, formData);
      await fetchReports();
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
      setTwinError(serverMsg || error?.message || "Failed to upload report");
    } finally {
      setTwinUploading(false);
      if (uploadRef.current) {
        uploadRef.current.value = "";
      }
    }
  };

  const triggerUpload = () => {
    uploadRef.current?.click();
  };

  const handleDeleteReport = async (reportId) => {
    if (!userId || !reportId) return;
    if (!window.confirm("Delete this report? This cannot be undone.")) return;
    try {
      setDeletingReportId(reportId);
      setTwinError("");
      await userAPI.deleteBloodReport(userId, reportId);
      await fetchReports();
    } catch (error) {
      const serverMsg = error?.response?.data?.message;
      setTwinError(serverMsg || "Failed to delete report");
    } finally {
      setDeletingReportId(null);
    }
  };

  // Fetch the stored original file with auth, convert to a blob URL, open in
  // a new tab. Needed because <a> and window.open can't send the
  // Authorization header our backend requires.
  // Fetch the stored file with auth, re-wrap as a PDF blob (the global
  // response interceptor already unwrapped to response.data, which for
  // responseType: "blob" is the Blob itself), and open in a new tab.
  const handleViewReport = async (reportId) => {
    try {
      setTwinError("");
      const raw = await userAPI.getBloodReportFile(reportId);
      const bodyType =
        raw?.type && raw.type.startsWith("application/") && raw.type !== "application/json"
          ? raw.type
          : "application/pdf";
      const blob = new Blob([raw], { type: bodyType });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      setTwinError(error?.message || "Could not open this report");
    }
  };

  const filteredReports = useMemo(() => {
    const normalizedSearch = reportSearch.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesSearch = !normalizedSearch || report.fileName?.toLowerCase().includes(normalizedSearch);

      if (reportFilter === "all") {
        return matchesSearch;
      }

      return matchesSearch;
    });
  }, [reports, reportSearch, reportFilter]);

  const hasReports = filteredReports.length > 0;

  return (
    <div className="min-h-screen bg-pageBackground pb-24 font-inter lg:pb-10">
      <div className="mx-auto w-full max-w-[1240px] px-4 pt-6 lg:px-8 lg:pt-10">
        <div className="pb-6 space-y-3 lg:pb-10 lg:space-y-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("data")}
              className={`text-3xl font-bold transition lg:text-5xl ${
                activeTab === "data" ? "text-black" : "text-secondary"
              }`}
            >
              Data
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("twin")}
              className={`text-2xl font-bold transition lg:text-4xl ${
                activeTab === "twin" ? "text-black" : "text-secondary"
              }`}
            >
              Twin
            </button>
          </div>

          {activeTab === "data" && (
            <>
              <div className="flex items-end justify-between gap-4 lg:items-center">
                <h2 className="text-2xl text-black lg:text-3xl font-semibold">{userName}</h2>
                <p className="text-xs text-secondary lg:text-sm">Updated Dec 16, 2025</p>
              </div>
              <p className="pt-2 text-xs text-secondary lg:max-w-[70ch] lg:text-base lg:leading-relaxed">
                {userName}, you&apos;re doing quite well. While there&apos;s room for improvement in some areas, your overall health markers are good.
              </p>
            </>
          )}
        </div>

        {activeTab === "data" ? (
          <section className="lg:grid lg:grid-cols-12 lg:gap-7 lg:items-start">
            <div className="bg-white rounded-2xl p-6 space-y-4 lg:col-span-3 lg:sticky lg:top-24 lg:p-8">
              <div className="space-y-5">
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Biomarkers</h2>
                <StatsGrid stats={stats} />
                <ProgressBar stats={stats} />
              </div>

              <div className="border-t border-borderColor pt-5 space-y-3">
                <SearchBar placeholder="Search..." value={searchQuery} onChange={setSearchQuery} />

                <div className="grid grid-cols-2 gap-3 lg:gap-2.5">
                  <DropdownFilter label="All ranges" options={rangeOptions} value={rangeFilter} onChange={setRangeFilter} />
                  <DropdownFilter label="Category" options={categories} value={categoryFilter} onChange={setCategoryFilter} />
                </div>
              </div>
            </div>

            <div className="space-y-8 pt-6 lg:col-span-9 lg:pt-0">
              {Object.entries(groupedBiomarkers).map(([category, biomarkers]) => (
                <BiomarkersList key={category} title={category} biomarkers={biomarkers} />
              ))}

              {filteredBiomarkers.length === 0 && <div className="py-12 text-center text-gray-500">No biomarkers found</div>}
            </div>
          </section>
        ) : (
          <section className="mx-auto w-full max-w-[760px]">
            {twinError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {twinError}
              </div>
            )}

            {twinUploading && (
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#e4e6ef] bg-white px-4 py-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black opacity-40"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-black"></span>
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#1e2027]">{uploadPhaseLabel}…</div>
                  <div className="text-xs text-[#6d6f7b]">
                    {uploadElapsedSec}s elapsed · typically 60–90s · keep this tab open
                  </div>
                </div>
              </div>
            )}

            {twinLoading ? (
              <div className="rounded-2xl border border-borderColor bg-white p-8 text-center text-gray-500">
                Loading twin records...
              </div>
            ) : !hasReports ? (
              <div className="min-h-[70vh]">
                <div className="space-y-4">
                  <SearchBar placeholder="Search...." value={reportSearch} onChange={setReportSearch} />
                  <button
                    type="button"
                    onClick={() => setReportFilter("all")}
                    className="flex items-center gap-2 text-[30px] font-medium text-[#6c6d79]"
                  >
                    All Files
                    <svg className="h-6 w-6" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M5 8L10 13L15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                <div className="mt-28 flex flex-col items-center justify-center text-center">
                  <h3 className="text-[50px] font-semibold leading-tight text-[#14151a]">No healthcare records yet</h3>
                  <p className="mt-5 max-w-[640px] text-[20px] leading-[1.45] text-[#6d6f7b]">
                    Integrate your healthcare records into superpower. Drop your files here or click to upload
                  </p>

                  <input
                    ref={uploadRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleUploadFile}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => triggerUpload()}
                    disabled={twinUploading}
                    className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-black px-6 text-[20px] font-medium text-white disabled:opacity-60"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 16V4M12 4L7 9M12 4L17 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M5 14V18C5 19.1046 5.89543 20 7 20H17C18.1046 20 19 19.1046 19 18V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {twinUploading ? `${uploadPhaseLabel}…` : "Upload"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pb-10">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-[#9ea3b1] bg-white px-4 py-2 text-[20px] font-medium text-[#2f3139]"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12.62 20.63C12.28 20.84 11.86 20.84 11.52 20.63C6.7 17.53 3.5 14.58 3.5 10.74C3.5 7.92 5.74 5.75 8.43 5.75C10.06 5.75 11.25 6.49 12.07 7.56C12.89 6.49 14.08 5.75 15.71 5.75C18.4 5.75 20.64 7.92 20.64 10.74C20.64 14.58 17.44 17.53 12.62 20.63Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Summary
                </button>

                <div className="rounded-2xl bg-white p-4">
                  <div className="relative flex h-[240px] items-center justify-center overflow-hidden rounded-xl bg-[#f7f7fa]">
                    <img src="/assets/man.png" alt="Digital twin body" className="h-[210px] w-auto opacity-30" />
                    <div className="absolute left-[9%] top-[8%] bottom-[8%] w-[2px] bg-black/55" />
                    <div className="absolute right-[9%] top-[8%] bottom-[8%] w-[1px] bg-black/10" />
                  </div>
                </div>

                <div className="rounded-2xl border border-[#d5d9e6] bg-[#f6f7fb] p-5">
                  <h3 className="text-[36px] font-medium text-[#1b1d24]">Hi {userName},</h3>
                  <p className="mt-3 text-[20px] leading-[1.45] text-[#666b78]">
                    We are currently awaiting and analyzing your first test results. They should be with you in 7-10 days and appear here in the date page. You’ll receive an e-mail once your results are ready and your digital twin is set up.
                  </p>
                  <p className="mt-3 text-[20px] leading-[1.45] text-[#666b78]">
                    Until then feel free to upload your existing health records or connect your wearables
                  </p>

                  <div className="mt-4 space-y-4">
                    {filteredReports.map((report) => {
                      const fileName = report?.filename || report?.fileName || "Uploaded report";
                      const isDeleting = deletingReportId === report._id;
                      return (
                        <div
                          key={report._id}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleViewReport(report._id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleViewReport(report._id);
                            }
                          }}
                          className="w-full cursor-pointer rounded-2xl border border-[#cfd5e4] bg-white p-4 text-left transition hover:border-[#9ea3b1]"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#f4f5f9] text-[#636776]">
                              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M7 3H13L19 9V19C19 20.1046 18.1046 21 17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3Z" stroke="currentColor" strokeWidth="2"/>
                                <path d="M13 3V9H19" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[17px] font-medium text-[#1e2027]">{fileName}</div>
                              <div className="text-xs text-[#787d8b]">
                                {report.reportDate
                                  ? new Date(report.reportDate).toISOString().slice(0, 10)
                                  : ""}
                                {report.testCount ? ` · ${report.testCount} tests` : ""}
                                {report.flaggedCount ? ` · ${report.flaggedCount} flagged` : ""}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteReport(report._id);
                              }}
                              disabled={isDeleting}
                              aria-label={isDeleting ? "Deleting report" : "Delete report"}
                              title="Delete report"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              {isDeleting ? (
                                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                </svg>
                              ) : (
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                  <path d="M3 6H21M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6L18.1327 19.0114C18.0579 20.1342 17.125 21 16 21H8C6.87502 21 5.94211 20.1342 5.86734 19.0114L5 6H19Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M10 11V17M14 11V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={triggerUpload}
                      disabled={twinUploading}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-black px-5 text-sm font-medium text-white disabled:opacity-60"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M12 16V4M12 4L7 9M12 4L17 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M5 14V18C5 19.1046 5.89543 20 7 20H17C18.1046 20 19 19.1046 19 18V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {twinUploading ? `${uploadPhaseLabel}…` : "Upload another report"}
                    </button>
                  </div>

                  <input
                    ref={uploadRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleUploadFile}
                    className="hidden"
                  />
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}