"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import Cookie from "js-cookie";
import {
    ArrowUpRight, ChevronRight, Check, Lock, FileText, Watch, Sparkles, Apple,
    Flame, Leaf, Wheat, Beef, Droplet, Candy, CircleCheck, MessageSquareWarning,
} from "lucide-react";
import { BodyModelClient } from "@/components/data/BodyModelClient";
import { organKeyForCategory } from "@/components/data/organStatus";
import { actionPlanAPI, timelineAPI, mealAPI } from "@/services/api";
import ActionButtons from "@/components/home/ActionButtons";
import TimelineMealCard from "@/components/home/TimelineMealCard";
import TimelineActivityCard from "@/components/home/TimelineActivityCard";

const CARD = "rounded-3xl border border-borderColor bg-white";

/* ── shared helpers ─────────────────────────────────────────────────────── */

// matchMedia hook — false during SSR / first paint, true once ≥1100px (the app's
// mobile↔desktop divider). Drives the single-instance twin placement.
function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(min-width: 1100px)");
        const on = () => setIsDesktop(mq.matches);
        on();
        mq.addEventListener("change", on);
        return () => mq.removeEventListener("change", on);
    }, []);
    return isDesktop;
}

function statusMeta(status) {
    const s = String(status || "").toLowerCase();
    if (s === "optimal") return { label: "Optimal", dot: "bg-emerald-500", text: "text-emerald-600", hex: "#05BC7E" };
    if (s === "normal") return { label: "Normal", dot: "bg-[#D7D82E]", text: "text-[#9a9b17]", hex: "#D7D82E" };
    return { label: "Out of Range", dot: "bg-[#F865DD]", text: "text-[#e23bc6]", hex: "#F865DD" };
}

// "150–410" / ">40" / "<100" from whatever bounds a biomarker carries.
function refRangeText(b) {
    const lo = b?.referenceMin ?? b?.optimalRange?.min ?? null;
    const hi = b?.referenceMax ?? b?.optimalRange?.max ?? null;
    if (lo != null && hi != null) return `${lo}–${hi}`;
    if (lo != null) return `>${lo}`;
    if (hi != null) return `<${hi}`;
    return null;
}

// Value's fractional position inside its reference band (0–1), clamped.
function bandPosition(b) {
    const lo = Number(b?.referenceMin ?? b?.optimalRange?.min);
    const hi = Number(b?.referenceMax ?? b?.optimalRange?.max);
    const v = Number(b?.value);
    if (!Number.isFinite(v) || !Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo) return 0.5;
    return Math.max(0.04, Math.min(0.96, (v - lo) / (hi - lo)));
}

// Deterministic, non-fabricated guidance keyed on organ system + direction.
const GUIDANCE = {
    heart: { bad: "Low results can affect your cardiovascular resilience and overall lipid balance. Incorporate consistent movement like brisk walking after meals to support your health.", good: "These values support healthy circulation and heart function. Sustain them with regular movement and a plant-forward nutrition plan." },
    nutrients: { bad: "Low levels can sap your energy and slow recovery. Prioritise nutrient-dense foods and targeted supplementation to rebuild your reserves.", good: "Your nutrient status looks solid — keep up a varied, whole-food diet to maintain these levels." },
    metabolic: { bad: "These markers point to blood-sugar strain. Balance meals with protein and fibre and stay active after eating.", good: "Balanced metabolic markers mean steady energy and stable blood sugar. Keep up the good habits." },
    thyroid: { bad: "Thyroid markers outside range can affect energy, weight and mood. Worth reviewing with your clinician.", good: "Thyroid markers sit in a healthy range, supporting steady metabolism and energy." },
    liver: { bad: "These results suggest your liver is working harder than ideal. Ease alcohol and ultra-processed foods to lighten the load.", good: "Liver markers are in a healthy range, a good sign for detox and metabolism." },
    kidney: { bad: "These markers hint at extra strain on your kidneys. Stay well hydrated and keep an eye on sodium.", good: "Kidney markers look healthy, supporting good filtration and fluid balance." },
    inflammation: { bad: "Elevated inflammation can slow recovery and affect long-term health. Prioritise sleep, omega-3s and stress reset.", good: "Low inflammation is a strong sign of resilience. Maintain it with sleep and an anti-inflammatory diet." },
    immune: { bad: "These values can leave your defences under-supported. Focus on sleep, protein and micronutrients.", good: "These values support healthy blood clotting and overall circulatory wellness. Sustain this balance by following a balanced, plant-forward nutrition plan." },
    sex: { bad: "Hormone markers outside range can affect drive, energy and mood. A clinician can help you interpret these.", good: "Your hormone markers are well balanced, supporting energy, mood and drive." },
    dna: { bad: "These markers relate to methylation and cellular ageing. B-vitamins and lifestyle can help optimise them.", good: "These markers point to healthy cellular ageing — keep up the habits supporting them." },
    brain: { bad: "These markers can influence focus and mood. Sleep, omega-3s and movement all help.", good: "These markers support clear focus and steady mood." },
    default: { bad: "This marker is outside the optimal range. Small, consistent lifestyle changes can help bring it back into balance.", good: "This marker sits in a healthy range — keep up the habits that got you here." },
};

