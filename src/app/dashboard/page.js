"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import InsightsDashboard from "@/components/home/InsightsDashboard";
import { BodyModelClient } from "@/components/data/BodyModelClient";
import { useState, useEffect, useCallback, useRef } from "react";
import { transformPanel, computeSummary, extractScores, humanizeCategory } from "@/utils/biomarkerAdapter";
import { biomarkerAPI, userAPI, actionPlanAPI } from "@/services/api";
import { ArrowUpRight, ChevronRight, X, Lock, Fingerprint, Upload, ClipboardList } from "lucide-react";

// Normalize any stored value ("Male"/"Female"/"female"/…) to the 3D model key.
const normalizeSex = (v) => (String(v || "").toLowerCase().startsWith("f") ? "female" : "male");

// Coerce a score/bio-age (which may be an object like { phenoAge }) to a finite
// number, or null when it isn't available yet.
const numOrNull = (v) => {
    const n = v && typeof v === "object" ? v.phenoAge : v;
    return Number.isFinite(Number(n)) ? Number(n) : null;
};

// Format a date into { day: "22", mon: "MAR" } for the timeline rows.
const evDate = (d) => {
    const dt = d ? new Date(d) : null;
    if (!dt || isNaN(dt.getTime())) return { day: "--", mon: "" };
    return { day: String(dt.getDate()).padStart(2, "0"), mon: dt.toLocaleDateString("en-US", { month: "short" }).toUpperCase() };
};

const CARD = "rounded-3xl border border-borderColor bg-white";

