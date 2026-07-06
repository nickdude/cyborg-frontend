"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import InsightsDashboard from "@/components/home/InsightsDashboard";
import TimelineHome from "@/components/home/TimelineHome";
import { homeScheduledData } from "@/data/homeScheduledData";
import UserActions from "@/components/UserActions";
import ActionButtons from "@/components/home/ActionButtons";
import TimelineMealCard from "@/components/home/TimelineMealCard";
import TimelineActivityCard from "@/components/home/TimelineActivityCard";
import { BodyModelClient } from "@/components/data/BodyModelClient";
import { organKeyForCategory, categoryStatus } from "@/components/data/organStatus";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { transformPanel, computeSummary, extractScores, humanizeCategory } from "@/utils/biomarkerAdapter";
import { biomarkerAPI, userAPI, actionPlanAPI, goalsAPI, mealAPI, timelineAPI } from "@/services/api";
import { ArrowUpRight, ChevronRight, X, Lock, ClipboardList, Check, Droplet, FileText, Stethoscope, FlaskConical, RefreshCw, HeartPulse, Watch, Sparkles } from "lucide-react";

// Normalize any stored value ("Male"/"Female"/"female"/…) to the 3D model key.
const normalizeSex = (v) => (String(v || "").toLowerCase().startsWith("f") ? "female" : "male");

// Coerce a score/bio-age (which may be an object like { phenoAge }) to a finite
// number, or null when it isn't available yet.
const numOrNull = (v) => {
    const n = v && typeof v === "object" ? v.phenoAge : v;
    if (n == null) return null; // guard: Number(null) is 0 — don't render a fake "0"
    const num = Number(n);
    return Number.isFinite(num) ? num : null;
};

// Format a date into { day: "22", mon: "MAR" } for the timeline rows.
const evDate = (d) => {
    const dt = d ? new Date(d) : null;
    if (!dt || isNaN(dt.getTime())) return { day: "--", mon: "" };
    return { day: String(dt.getDate()).padStart(2, "0"), mon: dt.toLocaleDateString("en-US", { month: "short" }).toUpperCase() };
};

const CARD = "rounded-3xl border border-borderColor bg-white";

