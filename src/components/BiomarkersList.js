"use client";

import BiomarkerCard from "./BiomarkerCard";
import { humanizeCategory } from "@/utils/biomarkerAdapter";

export default function BiomarkersList({ biomarkers, title }) {
  return (
    <div className="font-inter">
      {title && (
        <div className="mb-3 flex items-center gap-2.5 lg:mb-4">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-secondary lg:text-sm">
            {humanizeCategory(title)}
          </h3>
          <span className="h-px flex-1 bg-borderColor" />
          <span className="rounded-full bg-pageBackground px-2 py-0.5 text-[11px] font-medium text-secondary">
            {biomarkers.length}
          </span>
        </div>
      )}
      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2 lg:gap-3">
        {biomarkers.map((biomarker) => (
          <BiomarkerCard key={biomarker.id} biomarker={biomarker} />
        ))}
      </div>
    </div>
  );
}
