"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  ReferenceArea,
  ReferenceLine,
  Tooltip,
} from "recharts";
import { conciergeAPI, streamMessage, productAPI } from "@/services/api";

/* ------------------------------------------------------------------ */
/* Status helpers                                                      */
/* ------------------------------------------------------------------ */

const STATUS = {
  optimal: { color: "#05BC7E", label: "Optimal", text: "text-biomarkerOptimal", soft: "bg-biomarkerOptimal/10" },
  normal: { color: "#D7D82E", label: "Normal", text: "text-biomarkerNormal", soft: "bg-biomarkerNormal/10" },
  out_of_range: { color: "#F865DD", label: "Out of range", text: "text-biomarkerOutOfRange", soft: "bg-biomarkerOutOfRange/10" },
};

function statusMeta(status) {
  return STATUS[status] || { color: "#71717B", label: status || "—", text: "text-secondary", soft: "bg-pageBackground" };
}

// High / Low / Normal / Optimal — the short badge word superpower shows.
function badgeWord(bm) {
  if (bm.status === "optimal") return "Optimal";
  const val = parseFloat(bm.value);
  const max = bm.optimalRange?.max ?? bm.referenceMax;
  const min = bm.optimalRange?.min ?? bm.referenceMin;
  if (!isNaN(val)) {
    if (max != null && val > Number(max)) return "High";
    if (min != null && Number(min) > 0 && val < Number(min)) return "Low";
  }
  return bm.status === "normal" ? "Normal" : "Out of range";
}

// "4-5.6 %", "≤100 mg/dL", "≥40 mg/dL"
function formatOptimal(bm) {
  const r = bm.optimalRange || {};
  const min = r.min ?? bm.referenceMin ?? null;
  const max = r.max ?? bm.referenceMax ?? null;
  const minPos = min != null && Number(min) > 0;
  const maxSet = max != null;
  const unit = bm.unit ? ` ${bm.unit}` : "";
  if (minPos && maxSet) return `${min}-${max}${unit}`;
  if (maxSet) return `≤${max}${unit}`;
  if (minPos) return `≥${min}${unit}`;
  return "Not established";
}

/* ------------------------------------------------------------------ */
/* Trend chart (recharts)                                              */
/* ------------------------------------------------------------------ */

