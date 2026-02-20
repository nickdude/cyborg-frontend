"use client";

import BiomarkerCard from "./BiomarkerCard";

export default function BiomarkersList({ biomarkers, title }) {
  return (
    <div className="space-y-3 font-inter">
      {title && <h3 className="text-sm font-semibold text-gray-700">{title}</h3>}
      <div className="space-y-3">
        {biomarkers.map((biomarker) => (
          <BiomarkerCard key={biomarker.id} biomarker={biomarker} />
        ))}
      </div>
    </div>
  );
}