function guidanceFor(b, direction) {
    const key = organKeyForCategory(b?.category || "") || "default";
    return (GUIDANCE[key] || GUIDANCE.default)[direction];
}

/* ── semicircle gauge (Score / Bio age) ─────────────────────────────────── */

function Gauge({ fraction, tone = "#ffffff" }) {
    const f = Math.max(0, Math.min(1, Number(fraction) || 0));
    const theta = Math.PI * (1 - f); // f=0 → left, f=1 → right, over the top
    const cx = 100, cy = 100, r = 80;
    const kx = cx + r * Math.cos(theta);
    const ky = cy - r * Math.sin(theta);
    return (
        <svg viewBox="0 0 200 116" className="w-full">
            <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="6" strokeLinecap="round" />
            <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke={tone} strokeWidth="6" strokeLinecap="round" pathLength="100" strokeDasharray={`${f * 100} 100`} />
            <circle cx={kx} cy={ky} r="7" fill={tone} />
        </svg>
    );
}

function GaugeCard({ href, title, bg, fraction, big, sub, footnote, ready }) {
    return (
        <Link href={href} className="group relative flex min-h-[210px] min-w-0 flex-col overflow-hidden rounded-3xl p-4 text-white transition hover:brightness-105 lg:min-h-[240px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bg} alt="" className="absolute inset-0 h-full w-full object-cover" onError={(e) => e.currentTarget.remove()} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-black/45" />
            <div className="relative z-10 flex h-full flex-col">
                <span className="text-[17px] font-semibold tracking-tight">{title}</span>
                <div className="flex flex-1 items-center justify-center">
                    <div className="relative w-full max-w-[190px]">
                        <Gauge fraction={fraction} />
                        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
                            {ready ? (
                                <>
                                    <span className="text-[30px] font-semibold leading-none">{big}</span>
                                    <span className="mt-1 text-[12px] text-white/85">{sub}</span>
                                </>
                            ) : (
                                <span className="select-none text-[30px] font-semibold leading-none tracking-[0.1em] text-white/60">— —</span>
                            )}
                        </div>
                    </div>
                </div>
                <p className="text-[13px] text-white/85">{footnote}</p>
            </div>
        </Link>
    );
}

/* ── biomarker detail card (attention / working-well) ────────────────────── */

function BiomarkerDetailCard({ b, withGuidance, direction }) {
    const meta = statusMeta(b.status);
    const range = refRangeText(b);
    return (
        <div className={`${CARD} p-5`}>
            <div className="flex items-start justify-between gap-3">
                <p className="text-[12px] text-secondary">{b.category}</p>
                <div className="flex items-center gap-2">
                    {(b.value != null) && (
                        <p className="text-[13px] font-semibold text-blue">
                            {b.value} <span className="font-normal text-secondary">{b.unit}</span>
                        </p>
                    )}
                    {range && <span className="rounded-md bg-pageBackground px-2 py-0.5 text-[12px] font-medium text-secondary">{range}</span>}
                </div>
            </div>
            <p className="mt-1 text-[16px] font-semibold text-blue">{b.name}</p>
            <p className={`mt-1 flex items-center gap-1.5 text-[13px] font-medium ${meta.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                {meta.label}
            </p>
            {withGuidance && (
                <p className="mt-3 text-[13px] leading-relaxed text-secondary">{guidanceFor(b, direction)}</p>
            )}
        </div>
    );
}

function SectionHeader({ icon, children }) {
    return (
        <div className="flex items-center gap-2 px-1">
            {icon}
            <h3 className="text-[15px] font-semibold tracking-tight text-blue">{children}</h3>
        </div>
    );
}

/* ── contributing biomarkers (gradient sliders) ─────────────────────────── */

function ContributingRow({ b }) {
    const meta = statusMeta(b.status);
    const pos = bandPosition(b);
    return (
        <div className={`${CARD} flex items-center justify-between gap-3 px-4 py-3.5`}>
            <div className="min-w-0">
                <p className="flex items-center gap-2 text-[15px] font-semibold text-blue">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
                    <span className="truncate">{b.name}</span>
                </p>
                <p className="mt-1 pl-4 text-[13px] text-secondary">{b.value} {b.unit}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
                <div className="relative h-4 w-[92px]">
                    <div className="absolute top-1/2 h-2 w-full -translate-y-1/2 rounded-full" style={{ background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, ${meta.hex}55 55%, ${meta.hex} 100%)` }} />
                    <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow" style={{ left: `${pos * 100}%`, background: meta.hex }} />
                </div>
                <div className="flex flex-col gap-[3px]">
                    <span className="h-2 w-[3px] rounded-full bg-[#F865DD]" />
                    <span className="h-2 w-[3px] rounded-full bg-[#D7D82E]" />
                    <span className="h-2 w-[3px] rounded-full bg-emerald-500" />
                </div>
            </div>
        </div>
    );
}

