"use client";

export default function StatusCard({ status }) {
  return (
    <div className="mt-6 bg-white rounded-2xl border border-borderColor p-5 lg:p-6 shadow-sm hover:shadow-md transition">
      <div className="flex flex-col gap-3 mb-5 lg:gap-4">
        <p className="text-sm font-semibold font-inter text-black lg:text-base">{status.title}</p>
        <p className="text-xs font-inter text-secondary lg:text-sm leading-relaxed">{status.description}</p>
      </div>

      <div className="flex items-center justify-between text-xs font-inter text-secondary mt-6 mb-2.5 lg:text-sm">
        {status.steps.map((step) => (
          <span key={step} className="font-medium">{step}</span>
        ))}
      </div>
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary to-purple-600 rounded-full transition-all duration-500" style={{ width: `${status.progress * 100}%` }} />
      </div>
    </div>
  );
}
