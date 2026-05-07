"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, Pencil, X, Flame, Leaf, Wheat, Beef, Droplet, Candy } from "lucide-react";
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

const MACRO_TILES = [
  { key: "calories", label: "CALORIES", icon: Flame, color: "#EF1360", unit: "" },
  { key: "fiberG", label: "FIBER", icon: Leaf, color: "#34C759", unit: "g" },
  { key: "carbsG", label: "Carbs", icon: Wheat, color: "#DE8E4E", unit: "g" },
  { key: "proteinG", label: "Protein", icon: Beef, color: "#DD5F5F", unit: "g" },
  { key: "fatG", label: "FAT", icon: Droplet, color: "#548ADE", unit: "g" },
  { key: "sugarG", label: "SUGAR", icon: Candy, color: "#4F378B", unit: "g" },
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
    <div className="mx-auto min-h-screen w-full max-w-[360px] bg-[#F2F2F2] pb-24" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Back arrow */}
      <button
        type="button"
        onClick={onBack}
        aria-label="Go back"
        className="absolute z-10"
        style={{ left: 20, top: 28 }}
      >
        <ChevronLeft size={16} strokeWidth={2.5} className="text-black" />
      </button>

      {/* Tab bar */}
      <div className="flex items-center gap-6" style={{ paddingLeft: 46, paddingTop: 60 }}>
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
        <FoodScoreTab
          scoreVal={scoreVal}
          predictedDelta={predictedDelta}
          items={items}
          totals={totals}
          consumedAt={consumedAt}
          mealTitle={mealTitle}
        />
      ) : (
        <PredictedGlucoseTab
          scoreVal={scoreVal}
          predictedDelta={predictedDelta}
          glucoseCurve={glucoseCurve}
          items={items}
          totals={totals}
          consumedAt={consumedAt}
          mealTitle={mealTitle}
        />
      )}
    </div>
  );
}