/* ── main ────────────────────────────────────────────────────────────────── */

export default function DigitalTwinHome(props) {
    const {
        userName, sex, router, activeTab, onTabChange, twinHighlights,
        score, bioAge, chronoAge, biomarkerSummary, biomarkers, reportDate,
        plan, planReady, actionPlanUpdated, protocolItems, topGoal,
        reports, reportsLoading, processingReport, readyReport, hasAnyReport,
        userId, processing,
    } = props;

    const isDesktop = useIsDesktop();

    const hero = (
        <TwinHero firstName={userName} sex={sex} router={router} highlights={twinHighlights} />
    );

    // Biomarker groupings (real data → honest empty states).
    const bms = Array.isArray(biomarkers) ? biomarkers : [];
    const attention = bms.filter((b) => String(b.status).toLowerCase() === "out_of_range").slice(0, 3);
    const workingWell = bms.filter((b) => String(b.status).toLowerCase() === "optimal").slice(0, 2);
    const contributing = [...bms]
        .sort((a, b) => bandPosition(b) - bandPosition(a))
        .slice(0, 3);

    return (
        <div className="min-h-screen overflow-x-hidden bg-pageBackground font-inter pb-36 lg:pb-16">
            <div className="mx-auto w-full max-w-[1180px] px-4 pt-4 lg:px-8 lg:pt-6">
                <Tabs active={activeTab} onChange={onTabChange} />

                {/* Header — welcome + language chip */}
                <div className="mb-5 mt-4 flex items-start justify-between gap-4">
                    <h1 className="text-[26px] font-semibold leading-[1.12] tracking-tight text-blue lg:text-[30px]">
                        Welcome back,<br />{userName}
                    </h1>
                    <button type="button" aria-label="Language" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-borderColor text-[13px] font-semibold text-secondary">
                        EN
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)] lg:items-start lg:gap-6">
                    {/* Desktop-only sticky twin rail */}
                    <aside className="hidden lg:block lg:sticky lg:top-6 lg:self-start">
                        {isDesktop && hero}
                    </aside>

                    {/* Report stream */}
                    <div className="flex min-w-0 flex-col gap-4">
                        <AppPromoCard />
                        <ActionItemsCard />

                        <div className="grid grid-cols-2 gap-4">
                            <GaugeCard
                                href="/data" title="Score" bg="/assets/data/score.jpg"
                                fraction={score != null ? Math.min(1, score / 100) : 0}
                                ready={score != null} big={score != null ? Math.round(score) : "—"} sub="out of 100"
                                footnote={score != null ? "Last test was 1 month ago" : "Awaiting lab results"}
                            />
                            <GaugeCard
                                href="/data" title="Biological age" bg="/assets/data/bioage.jpg"
                                fraction={bioAgeFraction(bioAge, chronoAge)}
                                ready={bioAge != null} big={bioAge != null ? bioAge.toFixed(1) : "—"} sub="years old"
                                footnote={bioAgeFootnote(bioAge, chronoAge)}
                            />
                        </div>

                        <ResultsReadyCard loading={reportsLoading} readyReport={readyReport} processingReport={processingReport} hasAnyReport={hasAnyReport} />

                        <div className="grid grid-cols-2 gap-4">
                            <ActionPlanCard planReady={planReady} />
                            <TestRecordCard hasAnyReport={hasAnyReport} />
                        </div>

                        <HelpUsKnowYouCard hasReports={hasAnyReport} />

                        {/* Twin inline on mobile only (single WebGL instance) */}
                        {!isDesktop && hero}

                        <SummaryCard userName={userName} reportDate={reportDate} processing={processing} plan={plan} />
                        <BiomarkersCard summary={biomarkerSummary} />

                        {/* Notable shifts — no delta backend yet → honest empty state */}
                        <div className="flex flex-col gap-3">
                            <SectionHeader icon={<span className="grid h-5 w-5 place-items-center rounded-full bg-black text-white"><Sparkles className="h-3 w-3" /></span>}>Notable shifts</SectionHeader>
                            <div className={`${CARD} p-5`}>
                                <p className="text-[13px] leading-relaxed text-secondary">Change and delta information will appear after your next collection.</p>
                            </div>
                        </div>

                        {attention.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <SectionHeader icon={<MessageSquareWarning className="h-5 w-5 text-[#F865DD]" />}>Biomarkers that need attention</SectionHeader>
                                {attention.map((b, i) => <BiomarkerDetailCard key={(b.id || b.name) + i} b={b} withGuidance direction="bad" />)}
                            </div>
                        )}

                        {workingWell.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <SectionHeader icon={<CircleCheck className="h-5 w-5 text-emerald-500" />}>What&apos;s working well</SectionHeader>
                                {workingWell.map((b, i) => <BiomarkerDetailCard key={(b.id || b.name) + i} b={b} withGuidance direction="good" />)}
                            </div>
                        )}

                        {contributing.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <h3 className="px-1 text-[15px] font-semibold tracking-tight text-secondary">Contributing Biomarkers</h3>
                                {contributing.map((b, i) => <ContributingRow key={(b.id || b.name) + i} b={b} />)}
                            </div>
                        )}

                        <HigherPriorityGoalCard topGoal={topGoal} biomarkers={bms} />
                        <ProtocolChecklist items={protocolItems} planReady={planReady} />
                        <TimelineSection userId={userId} router={router} />
                        <LiveBetterCard />
                    </div>
                </div>
            </div>
        </div>
    );
}

