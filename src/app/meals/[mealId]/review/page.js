"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
  MoreHorizontal,
  Utensils,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceArea,
  ReferenceDot,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { mealAPI } from "@/services/api";
import { portionText } from "@/components/food/macros";

/* Chart/data-viz values live in JS constants (MACRO_META pattern) — named
   Tailwind tokens can't reach recharts props or per-bar styles. */
const BRAND_PURPLE = "#541D7A";
const BAND_FILL = "#F2F2F2"; // pageBackground token value
const AXIS_GREY = "#71717B"; // secondary token value
const AXIS_LINE = "#E6E6E8"; // borderColor token value

// Community score distribution, one color per score bucket 1..10.
const HISTOGRAM_COLORS = [
  "#E93B81", "#A151A3", "#7267B9", "#4A79B6", "#3B7DA6",
  "#4290B5", "#51A2B5", "#49A79E", "#39B390", "#3DC8A8",
];

// Soft pastel gradients for the photo-less food cards, indexed by position.
const CARD_GRADIENTS = [
  ["#FCE7F3", "#F5C0DC"],
  ["#EDE9FE", "#CFC4F5"],
  ["#DCFCE7", "#AEEBC6"],
  ["#FEF3C7", "#F7DE94"],
];

function formatDayTitle(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatClock(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase();
}

function scoreLabel(score) {
  if (score <= 4) return "Large Spike";
  if (score <= 7) return "Moderate Rise";
  return "Steady Response";
}

function verdictFor(score) {
  if (score == null) return "shapes your glucose response.";
  if (score <= 4) return "is a glucose spiker. Enjoy it infrequently.";
  if (score <= 7) return "raises glucose moderately. Pair it with protein or fiber.";
  return "is glucose-friendly. A solid staple.";
}

function sameName(a, b) {
  return !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
}

function ingredientScore(ing) {
  return ing?.stats?.avgScore ?? ing?.typical?.score ?? null;
}

function resolveSpikerName(analysis, ingredients, items) {
  if (analysis?.spiker) return analysis.spiker;
  let best = null;
  for (const ing of ingredients || []) {
    const s = ingredientScore(ing);
    if (s == null) continue;
    if (!best || s < best.score) best = { name: ing.name, score: s };
  }
  return best?.name || items?.[0]?.name || null;
}

function foodEmoji(name = "") {
  const n = name.toLowerCase();
  if (n.includes("milk")) return "🥛";
  if (n.includes("juice")) return "🥤";
  if (n.includes("salad") || n.includes("greens")) return "🥗";
  if (n.includes("nut") || n.includes("butter")) return "🥜";
  if (n.includes("yogurt") || n.includes("curd")) return "🍶";
  if (n.includes("seed") || n.includes("pudding")) return "🍮";
  if (n.includes("egg")) return "🥚";
  if (n.includes("fruit")) return "🍎";
  return "🍽️";
}

function formatDelta(delta) {
  if (delta == null) return "--";
  const r = Math.round(delta);
  return `${r >= 0 ? "+" : ""}${r} mg/dL`;
}

// Same synthetic curve as FoodScoreScreen's buildGlucoseCurve.
function buildCurve(baseline, delta) {
  const points = [];
  for (let m = 0; m <= 180; m += 10) {
    const t = m / 180;
    points.push({
      minute: m,
      glucose: Math.round(baseline + delta * Math.sin(Math.PI * t) * Math.exp(-0.5 * t)),
    });
  }
  return points;
}

export default function MealReviewPage() {
  const { mealId } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const userId = user?._id || user?.id;

  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) { setLoading(false); return; }
    if (!mealId) return;
    let cancelled = false;
    setLoading(true);
    setError("");

    mealAPI
      .insights(userId, mealId)
      .then((resp) => {
        if (cancelled) return;
        const data = resp?.data || resp;
        if (!data?.meal) {
          setError("Meal not found.");
        } else {
          setInsights(data);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || "Failed to load meal insights.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, userId, mealId]);

  const handleBack = () => (step > 1 ? setStep(step - 1) : router.back());
  const handleNext = () => (step < 3 ? setStep(step + 1) : router.back());

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white">
        <Loader2 size={28} className="animate-spin text-primary" />
        <p className="text-sm text-secondary">Analyzing your meal...</p>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 bg-white px-6 text-center">
        <p className="text-sm text-secondary">{error || "Meal not found."}</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Go back
        </button>
      </div>
    );
  }

  const { meal, score, analysis } = insights;
  const ingredients = insights.ingredients || [];
  const items = meal?.items || [];
  const foodScore = score?.foodScore ?? null;
  const predicted = score?.predictedGlucosePeak || null;

  const spikerName = resolveSpikerName(analysis, ingredients, items);
  const spikerIng =
    ingredients.find((i) => sameName(i.name, spikerName)) ||
    ingredients.find((i) => i.isSpiker) ||
    null;
  const otherIngredients = ingredients.filter((i) => !sameName(i.name, spikerName));

  const dayLabel = formatDayTitle(meal?.consumedAt);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white px-6 font-sans">
      <header className="sticky top-0 z-10 -mx-6 bg-white px-6 pb-3 pt-5">
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="absolute left-0 text-ink"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
          <h1 className="text-base font-semibold text-ink">
            Day Review{dayLabel ? ` - ${dayLabel}` : ""}
          </h1>
        </div>
      </header>

      <main className="flex-1 pb-6 pt-2">
        {step === 1 && (
          <StepGlucoseResponse
            foodScore={foodScore}
            predicted={predicted}
            items={items}
            consumedAt={meal?.consumedAt}
            spikerName={spikerName}
            onEditMeal={() => router.push(`/meals/${mealId}`)}
          />
        )}
        {step === 2 && (
          <StepCause
            spikerName={spikerName}
            spikerIng={spikerIng}
            others={otherIngredients}
          />
        )}
        {step === 3 && (
          <StepTakeaway
            spikerName={spikerName}
            spikerIng={spikerIng}
            foodScore={foodScore}
            analysis={analysis}
          />
        )}
      </main>

      <footer className="sticky bottom-0 -mx-6 mt-auto bg-white px-6 pb-6 pt-3">
        <button
          type="button"
          onClick={handleNext}
          className="w-full rounded-xl bg-black py-4 text-base font-semibold text-white transition active:scale-[0.99]"
        >
          {step === 3 ? "Done" : "Next"}
        </button>
      </footer>
    </div>
  );
}

