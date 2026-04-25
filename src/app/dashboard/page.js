"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import HomeScheduledSection from "@/components/home/HomeScheduledSection";
import InsightsDashboard from "@/components/home/InsightsDashboard";
import { homeScheduledData } from "@/data/homeScheduledData";
import { useState, useEffect, useCallback } from "react";
import { transformPanel, computeSummary, extractScores } from "@/utils/biomarkerAdapter";
import { biomarkerAPI } from "@/services/api";

export default function Dashboard() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const userName = user?.firstName || "User";

    const hasInsightsSignals =
        user?.dashboardVariant === "insights" ||
        user?.latestReportReady ||
        user?.actionPlanReady ||
        (Array.isArray(user?.bloodReports) && user.bloodReports.length > 0);

    const forcedView = searchParams.get("view");
    const showInsightsDashboard =
        forcedView === "insights" || (forcedView !== "scheduled" && hasInsightsSignals);
    const actionPlanHref = user?.id || user?._id ? `/action-plan/${user?.id || user?._id}` : "/dashboard";

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
                        ? `Focus on ${Object.entries(scores.categoryGrades).sort(([,a], [,b]) => String(a).localeCompare(String(b))).pop()?.[0] || "overall health"}`
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
            />
        );
    }

    return (
        <div className="min-h-screen bg-pageBackground pb-24 lg:pb-10">
            {/* Hero */}
            <div className="relative w-full min-h-[60vh] text-white lg:min-h-[480px]">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/assets/welcome/welcome.jpg"
                        alt="Welcome background"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
                <div className="absolute inset-0 bg-black/40 z-0" />

                <div className="relative z-10 mx-auto w-full max-w-[1240px] px-6 pt-10 lg:px-8 lg:pt-14">
                    <div className="space-y-6">
                        <div>
                            <p className="text-2xl font-semibold font-inter lg:text-[2rem]">Good morning {userName},</p>
                            <h1 className="text-lg font-inter opacity-90 lg:text-xl">Welcome to
                                <span className="block">CYBORG</span>
                            </h1>
                        </div>
                    </div>

                    <div className="mt-8 bg-white/20 backdrop-blur rounded-2xl p-5 max-w-sm lg:mt-10 lg:max-w-[430px] lg:p-6">
                        <p className="text-xs font-inter uppercase tracking-wide opacity-80">{homeScheduledData.hero.panelLabel}</p>
                        <p className="text-base font-semibold font-inter mt-2 lg:text-lg">{homeScheduledData.hero.appointmentText}</p>
                        <div className="flex items-center gap-2 mt-44 lg:mt-52">
                            {homeScheduledData.hero.progressBars.map((opacity, index) => (
                                <div
                                    key={index}
                                    className="h-[3px] w-8 bg-white rounded-full"
                                    style={{ opacity }}
                                />
                            ))}
                        </div>
                        <p className="text-xs font-inter opacity-80 mt-2">{homeScheduledData.hero.statusText}</p>
                    </div>
                </div>
            </div>

            <HomeScheduledSection data={homeScheduledData} />
        </div>
    );
}