function bioAgeFraction(bioAge, chronoAge) {
    if (bioAge == null) return 0;
    if (chronoAge == null) return 0.68;
    const delta = chronoAge - bioAge; // +ve = younger = good
    return Math.max(0.06, Math.min(0.94, (delta + 5) / 10));
}
function bioAgeFootnote(bioAge, chronoAge) {
    if (bioAge == null) return "Awaiting lab results";
    if (chronoAge == null) return "PhenoAge estimate";
    const d = chronoAge - bioAge;
    return d >= 0 ? `You're ${d.toFixed(1)} years younger` : `You're ${Math.abs(d).toFixed(1)} years older`;
}

/* ── tabs ────────────────────────────────────────────────────────────────── */

function Tabs({ active, onChange }) {
    const tabs = [["timeline", "Timeline", false], ["twin", "Digital Twin", false]];
    return (
        <div className="flex items-center gap-6 border-b border-borderColor px-1">
            {tabs.map(([k, label, locked]) => (
                <button
                    key={k}
                    type="button"
                    onClick={() => onChange(k)}
                    className={`-mb-px flex items-center gap-1.5 border-b-2 pb-3 text-sm font-medium transition-colors ${active === k ? "border-blue text-blue" : "border-transparent text-secondary hover:text-blue"}`}
                >
                    {locked && <Lock className="h-3.5 w-3.5" />}
                    {label}
                </button>
            ))}
        </div>
    );
}

/* ── twin hero (3D body + ask AI) ───────────────────────────────────────── */

function TwinHero({ firstName, sex, router, highlights }) {
    const [query, setQuery] = useState("");
    const list = Array.isArray(highlights) && highlights.length ? highlights : [{ organ: null, status: "good" }];
    const [hi, setHi] = useState(0);
    useEffect(() => {
        setHi(0);
        if (list.length < 2) return undefined;
        const id = setInterval(() => setHi((i) => (i + 1) % list.length), 3500);
        return () => clearInterval(id);
    }, [list.length]);
    const active = list[hi % list.length] || list[0];

    const goConcierge = (e) => {
        e.preventDefault();
        const q = query.trim();
        router.push(q ? `/concierge?q=${encodeURIComponent(q)}` : "/concierge");
    };

    return (
        <div className="relative flex min-h-[560px] flex-col overflow-hidden rounded-3xl bg-[#ececef] lg:min-h-[720px]">
            <div className="flex items-start justify-between px-6 pt-6 lg:px-8 lg:pt-8">
                <h2 className="text-2xl font-semibold tracking-tight text-blue/40 lg:text-[28px]">Welcome, {firstName}</h2>
                <Link href="/data" aria-label="Open your data" className="rounded-full p-1.5 text-secondary transition hover:bg-white hover:text-blue">
                    <ArrowUpRight className="h-5 w-5" />
                </Link>
            </div>
            <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-0">
                    <BodyModelClient sex={sex} highlight={active.organ} status={active.status} zoom={1.15} className="h-full w-full" />
                </div>
            </div>
            <form onSubmit={goConcierge} className="px-4 pb-4 lg:px-6 lg:pb-6">
                <div className="flex items-center gap-3 rounded-full border border-borderColor bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask anything…"
                        className="min-w-0 flex-1 bg-transparent text-sm text-blue placeholder:text-secondary focus:outline-none"
                    />
                    <button type="submit" aria-label="Ask Cyborg AI" className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-borderColor bg-white text-secondary transition hover:text-blue">
                        <ArrowUpRight className="h-4 w-4" />
                    </button>
                </div>
            </form>
        </div>
    );
}

/* ── app promo ──────────────────────────────────────────────────────────── */