function StepEyebrow({ children, withInfo }) {
  return (
    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-secondary">
      <span>{children}</span>
      {withInfo && <Info size={16} className="shrink-0 text-secondary" />}
    </p>
  );
}

/* ---------------------------- Step 1 ---------------------------- */

function StepGlucoseResponse({ foodScore, predicted, items, consumedAt, spikerName, onEditMeal }) {
  const cardItem = items.find((i) => sameName(i.name, spikerName)) || items[0] || null;
  const portion = cardItem ? portionText(cardItem.portion) : "";
  const calLine = cardItem ? `${Math.round(cardItem.calories || 0)} Cal` : "";

  return (
    <section>
      <StepEyebrow withInfo>1 of 3 - Your glucose response</StepEyebrow>

      <h2 className="mt-3 text-3xl font-extrabold leading-tight text-primary">
        {foodScore != null ? `${foodScore}/10 - ${scoreLabel(foodScore)}` : "Score unavailable"}
      </h2>

      <p className="mt-3 text-lg leading-relaxed text-secondary">
        {predicted ? (
          <>
            Glucose is predicted to rise{" "}
            <span className="font-semibold text-primary">
              {Math.round(predicted.deltaMgDl)} mg/dL
            </span>{" "}
            and peak at{" "}
            <span className="font-semibold text-primary">
              {Math.round(predicted.peakMgDl)} mg/dL
            </span>
            .
          </>
        ) : (
          "Prediction unavailable"
        )}
      </p>

      {/* Only draw a curve when a prediction actually exists — a fabricated
          default under a "predicted" caption would be dishonest. */}
      {predicted ? (
        <>
          <GlucoseChart predicted={predicted} consumedAt={consumedAt} />
          <p className="mt-2 text-[10px] italic text-secondary">
            Predicted from your meal&apos;s composition — connect a wearable for measured
            glucose.
          </p>
        </>
      ) : (
        <div className="mt-6 rounded-xl border border-borderColor bg-pageBackground p-6 text-center text-sm text-secondary">
          No glucose prediction is available for this meal yet.
        </div>
      )}

      {cardItem && (
        <div className="mt-6 flex items-center gap-4 rounded-xl border border-borderColor p-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-pageBackground text-secondary">
            <Utensils size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-ink">{cardItem.name}</p>
            <p className="truncate text-sm text-secondary">
              {portion ? `${portion} · ${calLine}` : calLine}
            </p>
          </div>
          <button
            type="button"
            onClick={onEditMeal}
            aria-label="Edit meal"
            className="flex-shrink-0 text-secondary transition hover:text-ink"
          >
            <MoreHorizontal size={20} />
          </button>
        </div>
      )}
    </section>
  );
}

