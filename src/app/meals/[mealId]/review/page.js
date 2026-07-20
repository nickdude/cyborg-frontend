"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CircleEllipsis,
  Info,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { mealAPI } from "@/services/api";
import { portionText } from "@/components/food/macros";
import DayReviewChart from "@/components/insights/DayReviewChart";
import StorySlide from "@/components/insights/StorySlide";
import { insightFoodImage, STORY_SLIDE_IMAGES } from "@/components/insights/foodImages";

/* Chart/data-viz values live in JS constants (MACRO_META pattern) — named
   Tailwind tokens can't reach per-bar styles. */
// Community score distribution, one color per score bucket 1..10 (Figma frame).
const HISTOGRAM_COLORS = [
  "#DE348A", "#9F50A5", "#6A67BA", "#4170B8", "#3877A5",
  "#338BB5", "#469CB2", "#35A5A2", "#2DA897", "#23AC89",
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

function scoreLabel(score) {
  if (score <= 4) return "Large Spike";
  if (score <= 7) return "Moderate Rise";
  return "Stable Response";
}

function verdictFor(score) {
  if (score == null) return "shapes your glucose response.";
  if (score <= 4) return "is a glucose spiker. Enjoy it infrequently.";
  if (score <= 7) return "raises glucose moderately. Pair it with protein or fiber.";
  return "is glucose-friendly. A solid staple.";
}

function titleCase(text = "") {
  return String(text).replace(/\b\w/g, (c) => c.toUpperCase());
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

function splitSentences(text = "") {
  return String(text).match(/[^.!?]+[.!?]+["”]?|[^.!?]+$/g)?.map((s) => s.trim()) || [];
}

// Split a slide's sentences into at most two paragraphs (Figma slides show
// two short paragraphs separated by a blank line).
function toParagraphs(sentences) {
  if (!sentences.length) return [];
  if (sentences.length === 1) return [sentences[0]];
  const mid = Math.ceil(sentences.length / 2);
  return [sentences.slice(0, mid).join(" "), sentences.slice(mid).join(" ")];
}

// Educational story content for the stable variant, derived from the
// insights payload (AI explanation split across the two slides).
function buildStorySlides(spikerName, explanation) {
  const name = spikerName || "this meal";
  const sentences = splitSentences(explanation);
  const mid = Math.ceil(sentences.length / 2);
  const first = sentences.slice(0, mid);
  const second = sentences.slice(mid);

  const fallback1 = [
    `${titleCase(name)} kept your glucose steady this time.`,
    "Meals rich in protein, fiber and healthy fats digest slowly, so glucose rises gently and stays in your target range.",
  ];
  const fallback2 = [
    "Responses this stable mean steadier energy and fewer cravings through the day.",
    "Keep logging meals to learn which foods work best for your body.",
  ];

  return [
    {
      image: STORY_SLIDE_IMAGES[0],
      headline: `Is ${name} good for you?`,
      paragraphs: first.length ? toParagraphs(first) : fallback1,
    },
    {
      image: STORY_SLIDE_IMAGES[1],
      headline: `Why ${name} works for you`,
      paragraphs: second.length ? toParagraphs(second) : fallback2,
    },
  ];
}

export default function MealReviewPage() {
  return (
    <Suspense fallback={<ReviewLoader />}>
      <MealReviewContent />
    </Suspense>
  );
}

function ReviewLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white">
      <Loader2 size={28} className="animate-spin text-primary" />
      <p className="text-sm text-secondary">Analyzing your meal...</p>
    </div>
  );
}

function MealReviewContent() {
  const { mealId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const userId = user?._id || user?.id;

  // ?variant=stable → step 1 wears the stable styling and steps 2-3 become
  // full-bleed educational story slides. Default (no param) is unchanged.
  const stable = searchParams.get("variant") === "stable";

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
  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else if (stable) {
      // Story flow exits back to the meal score screen.
      router.push(`/meals/${mealId}/score`);
    } else {
      router.back();
    }
  };

  if (authLoading || loading) return <ReviewLoader />;

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

  // Stable variant, steps 2-3: full-bleed story slides replace the shell.
  if (stable && step > 1) {
    const slides = buildStorySlides(spikerName, analysis?.explanation);
    const slide = slides[step - 2] || slides[0];
    return (
      <StorySlide
        image={slide.image}
        dayLabel={dayLabel}
        headline={slide.headline}
        paragraphs={slide.paragraphs}
        onBack={handleBack}
        onNext={handleNext}
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white px-5 font-sans">
      <header className="sticky top-0 z-10 -mx-5 bg-white px-5 pb-3 pt-5">
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="absolute left-0 text-ink"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
          <h1 className="text-base font-medium text-ink">
            Day Review{dayLabel ? ` - ${dayLabel}` : ""}
          </h1>
        </div>
      </header>

      <main className="flex-1 pb-6 pt-2">
        {step === 1 && (
          <StepGlucoseResponse
            stable={stable}
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

      <footer className="sticky bottom-0 -mx-5 mt-auto bg-white px-5 pb-6 pt-3">
        <button
          type="button"
          onClick={handleNext}
          className="h-12 w-full rounded-lg bg-black text-base font-medium text-white transition active:scale-[0.99]"
        >
          Next
        </button>
      </footer>
    </div>
  );
}

function StepEyebrow({ children, withInfo }) {
  return (
    <p className="flex items-center gap-2 text-sm tracking-[0.14px] text-secondary">
      <span>{children}</span>
      {withInfo && <Info size={16} className="shrink-0 text-secondary" />}
    </p>
  );
}

/* ---------------------------- Step 1 ---------------------------- */

function StepGlucoseResponse({ stable, foodScore, predicted, items, consumedAt, spikerName, onEditMeal }) {
  const cardItem = items.find((i) => sameName(i.name, spikerName)) || items[0] || null;

  // A prediction is only renderable when both numbers actually exist —
  // MealScore leaves them optional and Math.round(undefined) paints "NaN".
  const hasPrediction =
    predicted != null &&
    Number.isFinite(predicted.deltaMgDl) &&
    Number.isFinite(predicted.peakMgDl);

  return (
    <section>
      <StepEyebrow withInfo>1 of 3 - YOUR GLUCOSE RESPONSE</StepEyebrow>

      <h2 className="mt-2 text-[25px] font-bold leading-[35px] text-primary">
        {foodScore != null
          ? `${foodScore}/10 - ${stable ? "Stable Response" : scoreLabel(foodScore)}`
          : "Score unavailable"}
      </h2>

      <p className="mt-2 text-sm leading-[22px] text-secondary">
        {hasPrediction ? (
          <>
            Glucose increased{" "}
            <span className="font-medium text-primary">
              {Math.round(predicted.deltaMgDl)} mg/dL
            </span>{" "}
            and peaked at{" "}
            <span className="font-medium text-primary">
              {Math.round(predicted.peakMgDl)} mg/dL
            </span>
          </>
        ) : (
          "Prediction unavailable"
        )}
      </p>

      {/* Only draw a curve when a prediction actually exists — a fabricated
          default under a "predicted" caption would be dishonest. */}
      {hasPrediction ? (
        <div className="-mx-5 mt-5">
          <DayReviewChart
            variant={stable ? "stable" : "spike"}
            predicted={predicted}
            consumedAt={consumedAt}
          />
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-borderColor bg-pageBackground p-6 text-center text-sm text-secondary">
          No glucose prediction is available for this meal yet.
        </div>
      )}

      {cardItem && <MealItemCard item={cardItem} onEditMeal={onEditMeal} />}
    </section>
  );
}

function MealItemCard({ item, onEditMeal }) {
  const portion = portionText(item.portion);
  const r = (v) => Math.round(v || 0);

  return (
    <div className="mt-4 flex h-[60px] items-center gap-3 rounded-lg border border-borderColor bg-white px-3 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)]">
      {/* Figma-exported icon tile (node 1867:4674) — solid utensils glyph */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/insights/utensils-tile.svg"
        alt=""
        className="h-[30px] w-[30px] flex-shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-4 text-ink">{item.name}</p>
        <p className="mt-1 flex items-center gap-2 text-xs font-medium leading-4 text-stepIndicator">
          {portion && (
            <>
              <span className="min-w-0 truncate">{portion}</span>
              <span aria-hidden>&middot;</span>
            </>
          )}
          <span className="whitespace-nowrap">{r(item.calories)} Cal</span>
          <span>{r(item.proteinG)}P</span>
          <span>{r(item.fatG)}F</span>
          <span>{r(item.carbsG)}C</span>
        </p>
      </div>
      <button
        type="button"
        onClick={onEditMeal}
        aria-label="Edit meal"
        className="flex-shrink-0 text-stepIndicator transition hover:text-ink"
      >
        <CircleEllipsis size={16} />
      </button>
    </div>
  );
}

/* ---------------------------- Step 2 ---------------------------- */

function StepCause({ spikerName, spikerIng, others }) {
  const stats = spikerIng?.stats;
  const hasStats = !!stats && stats.count > 0;

  return (
    <section>
      <StepEyebrow>2 of 3 - WHAT CAUSED THIS RESPONSE</StepEyebrow>

      <h2 className="mt-2 text-2xl font-bold leading-8 text-ink">
        The largest influence on your score was{" "}
        <span className="block text-primary">
          &ldquo;{spikerName || "this meal"}&rdquo;
        </span>
      </h2>

      {/* Only Figma elements render here: the histogram appears once the
          ingredient has community logs; until then step 2 is headline + the
          ingredient table below (both on-design, both engine-backed). */}
      {hasStats && (
        <CommunityHistogram
          histogram={stats.histogram || []}
          count={stats.count}
          spiker={spikerName}
        />
      )}

      {others.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold leading-tight text-ink">
            How other ingredients typically score
          </h3>
          <div className="mt-1 divide-y divide-borderColor">
            {others.map((ing, idx) => (
              <IngredientRow key={ing.name || idx} ing={ing} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function CommunityHistogram({ histogram, count, spiker }) {
  const bars = Array.from({ length: 10 }, (_, i) => Number(histogram[i]) || 0);
  const max = Math.max(...bars, 1);
  const maxIndex = bars.indexOf(Math.max(...bars));
  const calloutColor = HISTOGRAM_COLORS[maxIndex];
  // Keep the callout text inside the padding while the connector stays on the bar.
  const calloutLeft = Math.min(Math.max((maxIndex + 0.5) * 10, 18), 82);

  return (
    <div className="mt-6">
      <div className="relative h-[72px]">
        <span
          className="absolute top-0 w-[114px] -translate-x-1/2 text-center text-xs font-medium leading-4"
          style={{ left: `${calloutLeft}%`, color: calloutColor }}
        >
          The most common meal score
        </span>
        <span
          className="absolute top-9 h-7 border-l border-dotted"
          style={{ left: `${(maxIndex + 0.5) * 10}%`, borderColor: calloutColor }}
        />
      </div>
      <div className="flex h-[158px] items-end gap-1.5">
        {bars.map((c, i) => (
          <div
            key={i}
            className="flex-1 rounded-t"
            style={{
              backgroundColor: HISTOGRAM_COLORS[i],
              height: `${Math.max((c / max) * 100, 1.5)}%`,
            }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {bars.map((_, i) => (
          <span
            key={i}
            className="flex-1 text-center text-xs font-bold"
            style={{ color: HISTOGRAM_COLORS[i] }}
          >
            {i + 1}
          </span>
        ))}
      </div>
      <p className="mt-4 text-xs text-secondary">
        Based on {Number(count).toLocaleString("en-US")} Community{" "}
        {count === 1 ? "Log" : "Logs"} with &ldquo;{titleCase(spiker || "")}&rdquo;
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
    <div className="flex items-center py-[15px]">
      {/* 33/18 keeps the delta column on the frame's x while giving typical
          ingredient names room to render untruncated. */}
      <p className="w-[33%] truncate pr-2 text-sm font-medium text-ink">{ing.name}</p>
      <span className="w-[18%] text-sm text-secondary">{scoreText}</span>
      <span className="flex-1 text-sm text-secondary">{formatDelta(delta)}</span>
      <ChevronRight size={16} className="flex-shrink-0 text-secondary" />
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
      <StepEyebrow>3 of 3 - WHAT CAUSED THIS RESPONSE</StepEyebrow>

      <h2 className="mt-2 text-2xl font-bold leading-8 text-ink">
        <span className="text-primary">&ldquo;{spikerName || "This meal"}&rdquo;</span>{" "}
        {verdictFor(verdictScore)}
      </h2>

      {analysis ? (
        <>
          <FoodCardGrid first title="POPULAR ALTERNATIVES" items={analysis.alternatives} />
          <FoodCardGrid
            title={<>SPIKE &ldquo;BLUNTERS&rdquo;</>}
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

function FoodCardGrid({ title, items, first }) {
  if (!items?.length) return null;
  return (
    <div className={first ? "mt-8" : "mt-6"}>
      <h3 className="text-sm tracking-[0.14px] text-ink">{title}</h3>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {items.slice(0, 4).map((item, idx) => (
          <FoodCard key={item.name || idx} item={item} index={idx} />
        ))}
      </div>
    </div>
  );
}

function FoodCard({ item, index }) {
  const photo = insightFoodImage(item.name);
  const [from, to] = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

  return (
    <div
      className="relative aspect-[154/135] overflow-hidden rounded"
      style={photo ? undefined : { background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center text-5xl" aria-hidden>
          {foodEmoji(item.name)}
        </div>
      )}
      {/* Full-height scrim: long AI food names can rise above the lower band,
          so keep the whole text zone legible while the top stays clear.
          Pastel fallback cards need a stronger wash than real photos. */}
      <div
        className={`absolute inset-0 rounded bg-gradient-to-b ${
          photo
            ? "from-transparent via-black/30 to-black/70"
            : "from-black/20 via-black/45 to-black/75"
        }`}
      />
      <div className="absolute bottom-3 left-3 right-3">
        <p className="text-sm font-semibold leading-[18px] tracking-[0.14px] text-white">
          {titleCase(item.name)}
        </p>
      </div>
    </div>
  );
}