function AppPromoCard() {
    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-400 via-orange-500 to-orange-700 p-6 text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/mobileappgirl.png" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right" onError={(e) => e.currentTarget.remove()} />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/35 via-black/10 to-transparent" />
            <div className="relative z-10 max-w-[65%]">
                <h3 className="text-[22px] font-semibold leading-tight tracking-tight">Launching early August</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/90">All your data in your pocket, sync wearables and text Cyborg AI anytime.</p>
                <span className="mt-4 inline-flex items-center gap-2 rounded-lg bg-black px-3.5 py-2 text-white">
                    <Apple className="h-5 w-5" />
                    <span className="text-left leading-none">
                        <span className="block text-[9px] text-white/70">Download on the</span>
                        <span className="block text-[13px] font-semibold">App Store</span>
                    </span>
                </span>
            </div>
        </div>
    );
}

/* ── action items ───────────────────────────────────────────────────────── */

function ActionItemsCard() {
    return (
        <div className={`${CARD} p-5 lg:p-6`}>
            <h3 className="text-base font-semibold tracking-tight text-blue">Action Items</h3>
            <Link href="/settings?tab=integrations" className="group mt-4 flex items-center gap-4 border-t border-borderColor pt-4">
                <span className="grid h-10 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-pageBackground">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/assets/wearables.jpg" alt="" className="h-9 w-11 object-contain" onError={(e) => { e.currentTarget.replaceWith(Object.assign(document.createElement("span"), { textContent: "⌚" })); }} />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-blue">Connect your wearables</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-secondary">Get personalised insights from your wearable data.</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-secondary transition group-hover:translate-x-0.5 group-hover:text-blue" />
            </Link>
        </div>
    );
}

/* ── results ready ──────────────────────────────────────────────────────── */

function ResultsReadyCard({ loading, readyReport, processingReport, hasAnyReport }) {
    let title, sub, ring = "border-borderColor";
    if (loading) { title = "Loading your results…"; sub = "Fetching your latest report"; }
    else if (readyReport) { title = "Your results are ready"; sub = "Lab report ready"; ring = "border-orange-400"; }
    else if (processingReport) { title = "Results are processing"; sub = "We'll notify you when they're ready"; }
    else { title = "Upload your lab report"; sub = "Unlock your biomarker breakdown"; }
    return (
        <Link href="/data" className={`group flex items-center gap-4 rounded-3xl border-2 bg-white p-4 transition hover:brightness-[0.99] ${ring}`}>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange-50">
                <Image src="/assets/black-icons/vial.svg" alt="" width={22} height={22} className="opacity-80" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[16px] font-semibold text-blue">{title}</p>
                <p className="mt-0.5 text-[13px] text-secondary">{sub}</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-secondary transition group-hover:translate-x-0.5 group-hover:text-blue" />
        </Link>
    );
}

/* ── action plan / test record ──────────────────────────────────────────── */

function ActionPlanCard({ planReady }) {
    return (
        <Link href="/protocol" className={`group relative flex min-h-[190px] flex-col overflow-hidden ${CARD} p-5 transition hover:border-blue/20`}>
            <p className="text-[16px] font-semibold text-blue">Action plan</p>
            {!planReady && <p className="mt-1 text-[12px] text-secondary">Unlocks after your labs</p>}
            <div className="relative mt-auto h-[110px] w-full">
                <Image src="/assets/goal-theme-1.png" alt="" fill className="object-contain object-bottom" />
            </div>
        </Link>
    );
}

function TestRecordCard() {
    return (
        <Link href="/data?tab=records" className={`group relative flex min-h-[190px] flex-col overflow-hidden ${CARD} p-5 transition hover:border-blue/20`}>
            <p className="text-[16px] font-semibold text-blue">Test record</p>
            <div className="relative mt-auto h-[110px] w-full">
                <Image src="/assets/preview/mobile-image-2.png" alt="" fill className="object-contain object-bottom" />
            </div>
        </Link>
    );
}

/* ── help us know you ───────────────────────────────────────────────────── */

