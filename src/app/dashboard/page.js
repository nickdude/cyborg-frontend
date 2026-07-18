"use client";

export const dynamic = "force-dynamic";

import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import InsightsDashboard from "@/components/home/InsightsDashboard";
import TimelineHome from "@/components/home/TimelineHome";
import DigitalTwinHome from "@/components/home/DigitalTwinHome";
import { homeScheduledData } from "@/data/homeScheduledData";
import UserActions from "@/components/UserActions";
import { organKeyForCategory, categoryStatus } from "@/components/data/organStatus";
import { useState, useEffect, useCallback } from "react";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { transformPanel, computeSummary, extractScores, humanizeCategory } from "@/utils/biomarkerAdapter";
import { biomarkerAPI, userAPI, actionPlanAPI, goalsAPI } from "@/services/api";
import { ClipboardList, Droplet, FileText, Stethoscope, RefreshCw } from "lucide-react";

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
    const initialTab = searchParams.get("tab") === "timeline" ? "timeline" : "twin";
    const [homeTab, setHomeTab] = useState(initialTab); // twin | timeline
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
                    { label: "Log Food", variant: "solid", href: "/meals/log?from=insights" },
                    { label: "Add an activity", variant: "solid", href: "/activities/new?from=insights" },
                ],
                liveBetter: {
                    title: "Live better, longer together",
                    cards: [
                        {
                            image: "/assets/refer.webp",
                            text: "Review family health insights from your intake",
                            action: { type: "chevron" },
                        },
                        {
                            image: "/assets/refer-friend.webp",
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
        { key: "intake", tone: "purple", Icon: ClipboardList, title: "Health intake", img: "/assets/timeline/intake.webp",
          date: user?.createdAt || null, href: "/onboarding",
          status: user?.onboardingCompleted ? "complete" : "active",
          note: user?.onboardingCompleted ? "Complete" : "Answer a few questions" },
        { key: "blood", tone: "red", Icon: Droplet, title: "Blood Panel", img: "/assets/timeline/custom-panel.webp",
          date: firstReportDate, href: "/data?tab=records",
          status: hasAnyReport ? "complete" : "active",
          note: hasAnyReport ? "Complete" : "Upload your first panel" },
        { key: "plan", tone: "purple", Icon: FileText, title: "Your Action Plan", img: "/assets/timeline/roadmap.webp",
          date: planDate, href: "/protocol",
          status: planReady ? "active" : "locked",
          note: planReady ? "Tap to open" : "Unlocks after your labs" },
        { key: "review", tone: "blue", Icon: Stethoscope, title: "1-1 Advisory call", img: "/assets/timeline/advisory.webp",
          date: planReady && planDate ? addDaysISO(planDate, 7) : null, href: "/consults",
          status: planReady ? "upcoming" : "locked",
          note: "Review your results with a clinician" },
        { key: "retest", tone: "green", Icon: RefreshCw, title: "90-day re-test", img: "/assets/timeline/retest.webp",
          date: lastReportDate ? addDaysISO(lastReportDate, 90) : null, href: "/data",
          status: "locked", note: "Track your progress" },
    ];
    const journeyDone = journey.filter((m) => m.status === "complete").length;

    // ── Digital Twin: the clean 3D-body home (no purple header, exactly the
    //    original dashboard) ─────────────────────────────────────────────────
    if (homeTab === "twin") {
        return (
            <>
                <div className="lg:hidden"><UserActions /></div>
                <DigitalTwinHome
                    userName={userName}
                    sex={sex}
                    router={router}
                    activeTab={homeTab}
                    onTabChange={setHomeTab}
                    twinHighlights={twinHighlights}
                    score={homeScore}
                    bioAge={bioAge}
                    chronoAge={chronoAge}
                    biomarkerSummary={biomarkerSummary}
                    biomarkers={insightsData?.biomarkers}
                    reportDate={insightsData?.reportDate}
                    plan={plan}
                    planReady={planReady}
                    actionPlanUpdated={actionPlanUpdated}
                    protocolItems={protocolItems}
                    topGoal={topGoal}
                    reports={reports}
                    reportsLoading={reportsLoading}
                    processingReport={processingReport}
                    readyReport={readyReport}
                    hasAnyReport={hasAnyReport}
                    userId={userId}
                    processing={!!processingReport}
                />
            </>
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
                userId={userId}
            />
        </div>
    );
}
