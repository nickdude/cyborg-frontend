import Link from "next/link";

export default function BiologicalAgePage() {
  const current = 42.4;
  const optimalUpper = 48.64;

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
              <span>48.6</span>
              <span>Optimal</span>
            </div>
            <div className="relative mt-6 h-20 w-full">
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-gray-300" />
              <div className="absolute left-14 top-2.5 h-1.5 w-4 rounded-full bg-emerald-500" />
              <div className="absolute left-[40%] top-2.5 h-1.5 w-4 rounded-full bg-slate-400" />
            </div>
            <p className="mt-3 text-sm text-gray-500">Jul 2025 • Jan 2026</p>
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
            <p>Your chronological age reflects how many years you’ve lived, while your biological age reflects how your body is aging at a cellular level. Biological age is influenced by factors like diet, sleep, stress, exercise, and genetics, and can potentially be improved with lifestyle changes.</p>
            <p>Cyborg measures biological age using blood biomarkers run through PhenoAge, a peer-reviewed algorithm developed by Yale scientist Morgan Levine, PhD. Based on a 23-year study of nearly 10,000 subjects, PhenoAge was found to predict mortality and disease risk better than chronological age alone, using nine key biomarkers including albumin, glucose, creatinine, and inflammatory markers (see “Sources”).</p>
            <p>However, biological age isn’t a precise predictor of how long you’ll live or whether you’ll develop disease. Instead, think of it as a directional measurement—tracking changes in your biological age over time reveals general trends in how you’re aging and can guide lifestyle adjustments to support healthier aging.</p>
          </div>

          <p className="mt-6 text-base font-bold text-black">Sources</p>
          <p className="mt-1 text-sm text-secondary">Phenotypic Age algorithm (PhenoAge), literature from Morgan Levine, PhD.</p>
        </section>
      </div>
    </div>
  );
}