function HelpUsKnowYouCard({ hasReports }) {
    const items = [
        { key: "wearables", title: "Connect your wearables", done: false, href: "/settings?tab=integrations", Icon: Watch, img: "/assets/wearables.jpg" },
        { key: "labs", title: "Lab reports uploaded", done: !!hasReports, href: "/data?tab=records", Icon: FileText },
        { key: "memory", title: "Import your AI memory", done: false, href: "/concierge", ai: true },
    ];
    const completed = items.filter((i) => i.done).length;
    const AiLogos = () => (
        <span className="grid h-10 w-12 shrink-0 grid-cols-2 place-items-center gap-0.5 rounded-lg bg-white p-1">
            {["/assets/claude-icon.svg", "/assets/ChatGPT-Logo.svg", "/assets/google.svg", "/assets/perplexity-icon.svg"].map((s) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={s} src={s} alt="" className="h-3.5 w-3.5 object-contain" onError={(e) => e.currentTarget.remove()} />
            ))}
        </span>
    );
    return (
        <div className={`${CARD} p-5 lg:p-6`}>
            <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold tracking-tight text-blue">Help us know you better</h3>
                <span className="shrink-0 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-600">{completed}/3 completed</span>
            </div>
            <div className="mt-4 space-y-3">
                {items.map(({ key, title, done, href, Icon, img, ai }) => {
                    const icon = ai ? <AiLogos /> : img ? (
                        <span className="grid h-10 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-white">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img} alt="" className="h-9 w-11 object-contain" onError={(e) => e.currentTarget.remove()} />
                        </span>
                    ) : (
                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white ${done ? "text-emerald-600" : "text-secondary"}`}><Icon className="h-4 w-4" /></span>
                    );
                    return done ? (
                        <div key={key} className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3">
                            {icon}
                            <p className="min-w-0 flex-1 text-sm font-medium text-emerald-700">{title}</p>
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-600 text-white"><Check className="h-4 w-4" /></span>
                        </div>
                    ) : (
                        <Link key={key} href={href} className="group flex items-center gap-3 rounded-2xl border border-borderColor bg-white px-4 py-3 transition hover:brightness-[0.98]">
                            {icon}
                            <p className="min-w-0 flex-1 text-sm font-medium text-blue">{title}</p>
                            <ChevronRight className="h-5 w-5 shrink-0 text-secondary transition group-hover:translate-x-0.5 group-hover:text-blue" />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

/* ── summary ────────────────────────────────────────────────────────────── */

function SummaryCard({ userName, reportDate, processing, plan }) {
    const d = reportDate || plan?.updatedAt || null;
    const updated = d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;
    const body = processing
        ? `${userName}, we're still processing your data, but can already take a look into your first results.`
        : `${userName}, here's a look at where your health stands today based on your latest results.`;
    return (
        <div className={`${CARD} p-5 lg:p-6`}>
            <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold tracking-tight text-blue">Summary</h3>
                {updated && <span className="text-[12px] text-secondary">Last updated {updated}</span>}
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-secondary">{body}</p>
        </div>
    );
}

/* ── biomarkers summary ─────────────────────────────────────────────────── */

function BiomarkersCard({ summary }) {
    const s = summary || { total: 0, optimal: 0, normal: 0, outOfRange: 0 };
    const total = s.total || 0;
    const seg = (n) => (total > 0 ? `${(n / total) * 100}%` : "0%");
    const Stat = ({ n, label }) => (
        <div>
            <p className="text-[26px] font-semibold leading-none text-blue">{n ?? 0}</p>
            <p className="mt-1.5 text-[12px] text-secondary">{label}</p>
        </div>
    );
    return (
        <div className={`${CARD} p-5 lg:p-6`}>
            <h3 className="text-base font-semibold tracking-tight text-blue">Biomarkers</h3>
            <div className="mt-4 grid grid-cols-4 gap-2">
                <Stat n={total} label="Total" />
                <Stat n={s.optimal} label="Optimal" />
                <Stat n={s.normal} label="Normal" />
                <Stat n={s.outOfRange} label="Out of Range" />
            </div>
            <div className="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-pageBackground">
                <div className="h-full bg-emerald-500" style={{ width: seg(s.optimal) }} />
                <div className="h-full bg-[#D7D82E]" style={{ width: seg(s.normal) }} />
                <div className="h-full bg-[#F865DD]" style={{ width: seg(s.outOfRange) }} />
            </div>
            <Link href="/data" className="mt-5 inline-flex items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-900">
                View all biomarkers
            </Link>
        </div>
    );
}

/* ── higher priority goal (red card) ────────────────────────────────────── */

const PRIORITY_SYMPTOMS = {
    nutrients: ["Slower recovery after workout", "Low energy"],
    metabolic: ["Afternoon energy crashes", "Sugar cravings"],
    heart: ["Reduced stamina", "Fatigue"],
    thyroid: ["Low energy", "Brain fog"],
    liver: ["Sluggishness", "Poor detox"],
    kidney: ["Fatigue", "Fluid retention"],
    inflammation: ["Aches", "Slower recovery"],
    sex: ["Low drive", "Mood dips"],
    immune: ["Frequent colds", "Slow recovery"],
    brain: ["Brain fog", "Low mood"],
    default: ["Low energy", "Slower recovery"],
};

function MiniSlider({ b }) {
    const meta = statusMeta(b.status);
    const pos = bandPosition(b);
    return (
        <div className="relative h-11 w-[70px] overflow-hidden rounded-lg bg-white/90">
            <div className="absolute inset-x-2 top-1/2 h-1.5 -translate-y-1/2 rounded-full" style={{ background: `linear-gradient(90deg, rgba(255,255,255,0), ${meta.hex})` }} />
            <span className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow" style={{ left: `${8 + pos * 54}px`, background: meta.hex }} />
            <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 flex-col gap-[2px]">
                <span className="h-1.5 w-[3px] rounded-full bg-[#F865DD]" />
                <span className="h-1.5 w-[3px] rounded-full bg-[#D7D82E]" />
                <span className="h-1.5 w-[3px] rounded-full bg-emerald-500" />
            </div>
        </div>
    );
}

function HigherPriorityGoalCard({ topGoal, biomarkers }) {
    const flagged = (Array.isArray(biomarkers) ? biomarkers : [])
        .filter((b) => String(b.status || "").toLowerCase() !== "optimal");
    const feature = flagged[0];
    const heading = topGoal?.title || (feature ? `Get your ${feature.name} into the optimal zone` : null);
    if (!heading) return null;
    const organ = feature ? organKeyForCategory(feature.category || "") : null;
    const symptoms = PRIORITY_SYMPTOMS[organ] || PRIORITY_SYMPTOMS.default;
    const affected = flagged.slice(0, 2);
    return (
        <div className="relative overflow-hidden rounded-3xl p-6 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-[#c0341f] via-[#a52d1c] to-[#6f1a10]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/data/score.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" onError={(e) => e.currentTarget.remove()} />
            <div className="absolute inset-0 bg-black/25" />
            <div className="relative z-10">
                <p className="text-[12px] text-white/75">Higher priority goals</p>
                <h3 className="mt-1 text-[26px] font-semibold leading-[1.15] tracking-tight">{heading}</h3>
                <p className="mt-1 text-[13px] text-white/80">8–12 weeks to optimal levels</p>
                <span className="mt-3 inline-flex rounded-full border border-white/40 px-3 py-1 text-[12px] font-medium">Why this matters</span>

                <p className="mt-6 text-[17px] font-semibold">How you might be feeling</p>
                <div className="mt-2 flex flex-wrap gap-2">
                    {symptoms.map((sx) => (
                        <span key={sx} className="rounded-full border border-white/40 px-3 py-1.5 text-[13px] font-medium">{sx}</span>
                    ))}
                </div>

                {affected.length > 0 && (
                    <>
                        <p className="mt-6 text-[17px] font-semibold">Affected biomarkers</p>
                        <div className="mt-2 space-y-2">
                            {affected.map((b, i) => {
                                const meta = statusMeta(b.status);
                                return (
                                    <div key={(b.id || b.name) + i} className="flex items-center justify-between gap-3 rounded-2xl bg-white/10 px-4 py-3">
                                        <p className="text-[14px] font-medium">{b.name}</p>
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1.5 text-[12px] font-medium">
                                                <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                                                {meta.label}
                                            </span>
                                            <MiniSlider b={b} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

/* ── protocol checklist ─────────────────────────────────────────────────── */

function localToday() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function protocolThumb(item) {
    const name = String(item?.productName || "").toLowerCase();
    if (/meal|eat|food|diet/.test(name)) return "/assets/product-2.png";
    if (/routine|sleep|movement|stress/.test(name)) return "/assets/profile1.png";
    return "/assets/sample-medicine.png";
}

function ProtocolChecklist({ items, planReady }) {
    const list = Array.isArray(items) ? items : [];
    const [taken, setTaken] = useState(new Set());

    const fetchAdherence = useCallback(async () => {
        if (!Cookie.get("authToken")) return;
        try {
            const res = await actionPlanAPI.getAdherence(localToday());
            const data = res?.data || res;
            setTaken(new Set(Array.isArray(data?.taken) ? data.taken : []));
        } catch { /* keep state */ }
    }, []);
    useEffect(() => { fetchAdherence(); }, [fetchAdherence]);

    const toggle = async (item) => {
        const key = item?.productName;
        if (!key) return;
        setTaken((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
        try {
            const res = await actionPlanAPI.toggleAdherence(key, localToday());
            const data = res?.data || res;
            if (Array.isArray(data?.taken)) setTaken(new Set(data.taken));
        } catch {
            setTaken((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
        }
    };

    return (
        <div className={`${CARD} p-5 lg:p-6`}>
            <h3 className="text-base font-semibold tracking-tight text-blue">Your Protocol</h3>
            <p className="mt-0.5 text-sm text-secondary">Today&apos;s actions</p>

            {list.length > 0 ? (
                <div className="relative mt-4">
                    {list.map((it, i) => {
                        const key = it.productName || String(i);
                        const done = taken.has(it.productName);
                        return (
                            <div key={key + i} className="relative flex items-start gap-3 pb-3 last:pb-0">
                                {i < list.length - 1 && <span className="absolute left-[13px] top-8 h-[calc(100%-16px)] w-px bg-borderColor" />}
                                <button
                                    type="button"
                                    onClick={() => toggle(it)}
                                    aria-label={done ? "Mark not done" : "Mark done"}
                                    className={`z-10 mt-2.5 grid h-[26px] w-[26px] shrink-0 place-items-center rounded-md border-2 transition ${done ? "border-emerald-500 bg-emerald-500 text-white" : "border-borderColor bg-white text-transparent hover:border-secondary"}`}
                                >
                                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                </button>
                                <Link href="/protocol" className="group flex flex-1 items-center gap-3 rounded-2xl border border-borderColor bg-white p-2.5 transition hover:border-blue/20">
                                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-pageBackground">
                                        <Image src={protocolThumb(it)} alt="" fill className="object-contain p-1" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium leading-snug text-blue">{it.productName}</p>
                                        {it.dosing && <p className="mt-0.5 truncate text-xs text-secondary">{it.dosing}</p>}
                                    </div>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-secondary transition group-hover:translate-x-0.5 group-hover:text-blue" />
                                </Link>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="mt-4 text-sm leading-relaxed text-secondary">
                    {planReady ? "Your protocol is ready — open it to see today's actions." : "Your protocol actions will appear here once your plan is ready."}
                </p>
            )}
        </div>
    );
}

/* ── timeline ───────────────────────────────────────────────────────────── */

const TIMELINE_MACROS = [
    { key: "calories", label: "Calories", unit: "", Icon: Flame, color: "#EF1360" },
    { key: "fiberG", label: "Fiber", unit: "g", Icon: Leaf, color: "#34C759" },
    { key: "carbsG", label: "Carbs", unit: "g", Icon: Wheat, color: "#DE8E4E" },
    { key: "proteinG", label: "Protein", unit: "g", Icon: Beef, color: "#DD5F5F" },
    { key: "fatG", label: "Fat", unit: "g", Icon: Droplet, color: "#548ADE" },
    { key: "sugarG", label: "Sugar", unit: "g", Icon: Candy, color: "#4F378B" },
];

function TimelineSection({ userId, router }) {
    const [entries, setEntries] = useState([]);
    const [macros, setMacros] = useState(null);

    useEffect(() => {
        if (!userId) return;
        const date = localToday();
        let active = true;
        timelineAPI.get(userId, date).then((r) => { if (active) setEntries(r?.data?.entries || r?.data || []); }).catch(() => {});
        mealAPI.summary(userId, date).then((r) => { if (active) setMacros(r?.data || null); }).catch(() => {});
        return () => { active = false; };
    }, [userId]);

    const list = Array.isArray(entries) ? entries : [];
    const hasMeals = list.some((e) => e.type === "meal");

    return (
        <div className={`${CARD} p-5 lg:p-6`}>
            <h3 className="text-base font-semibold tracking-tight text-blue">Timeline</h3>
            <ActionButtons actions={[{ label: "Log Food", href: "/meals/new" }, { label: "Add an activity", href: "/activities/new" }]} />

            {list.length > 0 && (
                <div className="mt-4 space-y-3">
                    {list.map((entry) => {
                        const id = entry.id || entry._id;
                        if (entry.type === "meal") return <TimelineMealCard key={id} entry={entry} onClick={() => id && router.push(`/meals/${id}/score`)} />;
                        if (entry.type === "activity") return <TimelineActivityCard key={id} entry={entry} onClick={() => id && router.push(`/activities/${id}`)} />;
                        return null;
                    })}
                </div>
            )}

            {hasMeals && macros && (
                <div className="mt-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Macro Split</p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                        {TIMELINE_MACROS.map(({ key, label, unit, Icon, color }) => (
                            <div key={key} className="flex items-center gap-2 rounded-xl border border-borderColor p-3">
                                <Icon size={16} color={color} className="shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[10px] font-medium uppercase tracking-wide text-secondary">{label}</p>
                                    <p className="text-[15px] font-semibold leading-none text-blue">{Math.round(macros[key] || 0)}{unit}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── live better ────────────────────────────────────────────────────────── */

function LiveBetterCard() {
    return (
        <div className="flex flex-col gap-3">
            <h3 className="px-1 text-[17px] font-semibold tracking-tight text-blue">Live better, longer together</h3>
            <Link href="/invite" className="group relative flex min-h-[120px] items-center overflow-hidden rounded-3xl p-5 text-white">
                <Image src="/assets/refer.png" alt="" fill className="absolute inset-0 object-cover" />
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative z-10 flex w-full items-center justify-between gap-3">
                    <p className="max-w-[75%] text-[18px] font-semibold leading-snug">Review family health insights from your intake</p>
                    <ChevronRight className="h-6 w-6 shrink-0" />
                </div>
            </Link>
            <Link href="/invite" className="group relative flex min-h-[120px] items-center overflow-hidden rounded-3xl p-5 text-white">
                <Image src="/assets/refer-friend.png" alt="" fill className="absolute inset-0 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600/80 to-orange-500/40" />
                <div className="relative z-10 flex w-full items-center justify-between gap-3">
                    <div>
                        <p className="text-[15px] font-medium leading-snug">Refer your friends and<br />earn ₹299</p>
                        <p className="mt-2 text-[13px] text-white/85">Get ₹299 each</p>
                    </div>
                    <span className="shrink-0 rounded-lg bg-white px-4 py-2 text-[13px] font-semibold text-blue">Earn ₹299</span>
                </div>
            </Link>
        </div>
    );
}
