"use client";

import { useEffect } from "react";

// Segment-level error boundary. Rendered inside the root layout, so it keeps
// the app chrome/theme and can recover the failed subtree via reset() without a
// full reload. Having this (plus not-found.js and global-error.js) means a
// route render/compile failure resolves to a real component instead of Next's
// on-demand default error pages — the thing that, when it fails to compile in
// dev, triggers the "missing required error components, refreshing..." loop.
export default function Error({ error, reset }) {
  useEffect(() => {
    // Surface for local debugging; wire to your error reporter here if wanted.
    console.error("[app error boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <svg
          className="h-7 w-7 text-primary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <h1 className="mb-1.5 text-xl font-semibold text-ink">Something went wrong</h1>
      <p className="mb-6 max-w-sm text-sm text-secondary">
        An unexpected error occurred while loading this page. You can try again —
        your data is safe.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-xl bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-800"
      >
        Try again
      </button>
    </div>
  );
}
