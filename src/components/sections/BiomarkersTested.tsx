"use client";

import { useState } from "react";
import { Container } from "@/components/Container";
import { cn } from "@/lib/utils";

type Tab = {
  label: string;
  icon: string;
};

type Marker = {
  name: string;
  advanced?: boolean;
};

const tabs: Tab[] = [
  { label: "Heart & Vascular Health", icon: "/assets/heart-vascular.png" },
  { label: "Liver health", icon: "/assets/liver-health.png" },
  { label: "Kidney health", icon: "/assets/kidney.png" },
  { label: "Thyroid", icon: "/assets/thyroid-health.png" },
  { label: "Metabolic health", icon: "/assets/metabolic-health.png" },
  { label: "Nutrients", icon: "/assets/nutrient.png" },
];

const markers: Marker[] = [
  { name: "Cholesterol, Total" },
  { name: "HDL Cholesterol" },
  { name: "Triglycerides" },
  { name: "LDL-Cholesterol (calculated)" },
  { name: "Cholesterol/HDL Ratio (calculated)" },
  { name: "LDL/HDL Ratio (calculated)" },
  { name: "Non-HDL Cholesterol (calculated)" },
  { name: "Apolipoprotein B" },
  { name: "LDL Cholesterol / Total Cholesterol (Mass Ratio)" },
  { name: "Non-HDL Cholesterol / Total Cholesterol (Mass Ratio)" },
  { name: "Triglyceride / HDL Cholesterol (Molar Ratio)" },
  { name: "Atherogenic Index of Plasma (AIP)" },
  { name: "Atherogenic Coefficient" },
  { name: "Neutrophil-to-HDL Cholesterol Ratio (NHR)" },
  { name: "TG / ApoB" },
  { name: "LDL-C / ApoB" },
  { name: "Non-HDL Cholesterol / Apolipoprotein B (Non-Hdl-C / ApoB)" },
  { name: "Uric Acid / HDL-C" },
  { name: "Testosterone /ApoB" },
  { name: "Lipoprotein (a)", advanced: true },
  { name: "LDL P", advanced: true },
  { name: "Small LDL P", advanced: true },
  { name: "LDL Size", advanced: true },
  { name: "HDL P", advanced: true },
  { name: "Large HDL P", advanced: true },
  { name: "HDL Size", advanced: true },
  { name: "Large VLDL P", advanced: true },
  { name: "VLDL Size", advanced: true },
];

export function BiomarkersTested() {
  const [active, setActive] = useState(0);

  return (
    <section className="bg-white py-20 md:py-24">
      <Container className="max-w-[1120px]">
        <h2 className="text-3xl font-semibold tracking-[-0.02em] text-black md:text-[44px]">
          See everything we test
        </h2>
        <p className="mt-3 max-w-[420px] text-[17px] text-black/60">
          The following 100+ biomarkers are included with your annual Cyborg
          membership.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "flex items-center gap-2 rounded-full border border-[#e6e6e8] px-4 py-2 text-sm font-medium text-black transition",
                active === i ? "bg-white shadow-sm" : "bg-white/55",
              )}
            >
              <img
                src={tab.icon}
                alt=""
                className="h-[26px] w-[26px] shrink-0"
              />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-[#e6e6e8] px-6 py-2 md:px-8">
          {markers.map((marker, i) => (
            <div
              key={marker.name}
              className={cn(
                "flex items-center py-3.5 text-[16px] text-black",
                i < markers.length - 1 && "border-b border-black/5",
              )}
            >
              <span>{marker.name}</span>
              {marker.advanced && (
                <span className="ml-3 rounded-md bg-[#ece4f5] px-2 py-0.5 text-xs font-medium text-[#5b2487]">
                  Advanced Panel
                </span>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