// Every organ region the twin can paint (a texture exists for each). Used to
// cycle through all systems on the twin before any report is uploaded.
const ALL_ORGANS = [
    "heart", "metabolic", "brain", "liver", "kidney", "thyroid", "immune",
    "inflammation", "sex", "dna", "nutrients", "gut", "skin", "body",
];

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
    const [homeTab, setHomeTab] = useState("twin"); // twin | timeline
    const [goals, setGoals] = useState([]);

    useEffect(() => {
        let active = true;
        goalsAPI
            .list()
            .then((res) => { if (active) setGoals(res?.data || res || []); })
            .catch(() => {});
        return () => { active = false; };
    }, []);

    // Time-based greeting depends on the client clock, so computing it during
    // render would differ between server and browser. Defer it to after mount
    // (empty placeholder during SSR / first client render) to avoid a hydration
    // mismatch.
    const [greeting, setGreeting] = useState("");
    useEffect(() => {
        const h = new Date().getHours();
        setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
    }, []);

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

    // Always-on live refresh (silent) so an approved plan or freshly processed
    // report appears on the home without a manual reload.
    useAutoRefresh(
        useCallback(() => {
            fetchReports({ silent: true });
            actionPlanAPI.getLatest().then((res) => setPlan(res?.data || res || null)).catch(() => {});
        }, [fetchReports]),
        { interval: 15000 }
    );

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
                            textLines: ["Refer your friends and", "earn ₹299"],
                            subtext: "Get ₹299 each",
                            action: { type: "button", label: "Earn ₹299" },
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
        fetchInsightsData();
    }, [fetchInsightsData]);

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
    const initials = (userName || "U").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

    // Chronological age from DOB — used for the "younger than your actual age"
    // line. Never fabricated: null when there's no DOB on file.
    const chronoAge = (() => {
        const dob = user?.dateOfBirth || user?.birthDate || user?.dob;
        if (!dob) return null;
        const d = new Date(dob);
        if (isNaN(d.getTime())) return null;
        const now = new Date();
        let a = now.getFullYear() - d.getFullYear();
        const m = now.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
        return a > 0 && a < 130 ? a : null;
    })();

    // Latest report date → "Last updated" on the digital-twin card.
    const latestReport = [...reports].sort(
        (a, b) => new Date(b.reportDate || b.createdAt || 0) - new Date(a.reportDate || a.createdAt || 0)
    )[0];
    const lastUpdated = latestReport?.reportDate || latestReport?.createdAt || plan?.updatedAt || null;
    const actionPlanUpdated = plan?.updatedAt || plan?.generatedAt || plan?.createdAt || null;

    // Top health priority (highest-priority goal) → Key Insights.
    const topGoal = (() => {
        if (!Array.isArray(goals) || goals.length === 0) return null;
        const rank = { High: 0, high: 0, Medium: 1, medium: 1, Low: 2, low: 2 };
        return [...goals].sort((a, b) => (rank[a.priority] ?? 1) - (rank[b.priority] ?? 1))[0] || null;
    })();

    // Biomarker summary + score (from the panel) and protocol preview for the home.
    const homeScore = insightsData?.scores?.cyborgScore ?? cyborgScore;
    const biomarkerSummary = insightsData?.summary || null;
    const protocolItems = plan?.deduplicatedProtocol || [];

    // The two organs to light up on the digital twin — the user's most-flagged
    // biomarker systems (worst first), each in its status colour. Falls back to a
    // sensible pair so the twin is never blank, even before any report.
    const twinHighlights = (() => {
        // No report yet → cycle through every organ system (all green).
        const allOrgans = ALL_ORGANS.map((organ) => ({ organ, status: "good" }));
        const bms = insightsData?.biomarkers || [];
        if (!bms.length) return allOrgans;
        // Report done → only the 2 most-flagged systems from the biomarkers.
        const byOrgan = new Map();
        for (const b of bms) {
            const organ = organKeyForCategory(b.category || "");
            if (!organ) continue;
            if (!byOrgan.has(organ)) byOrgan.set(organ, []);
            byOrgan.get(organ).push(b);
        }
        const sev = { bad: 0, neutral: 1, good: 2 };
        const organs = [...byOrgan.entries()]
            .map(([organ, items]) => ({ organ, status: categoryStatus(items) }))
            .sort((a, b) => sev[a.status] - sev[b.status])
            .slice(0, 2);
        return organs.length ? organs : allOrgans;
    })();

    // ── Member health journey (drives the home Timeline) ─────────────────────
    // Statuses come from REAL state; the sequence mirrors the product logic:
    // intake → blood panel → action plan → clinician review → follow-up → re-test.
    const addDaysISO = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString(); };
    const sortedReports = [...reports].sort((a, b) => new Date(a.reportDate || a.createdAt || 0) - new Date(b.reportDate || b.createdAt || 0));
    const firstReportDate = sortedReports[0]?.reportDate || sortedReports[0]?.createdAt || null;
    const lastReportDate = sortedReports.at(-1)?.reportDate || sortedReports.at(-1)?.createdAt || null;
    const planDate = plan?.generatedAt || plan?.createdAt || null;

    const journey = [
        { key: "intake", tone: "purple", Icon: ClipboardList, title: "Health intake", img: "/assets/timeline/intake.jpg",
          date: user?.createdAt || null, href: "/onboarding",
          status: user?.onboardingCompleted ? "complete" : "active",
          note: user?.onboardingCompleted ? "Complete" : "Answer a few questions" },
        { key: "blood", tone: "red", Icon: Droplet, title: "Blood Panel", img: "/assets/timeline/custom-panel.png",
          date: firstReportDate, href: "/data?tab=records",
          status: hasAnyReport ? "complete" : "active",
          note: hasAnyReport ? "Complete" : "Upload your first panel" },
        { key: "plan", tone: "purple", Icon: FileText, title: "Your Action Plan", img: "/assets/timeline/roadmap.png",
          date: planDate, href: "/protocol",
          status: planReady ? "active" : "locked",
          note: planReady ? "Tap to open" : "Unlocks after your labs" },
        { key: "review", tone: "blue", Icon: Stethoscope, title: "1-1 Advisory call", img: "/assets/timeline/advisory.png",
          date: planReady && planDate ? addDaysISO(planDate, 7) : null, href: "/consults",
          status: planReady ? "upcoming" : "locked",
          note: "Review your results with a clinician" },
        { key: "retest", tone: "green", Icon: RefreshCw, title: "90-day re-test", img: "/assets/timeline/retest.jpg",
          date: lastReportDate ? addDaysISO(lastReportDate, 90) : null, href: "/data",
          status: "locked", note: "Track your progress" },
    ];
    const journeyDone = journey.filter((m) => m.status === "complete").length;

    // ── Digital Twin: the clean 3D-body home (no purple header, exactly the
    //    original dashboard) ─────────────────────────────────────────────────
    if (homeTab === "twin") {
        return (
            <div className="min-h-screen overflow-x-hidden bg-pageBackground font-inter pb-36 lg:pb-16">
                <div className="lg:hidden"><UserActions /></div>
                <div className="mx-auto w-full max-w-[1180px] px-4 pt-4 lg:px-8 lg:pt-6">
                    <HomeTabs active={homeTab} onChange={setHomeTab} />

                    {/* Mobile-only welcome header (desktop shows it inside the twin card). */}
                    <div className="mb-5 mt-4 pr-20 lg:hidden">
                        <h1 className="text-[26px] font-semibold leading-[1.15] tracking-tight text-blue">
                            Welcome back,<br />{userName}
                        </h1>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                        <div className="hidden lg:block">
                            <WelcomeTwinCard firstName={userName} sex={sex} router={router} highlights={twinHighlights} />
                        </div>
                        <div className="flex min-w-0 flex-col gap-4">
                            <AppPromoCard />
                            <ActionItemsCard />
                            <div className="grid grid-cols-2 gap-4">
                                <CyborgScoreCard score={homeScore} />
                                <BioAgeCard bioAge={bioAge} chronoAge={chronoAge} />
                            </div>
                            <YourBiomarkersCard summary={biomarkerSummary} />
                            <ReviewActionPlanCard planReady={planReady} actionPlanUpdated={actionPlanUpdated} />
                            <HealthBreakdownCard categoryGrades={insightsData?.scores?.categoryGrades} biomarkers={insightsData?.biomarkers} />
                            <HighPriorityCard topGoal={topGoal} biomarkers={insightsData?.biomarkers} />
                            <YourProtocolItemsCard items={protocolItems} planReady={planReady} />
                            <HelpUsKnowYouCard hasReports={hasAnyReport} />
                            <TimelineCard userId={userId} router={router} />
                            <LiveBetterCard />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Default: Timeline home (photo hero + blood-draw feed — matches Figma) ──
    return (
        <div className="font-inter">
            <TimelineHome
                data={homeScheduledData}
                greeting={greeting}
                name={userName}
                initials={initials}
                activeTab={homeTab}
                onTabChange={setHomeTab}
                cyborgScore={cyborgScore}
                bioAge={bioAge}
                planReady={planReady}
                actionPlanHref={actionPlanHref}
                journey={journey}
                processing={!!processingReport}
            />
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

function TimelineContent({ processing, journey, journeyDone }) {
    return (
        <div className="mt-4 flex flex-col gap-5">
            <UpcomingCard processing={processing} journey={journey} />
            <JourneySection journey={journey} done={journeyDone} />
        </div>
    );
}

function UpcomingCard({ processing, journey }) {
    // The 14-day strip is anchored on the current date, which differs between
    // the server and the browser (timezone / clock). Compute it after mount and
    // render stable empty placeholders during SSR to avoid a hydration mismatch.
    const [today, setToday] = useState(null);
    useEffect(() => { setToday(new Date()); }, []);

    const days = today
        ? Array.from({ length: 14 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            return d;
        })
        : Array.from({ length: 14 }, () => null);
    // Mark days in the window that carry an upcoming milestone.
    const marks = new Set();
    if (today) {
        (journey || []).forEach((m) => {
            if (!m.date) return;
            const md = new Date(m.date);
            days.forEach((d, i) => { if (d && d.toDateString() === md.toDateString()) marks.add(i); });
        });
    }

    return (
        <div className="overflow-hidden rounded-3xl bg-[#1b1b1d] text-white">
            <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
            <div className="p-5">
                <h3 className="text-lg font-semibold">Upcoming</h3>
                <p className="mt-0.5 text-sm text-white/45">
                    {processing ? "Results processing — check back soon" : "in the next 2 weeks"}
                </p>
                <div className="mt-6 grid grid-cols-7 gap-y-3">
                    {days.map((d, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                            <span
                                className={`grid h-9 w-9 place-items-center rounded-full text-sm font-medium ${
                                    d && i === 0 ? "bg-white text-black" : "bg-white/10 text-white/80"
                                }`}
                            >
                                {d ? d.getDate() : ""}
                            </span>
                            <span className={`h-1 w-1 rounded-full ${marks.has(i) ? "bg-fuchsia-400" : "bg-transparent"}`} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const MILESTONE_TONE = {
    purple: "bg-[#ece7f6] text-primary",
    red: "bg-red-50 text-red-500",
    blue: "bg-blue/10 text-blue",
    orange: "bg-orange-50 text-orange-500",
    green: "bg-emerald-50 text-emerald-600",
};

function MilestoneCard({ m }) {
    const d = evDate(m.date);
    const Icon = m.Icon;
    // Photo chip per milestone (drop-in replaceable at /assets/timeline/<key>.jpg).
    // Milestones without a photo (e.g. Blood Panel) show their tinted icon instead.
    const PHOTO_KEYS = ["intake", "blood", "plan", "review", "retest"];
    const img = m.img || (PHOTO_KEYS.includes(m.key) ? `/assets/timeline/${m.key}.jpg` : null);
    const clickable = m.status === "complete" || m.status === "active";
    const sub = m.status === "upcoming" && m.date ? `Upcoming · ${d.mon} ${d.day}` : m.note;

    const inner = (
        <>
            <div className="flex w-9 shrink-0 flex-col items-center">
                {m.date ? (
                    <>
                        <span className="text-[15px] font-semibold leading-none text-blue">{d.day}</span>
                        <span className="mt-0.5 text-[11px] uppercase tracking-wide text-secondary">{d.mon}</span>
                    </>
                ) : (
                    <span className="text-[11px] uppercase tracking-wide text-secondary/60">—</span>
                )}
            </div>
            <span className={`relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl ${MILESTONE_TONE[m.tone] || MILESTONE_TONE.purple}`}>
                <Icon className="h-[18px] w-[18px]" />
                {img && (
                    <img
                        src={img}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={(e) => { e.currentTarget.remove(); }}
                    />
                )}
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-blue">{m.title}</p>
                <p className="mt-0.5 text-xs text-secondary">{sub}</p>
            </div>
            {m.status === "complete" ? (
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
            ) : m.status === "active" ? (
                <ChevronRight className="h-5 w-5 shrink-0 text-secondary" />
            ) : (
                <Lock className="h-4 w-4 shrink-0 text-secondary/50" />
            )}
        </>
    );

    const cls = `flex items-center gap-3 rounded-2xl border border-borderColor bg-white px-4 py-3.5 ${
        m.status === "locked" ? "opacity-60" : ""
    } ${clickable ? "transition hover:shadow-md" : ""}`;

    return clickable ? <Link href={m.href} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>;
}

function JourneySection({ journey, done }) {
    const total = journey.length;
    const pct = total ? Math.round((done / total) * 100) : 0;

    return (
        <div>
            <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-secondary">Your journey</h3>
                <span className="text-xs font-medium text-secondary">{done} of {total} milestones complete</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-borderColor">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>

            <div className="mt-4 flex flex-col gap-3">
                {journey.length === 0 ? (
                    <p className="py-8 text-center text-sm text-secondary">Nothing here yet.</p>
                ) : (
                    journey.map((m) => <MilestoneCard key={m.key} m={m} />)
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════ Digital Twin (3D body) home ═══════════════════════ */

function WelcomeTwinCard({ firstName, sex, router, highlights }) {
    const [query, setQuery] = useState("");

    // Alternate the twin between the (up to) two flagged organs, since the model
    // paints one region at a time.
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
        <div className="relative flex min-h-[600px] flex-col overflow-hidden rounded-3xl bg-[#ececef] lg:min-h-[760px]">
            <div className="flex items-start justify-between px-6 pt-6 lg:px-8 lg:pt-8">
                <h1 className="text-2xl font-semibold tracking-tight text-blue/40 lg:text-[28px]">
                    Welcome, {firstName}
                </h1>
                <Link
                    href="/data"
                    aria-label="Open your data"
                    className="rounded-full p-1.5 text-secondary transition hover:bg-white hover:text-blue"
                >
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

// Cyborg score card — purple photo + score slider (matches the /data card).
function CyborgScoreCard({ score }) {
    const val = score != null ? Math.round(score) : null;
    const sPos = Math.min(100, Math.max(0, val ?? 0));
    const status = val == null ? "Awaiting lab results" : val >= 60 ? "On Track" : "Needs attention";
    return (
        <Link
            href="/data"
            className="group relative flex min-h-[200px] min-w-0 flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-[#7b3ff2] via-[#6a27d8] to-[#3f1585] p-5 text-left text-white shadow-sm transition hover:brightness-105"
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/data/score.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" onError={(e) => e.currentTarget.remove()} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-black/5" />
            <div className="relative z-10 flex items-start justify-between">
                <span className="text-[13px] font-medium text-white/85">Cyborg score</span>
                <svg className="h-4 w-4 text-white/70" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div className="relative z-10 mt-auto">
                {val != null ? (
                    <>
                        <div className="flex items-end justify-end text-right">
                            <div>
                                <p className="text-[34px] font-semibold leading-none">{val}</p>
                                <p className="mt-1 text-[13px] text-white/85">{status}</p>
                            </div>
                        </div>
                        <div className="relative mt-4">
                            <div className="h-1 rounded-full bg-white/30"><div className="h-full rounded-full bg-white" style={{ width: `${sPos}%` }} /></div>
                            <div className="absolute -top-[7px]" style={{ left: `${sPos}%`, transform: "translateX(-50%)" }}>
                                <div className="h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-white" />
                            </div>
                            <div className="relative mt-1.5 h-3 text-[10px] text-white/70">
                                <span className="absolute left-0">0</span>
                                <span className="absolute" style={{ left: "60%", transform: "translateX(-50%)" }}>60</span>
                                <span className="absolute" style={{ left: "80%", transform: "translateX(-50%)" }}>80</span>
                                <span className="absolute right-0">100</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <p className="max-w-[22ch] text-[13px] font-medium leading-snug text-white/95">Upload a lab report to see your Cyborg score.</p>
                )}
            </div>
        </Link>
    );
}

// Biological age card — green photo (matches the /data card).
function BioAgeCard({ bioAge, chronoAge }) {
    const hasBio = bioAge != null;
    const delta = hasBio && chronoAge != null ? bioAge - chronoAge : 0; // negative = younger
    const bPos = Math.min(100, Math.max(0, ((delta + 5) / 10) * 100));
    const diffText = chronoAge != null
        ? (chronoAge - bioAge >= 0
            ? `${(chronoAge - bioAge).toFixed(1)} years younger`
            : `${Math.abs(chronoAge - bioAge).toFixed(1)} years older`)
        : "PhenoAge estimate";
    return (
        <Link
            href="/data"
            className="group relative flex min-h-[200px] w-full min-w-0 flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-[#5fd08a] via-[#31b36a] to-[#1a7d46] p-5 text-left text-white shadow-sm transition hover:brightness-105"
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/data/bioage.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" onError={(e) => e.currentTarget.remove()} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/5" />
            <div className="relative z-10 flex items-start justify-between">
                <span className="text-[13px] font-medium text-white/90">Biological age</span>
                <svg className="h-4 w-4 text-white/70" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div className="relative z-10 mt-auto">
                {hasBio ? (
                    <>
                        <div className="flex items-end justify-end text-right">
                            <div>
                                <p className="text-[34px] font-semibold leading-none"><span className="mr-1 align-top text-[14px] font-normal text-white/80">Age</span>{Math.round(bioAge)}</p>
                                <p className="mt-1 text-[13px] text-white/90">{diffText}</p>
                            </div>
                        </div>
                        <div className="relative mt-4">
                            <div className="h-1 rounded-full bg-white/30"><div className="h-full rounded-full bg-white" style={{ width: `${bPos}%` }} /></div>
                            <div className="absolute -top-[7px]" style={{ left: `${bPos}%`, transform: "translateX(-50%)" }}>
                                <div className="h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-white" />
                            </div>
                            <div className="relative mt-1.5 h-3 text-[10px] text-white/75">
                                <span className="absolute left-0">-5</span>
                                <span className="absolute" style={{ left: `${bPos}%`, transform: "translateX(-50%)" }}>Current</span>
                                <span className="absolute right-0">5</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <p className="max-w-[22ch] text-[13px] font-medium leading-snug text-white/95">Add your date of birth in Settings to see your biological age.</p>
                )}
            </div>
        </Link>
    );
}

// Your biomarkers — totals + a status distribution bar.
function YourBiomarkersCard({ summary }) {
    const s = summary || { total: 0, optimal: 0, normal: 0, outOfRange: 0 };
    const total = s.total || 0;
    const seg = (n) => (total > 0 ? `${(n / total) * 100}%` : "0%");
    const Stat = ({ n, label, dot }) => (
        <div>
            <p className="text-[22px] font-semibold leading-none text-blue">{n ?? 0}</p>
            <p className="mt-1.5 flex items-center gap-1 text-[12px] text-secondary">
                {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
                {label}
            </p>
        </div>
    );
    return (
        <div className={`${CARD} p-5 lg:p-6`}>
            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold tracking-tight text-blue">Your biomarkers</h3>
                <Link href="/data" className="inline-flex items-center gap-1 text-sm font-medium text-secondary transition hover:text-blue">
                    Explore more <ChevronRight className="h-4 w-4" />
                </Link>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
                <Stat n={total} label="Total" />
                <Stat n={s.optimal} label="Optimal" dot="bg-emerald-500" />
                <Stat n={s.normal} label="Normal" dot="bg-yellow-400" />
                <Stat n={s.outOfRange} label="Out of Range" dot="bg-pink-400" />
            </div>
            <div className="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-pageBackground">
                <div className="h-full bg-emerald-500" style={{ width: seg(s.optimal) }} />
                <div className="h-full bg-yellow-400" style={{ width: seg(s.normal) }} />
                <div className="h-full bg-pink-400" style={{ width: seg(s.outOfRange) }} />
            </div>
        </div>
    );
}

// Your protocol items — preview of the current supplement protocol.
function YourProtocolItemsCard({ items, planReady }) {
    const list = Array.isArray(items) ? items.slice(0, 3) : [];
    return (
        <div className={`${CARD} p-5 lg:p-6`}>
            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold tracking-tight text-blue">Your protocol items</h3>
                <Link href="/protocol" className="inline-flex items-center gap-1 text-sm font-medium text-secondary transition hover:text-blue">
                    Explore more <ChevronRight className="h-4 w-4" />
                </Link>
            </div>
            {list.length > 0 ? (
                <div className="mt-4 flex flex-col divide-y divide-borderColor">
                    {list.map((it, i) => (
                        <Link key={(it.productName || "") + i} href="/protocol" className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-pageBackground text-secondary">
                                <FlaskConical className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-blue">{it.productName}</p>
                                {it.dosing && <p className="truncate text-xs text-secondary">{it.dosing}</p>}
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-secondary transition group-hover:translate-x-0.5 group-hover:text-blue" />
                        </Link>
                    ))}
                </div>
            ) : (
                <p className="mt-4 text-sm leading-relaxed text-secondary">
                    {planReady ? "Your protocol is ready — open it to see your items." : "Your protocol items will appear here once your plan is ready."}
                </p>
            )}
        </div>
    );
}

// Onboarding checklist — real completion (lab reports are the only one with a backend;
// wearables & AI memory have no OAuth/import backend, so they stay honestly pending).
function HelpUsKnowYouCard({ hasReports }) {
    const items = [
        { key: "wearables", title: "Connect your wearables", done: false, href: "/settings?tab=integrations", Icon: Watch, img: "/assets/wearables.jpg" },
        { key: "labs", title: "Lab reports uploaded", done: !!hasReports, href: "/data?tab=records", Icon: FileText },
        { key: "memory", title: "Import your AI memory", done: false, href: "/concierge", Icon: Sparkles },
    ];
    const completed = items.filter((i) => i.done).length;
    return (
        <div className={`${CARD} p-5 lg:p-6`}>
            <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold tracking-tight text-blue">Help us know you better</h3>
                <span className="shrink-0 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-600">{completed}/3 completed</span>
            </div>
            <div className="mt-4 space-y-3">
                {items.map(({ key, title, done, href, Icon, img }) => {
                    const icon = img ? (
                        <span className="grid h-10 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-white">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img} alt="" className="h-9 w-12 object-contain" onError={(e) => e.currentTarget.remove()} />
                        </span>
                    ) : (
                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white ${done ? "text-emerald-600" : "text-secondary"}`}>
                            <Icon className="h-4 w-4" />
                        </span>
                    );
                    return done ? (
                        <div key={key} className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3">
                            {icon}
                            <p className="min-w-0 flex-1 text-sm font-medium text-emerald-700">{title}</p>
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-600 text-white"><Check className="h-4 w-4" /></span>
                        </div>
                    ) : (
                        <Link key={key} href={href} className="group flex items-center gap-3 rounded-2xl bg-pageBackground px-4 py-3 transition hover:brightness-[0.98]">
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

// Timeline — live meals/activities for today + macro split. Stays blank until something's logged.
const TIMELINE_MACROS = [
    { key: "calories", label: "Calories", unit: "", dot: "bg-orange-500" },
    { key: "fiberG", label: "Fiber", unit: "g", dot: "bg-emerald-500" },
    { key: "carbsG", label: "Carbs", unit: "g", dot: "bg-amber-500" },
    { key: "proteinG", label: "Protein", unit: "g", dot: "bg-rose-500" },
    { key: "fatG", label: "Fat", unit: "g", dot: "bg-yellow-400" },
    { key: "sugarG", label: "Sugar", unit: "g", dot: "bg-pink-400" },
];

function TimelineCard({ userId, router }) {
    const [entries, setEntries] = useState([]);
    const [macros, setMacros] = useState(null);

    useEffect(() => {
        if (!userId) return;
        const d = new Date();
        const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
                        {TIMELINE_MACROS.map(({ key, label, unit, dot }) => (
                            <div key={key} className="rounded-xl border border-borderColor p-3">
                                <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-secondary">
                                    <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                                    {label}
                                </p>
                                <p className="mt-1 text-lg font-semibold leading-none text-blue">{Math.round(macros[key] || 0)}{unit}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// "Review your action plan" row with the orange booklet.
function ReviewActionPlanCard({ planReady, actionPlanUpdated }) {
    if (!planReady) return null;
    const fmt = (d) => {
        if (!d) return null;
        const dt = new Date(d);
        return isNaN(dt.getTime()) ? null : dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };
    const updated = fmt(actionPlanUpdated);
    return (
        <Link href="/protocol" className={`group flex items-center gap-4 overflow-hidden ${CARD} p-5 transition hover:border-blue/20 lg:p-6`}>
            <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 text-sm font-semibold text-blue">
                    Review your action plan
                    <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </p>
                {updated && <p className="mt-0.5 text-[13px] text-secondary">Updated {updated}</p>}
            </div>
            <Image src="/assets/book.png" alt="" width={84} height={72} className="h-16 w-[84px] shrink-0 object-contain" />
        </Link>
    );
}

// grade letter → badge colours
function gradeColor(g) {
    const G = String(g || "").toUpperCase();
    if (G === "A") return { ring: "border-emerald-500", text: "text-emerald-600" };
    if (G === "B") return { ring: "border-lime-500", text: "text-lime-600" };
    if (G === "C") return { ring: "border-amber-500", text: "text-amber-600" };
    return { ring: "border-rose-500", text: "text-rose-600" };
}

// Mini trend sparkline for a biomarker, coloured by status.
function Sparkline({ trend, status }) {
    const pts = (Array.isArray(trend) ? trend : []).map(Number).filter((v) => !isNaN(v));
    const color = status === "optimal" ? "#11c182" : status === "normal" ? "#f5c518" : "#ff5d8f";
    if (pts.length < 2) {
        return (
            <svg viewBox="0 0 72 28" className="h-7 w-[72px] shrink-0">
                <circle cx="34" cy="14" r="3.5" fill="#fff" stroke={color} strokeWidth="2" />
                <line x1="66" y1="5" x2="66" y2="23" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
        );
    }
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const range = max - min || 1;
    const xy = pts.map((v, i) => [6 + (i / (pts.length - 1)) * 52, 5 + (1 - (v - min) / range) * 18]);
    const line = xy.map(([x, y]) => `${x},${y}`).join(" ");
    return (
        <svg viewBox="0 0 72 28" className="h-7 w-[72px] shrink-0">
            <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {xy.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={i === xy.length - 1 ? 3 : 2.2} fill="#fff" stroke={color} strokeWidth="1.8" />
            ))}
            <line x1="66" y1="5" x2="66" y2="23" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    );
}

// One biomarker row (image-1 style): name · status · mini trend.
function BiomarkerInsightRow({ b }) {
    const s = String(b.status || "").toLowerCase();
    const label = s === "optimal" ? "Optimal" : s === "normal" ? "Normal" : "Out of range";
    const dot = s === "optimal" ? "bg-emerald-500" : s === "normal" ? "bg-yellow-400" : "bg-pink-400";
    const txt = s === "optimal" ? "text-emerald-600" : s === "normal" ? "text-yellow-600" : "text-pink-600";
    return (
        <div className="flex items-center gap-3 rounded-xl bg-pageBackground px-3.5 py-3">
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-black">{b.name}</p>
            <span className={`flex shrink-0 items-center gap-1.5 text-xs font-medium ${txt}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                {label}
            </span>
            <Sparkline trend={b.trend} status={s} />
        </div>
    );
}

// Image-1 card: category grade chips + biomarker list with mini trends.
function HealthBreakdownCard({ categoryGrades, biomarkers }) {
    const grades = Object.entries(categoryGrades || {})
        .map(([key, val]) => {
            const hc = humanizeCategory(key);
            return { label: /health$/i.test(hc) ? hc : `${hc} Health`, grade: (val && typeof val === "object" ? val.grade : val) || "—" };
        })
        .filter((g) => g.label);
    const order = { out_of_range: 0, high: 0, low: 0, normal: 1, optimal: 2 };
    const list = (Array.isArray(biomarkers) ? biomarkers : [])
        .slice()
        .sort((a, b) => (order[String(a.status).toLowerCase()] ?? 3) - (order[String(b.status).toLowerCase()] ?? 3))
        .slice(0, 6);
    if (!grades.length && !list.length) return null;
    return (
        <div className={`${CARD} p-5 lg:p-6`}>
            {grades.length > 0 && (
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {grades.map((g, i) => {
                        const c = gradeColor(g.grade);
                        return (
                            <span key={i} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-borderColor bg-white py-1 pl-1 pr-3">
                                <span className={`grid h-6 w-6 place-items-center rounded-full border-2 text-[11px] font-bold ${c.ring} ${c.text}`}>{g.grade}</span>
                                <span className="text-[13px] font-medium text-blue">{g.label}</span>
                            </span>
                        );
                    })}
                </div>
            )}
            {list.length > 0 && (
                <div className="mt-4 space-y-2">
                    {list.map((b, i) => (
                        <BiomarkerInsightRow key={(b.id || b.name || "") + i} b={b} />
                    ))}
                </div>
            )}
        </div>
    );
}

// Curated symptoms for "how you might be feeling", keyed by organ/category.
const PRIORITY_SYMPTOMS = {
    nutrients: ["Low energy", "Slower recovery after workout", "Weaker immunity"],
    metabolic: ["Afternoon energy crashes", "Sugar cravings", "Stubborn weight"],
    heart: ["Reduced stamina", "Fatigue"],
    thyroid: ["Low energy", "Feeling cold", "Brain fog"],
    liver: ["Sluggishness", "Poor detox"],
    kidney: ["Fatigue", "Fluid retention"],
    inflammation: ["Aches", "Slower recovery"],
    sex: ["Low drive", "Low energy", "Mood dips"],
    immune: ["Frequent colds", "Slow recovery"],
    brain: ["Brain fog", "Low mood"],
    gut: ["Bloating", "Irregular digestion"],
    default: ["Low energy", "Slower recovery", "Off your best"],
};

// Image-2 card: the single highest-priority fix + affected biomarkers.
function HighPriorityCard({ topGoal, biomarkers }) {
    const order = { out_of_range: 0, high: 0, low: 0, normal: 1 };
    const flagged = (Array.isArray(biomarkers) ? biomarkers : [])
        .filter((b) => String(b.status || "").toLowerCase() !== "optimal")
        .sort((a, b) => (order[String(a.status).toLowerCase()] ?? 2) - (order[String(b.status).toLowerCase()] ?? 2));
    const feature = flagged[0];
    const heading = topGoal?.title || (feature ? `Get your ${feature.name} into the optimal zone` : null);
    if (!heading) return null;
    const organ = feature ? organKeyForCategory(feature.category || "") : null;
    const symptoms = PRIORITY_SYMPTOMS[organ] || PRIORITY_SYMPTOMS.default;
    const affected = flagged.slice(0, 2);
    return (
        <div className={`${CARD} p-5 lg:p-6`}>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-rose-500">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                High Priority
            </p>
            <h3 className="mt-2 text-lg font-semibold leading-snug text-blue lg:text-xl">{heading}</h3>
            <p className="mt-1 text-[13px] text-secondary">8–12 weeks to optimal levels</p>

            <p className="mt-5 text-sm font-medium text-secondary">How you might be feeling</p>
            <div className="mt-2 flex flex-wrap gap-2">
                {symptoms.map((sx) => (
                    <span key={sx} className="rounded-full bg-pageBackground px-3 py-1.5 text-[13px] font-medium text-blue">{sx}</span>
                ))}
            </div>

            {affected.length > 0 && (
                <>
                    <p className="mt-5 text-sm font-medium text-secondary">Affected biomarkers</p>
                    <div className="mt-2 space-y-2">
                        {affected.map((b, i) => (
                            <BiomarkerInsightRow key={(b.id || b.name || "") + i} b={b} />
                        ))}
                    </div>
                </>
            )}
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/mobileappgirl.png" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right" onError={(e) => e.currentTarget.remove()} />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/25 via-black/5 to-transparent" />
            <button
                type="button"
                onClick={() => setDismissed(true)}
                aria-label="Dismiss"
                className="absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-full bg-black/10 text-white/80 transition hover:bg-white/20 hover:text-white"
            >
                <X className="h-4 w-4" />
            </button>
            <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="max-w-[70%]">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                        Coming soon
                    </span>
                    <h3 className="mt-2 text-lg font-semibold tracking-tight lg:text-xl">Get the Cyborg app</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/90">
                        All your data in your pocket, sync wearables and text Cyborg AI anytime.
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white">
                        Launching in August
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
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pageBackground text-base">⌚</span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-blue">Connect your wearables</p>
                    <p className="mt-1 text-sm leading-relaxed text-secondary">
                        Download our app to connect &amp; get personalized insights from your wearable data.
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
            lines: ["Refer your friends and earn ₹299"],
        },
    ];

    return (
        <div className={`${CARD} p-5 lg:p-6`}>
            <h3 className="text-base font-semibold tracking-tight text-blue">Live better, longer together</h3>
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
