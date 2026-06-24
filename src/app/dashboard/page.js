"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import InsightsDashboard from "@/components/home/InsightsDashboard";
import { BodyModelClient } from "@/components/data/BodyModelClient";
import { useState, useEffect, useCallback } from "react";
import { transformPanel, computeSummary, extractScores, humanizeCategory } from "@/utils/biomarkerAdapter";
import { biomarkerAPI, userAPI } from "@/services/api";
import { ArrowUpRight, ChevronRight, X } from "lucide-react";

// Normalize any stored value ("Male"/"Female"/"female"/…) to the 3D model key.
const normalizeSex = (v) => (String(v || "").toLowerCase().startsWith("f") ? "female" : "male");

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

    const fetchReports = useCallback(async () => {
        if (!userId) return;
        try {
            setReportsLoading(true);
            const response = await userAPI.getBloodReports(userId);
            setReports(response?.data || []);
        } catch (err) {
            console.error("Failed to fetch blood reports:", err);
            setReports([]);
        } finally {
            setReportsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const isProcessing = (r) => r?.status === "uploaded" || r?.status === "analyzing";
    const processingReport = reports.find(isProcessing);
    const readyReport = reports.find((r) => !r?.status || r?.status === "ready");
    const hasAnyReport = reports.length > 0;

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
                            textLines: ["Refer your friends and", "earn $50"],
                            subtext: "Get $50 each",
                            action: { type: "button", label: "Earn $50" },
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

    // ── Default: Superpower-style home (2-col desktop, stacked mobile) ─────────
    return (
        <div className="min-h-screen bg-pageBackground font-inter pb-24 lg:pb-12">
            <div className="mx-auto w-full max-w-[1180px] px-4 pt-6 lg:px-8 lg:pt-8">
                {/* Mobile-only welcome header (desktop shows it inside the twin card).
                    The avatar + bell sit top-right via the floating UserActions. */}
                <div className="mb-5 pr-20 lg:hidden">
                    <h1 className="text-[26px] font-semibold leading-[1.15] tracking-tight text-blue">
                        Welcome back,<br />{userName}
                    </h1>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    {/* LEFT: welcome card with 3D digital twin — desktop only */}
                    <div className="hidden lg:block">
                        <WelcomeTwinCard firstName={userName} sex={sex} router={router} />
                    </div>

                    {/* RIGHT: stacked data-driven cards */}
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

// ─────────────────────────────────────────────────────────────────────────────
function WelcomeTwinCard({ firstName, sex, router }) {
    const [query, setQuery] = useState("");

    const goConcierge = (e) => {
        e.preventDefault();
        const q = query.trim();
        router.push(q ? `/concierge?q=${encodeURIComponent(q)}` : "/concierge");
    };

    return (
        <div className={`relative flex flex-col overflow-hidden ${CARD} min-h-[460px] lg:min-h-[640px]`}>
            {/* Header */}
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

            {/* 3D digital twin */}
            <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-0">
                    <BodyModelClient sex={sex} className="h-full w-full" />
                </div>
            </div>

            {/* Ask anything input pinned at the bottom */}
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

// ─────────────────────────────────────────────────────────────────────────────
function BloodReportCard({ loading, hasAnyReport, processingReport, readyReport }) {
    let title;
    let body;
    let href = "/data";
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

// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
function LiveBetterCard() {
    const cards = [
        {
            image: "/assets/refer.png",
            lines: ["Review family health insights", "from your intake"],
        },
        {
            image: "/assets/refer-friend.png",
            eyebrow: "Give the gift of health.",
            lines: ["Refer your friends and earn $50"],
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
