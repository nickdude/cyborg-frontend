"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { biomarkerAPI } from "@/services/api";
import { extractScores } from "@/utils/biomarkerAdapter";

export default function BiologicalAgePage() {
  const { user } = useAuth();

  const [bioAge, setBioAge] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBioAge = useCallback(async () => {
    try {
      const response = await biomarkerAPI.panel();
      const data = response?.data || response;
      const scores = extractScores(data?.scores);
      setBioAge(scores.bioAge);
    } catch (err) {
      console.error("Failed to fetch biological age:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBioAge();
  }, [fetchBioAge]);

  const current = bioAge;
  const optimalUpper = current != null ? Math.round(current * 1.147 * 100) / 100 : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-pageBackground flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (current == null) {
    return (
      <div className="min-h-screen bg-pageBackground py-8 px-4 font-inter lg:px-8">
        <div className="mx-auto w-full max-w-[900px] rounded-2xl bg-white p-5 shadow-sm lg:p-8 text-center">
          <h1 className="text-3xl font-bold text-black">Biological Age</h1>
          <p className="mt-4 text-gray-500">Upload a blood report to see your biological age</p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm font-semibold text-cyan-600 hover:text-cyan-700">
            ← Back to Summary
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pageBackground py-8 px-4 font-inter lg:px-8">
      <div className="mx-auto w-full max-w-[900px] rounded-2xl bg-white p-5 shadow-sm lg:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-black lg:text-4xl">Biological Age</h1>
            <p className="mt-1 text-sm text-secondary">Your estimated biological age compared with your optimal range</p>
          </div>
          <Link href="/dashboard" className="text-sm font-semibold text-cyan-600 hover:text-cyan-700">
            ← Back to Summary
          </Link>
        </div>

        <div className="mt-5 rounded-2xl border border-borderColor p-4 lg:p-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#E6FFF5] px-3 py-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-sm font-semibold text-emerald-700">Optimal</span>
            <span className="text-sm font-medium text-gray-600">{current} years</span>
          </div>

          <div className="mt-5 h-44 rounded-xl border border-dashed border-cyan-200 bg-[#F2FFF8] p-4">
            <div className="flex justify-between text-sm font-medium text-cyan-700">
              <span>{optimalUpper}</span>
              <span>Optimal</span>
            </div>
            <div className="relative mt-6 h-20 w-full">
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-gray-300" />
              <div className="absolute left-14 top-2.5 h-1.5 w-4 rounded-full bg-emerald-500" />
              <div className="absolute left-[40%] top-2.5 h-1.5 w-4 rounded-full bg-slate-400" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-borderColor p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-secondary">Latest result</p>
              <p className="mt-2 text-3xl font-bold text-emerald-500">{current}</p>
            </div>
            <div className="rounded-xl border border-borderColor p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-secondary">Optimal range</p>
              <p className="mt-2 text-3xl font-bold text-emerald-500">0 - {optimalUpper}</p>
            </div>
          </div>
        </div>

        <section className="mt-6">
          <h2 className="text-2xl font-bold text-black">What is Biological Age?</h2>
          <div className="mt-3 space-y-4 text-sm leading-relaxed text-gray-600 lg:text-base lg:leading-relaxed">
            <p>Your chronological age reflects how many years you&apos;ve lived, while your biological age reflects how your body is aging at a cellular level. Biological age is influenced by factors like diet, sleep, stress, exercise, and genetics, and can potentially be improved with lifestyle changes.</p>
            <p>Cyborg measures biological age using blood biomarkers run through PhenoAge, a peer-reviewed algorithm developed by Yale scientist Morgan Levine, PhD. Based on a 23-year study of nearly 10,000 subjects, PhenoAge was found to predict mortality and disease risk better than chronological age alone, using nine key biomarkers including albumin, glucose, creatinine, and inflammatory markers (see &quot;Sources&quot;).</p>
            <p>However, biological age isn&apos;t a precise predictor of how long you&apos;ll live or whether you&apos;ll develop disease. Instead, think of it as a directional measurement—tracking changes in your biological age over time reveals general trends in how you&apos;re aging and can guide lifestyle adjustments to support healthier aging.</p>
          </div>
          <p className="mt-6 text-base font-bold text-black">Sources</p>
          <p className="mt-1 text-sm text-secondary">Phenotypic Age algorithm (PhenoAge), literature from Morgan Levine, PhD.</p>
        </section>
      </div>
    </div>
  );
}
