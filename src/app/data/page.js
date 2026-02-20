"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import StatsGrid from "@/components/StatsGrid";
import ProgressBar from "@/components/ProgressBar";
import BiomarkersList from "@/components/BiomarkersList";
import DropdownFilter from "@/components/DropdownFilter";
import SearchBar from "@/components/SearchBar";

export default function DataDashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [rangeFilter, setRangeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Get user name
  const userName = user?.firstName || "User";

  // Sample biomarker data
  const biomarkersData = [
    {
      id: 1,
      name: "Health Score",
      value: "72",
      unit: "points",
      category: "Overall",
      status: "normal",
      trend: [65, 68, 70, 72],
      optimalRange: { min: 80, max: 100 }
    },
    {
      id: 2,
      name: "Biological Age",
      value: "72",
      unit: "points",
      category: "Aging",
      status: "optimal",
      trend: [75, 73, 72, 72],
      optimalRange: { min: 60, max: 75 }
    },
    {
      id: 3,
      name: "Pace of Aging",
      value: "86",
      unit: "%",
      category: "Aging",
      status: "optimal",
      trend: [88, 87, 86, 86],
      optimalRange: { min: 75, max: 95 }
    },
    {
      id: 4,
      name: "Cholesterol, Total",
      value: "172",
      unit: "mg/dL",
      category: "Heart & Vascular Health",
      status: "normal",
      trend: [180, 175, 172, 172],
      optimalRange: { min: 0, max: 200 }
    },
    {
      id: 5,
      name: "HDL Cholesterol",
      value: "52",
      unit: "mg/dL",
      category: "Heart & Vascular Health",
      status: "optimal",
      trend: [48, 50, 51, 52],
      optimalRange: { min: 40, max: 60 }
    },
    {
      id: 6,
      name: "LDL Cholesterol",
      value: "98",
      unit: "mg/dL",
      category: "Heart & Vascular Health",
      status: "optimal",
      trend: [105, 102, 100, 98],
      optimalRange: { min: 0, max: 100 }
    },
    {
      id: 7,
      name: "Blood Pressure Systolic",
      value: "118",
      unit: "mmHg",
      category: "Heart & Vascular Health",
      status: "optimal",
      trend: [125, 122, 120, 118],
      optimalRange: { min: 90, max: 120 }
    },
    {
      id: 8,
      name: "Glucose, Fasting",
      value: "92",
      unit: "mg/dL",
      category: "Metabolic Health",
      status: "optimal",
      trend: [95, 93, 92, 92],
      optimalRange: { min: 70, max: 99 }
    },
    {
      id: 9,
      name: "Insulin, Fasting",
      value: "8.5",
      unit: "mIU/L",
      category: "Metabolic Health",
      status: "normal",
      trend: [9.2, 8.8, 8.6, 8.5],
      optimalRange: { min: 2, max: 10 }
    },
    {
      id: 10,
      name: "Triglycerides",
      value: "145",
      unit: "mg/dL",
      category: "Heart & Vascular Health",
      status: "out_of_range",
      trend: [165, 155, 150, 145],
      optimalRange: { min: 0, max: 150 }
    },
  ];

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
    <div className="min-h-screen pb-24 px-4 font-inter bg-dataBarBg">
      {/* Header */}
      <div className="pt-6 pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl text-black">Data</h1>
          <span className="text-secondary text-2xl">Twin</span>
        </div>
        <div className="flex justify-between space-y-1">
          <h2 className="text-2xl text-black">{userName}</h2>
          <p className="text-sm text-secondary">Updated Dec 16, 2025</p>
        </div>
        <p className="text-secondary text-xs pt-2">{userName}, you're doing quite well. While there's room for improvement in some areas, your overall health markers are good.</p>
      </div>

      {/* Biomarkers Section */}
      <div className="bg-white rounded-2xl p-6 space-y-4 font-inter">
        {/* Header and Stats */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Biomarkers</h2>
          
          <StatsGrid stats={stats} />
          <ProgressBar stats={stats} />
        </div>

        {/* Search and Filters */}
        <div className="space-y-3 pt-2">
          <SearchBar 
            placeholder="Search..." 
            value={searchQuery}
            onChange={setSearchQuery}
          />
          
          <div className="grid grid-cols-2 gap-3">
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
      <div className="space-y-6 pt-6">
        {Object.entries(groupedBiomarkers).map(([category, biomarkers]) => (
          <BiomarkersList
            key={category}
            title={category}
            biomarkers={biomarkers}
          />
        ))}

        {filteredBiomarkers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No biomarkers found
          </div>
        )}
      </div>
    </div>
  );
}