function GlucoseChart({ predicted, consumedAt }) {
  const baseline = Math.round(predicted?.baselineMgDl ?? 90);
  const delta = predicted?.deltaMgDl ?? 26;
  const points = buildCurve(baseline, delta);
  const timeLabel = formatClock(consumedAt) || "meal";

  return (
    <div className="relative mt-6 h-64 w-full">
      {/* Baseline annotation at meal time */}
      <div className="pointer-events-none absolute left-2 top-0 z-10">
        <p className="text-[10px] font-semibold text-secondary">{timeLabel}</p>
        <p className="text-xs font-bold text-ink">{baseline} mg/dL</p>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 34, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="reviewGlucoseFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={BRAND_PURPLE} stopOpacity={0.18} />
              <stop offset="95%" stopColor={BRAND_PURPLE} stopOpacity={0} />
            </linearGradient>
          </defs>
          <ReferenceArea
            y1={70}
            y2={110}
            fill={BAND_FILL}
            fillOpacity={0.6}
            ifOverflow="extendDomain"
            label={{
              value: "TARGET RANGE",
              position: "insideRight",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.1em",
              fill: AXIS_GREY,
            }}
          />
          <XAxis
            dataKey="minute"
            type="number"
            domain={[0, 180]}
            ticks={[0, 60, 120, 180]}
            tickFormatter={(m) => (m === 0 ? timeLabel : `+${m / 60}h`)}
            tick={{ fontSize: 10, fill: AXIS_GREY }}
            axisLine={{ stroke: AXIS_LINE }}
            tickLine={false}
          />
          <YAxis hide domain={[60, (dataMax) => Math.max(dataMax + 12, 120)]} />
          <Area
            type="monotone"
            dataKey="glucose"
            stroke={BRAND_PURPLE}
            strokeWidth={3}
            fill="url(#reviewGlucoseFill)"
          />
          <ReferenceDot x={0} y={baseline} r={5} fill="#FFFFFF" stroke={BRAND_PURPLE} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------------------------- Step 2 ---------------------------- */

function StepCause({ spikerName, spikerIng, others }) {
  const stats = spikerIng?.stats;
  const typical = spikerIng?.typical;
  const hasStats = !!stats && stats.count > 0;

  return (
    <section>
      <StepEyebrow>2 of 3 - What caused this response</StepEyebrow>

      <h2 className="mt-3 text-[26px] font-bold leading-snug text-ink">
        The largest influence on your score was{" "}
        &ldquo;<span className="text-primary">{spikerName || "this meal"}</span>&rdquo;
      </h2>

      {hasStats ? (
        <CommunityHistogram
          histogram={stats.histogram || []}
          count={stats.count}
          spiker={spikerName}
        />
      ) : (
        <div className="mt-6 rounded-xl border border-borderColor p-4 text-sm leading-relaxed text-secondary">
          No community logs for &ldquo;{spikerName}&rdquo; yet
          {typical ? (
            <>
              {" "}— typical engine score{" "}
              <span className="font-semibold text-ink">{typical.score}/10</span>, ~+
              {Math.round(typical.deltaMgDl)} mg/dL.
            </>
          ) : (
            "."
          )}
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-lg font-bold text-ink">How other ingredients typically score</h3>
        {others.length ? (
          <div className="mt-1 divide-y divide-borderColor">
            {others.map((ing, idx) => (
              <IngredientRow key={ing.name || idx} ing={ing} />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-secondary">This was a single-ingredient meal.</p>
        )}
      </div>
    </section>
  );
}

function CommunityHistogram({ histogram, count, spiker }) {
  const bars = Array.from({ length: 10 }, (_, i) => Number(histogram[i]) || 0);
  const max = Math.max(...bars, 1);
  const maxIndex = bars.indexOf(Math.max(...bars));
  // Keep the callout text inside the padding while the connector stays on the bar.
  const calloutLeft = Math.min(Math.max((maxIndex + 0.5) * 10, 24), 76);

  return (
    <div className="mt-8">
      <div className="relative h-11">
        <span
          className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold text-primary"
          style={{ left: `${calloutLeft}%` }}
        >
          The most common meal score
        </span>
        <span
          className="absolute top-5 h-5 border-l border-dotted border-primary"
          style={{ left: `${(maxIndex + 0.5) * 10}%` }}
        />
      </div>
      <div className="flex h-48 items-end gap-1.5">
        {bars.map((c, i) => (
          <div key={i} className="flex h-full flex-1 flex-col items-center justify-end">
            <div className="flex h-40 w-full items-end">
              <div
                className="w-full rounded-t-sm"
                style={{
                  backgroundColor: HISTOGRAM_COLORS[i],
                  height: `${Math.max((c / max) * 100, 2)}%`,
                }}
              />
            </div>
            <span className="mt-1.5 text-[10px] font-bold" style={{ color: HISTOGRAM_COLORS[i] }}>
              {i + 1}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-[11px] text-secondary">
        Based on {count} Cyborg community {count === 1 ? "log" : "logs"} with &ldquo;{spiker}&rdquo;
      </p>
    </div>
  );
}

function IngredientRow({ ing }) {
  const avg = ing.stats?.avgScore;
  const scoreText =
    avg != null ? Number(avg).toFixed(1) : ing.typical?.score != null ? `${ing.typical.score}` : "--";
  const delta = ing.stats?.avgDeltaMgDl ?? ing.typical?.deltaMgDl ?? null;

  return (
    <div className="flex items-center justify-between py-3.5">
      <p className="min-w-0 flex-1 truncate pr-3 font-semibold text-ink">{ing.name}</p>
      <div className="flex flex-shrink-0 items-center gap-3">
        <span className="text-sm font-semibold text-ink">{scoreText}</span>
        <span className="text-sm text-secondary">{formatDelta(delta)}</span>
        <ChevronRight size={18} className="text-borderColor" />
      </div>
    </div>
  );
}

/* ---------------------------- Step 3 ---------------------------- */

function StepTakeaway({ spikerName, spikerIng, foodScore, analysis }) {
  // Judge the ingredient by its own track record when we have one — a good
  // meal can still contain a spiker, and vice versa. But the AI flagged it as
  // this meal's biggest riser, so never rate it ABOVE the meal it spiked.
  const ingScore =
    spikerIng?.stats?.avgScore ?? spikerIng?.typical?.score ?? foodScore;
  const verdictScore =
    foodScore != null ? Math.min(ingScore, foodScore) : ingScore;

  return (
    <section>
      <StepEyebrow>3 of 3 - The takeaway</StepEyebrow>

      <h2 className="mt-3 text-3xl font-extrabold leading-tight text-ink">
        <span className="text-primary">&ldquo;{spikerName || "This meal"}&rdquo;</span>{" "}
        {verdictFor(verdictScore)}
      </h2>

      {analysis?.explanation && (
        <p className="mt-3 leading-relaxed text-secondary">{analysis.explanation}</p>
      )}

      {analysis ? (
        <>
          <FoodCardGrid title="Popular alternatives" items={analysis.alternatives} />
          <FoodCardGrid
            title={<>Spike &ldquo;Blunters&rdquo;</>}
            items={analysis.blunters}
          />
        </>
      ) : (
        <div className="mt-6 rounded-xl border border-borderColor p-4 text-sm text-secondary">
          Analysis unavailable for this meal right now.
        </div>
      )}
    </section>
  );
}

function FoodCardGrid({ title, items }) {
  if (!items?.length) return null;
  return (
    <div className="mt-8">
      <h3 className="text-xs font-bold uppercase tracking-widest text-secondary">{title}</h3>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {items.slice(0, 4).map((item, idx) => (
          <FoodCard key={item.name || idx} item={item} index={idx} />
        ))}
      </div>
    </div>
  );
}

function FoodCard({ item, index }) {
  const [from, to] = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  return (
    <div
      className="relative aspect-square overflow-hidden rounded-xl"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      <div className="flex h-full items-center justify-center text-5xl" aria-hidden>
        {foodEmoji(item.name)}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-10">
        <p className="text-sm font-bold text-white">{item.name}</p>
        {item.description && (
          <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-white/80">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
}
