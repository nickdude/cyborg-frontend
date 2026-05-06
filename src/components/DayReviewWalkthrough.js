"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, ArrowRight, Check, AlertTriangle } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

/* ------------------------------------------------------------------ */
/* Mock / fallback data builders                                       */
/* ------------------------------------------------------------------ */

function buildSpikeChart(predictedPeak = 40, baseline = 90) {
  const points = [];
  for (let m = 0; m <= 180; m += 5) {
    const t = m / 180;
    const spike = predictedPeak * Math.sin(Math.PI * t) * Math.exp(-0.4 * t);
    points.push({ minute: m, glucose: Math.round(baseline + spike) });
  }
  return points;
}

const MOCK_REVIEW = {
  score: 3,
  scoreLabel: "Large Spike",
  baseline: 90,
  predictedPeak: 42,
  spikerFood: {
    name: "Orange Juice",
    portion: { quantity: 1, unit: "glass", grams: 250 },
    calories: 112,
    proteinG: 2,
    fatG: 0,
    carbsG: 26,
    sugarG: 21,
  },
  otherItems: [
    { name: "Oatmeal", contribution: "low", calories: 150, carbsG: 27, sugarG: 1 },
    { name: "Banana", contribution: "medium", calories: 105, carbsG: 27, sugarG: 14 },
  ],
  explanation:
    "Orange juice is high in simple sugars and lacks fiber, causing a rapid glucose spike. The liquid form bypasses chewing and speeds absorption.",
  alternatives: [
    { name: "Whole Orange", description: "Fiber slows absorption", calories: 62, carbsG: 15 },
    { name: "Apple Slices", description: "Lower glycemic index", calories: 52, carbsG: 14 },
    { name: "Mixed Berries", description: "High fiber, low GI", calories: 57, carbsG: 14 },
  ],
  blunters: [
    { name: "Almonds (handful)", description: "Fat + fiber slows absorption", calories: 160 },
    { name: "Greek Yogurt", description: "Protein buffer", calories: 100 },
    { name: "Apple Cider Vinegar", description: "1 tbsp before meals", calories: 3 },
  ],
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

/**
 * DayReviewWalkthrough
 *
 * 3-step walkthrough for glucose day review:
 *   Step 1: Spike Identification (chart + food)
 *   Step 2: What Caused It (explanation)
 *   Step 3: Alternatives (replacements + blunters)
 *
 * @param {object}   reviewData  - Response from glucoseAPI.dayReview(), falls back to mock
 * @param {function} onComplete  - Called when user finishes walkthrough
 */
export default function DayReviewWalkthrough({ reviewData, onComplete }) {
  const [step, setStep] = useState(0);

  // Merge with mock data as fallback
  const data = useMemo(() => {
    if (reviewData && Object.keys(reviewData).length > 0) {
      return { ...MOCK_REVIEW, ...reviewData };
    }
    return MOCK_REVIEW;
  }, [reviewData]);

  const chartPoints = useMemo(
    () => buildSpikeChart(data.predictedPeak, data.baseline),
    [data.predictedPeak, data.baseline]
  );

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      onComplete?.();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-[#f4f5f9] pb-24 font-inter">
      {/* Progress indicator */}
      <div className="px-4 pt-[max(env(safe-area-inset-top,0px),12px)] pb-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-[#6d6f7b]">
            Step {step + 1} of 3
          </p>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((s) => (
              <div
                key={s}
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  s <= step ? "bg-black" : "bg-[#e8e9f0]"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="px-4">
        {step === 0 && <SpikeStep data={data} chartPoints={chartPoints} />}
        {step === 1 && <CauseStep data={data} />}
        {step === 2 && <AlternativesStep data={data} />}
      </div>

      {/* Navigation buttons */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center bg-[#f4f5f9] pb-6 pt-3 px-4">
        <div className="w-full max-w-md flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-borderColor bg-white px-5 text-sm font-medium text-[#14151a]"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-black text-sm font-medium text-white"
          >
            {step < 2 ? (
              <>
                Next
                <ArrowRight size={16} />
              </>
            ) : (
              <>
                <Check size={16} />
                Done
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 1: Spike Identification                                        */
/* ------------------------------------------------------------------ */

function SpikeStep({ data, chartPoints }) {
  const scoreColor = data.score <= 4 ? "text-red-600 bg-red-100" : "text-green-600 bg-green-100";

  return (
    <div>
      <h2 className="text-lg font-bold text-black">Spike Identification</h2>

      {/* Score badge */}
      <div className="mt-3 mb-4 flex items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-sm font-bold ${scoreColor}`}>
          {data.score}/10
        </span>
        <span className="text-sm text-[#6d6f7b]">{data.scoreLabel || "Glucose Spike"}</span>
      </div>

      {/* Glucose chart */}
      <div className="rounded-2xl border border-borderColor bg-white p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6d6f7b]">
          Glucose Response
        </p>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartPoints} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="spikeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="minute"
                tick={{ fontSize: 10, fill: "#6d6f7b" }}
                tickFormatter={(v) => `${v}m`}
              />
              <YAxis
                domain={["dataMin - 5", "dataMax + 10"]}
                tick={{ fontSize: 10, fill: "#6d6f7b" }}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(val) => [`${val} mg/dL`, "Glucose"]}
                labelFormatter={(v) => `${v} min`}
              />
              <ReferenceLine
                y={data.baseline}
                stroke="#9ca3af"
                strokeDasharray="4 4"
                label={{ value: "Baseline", fontSize: 10, fill: "#9ca3af", position: "right" }}
              />
              <Area
                type="monotone"
                dataKey="glucose"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#spikeFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Spiker food card */}
      {data.spikerFood && (
        <div className="mt-4 rounded-xl border-2 border-red-200 bg-red-50 p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-red-500" />
            <p className="text-xs font-semibold text-red-600">Primary Spiker</p>
          </div>
          <p className="text-sm font-semibold text-[#14151a]">{data.spikerFood.name}</p>
          <p className="text-xs text-[#6d6f7b]">
            {data.spikerFood.calories} Cal · {data.spikerFood.carbsG}g carbs · {data.spikerFood.sugarG}g sugar
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 2: What Caused It                                              */
/* ------------------------------------------------------------------ */

function CauseStep({ data }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-black">What Caused It</h2>

      {/* Spiker highlight */}
      {data.spikerFood && (
        <div className="mt-4 rounded-xl border-2 border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-red-500" />
            <p className="text-sm font-bold text-red-600">{data.spikerFood.name}</p>
          </div>
          <p className="text-sm leading-relaxed text-[#14151a]">{data.explanation}</p>
        </div>
      )}

      {/* Other items */}
      {data.otherItems && data.otherItems.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6d6f7b]">
            Other Meal Items
          </p>
          <div className="space-y-2">
            {data.otherItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-borderColor bg-white p-3"
              >
                <div>
                  <p className="text-sm font-medium text-[#14151a]">{item.name}</p>
                  <p className="text-xs text-[#6d6f7b]">
                    {item.calories} Cal · {item.carbsG}g carbs
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    item.contribution === "high"
                      ? "bg-red-100 text-red-600"
                      : item.contribution === "medium"
                      ? "bg-amber-100 text-amber-600"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {item.contribution}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 3: Alternatives                                                */
/* ------------------------------------------------------------------ */

function AlternativesStep({ data }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-black">Alternatives</h2>

      {/* Spiker callout */}
      {data.spikerFood && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{data.spikerFood.name}</span> is a glucose spiker.
            Here are healthier alternatives and blunters.
          </p>
        </div>
      )}

      {/* Popular Alternatives */}
      {data.alternatives && data.alternatives.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6d6f7b]">
            Popular Alternatives
          </p>
          <div className="space-y-2">
            {data.alternatives.map((alt, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-borderColor bg-white p-3"
              >
                <p className="text-sm font-semibold text-[#14151a]">{alt.name}</p>
                <p className="text-xs text-[#6d6f7b]">{alt.description}</p>
                <p className="mt-1 text-[10px] font-medium text-[#6d6f7b]">
                  {alt.calories} Cal · {alt.carbsG}g carbs
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spike Blunters */}
      {data.blunters && data.blunters.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6d6f7b]">
            Spike Blunters
          </p>
          <div className="space-y-2">
            {data.blunters.map((bl, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-green-200 bg-green-50 p-3"
              >
                <p className="text-sm font-semibold text-[#14151a]">{bl.name}</p>
                <p className="text-xs text-[#6d6f7b]">{bl.description}</p>
                <p className="mt-1 text-[10px] font-medium text-[#6d6f7b]">
                  {bl.calories} Cal
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
