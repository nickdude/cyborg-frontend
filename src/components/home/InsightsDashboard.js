"use client";

import Image from "next/image";
import Link from "next/link";
import StatsGrid from "@/components/StatsGrid";
import BiomarkersList from "@/components/BiomarkersList";
import TimelineFeed from "./TimelineFeed";
import LiveBetterSection from "./LiveBetterSection";

const CARD = "rounded-2xl border border-borderColor bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]";

export default function InsightsDashboard({ userName, data, scores, reportDate, actionPlanHref, userId }) {
  return (
    <div className="min-h-screen bg-pageBackground pb-32 font-inter lg:pb-36">
      <div className="mx-auto w-full max-w-[1200px] px-4 pt-8 lg:px-8 lg:pt-10 xl:px-10">
        {/* Header */}
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-[28px] font-bold leading-tight tracking-tight text-blue lg:text-[34px]">
              Welcome back, {userName}
            </p>
            <p className="mt-2 text-sm text-secondary lg:text-base">
              Your latest biomarker summary and next steps are below.
            </p>
          </div>
        </div>

        {/* Mobile digital twin */}
        <div className="mt-6 xl:hidden">
          <div className={`relative mx-auto w-full max-w-[520px] overflow-hidden ${CARD}`}>
            <div className="relative h-[360px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.95),rgba(242,242,242,1))] sm:h-[420px]">
              <Image src="/assets/man.webp" alt="Digital twin" fill className="object-contain object-center" priority />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start xl:gap-8">
          {/* Left: digital twin */}
          <aside className="hidden xl:block xl:sticky xl:top-20">
            <div className={`${CARD} p-4`}>
              <div className="relative h-[460px] overflow-hidden rounded-xl bg-gradient-to-b from-white to-gray-100">
                <Image src="/assets/man.webp" alt="Digital twin" fill className="object-contain object-center" priority />
              </div>
              <div className="mt-4 border-t border-borderColor pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">Digital Twin</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">Your current biomarker overview at a glance.</p>
              </div>
            </div>
          </aside>

          <main className="space-y-5 lg:space-y-6">
            {/* Top stats */}
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
              <div className={`${CARD} p-5`}>
                <p className="text-[40px] font-bold leading-none text-blue lg:text-5xl">
                  {scores?.cyborgScore?.final ?? scores?.cyborgScore ?? "—"}
                </p>
                <p className="mt-3 text-sm font-medium text-secondary">CYBORG Score</p>
              </div>
              <Link href="/dashboard/biological-age" className={`${CARD} p-5 transition-all hover:border-zinc-300 hover:shadow-md`}>
                <p className="text-[40px] font-bold leading-none text-blue lg:text-5xl">
                  {scores?.bioAge?.bioAge ?? scores?.bioAge ?? "—"}
                </p>
                <p className="mt-3 text-sm font-medium text-secondary">Biological Age</p>
              </Link>
              <Link
                href={actionPlanHref}
                className={`${CARD} flex items-center justify-between gap-3 px-5 py-4 transition-all hover:border-zinc-300 hover:shadow-md sm:col-span-2 lg:col-span-1`}
              >
                <div>
                  <p className="text-base font-semibold text-blue lg:text-lg">Action plan</p>
                  <p className="mt-1.5 text-xs font-medium text-secondary lg:text-sm">
                    {reportDate
                      ? `Updated ${new Date(reportDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                      : "Review next steps"}
                  </p>
                </div>
                <div className="relative h-[72px] w-[108px] flex-shrink-0 lg:h-[84px] lg:w-[120px]">
                  <Image src="/assets/book.webp" alt="Action plan book" fill className="object-contain object-right" />
                </div>
              </Link>
            </div>

            {/* Key insights */}
            <section className={`${CARD} p-5 lg:p-6`}>
              <h2 className="text-lg font-semibold text-blue lg:text-xl">Key Insights</h2>
              <div className="mt-4 rounded-xl border border-primary/15 bg-primary/[0.04] p-4 lg:p-5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary lg:text-[13px]">
                    {data.keyInsight.tag}
                  </p>
                </div>
                <p className="mt-2 text-base font-medium leading-relaxed text-blue lg:text-lg">
                  {data.keyInsight.message}
                </p>
              </div>
            </section>

            {/* Summary */}
            <section className={`${CARD} p-5 lg:p-6`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-blue lg:text-xl">Summary</h2>
                <p className="text-xs text-secondary lg:text-sm">All values are from your latest panel</p>
              </div>
              <div className="mt-4">
                <StatsGrid stats={data.summary} />
              </div>
            </section>

            {/* Contributing biomarkers */}
            <section className={`${CARD} p-5 lg:p-6`}>
              <h2 className="mb-5 text-lg font-semibold text-blue lg:text-xl">Contributing Biomarkers</h2>
              <div className="space-y-7">
                {Object.entries(
                  (data.biomarkers || data.contributingBiomarkers || []).reduce((acc, biomarker) => {
                    const key = biomarker.category || "All Biomarkers";
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(biomarker);
                    return acc;
                  }, {})
                ).map(([category, biomarkers]) => (
                  <BiomarkersList key={category} title={category} biomarkers={biomarkers} />
                ))}
              </div>
            </section>

            {/* Recent activity */}
            <section className={`${CARD} p-5 lg:p-6`}>
              <h2 className="mb-5 text-lg font-semibold text-blue lg:text-xl">Recent Activity</h2>
              <TimelineFeed userId={userId} actions={data.timelineActions} />
            </section>

            <div className="pt-1">
              <LiveBetterSection data={data.liveBetter} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