function FoodScoreTab({ scoreVal, predictedDelta, items, totals, consumedAt, mealTitle }) {
  return (
    <div>
      {/* Score hero image */}
      <div
        className="relative mx-auto overflow-hidden rounded-lg"
        style={{ width: 268, height: 160, marginTop: 17, marginLeft: 46 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-400" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p
            className="text-white"
            style={{ fontFamily: "var(--font-arimo), Inter, sans-serif", fontWeight: 700, fontSize: 55 }}
          >
            {scoreVal ?? "--"}
          </p>
          <p className="text-[15px] font-medium text-white">
            +{Math.round(predictedDelta)} mg/dL
          </p>
        </div>
      </div>

      {/* Tab indicator dots */}
      <div className="flex items-center justify-center gap-2" style={{ marginTop: 17 }}>
        <div className="h-1 w-4 rounded-full bg-black" />
        <div className="h-1 w-2 rounded-full bg-[#D9D9D9]" />
      </div>

      {/* Meal title + date */}
      <p className="text-[16px] font-medium leading-6 text-black" style={{ marginLeft: 92, marginTop: 10 }}>
        {mealTitle}
      </p>
      {consumedAt && (
        <p className="text-[12px] font-medium leading-4 text-[#717178]" style={{ marginLeft: 118, marginTop: 4 }}>
          {formatMealDateTime(consumedAt)}
        </p>
      )}

      {/* YOUR MEAL */}
      <p
        className="text-[12px] font-semibold uppercase text-black"
        style={{ marginLeft: 20, marginTop: 20 }}
      >
        Your Meal
      </p>

      {/* Food items */}
      <div className="space-y-2" style={{ marginLeft: 20, marginRight: 20, marginTop: 8 }}>
        {items.map((item, idx) => (
          <FoodItemCard key={idx} item={item} />
        ))}
      </div>

      {/* MACRO SPLIT */}
      <p
        className="text-[12px] font-semibold leading-4 uppercase text-black"
        style={{ marginLeft: 20, marginTop: 18 }}
      >
        MACRO SPLIT
      </p>

      {/* Macro grid - 3 cols, 2 rows */}
      <div
        className="grid grid-cols-3 gap-1"
        style={{ marginLeft: 20, marginRight: 20, marginTop: 12 }}
      >
        {MACRO_TILES.map(({ key, label, icon: Icon, color, unit }) => {
          const raw = totals[key];
          const val = raw != null ? Math.round(raw) : "--";
          return (
            <div
              key={key}
              className="relative rounded-lg border border-[#E6E6E8] bg-white"
              style={{ width: 104, height: 50, boxShadow: "0px 0px 10px 0px rgba(0,0,0,0.05)" }}
            >
              <div className="absolute" style={{ left: 7, top: 8 }}>
                <Icon size={20} color={color} />
              </div>
              <p
                className="absolute text-[10px] font-medium uppercase text-black"
                style={{ left: 35, top: 8 }}
              >
                {label}
              </p>
              <p
                className="absolute text-[14px] font-semibold leading-[18px] text-black"
                style={{ left: 35, top: 24 }}
              >
                {val}{unit}
              </p>
            </div>
          );
        })}
      </div>

      {/* Action links */}
      <p
        className="text-[16px] font-semibold leading-6 text-black"
        style={{ marginLeft: 20, marginTop: 40 }}
      >
        Edit Meal
      </p>
      <p
        className="text-[16px] font-semibold leading-6 text-[#FB2C36]"
        style={{ marginLeft: 20, marginTop: 16 }}
      >
        Remove the Meal
      </p>
    </div>
  );
}

function PredictedGlucoseTab({ scoreVal, predictedDelta, glucoseCurve, items, totals, consumedAt, mealTitle }) {
  return (
    <div>
      {/* Score hero */}
      <div
        className="relative mx-auto overflow-hidden rounded-lg"
        style={{ width: 268, height: 160, marginTop: 17, marginLeft: 46 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-400" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p
            className="text-white"
            style={{ fontFamily: "var(--font-arimo), Inter, sans-serif", fontWeight: 700, fontSize: 55 }}
          >
            {scoreVal ?? "--"}
          </p>
          <p className="text-[15px] font-medium text-white">
            +{Math.round(predictedDelta)} mg/dL
          </p>
        </div>
      </div>

      {/* Tab indicator dots */}
      <div className="flex items-center justify-center gap-2" style={{ marginTop: 17 }}>
        <div className="h-1 w-2 rounded-full bg-[#D9D9D9]" />
        <div className="h-1 w-4 rounded-full bg-black" />
      </div>

      {/* Glucose chart */}
      <div
        className="rounded-lg border border-[#E6E6E8] bg-white p-4"
        style={{ marginLeft: 20, marginRight: 20, marginTop: 16, boxShadow: "0px 0px 10px 0px rgba(0,0,0,0.05)" }}
      >
        <p className="mb-3 text-[12px] font-semibold uppercase text-black">
          Predicted Response
        </p>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={glucoseCurve.points} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="glucFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="minute"
                tick={{ fontSize: 10, fill: "#717178" }}
                tickFormatter={(v) => `${v}m`}
                axisLine={{ stroke: "#E6E6E8" }}
                tickLine={false}
              />
              <YAxis
                domain={["dataMin - 5", "dataMax + 5"]}
                tick={{ fontSize: 10, fill: "#717178" }}
                axisLine={false}
                tickLine={false}
              />
              <ReferenceLine y={glucoseCurve.baseline} stroke="#E6E6E8" strokeDasharray="4 4" />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E6E6E8" }}
                formatter={(val) => [`${val} mg/dL`, "Glucose"]}
                labelFormatter={(v) => `${v} min`}
              />
              <Area
                type="monotone"
                dataKey="glucose"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#glucFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Meal info */}
      <p className="text-[16px] font-medium leading-6 text-black" style={{ marginLeft: 20, marginTop: 16 }}>
        {mealTitle}
      </p>
      {consumedAt && (
        <p className="text-[12px] font-medium leading-4 text-[#717178]" style={{ marginLeft: 20, marginTop: 4 }}>
          {formatMealDateTime(consumedAt)}
        </p>
      )}

      {/* Food items */}
      <div className="space-y-2" style={{ marginLeft: 20, marginRight: 20, marginTop: 12 }}>
        {items.map((item, idx) => (
          <FoodItemCard key={idx} item={item} />
        ))}
      </div>

      {/* Macro split */}
      <p className="text-[12px] font-semibold leading-4 uppercase text-black" style={{ marginLeft: 20, marginTop: 18 }}>
        MACRO SPLIT
      </p>
      <div className="grid grid-cols-3 gap-1" style={{ marginLeft: 20, marginRight: 20, marginTop: 12 }}>
        {MACRO_TILES.map(({ key, label, icon: Icon, color, unit }) => {
          const raw = (items[0] || {})[key] ?? 0;
          const totVal = 0;
          return (
            <div
              key={key}
              className="relative rounded-lg border border-[#E6E6E8] bg-white"
              style={{ width: 104, height: 50, boxShadow: "0px 0px 10px 0px rgba(0,0,0,0.05)" }}
            >
              <div className="absolute" style={{ left: 7, top: 8 }}>
                <Icon size={20} color={color} />
              </div>
              <p className="absolute text-[10px] font-medium uppercase text-black" style={{ left: 35, top: 8 }}>
                {label}
              </p>
              <p className="absolute text-[14px] font-semibold leading-[18px] text-black" style={{ left: 35, top: 24 }}>
                --{unit}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FoodItemCard({ item }) {
  if (!item) return null;
  const { name, portion = {}, calories = 0, proteinG = 0, fatG = 0 } = item;

  const portionBits = [];
  if (portion.quantity != null && portion.unit) portionBits.push(`${portion.quantity} ${portion.unit}`);
  else if (portion.quantity != null) portionBits.push(String(portion.quantity));
  if (portion.grams != null) portionBits.push(`(${portion.grams}g)`);
  const portionText = portionBits.join(" ");

  const macroLine = `${Math.round(calories)} Cal · ${Math.round(proteinG)}P · ${Math.round(fatG)}F...`;

  return (
    <div
      className="relative flex items-center gap-3 rounded-lg border border-[#E6E6E8] bg-[#F9F8FD] px-3 py-3"
      style={{ height: 60, boxShadow: "0px 0px 10px 0px rgba(0,0,0,0.05)" }}
    >
      {/* Thumbnail placeholder */}
      <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded bg-[#E6E6E8]">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#717178" strokeWidth="1.5" strokeLinecap="round">
          <path d="M6 4L18 4M6 20L18 20M4 6L4 18M20 6L20 18" />
          <path d="M8 8L16 16M16 8L8 16" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium leading-4 text-black">{name}</p>
        <p className="mt-1 text-[12px] font-medium leading-4 text-[#717178]">
          {portionText && `${portionText} · `}{macroLine}
        </p>
      </div>
      {/* Edit + Delete icons */}
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Edit" className="text-[#717178]">
          <Pencil size={16} />
        </button>
        <button type="button" aria-label="Remove" className="text-[#717178]">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
