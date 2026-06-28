"use client";

import { useEffect, useRef, useState } from "react";
import { humanizeCategory } from "@/utils/biomarkerAdapter";
import BiomarkerDetailModal from "@/components/data/BiomarkerDetailModal";
import { BodyModelClient } from "@/components/data/BodyModelClient";

/* ---------- helpers ---------- */

const num = (v) => {
  const n = Number(v && typeof v === "object" ? v.phenoAge ?? v.value : v);
  return Number.isFinite(n) ? n : null;
};

const statusFromFlag = (flag = "") => {
  const f = String(flag).toLowerCase();
  if (f.includes("optimal")) return "optimal";
  if (f.includes("normal") || f.includes("in range")) return "normal";
  return "out_of_range";
};

const GOAL_NUM_COLORS = ["#EF4444", "#F97316", "#3B82F6"];

/* ---------- shared bits ---------- */

function RingGauge({ value, max = 100, size = 248, stroke = 7, color = "#FBBF24", centerMain, centerTop, centerSub }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = Math.max(0, Math.min(1, max ? value / max : 0));
  const [offset, setOffset] = useState(c);
  useEffect(() => {
    setOffset(c);
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setOffset(c * (1 - ratio))));
    return () => cancelAnimationFrame(raf);
  }, [c, ratio]);
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" strokeDasharray="1.5 7" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)", filter: `drop-shadow(0 0 10px ${color}aa)` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center px-6 text-center">
        <div>
          {centerMain}
          {centerTop && <div className="mt-1 text-[15px] font-medium text-white/80">{centerTop}</div>}
          {centerSub && <div className="mt-0.5 text-[13px] text-white/55">{centerSub}</div>}
        </div>
      </div>
    </div>
  );
}

const DarkContinue = ({ onClick, label = "Continue" }) => (
  <button type="button" onClick={onClick}
    className="mt-8 w-full max-w-[420px] rounded-2xl bg-white/10 px-6 py-4 text-[15px] font-medium text-white ring-1 ring-white/15 transition hover:bg-white/15 active:scale-[0.99]">
    {label}
  </button>
);

const LightContinue = ({ onClick, label = "Continue" }) => (
  <button type="button" onClick={onClick}
    className="w-full rounded-2xl bg-black px-6 py-4 text-[15px] font-medium text-white transition hover:bg-black/90 active:scale-[0.99]">
    {label}
  </button>
);

const Wordmark = ({ dark }) => (
  <span className={`select-none text-[18px] font-semibold lowercase tracking-tight ${dark ? "text-blue" : "text-white"}`}>cyborg</span>
);

const ProgressBar = ({ pct }) => (
  <div className="h-1 w-full overflow-hidden rounded-full bg-borderColor">
    <div className="h-full rounded-full bg-black transition-all duration-500" style={{ width: `${pct}%` }} />
  </div>
);

/* ---------- main ---------- */

