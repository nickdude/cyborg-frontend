"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { ChevronLeft, Pencil, X } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
} from "recharts";

function formatMealDateTime(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
  }) + ", " + d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).toLowerCase();
}

function buildGlucoseCurve(predictedPeakDelta = 26) {
  const baseline = 90;
  const points = [];
  for (let m = 0; m <= 180; m += 10) {
    const t = m / 180;
    const y = baseline + predictedPeakDelta * Math.sin(Math.PI * t) * Math.exp(-0.5 * t);
    points.push({ minute: m, glucose: Math.round(y) });
  }
  return { points, baseline, peak: baseline + predictedPeakDelta };
}

const MACROS = [
  { key: "calories", label: "CALORIES", color: "#EF1360", unit: "" },
  { key: "fiberG", label: "FIBER", color: "#34C759", unit: "g" },
  { key: "carbsG", label: "CARBS", color: "#DE8E4E", unit: "g" },
  { key: "proteinG", label: "PROTEIN", color: "#DD5F5F", unit: "g" },
  { key: "fatG", label: "FAT", color: "#548ADE", unit: "g" },
  { key: "sugarG", label: "SUGAR", color: "#4F378B", unit: "g" },
];

export default function FoodScoreScreen({ meal, score, userId, onBack }) {
  const [tab, setTab] = useState(0);

  const scoreVal = score?.score ?? score?.foodScore ?? null;
  const predicted = score?.predictedGlucosePeak;
  const predictedDelta = predicted?.deltaMgDl ?? 26;

  const totals = meal?.totals || {};
  const items = meal?.items || [];
  const consumedAt = meal?.consumedAt;
  const mealTitle = items.map((i) => i.name).filter(Boolean).join(", ") || meal?.title || "Meal";

  const glucoseCurve = useMemo(() => buildGlucoseCurve(predictedDelta), [predictedDelta]);

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-[#F2F2F2] pb-20" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Back arrow */}
      <div className="px-5 pt-4 pb-2">
        <button type="button" onClick={onBack} aria-label="Go back">
          <ChevronLeft size={20} strokeWidth={2.5} className="text-black" />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-6 px-5">
        <button
          type="button"
          onClick={() => setTab(0)}
          className={`text-[14px] leading-5 ${tab === 0 ? "font-semibold text-black" : "font-medium text-[#717178]"}`}
        >
          Food Score
        </button>
        <button
          type="button"
          onClick={() => setTab(1)}
          className={`text-[14px] leading-5 ${tab === 1 ? "font-semibold text-black" : "font-medium text-[#717178]"}`}
        >
          Predicted Glucose Peak
        </button>
      </div>

      {tab === 0 ? (
        <FoodScoreTab scoreVal={scoreVal} predictedDelta={predictedDelta} items={items} totals={totals} consumedAt={consumedAt} mealTitle={mealTitle} />
      ) : (
        <PredictedGlucoseTab scoreVal={scoreVal} predictedDelta={predictedDelta} glucoseCurve={glucoseCurve} items={items} totals={totals} consumedAt={consumedAt} mealTitle={mealTitle} />
      )}
    </div>
  );
}