export default function Dashboard() {
    const { user, token, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    // Prefer first name, then full name's first word, then the email handle.
    const userName =
        user?.firstName ||
        user?.name?.split(" ")?.[0] ||
        user?.fullName?.split(" ")?.[0] ||
        user?.email?.split("@")?.[0] ||
        "there";
    const userId = user?._id || user?.id;
    const sex = normalizeSex(user?.biologicalSex);

    useEffect(() => {
        if (!authLoading && !token) {
            router.push("/login");
        }
    }, [authLoading, token, router]);

    // ── Real blood-report data ────────────────────────────────────────────────
    const [reports, setReports] = useState([]);
    const [reportsLoading, setReportsLoading] = useState(true);

    const fetchReports = useCallback(async ({ silent = false } = {}) => {
        if (!userId) return;
        try {
            if (!silent) setReportsLoading(true);
            const response = await userAPI.getBloodReports(userId);
            setReports(response?.data || []);
        } catch (err) {
            console.error("Failed to fetch blood reports:", err);
            if (!silent) setReports([]);
        } finally {
            if (!silent) setReportsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const isProcessing = (r) => r?.status === "uploaded" || r?.status === "analyzing";
    const processingReport = reports.find(isProcessing);
    const readyReport = reports.find((r) => !r?.status || r?.status === "ready");
    const hasAnyReport = reports.length > 0;

    // ── Latest action plan → scores for the home header cards ─────────────────
    const [plan, setPlan] = useState(null);
    const [planLoading, setPlanLoading] = useState(true);
    const [homeTab, setHomeTab] = useState("timeline"); // timeline | twin

    useEffect(() => {
        let active = true;
        actionPlanAPI
            .getLatest()
            .then((res) => { if (active) setPlan(res?.data || res || null); })
            .catch(() => { if (active) setPlan(null); })
            .finally(() => { if (active) setPlanLoading(false); });
        return () => { active = false; };
    }, []);

    // ── Real-time: poll while a plan is generating or a report is processing ──
    const processingCount = reports.filter(isProcessing).length;
    useEffect(() => {
        const planGenerating = plan?.status === "generating" || plan?.status === "pending";
        if (!planGenerating && processingCount === 0) return undefined;
        const id = setInterval(() => {
            fetchReports({ silent: true });
            actionPlanAPI.getLatest().then((res) => setPlan(res?.data || res || null)).catch(() => {});
        }, 8000);
        return () => clearInterval(id);
    }, [plan?.status, processingCount, fetchReports]);

    // ── Insights branch (only when a report is genuinely ready) ───────────────
    const forcedView = searchParams.get("view");
    const showInsightsDashboard = forcedView === "insights";
    const actionPlanHref = userId ? `/action-plan/${userId}` : "/dashboard";

    const [insightsData, setInsightsData] = useState(null);
    const [insightsLoading, setInsightsLoading] = useState(false);

    const fetchInsightsData = useCallback(async () => {
        try {
            setInsightsLoading(true);
            const [response, trendsRes] = await Promise.all([
                biomarkerAPI.panel(),
                biomarkerAPI.trends().catch(() => null),
            ]);
            const data = response?.data || response;
            if (!data?.biomarkerPanel) {
                setInsightsData(null);
                return;
            }
            const panel = transformPanel(data.biomarkerPanel);
            const trends = trendsRes?.data?.trends || {};
            const biomarkers = panel.map((bm) => {
                const history = trends[bm.id];
                if (history && history.length >= 1) {
                    return { ...bm, trend: history.map((p) => p.value) };
                }
                return bm;
            });
            const summary = computeSummary(biomarkers);
            const scores = extractScores(data.scores);

            setInsightsData({
                biomarkers,
                summary,
                scores,
                reportDate: data.reportDate,
                keyInsight: {
                    tag: "Top health priority:",
                    message: scores.categoryGrades
                        ? `Focus on ${humanizeCategory(Object.entries(scores.categoryGrades).sort(([, a], [, b]) => String(a).localeCompare(String(b))).pop()?.[0]) || "overall health"}`
                        : "Review your biomarker results",
                },
                timelineActions: [
                    { label: "Log Food", variant: "solid" },
                    { label: "Add an activity", variant: "solid" },
                ],
                liveBetter: {
                    title: "Live better, longer together",
                    cards: [
                        {
                            image: "/assets/refer.png",
                            text: "Review family health insights from your intake",
                            action: { type: "chevron" },
                        },
                        {
                            image: "/assets/refer-friend.png",
                            textLines: ["Refer your friends and", "earn $299"],
                            subtext: "Get $299 each",
                            action: { type: "button", label: "Earn $299" },
                        },
                    ],
                },
            });
        } catch (err) {
            console.error("Failed to fetch insights:", err);
        } finally {
            setInsightsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (showInsightsDashboard) {
            fetchInsightsData();
        }
    }, [showInsightsDashboard, fetchInsightsData]);

    if (showInsightsDashboard) {
        if (insightsLoading) {
            return (
                <div className="min-h-screen bg-pageBackground flex items-center justify-center">
                    <p className="text-gray-500">Loading your health insights...</p>
                </div>
            );
        }
        const fallbackData = {
            biomarkers: [],
            summary: { total: 0, optimal: 0, normal: 0, outOfRange: 0 },
            keyInsight: { tag: "", message: "" },
            timelineActions: [],
            liveBetter: { title: "", cards: [] },
        };
        return (
            <InsightsDashboard
                userName={userName}
                data={insightsData || fallbackData}
                scores={insightsData?.scores || {}}
                reportDate={insightsData?.reportDate}
                actionPlanHref={actionPlanHref}
                userId={userId}
            />
        );
    }

    // ── Derived score values for the header cards ─────────────────────────────
    const cyborgScore = numOrNull(plan?.healthReport?.cyborgScore);
    const bioAge = numOrNull(plan?.healthReport?.bioAge);
    const planReady = plan?.status === "ready" || plan?.status === "approved";
    const greeting = (() => {
        const h = new Date().getHours();
        return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    })();
    const initials = (userName || "U").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

    // ── Real timeline events (the user's actual blood reports) ────────────────
    const reportEvents = [...reports]
        .sort((a, b) => new Date(b.reportDate || b.createdAt || 0) - new Date(a.reportDate || a.createdAt || 0))
        .slice(0, 5)
        .map((r) => ({
            id: r._id,
            date: r.reportDate || r.createdAt || r.uploadedAt,
            title: r.filename || r.fileName || "Blood Panel",
            ready: !r.status || r.status === "ready",
        }));

    // ── Real onboarding next-steps (only what's genuinely still incomplete) ───
    const onboardingSteps = [];
    if (!user?.dateOfBirth) onboardingSteps.push({ key: "dob", Icon: Fingerprint, title: "Add your date of birth", desc: "Unlock your biological age", href: "/profile" });
    if (reports.length === 0) onboardingSteps.push({ key: "report", Icon: Upload, title: "Upload a blood report", desc: "Get your Cyborg Score and a personalized protocol", href: "/data?tab=records" });
    if (!user?.onboardingCompleted) onboardingSteps.push({ key: "intake", Icon: ClipboardList, title: "Complete your health intake", desc: "Answer a few questions to personalize your plan", href: "/onboarding" });

    // ── Digital Twin: the clean 3D-body home (no purple header, exactly the
    //    original dashboard) ─────────────────────────────────────────────────
    if (homeTab === "twin") {
        return (
            <div className="min-h-screen bg-pageBackground font-inter pb-28 lg:pb-12">
                <div className="mx-auto w-full max-w-[1180px] px-4 pt-4 lg:px-8 lg:pt-6">
                    <HomeTabs active={homeTab} onChange={setHomeTab} />

                    {/* Mobile-only welcome header (desktop shows it inside the twin card). */}
                    <div className="mb-5 mt-4 pr-20 lg:hidden">
                        <h1 className="text-[26px] font-semibold leading-[1.15] tracking-tight text-blue">
                            Welcome back,<br />{userName}
                        </h1>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                        <div className="hidden lg:block">
                            <WelcomeTwinCard firstName={userName} sex={sex} router={router} />
                        </div>
                        <div className="flex flex-col gap-4">
                            <BloodReportCard
                                loading={reportsLoading}
                                hasAnyReport={hasAnyReport}
                                processingReport={processingReport}
                                readyReport={readyReport}
                            />
                            <TestsRecordsCard />
                            <AppPromoCard />
                            <ActionItemsCard />
                            <LiveBetterCard />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Default: Timeline home (purple header + swipeable score cards) ─────────
    return (
        <div className="min-h-screen bg-pageBackground font-inter pb-28 lg:pb-12">
            <div className="mx-auto w-full max-w-[680px] px-3 pt-3 sm:px-4 sm:pt-4 lg:px-6 lg:pt-6">
                <PurpleHeader
                    greeting={greeting}
                    name={userName}
                    initials={initials}
                    cyborgScore={cyborgScore}
                    bioAge={bioAge}
                    planReady={planReady}
                    loading={planLoading}
                    actionPlanHref="/protocol"
                />

                <HomeTabs active={homeTab} onChange={setHomeTab} />

                <TimelineContent
                    loading={reportsLoading}
                    processingReport={processingReport}
                    readyReport={readyReport}
                    events={reportEvents}
                    onboardingSteps={onboardingSteps}
                />
            </div>
        </div>
    );
}

/* ═══════════════════════ Timeline home: purple header ═══════════════════════ */

function PurpleHeader({ greeting, name, initials, cyborgScore, bioAge, planReady, loading, actionPlanHref }) {
    return (
        <section
            className="relative overflow-hidden rounded-3xl px-4 pb-6 pt-6 shadow-[0_14px_44px_rgba(60,25,130,0.28)] lg:px-7 lg:pt-7"
            style={{ background: "radial-gradient(135% 125% at 18% 0%, #7b46e0 0%, #4a268f 46%, #1d1046 100%)" }}
        >
            {/* soft glow accents */}
            <div className="pointer-events-none absolute -left-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -right-12 top-10 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl" />

            <div className="relative flex items-start justify-between">
                <div>
                    <p className="text-[15px] leading-tight text-white/75">{greeting} {name},</p>
                    <h1 className="mt-0.5 text-[19px] font-semibold tracking-tight text-white">Welcome to CYBORG</h1>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 text-[13px] font-semibold text-white ring-1 ring-white/20">
                    {initials}
                </span>
            </div>

            <ScoreCarousel
                cyborgScore={cyborgScore}
                bioAge={bioAge}
                planReady={planReady}
                loading={loading}
                actionPlanHref={actionPlanHref}
            />
        </section>
    );
}

function ScoreCarousel({ cyborgScore, bioAge, planReady, loading, actionPlanHref }) {
    const ref = useRef(null);
    const [active, setActive] = useState(0);

    const onScroll = () => {
        const el = ref.current;
        if (!el) return;
        setActive(Math.round(el.scrollLeft / el.clientWidth));
    };
    const goTo = (i) => {
        const el = ref.current;
        if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    };

    const cards = [
        { key: "score", type: "value", title: "Cyborg score", value: cyborgScore != null ? String(Math.round(cyborgScore)) : null, ready: cyborgScore != null, sub: cyborgScore != null ? "out of 100" : "Awaiting lab results" },
        { key: "bioage", type: "value", title: "Biological Age", value: bioAge != null ? bioAge.toFixed(1) : null, ready: bioAge != null, sub: bioAge != null ? "years" : "Awaiting lab results" },
        { key: "plan", type: "plan", title: "Your Action Plan", ready: planReady, sub: planReady ? "Tap to view your protocol" : "Awaiting lab results" },
    ];

    return (
        <div className="relative mt-5">
            <div
                ref={ref}
                onScroll={onScroll}
                className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide"
            >
                {cards.map((c) => (
                    <div key={c.key} className="min-w-full shrink-0 snap-start">
                        <ScoreCard card={c} loading={loading} actionPlanHref={actionPlanHref} />
                    </div>
                ))}
            </div>

            {/* pagination dots */}
            <div className="mt-3 flex items-center justify-center gap-1.5">
                {cards.map((_, i) => (
                    <button
                        key={i}
                        type="button"
                        aria-label={`Go to card ${i + 1}`}
                        onClick={() => goTo(i)}
                        className={`h-1.5 rounded-full transition-all ${i === active ? "w-5 bg-white" : "w-1.5 bg-white/35"}`}
                    />
                ))}
            </div>
        </div>
    );
}

function ScoreCard({ card, loading, actionPlanHref }) {
    const Dashes = () => (
        <span className="select-none text-[40px] font-semibold leading-none tracking-[0.12em] text-white/45">— — —</span>
    );

    return (
        <div className="rounded-2xl bg-white/10 px-4 py-4 ring-1 ring-white/15 backdrop-blur-md">
            <div className="flex items-center justify-between">
                <p className="text-[13px] font-medium text-white/85">{card.title}</p>
                {!card.ready && <Lock className="h-3.5 w-3.5 text-white/45" />}
            </div>

            <div className="flex min-h-[96px] flex-col items-center justify-center gap-2 py-2">
                {loading ? (
                    <span className="h-9 w-24 animate-pulse rounded-lg bg-white/15" />
                ) : card.type === "plan" ? (
                    card.ready ? (
                        <Link
                            href={actionPlanHref}
                            className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#3f1f8f] transition hover:bg-white/90"
                        >
                            View Action Plan
                        </Link>
                    ) : (
                        <>
                            <span className="rounded-full bg-white/12 px-3 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/15">
                                Action plan coming soon
                            </span>
                            <Dashes />
                        </>
                    )
                ) : card.value != null ? (
                    <span className="text-[46px] font-semibold leading-none text-white">{card.value}</span>
                ) : (
                    <Dashes />
                )}
            </div>

            <p className="text-center text-[12px] text-white/55">{card.sub}</p>
        </div>
    );
}

/* ═══════════════════════ Timeline / Digital Twin tabs ═══════════════════════ */

function HomeTabs({ active, onChange }) {
    const tabs = [
        ["timeline", "Timeline", false],
        ["twin", "Digital Twin", true],
    ];
    return (
        <div className="mt-5 flex items-center gap-6 border-b border-borderColor px-1">
            {tabs.map(([k, label, locked]) => (
                <button
                    key={k}
                    type="button"
                    onClick={() => onChange(k)}
                    className={`-mb-px flex items-center gap-1.5 border-b-2 pb-3 text-sm font-medium transition-colors ${
                        active === k ? "border-blue text-blue" : "border-transparent text-secondary hover:text-blue"
                    }`}
                >
                    {locked && <Lock className="h-3.5 w-3.5" />}
                    {label}
                </button>
            ))}
        </div>
    );
}

/* ═══════════════════════ Timeline content ═══════════════════════ */

function TimelineContent({ loading, processingReport, readyReport, events, onboardingSteps }) {
    return (
        <div className="mt-4 flex flex-col gap-4">
            <UpcomingCard processing={!!processingReport} />
            <BloodStatusCard loading={loading} processingReport={processingReport} readyReport={readyReport} />
            <TimelineEventsCard events={events} />
            <FinishOnboardingCard steps={onboardingSteps} />
            <LiveBetterCard />
        </div>
    );
}

function UpcomingCard({ processing }) {
    const today = new Date();
    const days = Array.from({ length: 14 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        return d;
    });

    return (
        <div className="rounded-3xl bg-[#1b1b1d] p-5 text-white">
            <h3 className="text-lg font-semibold">Upcoming</h3>
            <p className="mt-0.5 text-sm text-white/45">
                {processing ? "Results processing — check back soon" : "in the next 2 weeks"}
            </p>
            <div className="mt-6 grid grid-cols-7 gap-y-3">
                {days.map((d, i) => (
                    <div key={i} className="flex justify-center">
                        <span
                            className={`grid h-9 w-9 place-items-center rounded-full text-sm font-medium ${
                                i === 0 ? "bg-white text-black" : "bg-white/10 text-white/80"
                            }`}
                        >
                            {d.getDate()}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function BloodStatusCard({ loading, processingReport, readyReport }) {
    const stages = ["Scheduled", "Processing", "Results Ready"];
    let stage = 0;
    let title = "Your blood draw is being scheduled";
    let body = "Your results will be uploaded to your dashboard once complete";
    if (!loading && readyReport) {
        stage = 2;
        title = "Your results are ready";
        body = "View your full biomarker breakdown and personalized insights.";
    } else if (!loading && processingReport) {
        stage = 1;
        title = "Your results are processing";
        body = "We're analyzing your sample — we'll notify you the moment it's done.";
    }
    const pct = ((stage + 1) / stages.length) * 100;

    return (
        <Link href="/data" className={`group block ${CARD} p-5 transition hover:border-blue/20`}>
            <h3 className="text-base font-semibold tracking-tight text-blue">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-secondary">{body}</p>
            <div className="mt-5 flex items-center justify-between text-xs font-medium text-secondary">
                {stages.map((s, i) => (
                    <span key={s} className={i <= stage ? "text-blue" : ""}>{s}</span>
                ))}
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-pageBackground">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
        </Link>
    );
}

function TimelineEventsCard({ events }) {
    if (!events?.length) return null;
    return (
        <div className={`${CARD} overflow-hidden`}>
            <div className="divide-y divide-borderColor">
                {events.map((e) => {
                    const d = evDate(e.date);
                    return (
                        <Link key={e.id} href="/data" className="group flex items-center gap-3 px-4 py-4 transition hover:bg-pageBackground/60">
                            <div className="flex w-10 shrink-0 flex-col items-center">
                                <span className="text-[15px] font-semibold leading-none text-blue">{d.day}</span>
                                <span className="mt-0.5 text-[11px] uppercase tracking-wide text-secondary">{d.mon}</span>
                            </div>
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-orange-50">
                                <Image src="/assets/black-icons/vial.svg" alt="" width={16} height={16} className="opacity-80" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-blue">{e.title}</p>
                                <p className="mt-0.5 text-xs text-secondary">{e.ready ? "Results ready" : "Processing"}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 shrink-0 text-secondary transition group-hover:translate-x-0.5 group-hover:text-blue" />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

function FinishOnboardingCard({ steps }) {
    if (!steps?.length) return null;
    return (
        <div>
            <h3 className="mb-3 px-1 text-base font-semibold tracking-tight text-blue">
                Finish onboarding to get most out of Cyborg
            </h3>
            <div className={`${CARD} overflow-hidden`}>
                <div className="divide-y divide-borderColor">
                    {steps.map(({ key, Icon, title, desc, href }) => (
                        <Link key={key} href={href} className="group flex items-center gap-3 px-4 py-4 transition hover:bg-pageBackground/60">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#ece7f6] text-primary">
                                <Icon className="h-[18px] w-[18px]" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-blue">{title}</p>
                                <p className="mt-0.5 text-xs leading-relaxed text-secondary">{desc}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 shrink-0 text-secondary transition group-hover:translate-x-0.5 group-hover:text-blue" />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════ Digital Twin (3D body) home ═══════════════════════ */

function WelcomeTwinCard({ firstName, sex, router }) {
    const [query, setQuery] = useState("");

    const goConcierge = (e) => {
        e.preventDefault();
        const q = query.trim();
        router.push(q ? `/concierge?q=${encodeURIComponent(q)}` : "/concierge");
    };

    return (
        <div className={`relative flex flex-col overflow-hidden ${CARD} min-h-[460px] lg:min-h-[560px]`}>
            <div className="flex items-start justify-between px-6 pt-6 lg:px-8 lg:pt-8">
                <h1 className="text-2xl font-semibold tracking-tight text-blue/30 lg:text-[28px]">
                    Welcome, {firstName}
                </h1>
                <Link
                    href="/data"
                    aria-label="Open your data"
                    className="rounded-full p-1.5 text-secondary transition hover:bg-pageBackground hover:text-blue"
                >
                    <ArrowUpRight className="h-5 w-5" />
                </Link>
            </div>

            <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-0">
                    <BodyModelClient sex={sex} className="h-full w-full" />
                </div>
            </div>

            <form onSubmit={goConcierge} className="px-4 pb-4 lg:px-6 lg:pb-6">
                <div className="flex items-center gap-3 rounded-full border border-borderColor bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask anything…"
                        className="min-w-0 flex-1 bg-transparent text-sm text-blue placeholder:text-secondary focus:outline-none"
                    />
                    <button
                        type="submit"
                        aria-label="Ask Cyborg AI"
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black text-white transition hover:opacity-90"
                    >
                        <ArrowUpRight className="h-4 w-4" />
                    </button>
                </div>
            </form>
        </div>
    );
}

function BloodReportCard({ loading, hasAnyReport, processingReport, readyReport }) {
    let title;
    let body;
    const href = "/data";
    let cta = null;

    if (loading) {
        title = "Loading your results…";
        body = "We're fetching the status of your latest blood report.";
    } else if (processingReport) {
        title = "Results are processing";
        body = "Your latest blood report is being analyzed. We'll update your digital twin and notify you the moment results are ready.";
        cta = "Track your current tests";
    } else if (readyReport) {
        title = "Results ready";
        body = "Your latest biomarker results are in. View your full breakdown and personalized insights.";
        cta = "View your results";
    } else {
        title = "Upload a report";
        body = "Upload a blood report to unlock your biomarker breakdown and bring your digital twin to life.";
        cta = "Upload a report";
    }

    const showProcessingTag = !loading && processingReport;
    const showReadyTag = !loading && !processingReport && readyReport;

    return (
        <Link href={href} className={`group block ${CARD} p-5 transition hover:border-blue/20 lg:p-6`}>
            <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                    {(showProcessingTag || showReadyTag) && (
                        <p className="mb-2 text-xs font-medium text-orange-500">
                            {showProcessingTag ? "Blood test in progress" : "Blood test completed"}
                        </p>
                    )}
                    <h2 className="text-lg font-semibold tracking-tight text-blue lg:text-xl">{title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-secondary">{body}</p>
                    {cta && (
                        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue group-hover:underline">
                            {cta}
                            <ChevronRight className="h-4 w-4" />
                        </span>
                    )}
                </div>
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange-50">
                    <Image src="/assets/black-icons/vial.svg" alt="Blood vial" width={22} height={22} className="opacity-80" />
                </div>
            </div>
        </Link>
    );
}

function TestsRecordsCard() {
    return (
        <Link href="/data" className={`group flex items-center justify-between gap-4 ${CARD} p-5 transition hover:border-blue/20 lg:p-6`}>
            <div className="flex items-center gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange-50">
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                </span>
                <div>
                    <p className="text-sm font-medium text-blue">Tests &amp; records</p>
                    <p className="mt-0.5 text-sm text-secondary">Track your current tests</p>
                </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-secondary transition group-hover:translate-x-0.5 group-hover:text-blue" />
        </Link>
    );
}

function AppPromoCard() {
    const [dismissed, setDismissed] = useState(false);
    if (dismissed) return null;
    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-400 via-orange-500 to-orange-700 p-5 text-white lg:p-6">
            <button
                type="button"
                onClick={() => setDismissed(true)}
                aria-label="Dismiss"
                className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
            >
                <X className="h-4 w-4" />
            </button>
            <div className="flex items-center justify-between gap-4">
                <div className="max-w-[70%]">
                    <h3 className="text-lg font-semibold tracking-tight lg:text-xl">Get the Cyborg app</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/90">
                        All your data in your pocket, sync wearables and text Cyborg AI anytime.
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white">
                        App Store
                    </span>
                </div>
            </div>
        </div>
    );
}

function ActionItemsCard() {
    return (
        <div className={`${CARD} p-5 lg:p-6`}>
            <h3 className="text-base font-semibold tracking-tight text-blue">Action Items</h3>
            <Link
                href="/settings?tab=integrations"
                className="group mt-4 flex items-center gap-4 border-t border-borderColor pt-4"
            >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pageBackground text-base">
                    ⌚
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-blue">Connect your wearables</p>
                    <p className="mt-1 text-sm leading-relaxed text-secondary">
                        Connect Apple Health, Oura, Fitbit &amp; more to get personalized insights from your wearable data.
                    </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-secondary transition group-hover:translate-x-0.5 group-hover:text-blue" />
            </Link>
        </div>
    );
}

function LiveBetterCard() {
    const cards = [
        {
            image: "/assets/refer.png",
            lines: ["Review family health insights", "from your intake"],
        },
        {
            image: "/assets/refer-friend.png",
            eyebrow: "Give the gift of health.",
            lines: ["Refer your friends and earn $299"],
        },
    ];

    return (
        <div className={`${CARD} p-5 lg:p-6`}>
            <h3 className="text-base font-semibold tracking-tight text-blue">Live better, together</h3>
            <div className="mt-4 flex flex-col gap-3">
                {cards.map((c, i) => (
                    <Link
                        key={i}
                        href="/invite"
                        className="group relative flex items-center justify-between overflow-hidden rounded-2xl p-4 text-white"
                    >
                        <Image src={c.image} alt="" fill className="absolute inset-0 object-cover" />
                        <div className="absolute inset-0 bg-black/45" />
                        <div className="relative z-10 max-w-[80%]">
                            {c.eyebrow && <p className="text-xs text-white/80">{c.eyebrow}</p>}
                            {c.lines.map((line, j) => (
                                <p key={j} className="text-sm font-medium leading-snug">{line}</p>
                            ))}
                        </div>
                        <ChevronRight className="relative z-10 h-5 w-5 shrink-0 transition group-hover:translate-x-0.5" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
