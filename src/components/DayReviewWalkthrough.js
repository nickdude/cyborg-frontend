"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Info } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
} from "recharts";

/* ------------------------------------------------------------------ */
/* Mock / fallback data builders                                       */
/* ------------------------------------------------------------------ */

function buildSpikeChart(predictedPeak = 36, baseline = 118) {
  const points = [];
  for (let m = 0; m <= 120; m += 5) {
    const t = m / 120;
    const spike = predictedPeak * Math.sin(Math.PI * t) * Math.exp(-0.3 * t);
    points.push({
      minute: m,
      glucose: Math.round(baseline + spike),
      time: `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`,
    });
  }
  return points;
}

const MOCK_REVIEW = {
  date: "Jan 29",
  score: 3,
  scoreLabel: "Large Spike",
  baseline: 118,
  predictedPeak: 36,
  peakValue: 154,
  spikeAmount: 36,
  spikerFood: {
    name: "orange juice",
    portion: { quantity: 1, unit: "glass", grams: 250 },
    calories: 112,
    proteinG: 2,
    fatG: 0,
    carbsG: 26,
    sugarG: 21,
    score: 3,
  },
  otherItems: [
    { name: "coffee", score: 6.2, deltaMgDl: null },
    { name: "eggs", score: null, deltaMgDl: 6 },
  ],
  communityScores: [
    { range: "1-2", count: 8, color: "#ef4444" },
    { range: "3-4", count: 22, color: "#f97316" },
    { range: "5-6", count: 35, color: "#eab308" },
    { range: "7-8", count: 25, color: "#22c55e" },
    { range: "9-10", count: 10, color: "#16a34a" },
  ],
  alternatives: [
    {
      name: "Cucumber & Celery Juice",
      image: null,
      description: "Low sugar, hydrating alternative",
    },
    {
      name: "Macadamia Milk",
      image: null,
      description: "Creamy, low-carb option",
    },
  ],
  blunters: [
    {
      name: "Chia Seed Pudding",
      image: null,
      description: "Fiber-rich, slows glucose absorption",
    },
    {
      name: "Almond Butter",
      image: null,
      description: "Healthy fats buffer sugar spikes",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function DayReviewWalkthrough({ reviewData, onComplete }) {
  const [step, setStep] = useState(0);

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
    <div className="mx-auto min-h-screen w-full max-w-md lg:max-w-[560px] bg-white pb-28 font-inter">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-2 pt-[max(env(safe-area-inset-top,0px),12px)]">
        <button
          type="button"
          onClick={step > 0 ? handlePrev : undefined}
          aria-label="Go back"
          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#f6f7fb]"
        >
          <ArrowLeft size={20} className="text-black" />
        </button>
        <h1 className="flex-1 text-base font-semibold text-black">
          Day Review - {data.date || "Jan 29"}
        </h1>
      </div>

      {/* Step content */}
      <div className="px-4">
        {step === 0 && <SpikeStep data={data} chartPoints={chartPoints} />}
        {step === 1 && <CauseStep data={data} />}
        {step === 2 && <AlternativesStep data={data} />}
      </div>

      {/* Next button - fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center bg-white pb-6 pt-3 px-4">
        <div className="w-full max-w-md lg:max-w-[560px]">
          <button
            type="button"
            onClick={handleNext}
            className="w-full rounded-lg bg-black py-3 text-sm font-semibold text-white transition hover:bg-black/90"
          >
            Next
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
  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mt-2 mb-3">
        <p className="text-xs font-medium uppercase tracking-wider text-[#717178]">
          1 of 3 &middot; Your Glucose Response
        </p>
        <Info size={14} className="text-[#717178]" />
      </div>

      {/* Score and label */}
      <h2 className="text-xl font-bold text-black">
        {data.score}/10 - {data.scoreLabel || "Large Spike"}
      </h2>

      {/* Description */}
      <p className="mt-2 text-sm text-[#717178] leading-relaxed">
        Glucose increased{" "}
        <span className="font-bold text-black">{data.spikeAmount || 36} mg/dL</span>{" "}
        and peaked at{" "}
        <span className="font-bold text-black">{data.peakValue || 154} mg/dL</span>
      </p>

      {/* Glucose chart */}
      <div className="mt-4 rounded-lg border border-[#E6E6E8] p-4" style={{ boxShadow: "0px 0px 10px rgba(0,0,0,0.05)" }}>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartPoints} margin={{ top: 10, right: 85, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="glucoseFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: "#717178" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={["dataMin - 10", "dataMax + 10"]}
                tick={{ fontSize: 10, fill: "#717178" }}
                axisLine={false}
                tickLine={false}
                unit=" mg/dL"
                width={55}
              />
              <ReferenceLine
                y={data.baseline}
                stroke="#9ca3af"
                strokeDasharray="6 4"
                strokeWidth={1}
              />
              {/* TARGET RANGE label on right */}
              <ReferenceLine
                y={data.baseline + 20}
                stroke="transparent"
                label={{
                  value: "TARGET RANGE",
                  position: "right",
                  fontSize: 9,
                  fill: "#9ca3af",
                  fontWeight: 600,
                }}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E6E6E8" }}
                formatter={(val) => [`${val} mg/dL`, "Glucose"]}
              />
              <Area
                type="monotone"
                dataKey="glucose"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#glucoseFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Spiker food card */}
      {data.spikerFood && (
        <div className="mt-4 rounded-lg border border-[#E6E6E8] p-3" style={{ boxShadow: "0px 0px 10px rgba(0,0,0,0.05)" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-black">{data.spikerFood.name}</p>
              <p className="text-xs text-[#717178] mt-0.5">
                {data.spikerFood.calories} Cal &middot; {data.spikerFood.carbsG}g carbs &middot; {data.spikerFood.sugarG}g sugar
              </p>
            </div>
            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-600">
              {data.spikerFood.score || data.score}/10
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 2: What Caused It                                              */
/* ------------------------------------------------------------------ */

function CauseStep({ data }) {
  const maxCount = Math.max(...(data.communityScores || []).map((s) => s.count), 1);

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mt-2 mb-3">
        <p className="text-xs font-medium uppercase tracking-wider text-[#717178]">
          2 of 3 &middot; What Caused It
        </p>
        <Info size={14} className="text-[#717178]" />
      </div>

      {/* Main explanation */}
      <p className="text-base text-black leading-relaxed">
        The largest influence on your score was{" "}
        <span className="font-bold">&lsquo;{data.spikerFood?.name || "orange juice"}&rsquo;</span>
      </p>

      {/* Community score distribution */}
      {data.communityScores && (
        <div className="mt-5 rounded-lg border border-[#E6E6E8] p-4" style={{ boxShadow: "0px 0px 10px rgba(0,0,0,0.05)" }}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#717178]">
            Community Score Distribution
          </p>
          <div className="space-y-2">
            {data.communityScores.map((bar, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-8 text-right text-xs text-[#717178]">{bar.range}</span>
                <div className="flex-1 h-5 rounded-full bg-[#f2f2f2] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(bar.count / maxCount) * 100}%`,
                      backgroundColor: bar.color,
                    }}
                  />
                </div>
                <span className="w-6 text-xs text-[#717178]">{bar.count}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How other ingredients typically score */}
      {data.otherItems && data.otherItems.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#717178]">
            How other ingredients typically score
          </p>
          <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0">
            {data.otherItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-[#E6E6E8] bg-white p-3"
                style={{ boxShadow: "0px 0px 10px rgba(0,0,0,0.05)" }}
              >
                <p className="text-sm font-medium text-black">{item.name}</p>
                <span className="text-sm font-semibold text-[#717178]">
                  {item.score != null ? item.score : `+${item.deltaMgDl} mg/dL`}
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
      {/* Step indicator */}
      <div className="flex items-center gap-2 mt-2 mb-3">
        <p className="text-xs font-medium uppercase tracking-wider text-[#717178]">
          3 of 3 &middot; Alternatives
        </p>
        <Info size={14} className="text-[#717178]" />
      </div>

      {/* Warning text */}
      <p className="text-base text-black leading-relaxed">
        &lsquo;{data.spikerFood?.name || "orange juice"}&rsquo; is a glucose spike. Enjoy it infrequently.
      </p>

      {/* Popular Alternatives */}
      {data.alternatives && data.alternatives.length > 0 && (
        <div className="mt-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#717178]">
            Popular Alternatives
          </p>
          <div className="grid grid-cols-2 gap-3">
            {data.alternatives.map((alt, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-[#E6E6E8] bg-white overflow-hidden"
                style={{ boxShadow: "0px 0px 10px rgba(0,0,0,0.05)" }}
              >
                {/* Image placeholder */}
                <div className="h-24 bg-[#f2f2f2] flex items-center justify-center">
                  {alt.image ? (
                    <img src={alt.image} alt={alt.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl">🥤</span>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-bold text-black leading-tight">{alt.name}</p>
                  {alt.description && (
                    <p className="mt-0.5 text-[10px] text-[#717178]">{alt.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spike Blunters */}
      {data.blunters && data.blunters.length > 0 && (
        <div className="mt-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#717178]">
            Spike &ldquo;Blunters&rdquo;
          </p>
          <div className="grid grid-cols-2 gap-3">
            {data.blunters.map((bl, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-[#E6E6E8] bg-white overflow-hidden"
                style={{ boxShadow: "0px 0px 10px rgba(0,0,0,0.05)" }}
              >
                {/* Image placeholder */}
                <div className="h-24 bg-[#f2f2f2] flex items-center justify-center">
                  {bl.image ? (
                    <img src={bl.image} alt={bl.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl">🥜</span>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-bold text-black leading-tight">{bl.name}</p>
                  {bl.description && (
                    <p className="mt-0.5 text-[10px] text-[#717178]">{bl.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