function FoodScoreTab({ scoreVal, predictedDelta, items, totals, consumedAt, mealTitle }) {
  return (
    <div className="px-5">
      {/* Score hero with background image */}
      <div className="relative mt-4 overflow-hidden rounded-lg" style={{ height: 160 }}>
        <Image
          src="/images/food-score/score-hero-bg.png"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-white" style={{ fontFamily: "var(--font-arimo), Inter, sans-serif", fontWeight: 700, fontSize: 55 }}>
            {scoreVal ?? "--"}
          </p>
          <p className="text-[15px] font-medium text-white">
            +{Math.round(predictedDelta)} mg/dL
          </p>
        </div>
      </div>

      {/* Tab indicator dots */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <div className="h-1 w-4 rounded-full bg-black" />
        <div className="h-1 w-2 rounded-full bg-[#D9D9D9]" />
      </div>

      {/* Meal title + date */}
      <p className="mt-3 text-center text-[16px] font-medium leading-6 text-black">
        {mealTitle}
      </p>
      {consumedAt && (
        <p className="mt-1 text-center text-[12px] font-medium leading-4 text-[#717178]">
          {formatMealDateTime(consumedAt)}
        </p>
      )}

      {/* YOUR MEAL */}
      <p className="mt-5 text-[12px] font-semibold uppercase text-black">
        Your Meal
      </p>

      {/* Food items */}
      <div className="mt-2 space-y-2">
        {items.map((item, idx) => (
          <FoodItemCard key={idx} item={item} />
        ))}
      </div>

      {/* MACRO SPLIT */}
      <p className="mt-5 text-[12px] font-semibold uppercase text-black">
        MACRO SPLIT
      </p>
      <MacroGrid totals={totals} />

      {/* Action links */}
      <p className="mt-8 text-[16px] font-semibold leading-6 text-black">
        Edit Meal
      </p>
      <p className="mt-3 text-[16px] font-semibold leading-6 text-[#FB2C36]">
        Remove the Meal
      </p>
    </div>
  );
}

function PredictedGlucoseTab({ scoreVal, predictedDelta, glucoseCurve, items, totals, consumedAt, mealTitle }) {
  return (
    <div className="px-5">
      {/* Score hero */}
      <div className="relative mt-4 overflow-hidden rounded-lg" style={{ height: 160 }}>
        <Image
          src="/images/food-score/score-hero-bg.png"
          alt=""
          fill
          className="object-cover"
          style={{ filter: "hue-rotate(200deg) saturate(1.3)" }}
          priority
        />
        <div className="absolute inset-0 bg-indigo-900/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-white" style={{ fontFamily: "var(--font-arimo), Inter, sans-serif", fontWeight: 700, fontSize: 55 }}>
            {scoreVal ?? "--"}
          </p>
          <p className="text-[15px] font-medium text-white">
            +{Math.round(predictedDelta)} mg/dL
          </p>
        </div>
      </div>

      {/* Tab indicator dots */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <div className="h-1 w-2 rounded-full bg-[#D9D9D9]" />
        <div className="h-1 w-4 rounded-full bg-black" />
      </div>

      {/* Glucose chart */}
      <div className="mt-4 rounded-lg border border-[#E6E6E8] bg-white p-4" style={{ boxShadow: "0px 0px 10px rgba(0,0,0,0.05)" }}>
        <p className="mb-3 text-[12px] font-semibold uppercase text-black">Predicted Response</p>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={glucoseCurve.points} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="glucFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="minute" tick={{ fontSize: 10, fill: "#717178" }} tickFormatter={(v) => `${v}m`} axisLine={{ stroke: "#E6E6E8" }} tickLine={false} />
              <YAxis domain={["dataMin - 5", "dataMax + 5"]} tick={{ fontSize: 10, fill: "#717178" }} axisLine={false} tickLine={false} />
              <ReferenceLine y={glucoseCurve.baseline} stroke="#E6E6E8" strokeDasharray="4 4" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E6E6E8" }} formatter={(val) => [`${val} mg/dL`, "Glucose"]} labelFormatter={(v) => `${v} min`} />
              <Area type="monotone" dataKey="glucose" stroke="#6366f1" strokeWidth={2} fill="url(#glucFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Meal info */}
      <p className="mt-4 text-center text-[16px] font-medium leading-6 text-black">{mealTitle}</p>
      {consumedAt && (
        <p className="mt-1 text-center text-[12px] font-medium leading-4 text-[#717178]">{formatMealDateTime(consumedAt)}</p>
      )}

      {/* Food items */}
      <div className="mt-3 space-y-2">
        {items.map((item, idx) => (
          <FoodItemCard key={idx} item={item} />
        ))}
      </div>

      {/* Macro split */}
      <p className="mt-5 text-[12px] font-semibold uppercase text-black">MACRO SPLIT</p>
      <MacroGrid totals={totals} />
    </div>
  );
}

function MacroGrid({ totals }) {
  return (
    <div className="mt-2 grid grid-cols-3 gap-1.5">
      {MACROS.map(({ key, label, color, unit }) => {
        const raw = totals[key];
        const val = raw != null ? Math.round(raw) : "--";
        return (
          <div
            key={key}
            className="rounded-lg border border-[#E6E6E8] bg-white px-2.5 py-2"
            style={{ boxShadow: "0px 0px 10px rgba(0,0,0,0.05)" }}
          >
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[9px] font-medium uppercase text-[#717178]">{label}</span>
            </div>
            <p className="mt-0.5 text-[14px] font-semibold leading-5 text-black">
              {val}{unit}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function FoodItemCard({ item }) {
  if (!item) return null;
  const { name, portion = {}, calories = 0, proteinG = 0, fatG = 0 } = item;

  const portionBits = [];
  if (portion.quantity != null && portion.unit) portionBits.push(`${portion.quantity} ${portion.unit}`);
  if (portion.grams != null) portionBits.push(`(${portion.grams}g)`);
  const portionText = portionBits.join(" ");

  const macroLine = `${Math.round(calories)} Cal · ${Math.round(proteinG)}P · ${Math.round(fatG)}F...`;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#E6E6E8] bg-white px-3 py-3" style={{ boxShadow: "0px 0px 10px rgba(0,0,0,0.05)" }}>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium leading-4 text-black">{name}</p>
        <p className="mt-1 text-[12px] font-medium leading-4 text-[#717178]">
          {portionText && `${portionText} · `}{macroLine}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button type="button" aria-label="Edit" className="text-[#717178] hover:text-black">
          <Pencil size={16} />
        </button>
        <button type="button" aria-label="Remove" className="text-[#717178] hover:text-[#FB2C36]">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