function TrendChart({ bm }) {
  const meta = statusMeta(bm.status);
  const oMin = bm.optimalRange?.min ?? null;
  const oMax = bm.optimalRange?.max ?? null;

  // Build {idx, label, value} points. trend is oldest -> newest numbers.
  const data = useMemo(() => {
    const trend = Array.isArray(bm.trend) ? bm.trend : [];
    const series = trend.length ? trend : [parseFloat(bm.value)].filter((v) => !isNaN(v));
    const n = series.length;
    return series.map((v, i) => ({
      idx: i,
      // Synthetic relative time labels (oldest -> Now). Real values, relative order.
      label: i === n - 1 ? "Now" : n === 1 ? "Now" : `T-${n - 1 - i}`,
      value: Number(v),
    }));
  }, [bm.trend, bm.value]);

  const yDomain = useMemo(() => {
    const vals = data.map((d) => d.value);
    if (oMin != null) vals.push(Number(oMin));
    if (oMax != null) vals.push(Number(oMax));
    if (!vals.length) return [0, 1];
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const pad = (hi - lo || Math.abs(hi) || 1) * 0.2;
    return [lo - pad, hi + pad];
  }, [data, oMin, oMax]);

  const hasBand = oMin != null || oMax != null;
  const bandLow = oMin != null ? Number(oMin) : yDomain[0];
  const bandHigh = oMax != null ? Number(oMax) : yDomain[1];

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 16, right: 64, left: -8, bottom: 4 }}>
          {/* Optimal range shaded green band */}
          {hasBand && (
            <ReferenceArea
              y1={bandLow}
              y2={bandHigh}
              fill="#05BC7E"
              fillOpacity={0.12}
              ifOverflow="extendDomain"
            />
          )}
          {oMax != null && (
            <ReferenceLine
              y={Number(oMax)}
              stroke="#05BC7E"
              strokeDasharray="5 4"
              strokeWidth={1}
              label={{ value: "Optimal", position: "right", fontSize: 10, fill: "#05BC7E", fontWeight: 600 }}
            />
          )}
          {oMin != null && Number(oMin) > 0 && (
            <ReferenceLine
              y={Number(oMin)}
              stroke="#05BC7E"
              strokeDasharray="5 4"
              strokeWidth={1}
              label={oMax == null ? { value: "Optimal", position: "right", fontSize: 10, fill: "#05BC7E", fontWeight: 600 } : undefined}
            />
          )}
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#71717B" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={yDomain}
            tick={{ fontSize: 10, fill: "#71717B" }}
            axisLine={false}
            tickLine={false}
            width={44}
            unit={bm.unit ? ` ${bm.unit}` : ""}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #E6E6E8" }}
            formatter={(val) => [`${val}${bm.unit ? ` ${bm.unit}` : ""}`, "Result"]}
          />
          {data.length > 1 && (
            <Line
              type="monotone"
              dataKey="value"
              stroke="#A0A0AB"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          )}
          {/* Markers colored by whether each point reads high/low/in-band */}
          <Scatter
            dataKey="value"
            isAnimationActive={false}
            shape={(props) => {
              const { cx, cy, payload } = props;
              const v = payload.value;
              let color = meta.color;
              if (oMin != null || oMax != null) {
                const aboveMax = oMax != null && v > Number(oMax);
                const belowMin = oMin != null && Number(oMin) > 0 && v < Number(oMin);
                color = aboveMax || belowMin ? "#F865DD" : "#05BC7E";
              }
              return <circle cx={cx} cy={cy} r={5} fill={color} stroke="#fff" strokeWidth={1.5} />;
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Educational AI section                                              */
/* ------------------------------------------------------------------ */

function buildEducationPrompt(bm) {
  const status = badgeWord(bm);
  const optimal = formatOptimal(bm);
  const unit = bm.unit || "";
  return [
    `Write a concise, friendly educational explainer about the biomarker "${bm.name}" for a health-platform user.`,
    `Their latest result is ${bm.value} ${unit} (status: ${status}). The optimal range is ${optimal}.`,
    bm.category ? `Category: ${bm.category}.` : "",
    "",
    "Use markdown with these short sections, each a level-3 heading (###):",
    "### Why does this matter?",
    "### Why is an optimal level important?",
    `### What does my ${status} level mean?`,
    "### What can I do? (lifestyle, nutrition, supplements)",
    "",
    "Keep each section to a few sentences or a short bullet list. Be practical and encouraging.",
    "Do NOT give a diagnosis or prescribe medication. End with a one-line reminder to discuss results with a clinician.",
    "Respond ONLY with the markdown content — no preamble, no closing pleasantries.",
  ]
    .filter(Boolean)
    .join("\n");
}

function WhyMatters({ bm }) {
  const [text, setText] = useState("");
  const [phase, setPhase] = useState("loading"); // loading | streaming | done | error
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    let cancelled = false;
    let acc = "";

    (async () => {
      try {
        // Use the app's real AI via the concierge chat SSE pipeline.
        const res = await conciergeAPI.createChat();
        const chatId = res?.data?._id || res?.data?.id || res?._id || res?.id;
        if (!chatId) throw new Error("Could not start an AI session");

        await streamMessage(chatId, buildEducationPrompt(bm), (evt) => {
          if (cancelled) return;
          if (evt.type === "textDelta" && typeof evt.text === "string") {
            acc += evt.text;
            setPhase("streaming");
            setText(acc);
          } else if (evt.type === "done") {
            setPhase("done");
          } else if (evt.type === "error") {
            if (!acc) {
              setPhase("error");
            } else {
              setPhase("done");
            }
          }
        });
        if (!cancelled) setPhase((p) => (p === "error" ? "error" : "done"));
      } catch (err) {
        if (!cancelled && !acc) setPhase("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bm]);

  return (
    <section className="px-5 pt-6 lg:px-7">
      <h3 className="text-base font-semibold text-blue">Why does this matter?</h3>

      {phase === "loading" && !text && (
        <div className="mt-3 flex items-center gap-2 text-sm text-secondary">
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/70" style={{ animationDelay: "150ms" }} />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/40" style={{ animationDelay: "300ms" }} />
          </span>
          Cyborg AI is reviewing your {bm.name}…
        </div>
      )}

      {phase === "error" && (
        <p className="mt-3 rounded-2xl border border-borderColor bg-pageBackground/60 p-4 text-sm leading-relaxed text-secondary">
          We couldn&apos;t generate an explanation right now. Open{" "}
          <Link href="/concierge" className="font-medium text-primary hover:underline">
            Cyborg AI
          </Link>{" "}
          to ask about your {bm.name} result.
        </p>
      )}

      {text && (
        <div className="mt-3 text-sm leading-relaxed text-blue">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ children }) => <h4 className="mt-4 text-sm font-semibold text-blue">{children}</h4>,
              h3: ({ children }) => <h4 className="mt-4 text-sm font-semibold text-blue">{children}</h4>,
              h4: ({ children }) => <h4 className="mt-4 text-sm font-semibold text-blue">{children}</h4>,
              p: ({ children }) => <p className="mb-3 last:mb-0 text-secondary">{children}</p>,
              ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 text-secondary">{children}</ul>,
              ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 text-secondary">{children}</ol>,
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-blue">{children}</strong>,
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noreferrer noopener" className="text-primary hover:underline">
                  {children}
                </a>
              ),
            }}
          >
            {text}
          </ReactMarkdown>
          {phase === "streaming" && <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse rounded-sm bg-primary/60 align-middle" />}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Retest upsell — OUR real test products                              */
/* ------------------------------------------------------------------ */

function RetestSection({ bm }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await productAPI.getProducts({ limit: 50 });
        const list = res?.data || res || [];
        const tests = (Array.isArray(list) ? list : []).filter((p) => p.type === "test" && p.isActive !== false);
        if (!cancelled) setProducts(tests.slice(0, 4));
      } catch {
        if (!cancelled) setProducts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!products.length) return null;

  return (
    <section className="px-5 pt-6 lg:px-7">
      <h3 className="text-base font-semibold text-blue">Retest your {bm.name}</h3>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {products.map((p) => (
          <div key={p.id || p._id} className="flex items-center gap-3 rounded-2xl border border-borderColor p-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-pageBackground">
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
              ) : (
                <svg className="h-5 w-5 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 3v6l-5 9a2 2 0 0 0 1.8 3h12.4A2 2 0 0 0 20 18l-5-9V3" />
                  <path d="M8 3h8M7 14h10" />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-blue">{p.name}</p>
              {p.price != null && <p className="text-xs text-secondary">₹{p.price}</p>}
            </div>
            <Link
              href="/market-place"
              className="shrink-0 rounded-full bg-black px-4 py-2 text-xs font-medium text-white transition hover:bg-black/90"
            >
              {p.price != null ? "View" : "Unlock"}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Ask Cyborg AI chips                                                 */
/* ------------------------------------------------------------------ */

function AskSection({ bm }) {
  const unit = bm.unit || "";
  const questions = [
    `${bm.name}: How do I improve it?`,
    `${bm.name}: Tips for my results`,
    `${bm.name}: Explain my ${bm.value}${unit} result`,
  ];

  return (
    <section className="px-5 pt-6 lg:px-7">
      <h3 className="text-base font-semibold text-blue">Ask Cyborg AI</h3>
      <div className="mt-3 space-y-2.5">
        {questions.map((q) => (
          <Link
            key={q}
            href={`/concierge?q=${encodeURIComponent(q)}`}
            className="flex items-center gap-3 rounded-2xl border border-borderColor p-3 transition hover:border-primary/40 hover:bg-pageBackground/60"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-black text-[11px] font-bold leading-none text-white">C</span>
            <span className="flex-1 text-sm text-blue">{q}</span>
            <span className="text-secondary" aria-hidden="true">→</span>
          </Link>
        ))}
        <Link
          href="/concierge"
          className="flex items-center gap-3 rounded-2xl border border-dashed border-borderColor p-3 text-secondary transition hover:border-primary/40 hover:text-blue"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-pageBackground text-secondary" aria-hidden="true">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span className="flex-1 text-sm">Ask your own question…</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

export default function BiomarkerDetailModal({ biomarker, onClose }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const handleKey = useCallback((e) => {
    if (e.key === "Escape") closeRef.current?.();
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [handleKey]);

  if (!biomarker) return null;

  const bm = biomarker;
  const meta = statusMeta(bm.status);
  const word = badgeWord(bm);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[1px] sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${bm.name} details`}
    >
      <div
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white font-inter shadow-[0_24px_60px_-12px_rgba(0,0,0,0.25)] sm:max-w-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'nbinternationalproboo', Inter, ui-sans-serif, system-ui, sans-serif" }}
      >
        {/* Mobile grab handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <span className="h-1.5 w-12 rounded-full bg-borderColor" />
        </div>

        {/* 1. Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-4 lg:px-7">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold text-blue lg:text-2xl">{bm.name}</h2>
            <span
              className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${meta.soft} ${meta.text}`}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
              {word}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-secondary transition hover:bg-pageBackground hover:text-blue"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto pb-8">
          {/* 2. Trend chart */}
          <div className="px-5 pt-5 lg:px-7">
            <TrendChart bm={bm} />
          </div>

          {/* 3. Latest result + Optimal range cards */}
          <div className="grid grid-cols-2 gap-3 px-5 pt-5 lg:px-7">
            <div className="rounded-2xl border border-borderColor p-4">
              <p className="text-xs text-secondary">Latest result</p>
              <p className={`mt-1 text-lg font-semibold ${meta.text}`}>
                {bm.value} <span className="text-xs text-secondary">{bm.unit}</span>
              </p>
            </div>
            <div className="rounded-2xl border border-borderColor p-4">
              <p className="text-xs text-secondary">Optimal range</p>
              <p className="mt-1 text-lg font-semibold text-biomarkerOptimal">{formatOptimal(bm)}</p>
            </div>
          </div>

          {/* 4. Ask Cyborg AI */}
          <AskSection bm={bm} />

          {/* 5. Why does this matter? — real AI */}
          <WhyMatters bm={bm} />

          {/* 6. Retest upsell — our real test products */}
          <RetestSection bm={bm} />
        </div>
      </div>
    </div>
  );
}
