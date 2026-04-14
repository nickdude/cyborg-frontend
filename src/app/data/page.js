"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import StatsGrid from "@/components/StatsGrid";
import ProgressBar from "@/components/ProgressBar";
import BiomarkersList from "@/components/BiomarkersList";
import DropdownFilter from "@/components/DropdownFilter";
import SearchBar from "@/components/SearchBar";
import { biomarkersData } from "@/data/biomarkersData";

export default function DataDashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [rangeFilter, setRangeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Get user name
  const userName = user?.firstName || "User";

  // Using shared biomarker data from @/data/biomarkersData.js


  const rangeOptions = [
    { id: "all", label: "All ranges" },
    { id: "optimal", label: "Optimal" },
    { id: "normal", label: "Normal" },
    { id: "out_of_range", label: "Out of Range" },
  ];

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(biomarkersData.map(b => b.category))];
    return [
      { id: "all", label: "Category" },
      ...uniqueCategories.map(cat => ({ id: cat.toLowerCase().replace(/\s+/g, "-"), label: cat }))
    ];
  }, []);

  // Filter biomarkers
  const filteredBiomarkers = useMemo(() => {
    return biomarkersData.filter(biomarker => {
      // Search filter
      const matchesSearch = biomarker.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Range filter
      const matchesRange = rangeFilter === "all" || biomarker.status === rangeFilter;
      
      // Category filter
      const matchesCategory = categoryFilter === "all" || 
        biomarker.category.toLowerCase().replace(/\s+/g, "-") === categoryFilter;
      
      return matchesSearch && matchesRange && matchesCategory;
    });
  }, [searchQuery, rangeFilter, categoryFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: biomarkersData.length,
      optimal: biomarkersData.filter(b => b.status === "optimal").length,
      normal: biomarkersData.filter(b => b.status === "normal").length,
      outOfRange: biomarkersData.filter(b => b.status === "out_of_range").length,
    };
  }, []);

  // Group biomarkers by category
  const groupedBiomarkers = useMemo(() => {
    const groups = {};
    filteredBiomarkers.forEach(biomarker => {
      if (!groups[biomarker.category]) {
        groups[biomarker.category] = [];
      }
      groups[biomarker.category].push(biomarker);
    });
    return groups;
  }, [filteredBiomarkers]);

  return (
    <div className="min-h-screen bg-pageBackground pb-24 font-inter lg:pb-10">
      <div className="mx-auto w-full max-w-[1240px] px-4 pt-6 lg:px-8 lg:pt-10">
        {/* Header */}
        <div className="pb-6 space-y-2 lg:pb-10 lg:space-y-3">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl text-black lg:text-5xl font-bold">Data</h1>
            <span className="text-secondary text-2xl lg:text-4xl font-bold">Twin</span>
          </div>
          <div className="flex items-end justify-between gap-4 lg:items-center">
            <h2 className="text-2xl text-black lg:text-3xl font-semibold">{userName}</h2>
            <p className="text-xs text-secondary lg:text-sm">Updated Dec 16, 2025</p>
          </div>
          <p className="pt-2 text-xs text-secondary lg:max-w-[70ch] lg:text-base lg:leading-relaxed">
            {userName}, you're doing quite well. While there's room for improvement in some areas, your overall health markers are good.
          </p>
        </div>

        <section className="lg:grid lg:grid-cols-12 lg:gap-7 lg:items-start">
          {/* Biomarkers Summary / Filters */}
          <div className="bg-white rounded-2xl p-6 space-y-4 lg:col-span-3 lg:sticky lg:top-24 lg:p-8">
            <div className="space-y-5">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Biomarkers</h2>
              <StatsGrid stats={stats} />
              <ProgressBar stats={stats} />
            </div>

            <div className="border-t border-borderColor pt-5 space-y-3">
              <SearchBar
                placeholder="Search..."
                value={searchQuery}
                onChange={setSearchQuery}
              />

              <div className="grid grid-cols-2 gap-3 lg:gap-2.5">
                <DropdownFilter
                  label="All ranges"
                  options={rangeOptions}
                  value={rangeFilter}
                  onChange={setRangeFilter}
                />
                <DropdownFilter
                  label="Category"
                  options={categories}
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                />
              </div>
            </div>
          </div>

          {/* Biomarkers List by Category */}
          <div className="space-y-8 pt-6 lg:col-span-9 lg:pt-0">
            {Object.entries(groupedBiomarkers).map(([category, biomarkers]) => (
              <BiomarkersList
                key={category}
                title={category}
                biomarkers={biomarkers}
              />
            ))}

            {filteredBiomarkers.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                No biomarkers found
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}