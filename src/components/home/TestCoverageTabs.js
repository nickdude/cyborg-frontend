"use client";

import { useState } from "react";
import { motion } from "motion/react";

const TAB_DATA = [
  {
    key: "heart",
    title: "Heart & Vascular Health",
    icon: "/assets/tests/heart-vascular.png",
    items: [
      { label: "Cholesterol, Total" },
      { label: "HDL Cholesterol" },
      { label: "Triglycerides" },
      { label: "LDL-Cholesterol (calculated)" },
      { label: "Cholesterol/HDL Ratio (calculated)" },
      { label: "LDL/HDL Ratio (calculated)" },
      { label: "Non-HDL Cholesterol (calculated)" },
      { label: "Apolipoprotein B" },
      { label: "LDL Cholesterol / Total Cholesterol (Mass Ratio)" },
      { label: "Non-HDL Cholesterol / Total Cholesterol (Mass Ratio)" },
      { label: "Triglyceride / HDL Cholesterol (Molar Ratio)" },
      { label: "Atherogenic Index of Plasma (AIP)" },
      { label: "Atherogenic Coefficient" },
      { label: "Neutrophil-to-HDL Cholesterol Ratio (NHR)" },
      { label: "TG / ApoB" },
      { label: "LDL-C / ApoB" },
      { label: "Non-HDL Cholesterol / Apolipoprotein B (Non-Hdl-C / ApoB)" },
      { label: "Uric Acid / HDL-C" },
      { label: "Testosterone /ApoB" },
      { label: "Lipoprotein (a)", advanced: true },
      { label: "LDL P", advanced: true },
      { label: "Small LDL P", advanced: true },
      { label: "LDL Size", advanced: true },
      { label: "HDL P", advanced: true },
      { label: "Large HDL P", advanced: true },
      { label: "HDL Size", advanced: true },
      { label: "Large VLDL P", advanced: true },
      { label: "VLDL Size", advanced: true },
    ],
  },
  {
    key: "liver",
    title: "Liver health",
    icon: "/assets/tests/liver-health.png",
    items: [
      { label: "Albumin" },
      { label: "Albumin/Globulin Ratio (calculated)" },
      { label: "Alkaline Phosphatase" },
      { label: "ALT" },
      { label: "AST" },
      { label: "Globulin (calculated)" },
      { label: "Total Bilirubin" },
      { label: "Bilirubin, Direct" },
      { label: "Bilirubin, Indirect" },
      { label: "Gamma Glutamyl Transferase (GGT)" },
      { label: "De Ritis (AST / ALT) Ratio" },
      { label: "Indirect-to-Direct Bilirubin Ratio (I/D Bilirubin Ratio)" },
      { label: "Bilirubin-to-Albumin Ratio (BAR)" },
      { label: "GGT-to-HDL Cholesterol Ratio (GGT /HDL-C)" },
      { label: "GGT / ALT" },
    ],
  },
  {
    key: "kidney",
    title: "Kidney health",
    icon: "/assets/tests/kidney.png",
    items: [
      "BUN/Creatinine Ratio (calculated)",
      "Calcium",
      "Carbon Dioxide",
      "Chloride",
      "Creatinine",
      "eGFR",
      "Potassium",
      "Sodium",
      "Urea Nitrogen",
      "Cockcroft-Gault Creatinine Clearance",
    ],
  },
  {
    key: "thyroid",
    title: "Thyroid",
    icon: "/assets/tests/thyroid-health.png",
    items: [
      "TSH",
      "Free T4",
      "Free T3",
      "Thyroid Peroxidase Antibodies (TPO Ab)",
      "Thyroglobulin Antibodies (TgAb)",
    ],
  },
  {
    key: "metabolic",
    title: "Metabolic health",
    icon: "/assets/tests/metabolic-health.png",
    items: [
      "Glucose",
      "Hemoglobin A1C",
      "Insulin",
      "HOMA-IR",
      "C-peptide",
    ],
  },
  {
    key: "nutrients",
    title: "Nutrients",
    icon: "/assets/tests/nutrient.png",
    items: [
      "Vitamin D (25-OH)",
      "Vitamin B12",
      "Folate",
      "Iron, Ferritin",
      "Magnesium",
    ],
  },
];

export default function TestCoverageTabs() {
  const [active, setActive] = useState(0);

  return (
    <section className="bg-white px-4 py-10 md:px-8 lg:pb-40 lg:pt-20">
      <div className="mx-auto max-w-[980px] lg:max-w-[1100px]">
        <h2 className="text-2xl font-semibold lg:text-[44px] lg:tracking-[-0.02em]">See everything we test</h2>
        <p className="mt-2 text-sm text-gray-600 max-w-[56ch] lg:mt-4 lg:text-lg">
          The following 100+ biomarkers are included with your annual Cyborg membership.
        </p>

        <div className="scrollbar-hide mt-6 flex items-center gap-3 overflow-x-auto pb-3">
          {TAB_DATA.map((tab, i) => (
            <button
              key={tab.key}
              onClick={() => setActive(i)}
              className={`flex shrink-0 items-center gap-3 rounded-full px-4 py-2 text-sm font-medium transition duration-200 ${
                i === active
                  ? "border border-[#E6E6E8] bg-white text-black shadow-sm"
                  : "border border-[#E6E6E8] bg-white/55 text-gray-500 opacity-70 blur-[0.2px]"
              }`}
            >
              <span className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-[#E6E6E8]">
                <img src={tab.icon} alt={tab.title} className="h-full w-full object-cover" />
              </span>
              <span>{tab.title}</span>
            </button>
          ))}
        </div>

        <div className="mt-6">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <ul key={TAB_DATA[active].key} className="space-y-3">
              {TAB_DATA[active].items.map((it, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(idx * 0.02, 0.35), ease: [0.22, 1, 0.36, 1] }}
                  className="text-sm text-gray-800"
                >
                  <span>{typeof it === "string" ? it : it.label}</span>
                  {typeof it === "object" && it.advanced && (
                    <span className="ml-3 rounded-md bg-[#E8E0F0] px-2 py-0.5 text-[11px] font-semibold text-[#6A2CA0]">
                      Advanced Panel
                    </span>
                  )}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
