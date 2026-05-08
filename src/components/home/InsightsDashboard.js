"use client";

import Image from "next/image";
import Link from "next/link";
import StatsGrid from "@/components/StatsGrid";
import BiomarkersList from "@/components/BiomarkersList";
import TimelineFeed from "./TimelineFeed";
import LiveBetterSection from "./LiveBetterSection";

export default function InsightsDashboard({ userName, data, scores, reportDate, actionPlanHref, userId }) {
  return (
    <div className="min-h-screen bg-pageBackground pb-32 font-inter lg:pb-36">
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-6 lg:px-8 lg:pt-8 xl:px-10">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-2xl leading-tight text-black lg:text-3xl">Welcome back,</p>
            <p className="text-2xl font-semibold leading-tight text-black mt-1 lg:text-3xl">{userName}</p>
            <p className="mt-2 text-sm text-secondary lg:text-base">Your latest biomarker summary and next steps are below.</p>
          </div>
        </div>

        <div className="mt-6 xl:hidden">
          <div className="relative mx-auto w-full max-w-[520px] overflow-hidden rounded-3xl border border-borderColor bg-white shadow-sm">
            <div className="relative h-[360px] sm:h-[420px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.9),rgba(242,242,242,1))]">
              <Image
                src="/assets/man.png"
                alt="Digital twin"
                fill
                className="object-contain object-center drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                priority
              />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
          <aside className="hidden xl:block">
            <div className="rounded-2xl border border-borderColor bg-white p-4 shadow-sm">
              <div className="relative h-[460px] overflow-hidden rounded-xl bg-gradient-to-b from-white to-gray-100">
                <Image
                  src="/assets/man.png"
                  alt="Digital twin"
                  fill
                  className="object-contain object-center"
                  priority
                />
              </div>
              <div className="mt-4 border-t border-borderColor pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary">Digital Twin</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">Your current biomarker overview at a glance.</p>
              </div>
            </div>
          </aside>

          <main className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-borderColor bg-white p-5 shadow-sm">
                <p className="text-4xl font-bold text-black lg:text-5xl">{scores?.cyborgScore?.final ?? scores?.cyborgScore ?? "—"}</p>
                <p className="mt-2 text-sm font-medium text-secondary lg:text-base">CYBORG Score</p>
              </div>
              <Link
                href="/dashboard/biological-age"
                className="rounded-2xl border border-borderColor bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <p className="text-4xl font-bold text-black lg:text-5xl">{scores?.bioAge?.bioAge ?? scores?.bioAge ?? "—"}</p>
                <p className="mt-2 text-sm font-medium text-secondary lg:text-base">Biological Age</p>
              </Link>
              <Link
                href={actionPlanHref}
                className="flex items-center justify-between gap-4 rounded-2xl border border-borderColor bg-white px-5 py-4 shadow-sm transition hover:shadow-md sm:col-span-2 lg:col-span-1"
              >
                <div>
                  <p className="text-base font-semibold text-black lg:text-lg">Action plan</p>
                  <p className="mt-1.5 text-xs text-secondary font-medium lg:text-sm">{reportDate ? `Updated ${new Date(reportDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "Review next steps"}</p>
                </div>
                <div className="relative h-[72px] w-[108px] flex-shrink-0 lg:h-[84px] lg:w-[128px]">
                  <Image
                    src="/assets/book.png"
                    alt="Action plan book"
                    fill
                    className="object-contain object-right"
                  />
                </div>
              </Link>
            </div>

            <section className="rounded-2xl border border-borderColor bg-white p-5 shadow-sm lg:p-6">
              <h2 className="text-xl font-semibold text-black lg:text-2xl">Key Insights</h2>
              <div className="mt-4 rounded-xl border border-borderColor bg-gray-50 p-4 lg:p-5">
                <p className="text-sm font-semibold text-rose-600 lg:text-base">🎯 {data.keyInsight.tag}</p>
                <p className="mt-2 text-base leading-relaxed text-black lg:text-lg">{data.keyInsight.message}</p>
              </div>
            </section>

            <section className="rounded-2xl border border-borderColor bg-white p-5 shadow-sm lg:p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-black lg:text-2xl">Summary</h2>
                <p className="text-sm text-secondary">All values are from your latest panel</p>
              </div>
              <div className="mt-4">
                <StatsGrid stats={data.summary} />
              </div>
            </section>

            <section className="rounded-2xl border border-borderColor bg-white p-5 shadow-sm lg:p-6">
              <h2 className="text-xl font-semibold text-black mb-5 lg:text-2xl">Contributing Biomarkers</h2>
              <div className="space-y-8">
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

            <section className="rounded-2xl border border-borderColor bg-white p-5 shadow-sm lg:p-6">
              <h2 className="text-xl font-semibold text-black mb-5 lg:text-2xl">Recent Activity</h2>
              <TimelineFeed userId={userId} actions={data.timelineActions} />
            </section>

            <div className="pt-2">
              <LiveBetterSection data={data.liveBetter} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
