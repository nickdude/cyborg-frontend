"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-6">
        <svg
          className="w-8 h-8 text-zinc-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>
      <h1 className="text-white text-xl font-semibold mb-2">You&apos;re offline</h1>
      <p className="text-zinc-400 text-sm mb-8 max-w-xs">
        Check your internet connection and try again. Your data is safe.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-emerald-500 text-black font-medium rounded-xl hover:bg-emerald-400 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