export default function ProtocolIntro({ userName = "there", sex = "male", bioAge, chronoAge, cyborgScore, categoryGrades, goals = [], onComplete }) {
  const [step, setStep] = useState(0); // 0 welcome → 1 bioage → 2 score → 3 steps → 4 winners → 5 build → 6 goals
  const [activeGoal, setActiveGoal] = useState(null);
  const [modalBiomarker, setModalBiomarker] = useState(null);
  const touchStartY = useRef(0);
  const last = 6;

  const next = () => {
    if (step >= last) { onComplete?.(); return; }
    // Skip the bio-age reveal (step 1) when it couldn't be computed — e.g. the
    // user has no date of birth, so there's no chronological age to compare to.
    setStep((s) => (s + 1 === 1 && num(bioAge) == null ? 2 : s + 1));
  };

  const bioNum = num(bioAge);
  const scoreNum = num(cyborgScore);
  const youngerBy = chronoAge != null && bioNum != null ? +(chronoAge - bioNum).toFixed(1) : null;
  const scoreWord = scoreNum >= 80 ? "generally healthy" : scoreNum >= 60 ? "doing okay" : "off to a start";

  const winners = Object.entries(categoryGrades || {})
    .map(([k, v]) => ({ name: humanizeCategory(k), grade: String(v?.grade ?? v).toUpperCase() }))
    .filter((w) => w.grade === "A" || w.grade === "B");

  const top3 = (goals || []).slice(0, 3).map((g, i) => ({
    id: g.goalId || g.id || `goal-${i}`,
    title: g.title || "Health goal",
    desc: g.description || g.summary || g.whatThisMeans || "",
    raw: g,
  }));

  let screen = null;

  if (activeGoal) {
    const g = activeGoal.raw || {};
    const evidence = Array.isArray(g.biomarkerEvidence) ? g.biomarkerEvidence : [];
    const actions = Array.isArray(g.recommendedActions) ? g.recommendedActions : [];
    screen = (
      <div className="flex h-full flex-col bg-pageBackground">
        <div className="mx-auto flex w-full max-w-[600px] items-center gap-3 px-5 pt-[5vh]">
          <button type="button" onClick={() => setActiveGoal(null)} aria-label="Back"
            className="grid h-9 w-9 place-items-center rounded-full text-secondary transition hover:bg-white hover:text-blue">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <span className="text-sm font-medium text-secondary">Health goal</span>
        </div>
        <div className="mx-auto w-full max-w-[600px] flex-1 overflow-y-auto px-5 pb-[14vh] pt-4">
          <h2 className="text-[24px] font-semibold leading-tight tracking-tight text-blue">{activeGoal.title}</h2>

          {g.whatThisMeans && (
            <section className="mt-6">
              <h3 className="text-sm font-semibold text-blue">What we found</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-secondary">{g.whatThisMeans}</p>
            </section>
          )}

          {evidence.length > 0 && (
            <section className="mt-6">
              <h3 className="text-sm font-semibold text-blue">Your biomarkers</h3>
              <p className="mb-3 text-xs text-secondary">{evidence.length} biomarkers linked to this</p>
              <div className="overflow-hidden rounded-2xl border border-borderColor bg-white">
                <div className="divide-y divide-borderColor">
                  {evidence.map((b, i) => {
                    const status = statusFromFlag(b.flag);
                    const color = status === "optimal" ? "#05BC7E" : status === "normal" ? "#D7D82E" : "#F865DD";
                    return (
                      <button key={(b.name || "") + i} type="button"
                        onClick={() => setModalBiomarker({
                          id: b.canonicalName || b.name, name: b.name, value: b.value, unit: b.unit, status,
                          category: activeGoal.title, trend: [],
                          optimalRange: { min: b.optimalMin ?? null, max: b.optimalMax ?? null },
                          referenceMin: b.optimalMin ?? null, referenceMax: b.optimalMax ?? null,
                        })}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-pageBackground/60">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-blue">{b.name}</span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-secondary">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                            {b.flag} · {b.value} {b.unit}
                          </span>
                        </span>
                        <svg className="h-4 w-4 shrink-0 text-secondary" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {g.potentialCauses && (
            <section className="mt-6">
              <h3 className="text-sm font-semibold text-blue">Why this matters</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-secondary">{g.potentialCauses}</p>
            </section>
          )}

          {actions.length > 0 && (
            <section className="mt-6">
              <h3 className="text-sm font-semibold text-blue">How to fix this</h3>
              <div className="mt-3 flex flex-col gap-2.5">
                {actions.map((a, i) => (
                  <div key={i} className="rounded-2xl border border-borderColor bg-white p-4">
                    <p className="text-sm font-medium text-blue">{a.label || a}</p>
                    {a.detail && <p className="mt-1 text-[13px] leading-relaxed text-secondary">{a.detail}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  } else if (step === 0) {
    screen = (
      <div className="relative flex h-full flex-col items-center justify-end overflow-hidden bg-black px-6 pb-[12vh] text-center">
        {/* Full-bleed looping background video. */}
        <video
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          src="/assets/protocol-welcome.mp4"
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
        />
        {/* Scrim — darkens the video toward the bottom so the copy stays legible. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/35 to-black/85" />
        <div className="relative flex flex-col items-center">
          <h1 className="text-[34px] font-semibold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">Welcome {userName}</h1>
          <p className="mt-3 max-w-[440px] text-[15px] leading-relaxed text-white/80 drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
            Cyborg has analyzed your lab results and identified core insights. Let&apos;s build a precise protocol to address these, tailored to you.
          </p>
          <DarkContinue onClick={next} />
        </div>
      </div>
    );
  } else if (step === 1) {
    screen = (
      <div className="flex h-full flex-col items-center bg-gradient-to-b from-[#7a3b0e] via-[#2a1607] to-black px-6 text-center">
        <div className="pt-[7vh]"><Wordmark /></div>
        <div className="flex flex-1 items-center justify-center">
          <RingGauge value={youngerBy != null ? Math.max(55, Math.min(92, 70 + youngerBy)) : 70} color="#FBBF24"
            centerMain={<div className="text-[52px] font-semibold leading-none text-white">{bioNum != null ? bioNum.toFixed(1) : "—"}</div>}
            centerTop="biological age"
            centerSub={youngerBy != null ? `${Math.abs(youngerBy)} years ${youngerBy >= 0 ? "younger" : "older"}` : undefined} />
        </div>
        <div className="pb-[8vh]">
          <h2 className="text-[26px] font-semibold text-white">Your biological age is {bioNum != null ? bioNum.toFixed(1) : "—"}</h2>
          <p className="mt-2 max-w-[440px] text-[14px] text-white/65">
            {youngerBy != null && youngerBy >= 0 ? `You are ${Math.round(Math.abs(youngerBy) * 10) / 10} years younger than your chronological age!` : "Here's how your biology compares to your age."}
          </p>
          <DarkContinue onClick={next} />
        </div>
      </div>
    );
  } else if (step === 2) {
    screen = (
      <div className="flex h-full flex-col items-center bg-gradient-to-b from-[#7a3b0e] via-[#2a1607] to-black px-6 text-center">
        <div className="pt-[7vh]"><Wordmark /></div>
        <div className="flex flex-1 items-center justify-center">
          <RingGauge value={scoreNum ?? 0} max={100} color="#FBBF24"
            centerMain={<div className="text-[52px] font-semibold leading-none text-white">{scoreNum != null ? Math.round(scoreNum) : "—"}</div>}
            centerTop="cyborg score" centerSub="out of 100" />
        </div>
        <div className="pb-[8vh]">
          <h2 className="text-[26px] font-semibold text-white">Your Cyborg Score is {scoreNum != null ? Math.round(scoreNum) : "—"}</h2>
          <p className="mt-2 max-w-[440px] text-[14px] text-white/65">{userName}, you&apos;re {scoreWord}. There are some areas that could be improved.</p>
          <DarkContinue onClick={next} />
        </div>
      </div>
    );
  } else if (step === 3) {
    const STEPS = [
      { n: 1, title: "Review key results", body: "We'll surface the biomarkers worth bringing to your attention." },
      { n: 2, title: "Build your protocol", body: "We'll turn your results into a clear, prioritized plan you can follow." },
      { n: 3, title: "Run it with confidence", body: "Simple daily actions, tracked over time, adjusted as you improve." },
    ];
    screen = (
      <div className="flex h-full flex-col bg-pageBackground">
        <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col overflow-y-auto px-5 pt-[7vh]">
          <ProgressBar pct={30} />
          <h2 className="mt-7 text-center text-[26px] font-semibold tracking-tight text-blue">Your protocol, in 3 steps</h2>
          <p className="mt-2 text-center text-sm text-secondary">Key biomarkers, a prioritized plan, and a simple way to run it.</p>
          <div className="mt-6 flex flex-col gap-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-borderColor bg-white p-5">
                <span className="text-2xl font-semibold text-orange-500">{s.n}</span>
                <h3 className="mt-3 text-base font-semibold text-blue">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-secondary">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto w-full max-w-[560px] px-5 pb-[5vh] pt-3"><LightContinue onClick={next} /></div>
      </div>
    );
  } else if (step === 4) {
    screen = (
      <div className="flex h-full flex-col bg-pageBackground">
        <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col overflow-y-auto px-5 pt-[7vh]">
          <ProgressBar pct={55} />
          <h2 className="mt-7 text-center text-[26px] font-semibold tracking-tight text-blue">Your health winners</h2>
          <p className="mt-2 text-center text-sm text-secondary">
            {winners.length} of 14 health categories {winners.length === 1 ? "is" : "are"} doing great!
          </p>
          <div className="mt-6 rounded-3xl border border-borderColor bg-white p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-secondary">{userName}</p>
              <span className="select-none text-[15px] font-semibold lowercase tracking-tight text-blue/35">cyborg</span>
            </div>
            {/* Static front bust (head + shoulders + chest), framed by the model camera */}
            <div className="relative mx-auto my-5 h-72 w-full overflow-hidden rounded-2xl bg-gradient-to-b from-emerald-50/60 via-white to-emerald-100/80">
              <BodyModelClient sex={sex} spin={false} frame="bust" className="h-full w-full" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-emerald-100/70" />
            </div>
            {winners.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {winners.map((w) => (
                  <span key={w.name} className="inline-flex items-center gap-1.5 rounded-full border border-borderColor bg-pageBackground px-3 py-1.5 text-[13px] font-medium text-blue">
                    <span className={`grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold text-white ${w.grade === "A" ? "bg-emerald-500" : "bg-yellow-400"}`}>{w.grade}</span>
                    {w.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="mx-auto w-full max-w-[560px] px-5 pb-[5vh] pt-3"><LightContinue onClick={next} /></div>
      </div>
    );
  } else if (step === 5) {
    // "Let's build your protocol" — tap the chevron / swipe up to start
    screen = (
      <div
        className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-white to-[#fdf4ea] px-6"
        onTouchStart={(e) => { touchStartY.current = e.touches[0].clientY; }}
        onTouchEnd={(e) => { if (touchStartY.current - e.changedTouches[0].clientY > 50) next(); }}
      >
        <div className="mx-auto w-full max-w-[560px] pt-[5vh]"><ProgressBar pct={80} /></div>
        <div className="mt-[7vh] text-center"><Wordmark dark /></div>
        <div className="relative flex flex-1 flex-col items-center justify-center text-center">
          <div className="pointer-events-none absolute top-[18%] h-40 w-[340px] rounded-full bg-[radial-gradient(ellipse,rgba(249,115,22,0.30),transparent_70%)] blur-2xl" />
          <h2 className="relative text-[28px] font-semibold tracking-tight text-blue">Let&apos;s build your protocol</h2>
          <p className="relative mt-2 max-w-[300px] text-sm leading-relaxed text-secondary">Based on your data and preferences we&apos;ll create your protocol.</p>
        </div>
        <div className="relative flex flex-col items-center gap-3 pb-[9vh]">
          <div className="pointer-events-none absolute -top-24 h-40 w-[260px] rounded-full bg-[radial-gradient(ellipse,rgba(249,115,22,0.26),transparent_70%)] blur-2xl" />
          <button type="button" onClick={next} aria-label="Start"
            className="relative grid h-12 w-12 animate-bounce place-items-center rounded-full bg-black text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition hover:bg-black/90 active:scale-95">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M7 13l5-5 5 5M7 18l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <span className="relative text-xs text-secondary">Swipe up to start</span>
        </div>
      </div>
    );
  } else {
    // step 6 — top 3 health goals
    screen = (
      <div className="flex h-full flex-col bg-pageBackground">
        <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col overflow-y-auto px-5 pt-[7vh]">
          <ProgressBar pct={100} />
          <h2 className="mt-7 text-[26px] font-semibold tracking-tight text-blue">Your top 3 health goals</h2>
          <p className="mt-2 text-sm text-secondary">Based on your data we found {top3.length} key focuses.</p>
          <div className="mt-6 flex flex-col gap-3">
            {top3.length ? top3.map((g, i) => (
              <button key={g.id} type="button" onClick={() => setActiveGoal(g)}
                className="group flex items-start gap-4 rounded-2xl border border-borderColor bg-white p-5 text-left transition hover:border-blue/20 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
                <span className="text-2xl font-semibold leading-none" style={{ color: GOAL_NUM_COLORS[i % 3] }}>{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-blue">{g.title}</span>
                  {g.desc && <span className="mt-1 block text-[13px] leading-relaxed text-secondary line-clamp-2">{g.desc}</span>}
                </span>
                <svg className="mt-1 h-4 w-4 shrink-0 text-secondary transition group-hover:translate-x-0.5 group-hover:text-blue" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            )) : (
              <div className="rounded-2xl border border-borderColor bg-white p-8 text-center text-sm text-secondary">Your goals will appear here once your report is reviewed.</div>
            )}
          </div>
        </div>
        <div className="mx-auto w-full max-w-[560px] px-5 pb-[5vh] pt-3"><LightContinue onClick={() => onComplete?.()} label="Go to my protocol" /></div>
      </div>
    );
  }

  const viewKey = activeGoal ? `goal-${activeGoal.id}` : `step-${step}`;

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden">
      <style>{`@keyframes protocolStepIn{from{opacity:0;transform:translateY(16px) scale(0.992)}to{opacity:1;transform:none}}.protocol-step-in{animation:protocolStepIn .42s cubic-bezier(0.22,1,0.36,1) both}`}</style>
      <div key={viewKey} className="protocol-step-in absolute inset-0">{screen}</div>
      {modalBiomarker && <BiomarkerDetailModal biomarker={modalBiomarker} onClose={() => setModalBiomarker(null)} />}
    </div>
  );
}
