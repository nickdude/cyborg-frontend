"use client";

import { useState } from "react";
import IconTabs from "@/components/IconTabs";

export default function Data() {
  const [activeTab, setActiveTab] = useState("grid");

  const dataCategories = [
    { id: "grid", icon: "/assets/data-bar-icons/grid.svg" },
    { id: "vial", icon: "/assets/data-bar-icons/vial.svg" },
    { id: "pills", icon: "/assets/data-bar-icons/pills.svg" },
    { id: "dose", icon: "/assets/data-bar-icons/dose.svg" },
  ];

  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* Data Category Selector */}
      <IconTabs 
        categories={dataCategories} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      {/* Content based on active tab */}
      <div className="space-y-4">
        {activeTab === "grid" && (
          <div className="text-gray-700">
            <h3 className="font-semibold mb-3">Health Overview</h3>
            <p>Your overall health metrics and insights</p>
          </div>
        )}
        {activeTab === "vial" && (
          <div className="text-gray-700">
            <h3 className="font-semibold mb-3">Biomarkers</h3>
            <p>Blood work and lab results analysis</p>
          </div>
        )}
        {activeTab === "pills" && (
          <div className="text-gray-700">
            <h3 className="font-semibold mb-3">Supplements</h3>
            <p>Recommended supplements based on your data</p>
          </div>
        )}
        {activeTab === "dose" && (
          <div className="text-gray-700">
            <h3 className="font-semibold mb-3">Dosage</h3>
            <p>Personalized dosage recommendations</p>
          </div>
        )}
      </div>
    </div>
  );
}