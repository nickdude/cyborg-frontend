"use client";

import BiomarkerCard from "./BiomarkerCard";

export default function BiomarkersList({ biomarkers, title }) {
  return (
    <div className="space-y-3 font-inter lg:space-y-5">
      {title && <h3 className="text-sm font-semibold text-gray-700 lg:text-lg lg:font-bold">{title}</h3>}
      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        {biomarkers.map((biomarker) => (
          <BiomarkerCard key={biomarker.id} biomarker={biomarker} />
        ))}
      </div>
    </div>
  );
}
