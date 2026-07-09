"use client";

// "What we are working on" step card — Material-3 mockup: a large faded coral
// step number, title + subtitle, and a chevron. Tapping opens the goal detail.
export default function GoalStepCard({ goal, index = 0, onOpen }) {
  const subtitle = goal?.summary || goal?.description || goal?.healthImpact || "";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full cursor-pointer items-start rounded-xl bg-surface-container-lowest p-6 text-left custom-shadow transition-shadow hover:shadow-md"
    >
      <div className="mr-6">
        <span className="font-step-number text-step-number text-primary-container opacity-50">
          {index + 1}
        </span>
      </div>
      <div className="min-w-0 flex-grow">
        <h3 className="mb-1 font-title-md text-title-md text-on-surface">{goal?.title}</h3>
        {subtitle && (
          <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">
            {subtitle}
          </p>
        )}
      </div>
      <div className="ml-4 flex h-12 items-center">
        <svg
          className="h-6 w-6 text-on-surface-variant transition-transform group-hover:translate-x-1"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </button>
  );
}
