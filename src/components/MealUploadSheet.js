"use client";

import { useEffect, useRef } from "react";

/**
 * Bottom-sheet picker with two choices: Take photo (camera) or Upload image (gallery).
 * Open state is controlled by the parent. When the user picks files, `onFilesPicked`
 * is called with the FileList as an array and the sheet auto-closes.
 */
export default function MealUploadSheet({ open, onClose, onFilesPicked }) {
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Reset the hidden inputs each time the sheet opens so picking the same
  // file twice still triggers onChange.
  useEffect(() => {
    if (open) {
      if (cameraRef.current) cameraRef.current.value = "";
      if (galleryRef.current) galleryRef.current.value = "";
    }
  }, [open]);

  const handlePick = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    onFilesPicked?.(files);
    onClose?.();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Add a meal"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />

      {/* Sheet */}
      <div className="relative w-full max-w-md rounded-t-3xl bg-white px-5 pt-6 pb-8 shadow-2xl animate-[slideUp_200ms_ease-out]">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-gray-200" aria-hidden="true" />
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#14151a]">Add a meal</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sheet"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex flex-col items-center gap-2 rounded-2xl border border-[#e4e6ef] bg-white px-4 py-5 text-sm font-medium text-[#1e2027] transition hover:border-[#9ea3b1] active:scale-95"
          >
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h3l2-3h6l2 3h3a1 1 0 011 1v11a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            <span>Take photo</span>
          </button>

          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="flex flex-col items-center gap-2 rounded-2xl border border-[#e4e6ef] bg-white px-4 py-5 text-sm font-medium text-[#1e2027] transition hover:border-[#9ea3b1] active:scale-95"
          >
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="9" cy="10" r="1.5" fill="currentColor" />
              <path d="M4 17l5-5 4 4 3-3 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Upload image</span>
          </button>
        </div>

        {/* Hidden file inputs — triggered by the card buttons above */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePick}
          className="hidden"
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handlePick}
          className="hidden"
        />
      </div>

      {/* Inline keyframe for the slide-up transition (avoids editing global CSS). */}
      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
