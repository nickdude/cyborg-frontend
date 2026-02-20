"use client";

function InsightCard({ title, body, cta }) {
  return (
    <div className="border border-borderColor rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-black text-white text-xs flex items-center justify-center font-bold flex-shrink-0 leading-none">C</div>
        <div>
          <p className="text-sm font-semibold text-primary">{title}</p>
          <p className="text-xs text-secondary mt-2 leading-relaxed">{body}</p>
        </div>
      </div>
      <button className="text-xs text-secondary mt-3 flex items-center gap-2 px-10">
        {cta} <span>→</span>
      </button>
    </div>
  );
}

function AskItem({ text }) {
  return (
    <div className="border border-borderColor rounded-xl p-3 flex items-center gap-3">
      <div className="w-7 h-7 rounded-full bg-black text-white text-xs flex items-center justify-center font-bold flex-shrink-0 leading-none">C</div>
      <p className="text-sm text-gray-900 flex-1">{text}</p>
      <span className="text-gray-400">→</span>
    </div>
  );
}

export default function BiomarkerDetail({ biomarker, onClose }) {
  const detail = {
    name: biomarker?.name || "Lipoprotein (a)",
    value: biomarker?.value || "177.4",
    unit: biomarker?.unit || "nmol/L",
    status: biomarker?.status || "out_of_range",
    optimalRange: biomarker?.optimalRange || { min: 0, max: 60 },
    timeline: biomarker?.timeline || { start: "Jul 2025", end: "Jan 2026" },
    insight: biomarker?.insight || {
      title: "Key Insight - Familial Risk",
      body:
        "Your Lp(a) level is largely inherited. High values can increase lifetime heart risk even with healthy habits. Because it runs in families, your results may help relatives understand their own risk too",
      cta: "Share this with your family",
    },
    questions: biomarker?.questions || [
      "What does an elevated Lipoprotein (a) level mean for my heart disease risk profile?",
      "How can I naturally lower my Lipoprotein (a) through lifestyle or nutrition changes?",
      "Should I consider additional testing or specialized panels to better understand my cardiovascular risk related to Lipoprotein (a)",
    ],
    description:
      biomarker?.description ||
      "Lipoprotein (a) or Lp(a) is a macromolecular complex composed of one molecule of Low-Density Lipoprotein (LDL) containing apolipoprotein B100 and one molecule of apolipoprotein(a). Lp(a) is synthesized by the liver and its assembly occurs at the hepatocyte cell membrane surface. Lp(a) has structural and functional similarities to both LDL and plasminogen, and may play a role in cholesterol transport, atherosclerosis, thrombosis, and inflammation.",
  };
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end z-50">
      <div className="w-full bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto font-inter pb-10">
        <div className="flex justify-center pt-3">
          <div className="w-14 h-1.5 bg-borderColor rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pt-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">{detail.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status Pill */}
        <div className="px-6 pt-4">
          <div className={`inline-flex items-center gap-2 ${detail.status === "optimal" ? "bg-biomarkerOptimal/10 text-biomarkerOptimal" : detail.status === "normal" ? "bg-biomarkerNormal/10 text-biomarkerNormal" : "bg-biomarkerOutOfRange/10 text-biomarkerOutOfRange"} rounded-full px-4 py-2 text-sm font-medium`}>
            <span className={`w-2.5 h-2.5 rounded-full ${detail.status === "optimal" ? "bg-biomarkerOptimal" : detail.status === "normal" ? "bg-biomarkerNormal" : "bg-biomarkerOutOfRange"}`} />
            {detail.status === "optimal" ? "Optimal" : detail.status === "normal" ? "Normal" : "Out of Range"}
            <span className="text-gray-500 font-normal">{detail.value} {detail.unit}</span>
          </div>
        </div>

        {/* Chart Area */}
        <div className="px-6 pt-6">
          <div className="relative">
            {/* Vertical Range Bar */}
            <div className="absolute left-0 top-3 flex flex-col items-center">
              <div className="w-1.5 h-16 rounded-full bg-biomarkerOutOfRange" />
              <div className="w-1.5 h-3 rounded-full bg-biomarkerNormal mt-1" />
              <div className="w-1.5 h-12 rounded-full bg-biomarkerOptimal mt-1" />
              <div className="w-2 h-2 rounded-full bg-biomarkerOutOfRange mt-2" />
            </div>

            <div className="ml-6">
              {/* Dotted Line with Points */}
              <div className="relative h-10">
                <div className="absolute left-10 right-6 top-5 border-t border-dashed border-borderColor" />
                <div className="absolute left-10 top-4 w-2.5 h-2.5 rounded-full bg-biomarkerOutOfRange" />
                <div className="absolute right-6 top-4 w-2.5 h-2.5 rounded-full bg-gray-300" />
              </div>

              {/* Optimal label */}
              <div className="flex justify-end">
                <span className="text-xs text-biomarkerOptimal font-medium">Optimal</span>
              </div>

              {/* Optimal Range Box */}
              <div className="mt-3">
                <div className="relative rounded-md border border-dashed border-biomarkerOptimal/60 bg-biomarkerOptimal/10 px-3 py-3">
                  <span className="text-xs text-secondary">{detail.optimalRange.max}</span>
                </div>
                <span className="text-xs text-secondary">{detail.optimalRange.min}</span>
              </div>

              <div className="border-t border-borderColor mt-4" />
              <div className="flex justify-center gap-16 text-xs text-secondary mt-2">
                <span>{detail.timeline.start}</span>
                <span>{detail.timeline.end}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="px-6 pt-6 grid grid-cols-2 gap-3">
          <div className="border border-borderColor rounded-lg p-3">
            <p className="text-xs text-secondary">Latest result</p>
            <p className={`text-lg font-semibold ${detail.status === "optimal" ? "text-biomarkerOptimal" : detail.status === "normal" ? "text-biomarkerNormal" : "text-biomarkerOutOfRange"}`}>
              {detail.value} <span className="text-xs text-secondary">{detail.unit}</span>
            </p>
          </div>
          <div className="border border-borderColor rounded-lg p-3">
            <p className="text-xs text-secondary">Optimal range</p>
            <p className="text-lg font-semibold text-biomarkerOptimal">{detail.optimalRange.min} - {detail.optimalRange.max} <span className="text-xs text-secondary">{detail.unit}</span></p>
          </div>
        </div>

        {/* Key Insight */}
        <div className="px-6 pt-4">
          <InsightCard title={detail.insight.title} body={detail.insight.body} cta={detail.insight.cta} />
        </div>

        {/* Ask Cyborg AI */}
        <div className="px-6 pt-6">
          <h3 className="text-lg font-semibold text-gray-900">Ask Cyborg AI</h3>
          <div className="mt-3 space-y-3">
            {detail.questions.map((q) => (
              <AskItem key={q} text={q} />
            ))}
          </div>
        </div>

        {/* What is Lipoprotein */}
        <div className="px-6 pt-6">
          <h3 className="text-lg font-semibold text-gray-900">What is {detail.name}</h3>
          <p className="text-xs text-gray-600 mt-2 leading-relaxed">
            {detail.description}
          </p>
        </div>
      </div>
    </div>
  );
}
