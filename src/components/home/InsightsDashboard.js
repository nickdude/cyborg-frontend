"use client";

import Image from "next/image";
import Link from "next/link";
import StatsGrid from "@/components/StatsGrid";
import BiomarkersList from "@/components/BiomarkersList";
import ActionButtons from "./ActionButtons";
import LiveBetterSection from "./LiveBetterSection";

export default function InsightsDashboard({ userName, data, scores, reportDate, actionPlanHref }) {
  return (
    <div className="min-h-screen bg-pageBackground pb-24 font-inter lg:pb-10">
      <div className="mx-auto w-full max-w-[1240px] px-4 pt-6 lg:px-8 lg:pt-10">
        <div>
          <div>
            <p className="text-2xl leading-tight text-black lg:text-3xl">Welcome back,</p>
            <p className="text-2xl font-semibold leading-tight text-black lg:text-3xl">{userName}</p>
          </div>
        </div>

        <div className="mt-4 lg:mt-6 lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
          <div className="hidden lg:col-span-5 lg:block lg:sticky lg:top-24">
            <div className="rounded-3xl border border-borderColor bg-white p-4">
              <div className="relative h-[620px] w-full">
                <Image
                  src="/assets/man.png"
                  alt="Digital twin"
                  fill
                  className="object-contain object-top"
                  priority
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="flex justify-center lg:hidden">
              <div className="relative h-[380px] w-full max-w-[520px] overflow-hidden bg-[#F3F3F5]">
                <Image
                  src="/assets/man.png"
                  alt="Digital twin"
                  fill
                  className="object-cover object-top scale-[1.02] -translate-y-1"
                  priority
                />
                <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-b from-transparent via-[#F3F3F5]/70 to-pageBackground" />
              </div>
            </div>

            <div className="mx-auto mt-2 grid max-w-[440px] grid-cols-2 gap-4 text-center lg:mx-0 lg:mt-0 lg:max-w-none">
              <div>
                <p className="text-3xl font-semibold text-black lg:text-4xl">{scores?.cyborgScore?.final ?? scores?.cyborgScore ?? "—"}</p>
                <p className="text-sm text-secondary lg:text-base">superpower score</p>
              </div>
              <Link
                href="/dashboard/biological-age"
                className="rounded-xl border border-borderColor bg-white px-3 py-2 transition hover:shadow-md"
              >
                <p className="text-3xl font-semibold text-black lg:text-4xl">{scores?.bioAge?.bioAge ?? scores?.bioAge ?? "—"}</p>
                <p className="text-sm text-secondary lg:text-base">biological age</p>
              </Link>
            </div>

            <Link
              href={actionPlanHref}
              className="mt-5 flex items-center justify-between overflow-hidden rounded-2xl border border-borderColor bg-white px-4 py-3 shadow-sm lg:mt-6"
            >
              <div>
                <p className="text-sm font-semibold text-black lg:text-base">Review your action plan ›</p>
                <p className="mt-0.5 text-xs text-secondary lg:text-sm">{reportDate ? `Updated ${new Date(reportDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}</p>
              </div>
              <div className="relative h-[80px] w-[120px] flex-shrink-0 lg:h-[90px] lg:w-[135px]">
                <Image
                  src="/assets/book.png"
                  alt="Action plan book"
                  fill
                  className="object-contain object-right"
                />
              </div>
            </Link>

            <section className="mt-6 rounded-2xl border border-borderColor bg-white p-4 lg:p-5">
              <h2 className="text-3xl font-semibold text-black lg:text-3xl">Key Insights</h2>
              <div className="mt-3 rounded-xl bg-[#F8F8FA] p-3">
                <p className="text-sm font-semibold text-[#E44166]">🎯 {data.keyInsight.tag}</p>
                <p className="mt-2 text-base text-black lg:text-lg">{data.keyInsight.message}</p>
              </div>
            </section>

            <section className="mt-4 rounded-2xl border border-borderColor bg-white p-4 lg:p-5">
              <h2 className="text-3xl font-semibold text-black lg:text-3xl">Summary</h2>
              <div className="mt-3">
                <StatsGrid stats={data.summary} />
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-borderColor bg-white p-4">
              <h2 className="text-3xl font-semibold text-black lg:text-3xl">Contributing Biomarkers</h2>
              <div className="mt-3 space-y-8">
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

            <section className="mt-6 rounded-2xl border border-borderColor bg-white p-4 lg:p-5">
              <h2 className="text-3xl font-semibold text-black lg:text-3xl">Timeline</h2>
              <div className="mt-5 text-center">
                <p className="text-lg font-medium text-black lg:text-xl">No events today</p>
                <p className="mt-1 text-secondary">Log something to fill your timeline</p>
              </div>
              <ActionButtons actions={data.timelineActions} />
            </section>

            <div className="mt-6">
              <LiveBetterSection data={data.liveBetter} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
