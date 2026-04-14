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
  const [twinError, setTwinError] = useState("");
  const [replaceReportId, setReplaceReportId] = useState(null);
  const uploadRef = useRef(null);
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

      if (replaceReportId) {
        await userAPI.deleteBloodReport(userId, replaceReportId);
      }

      await userAPI.uploadBloodReport(userId, formData);
      await fetchReports();
    } catch (error) {
      setTwinError(error?.message || "Failed to upload report");
    } finally {
      setTwinUploading(false);
      setReplaceReportId(null);
      if (uploadRef.current) {
        uploadRef.current.value = "";
      }
    }
  };

  const triggerUpload = (reportId = null) => {
    setReplaceReportId(reportId);
    uploadRef.current?.click();
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
                    {twinUploading ? "Uploading..." : "Upload"}
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
                    {filteredReports.slice(0, 2).map((report) => {
                      const previewUrl = report?.filePath
                        ? `${staticBaseUrl}${report.filePath}`
                        : null;
                      const fileName = report?.fileName || "Uploaded report";
                      const isImage =
                        report?.mimeType?.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(fileName);
                      const isPdf = report?.mimeType === "application/pdf" || /\.pdf$/i.test(fileName);

                      return (
                        <button
                          key={report._id}
                          type="button"
                          onClick={() => triggerUpload(report._id)}
                          className="w-full rounded-2xl border border-[#cfd5e4] bg-white p-4 text-left"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[19px] font-medium text-[#1e2027]">Upload existing health records</span>
                            <span className="text-[24px] text-[#777b89]">↗</span>
                          </div>

                          <div className="mt-3 h-[130px] overflow-hidden rounded-lg bg-[#d3d3d6]">
                            {previewUrl && isImage ? (
                              <img
                                src={previewUrl}
                                alt={fileName}
                                className="h-full w-full object-cover"
                              />
                            ) : previewUrl && isPdf ? (
                              <iframe
                                src={previewUrl}
                                title={fileName}
                                className="h-full w-full border-0"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center gap-2 text-[#636776]">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                  <path d="M7 3H13L19 9V19C19 20.1046 18.1046 21 17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3Z" stroke="currentColor" strokeWidth="2"/>
                                  <path d="M13 3V9H19" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                                <span className="text-sm font-medium">Preview unavailable</span>
                              </div>
                            )}
                          </div>

                          <p className="mt-2 truncate text-sm text-[#787d8b]">{fileName}</p>

                          <div className="mt-3 flex justify-end">
                            <span className="inline-flex rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white">
                              {twinUploading && replaceReportId === report._id ? "Replacing..." : "Replace report"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
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