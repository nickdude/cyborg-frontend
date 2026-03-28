"use client";

export default function StatusCard({ status }) {
  return (
    <div className="mt-4 bg-white rounded-2xl border border-borderColor p-4 lg:p-5">
      <div className="flex flex-col items-start gap-8 mb-3 lg:gap-10 lg:mb-4">
        <p className="text-sm font-semibold font-inter text-black lg:text-base">{status.title}</p>
        <p className="text-xs font-inter text-secondary lg:text-sm">{status.description}</p>
      </div>

      <div className="flex items-center justify-between text-xs font-inter text-black/70 mt-5 mb-2 lg:text-sm">
        {status.steps.map((step) => (
          <span key={step}>{step}</span>
        ))}
      </div>
      <div className="h-1.5 w-full bg-black/10 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width: `${status.progress * 100}%` }} />
      </div>
    </div>
  );
}
