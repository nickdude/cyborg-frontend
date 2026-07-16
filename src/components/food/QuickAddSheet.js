"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { mealAPI } from "@/services/api";
import { mergeAnalysis } from "@/utils/mealDraft";

function phaseLabel(elapsedSec) {
  if (elapsedSec < 3) return "Reading your description";
  if (elapsedSec < 10) return "Finding the foods";
  if (elapsedSec < 30) return "Estimating macros";
  if (elapsedSec < 60) return "Almost there";
  return "Still working";
}

/**
 * Manual "Quick Add" — describe a meal in words, the existing text-only
 * analyze path estimates the macros, and the items land in the draft.
 * Stays in the hub after adding (adding to the basket, not committing).
 */
export default function QuickAddSheet({ open, initialText = "", onClose, onAdded }) {
  const { user } = useAuth();
  const userId = user?._id || user?.id;

  const [text, setText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setText(initialText || "");
      setError("");
      setElapsedSec(0);
    } else {
      setText("");
      setError("");
      setAnalyzing(false);
      setElapsedSec(0);
    }
  }, [open, initialText]);

  // Phased-progress tick.
  useEffect(() => {
    if (!analyzing) return;
    const start = Date.now();
    setElapsedSec(0);
    const id = setInterval(() => setElapsedSec(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [analyzing]);

  // Close on Escape when not analyzing.
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape" && !analyzing) onClose?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, analyzing, onClose]);

  const canContinue = text.trim().length > 0 && !analyzing;

  const handleContinue = async () => {
    if (!canContinue || !userId) return;
    setError("");
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("description", text.trim());
      const resp = await mealAPI.analyze(userId, formData);
      const data = resp?.data;
      if (!data?.estimate) throw new Error("Unexpected response from server");
      if (data.estimate.notFood || !(data.estimate.items || []).length) {
        setError("Couldn't find any food in that — try rephrasing.");
        setAnalyzing(false);
        return;
      }
      mergeAnalysis(data.estimate, [], []);
      setAnalyzing(false);
      onAdded?.(data.estimate);
      onClose?.();
    } catch (err) {
      const serverMsg = err?.response?.data?.message || err?.message;
      setError(serverMsg || "Couldn't analyze that. Try again in a moment.");
      setAnalyzing(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[55]" role="dialog" aria-modal="true" aria-label="Quick add food">
      <button
        type="button"
        aria-label="Close"
        onClick={() => !analyzing && onClose?.()}
        className="absolute inset-0 bg-black/50"
      />

      <div className="absolute bottom-6 left-0 right-0 flex justify-center px-4">
        <div className="w-full max-w-md rounded-3xl bg-white px-5 pt-5 pb-6 shadow-2xl animate-[slideUp_200ms_ease-out]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight text-blue">Quick add</h2>
            <button
              type="button"
              onClick={() => !analyzing && onClose?.()}
              disabled={analyzing}
              aria-label="Close sheet"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white disabled:opacity-40"
            >
              ×
            </button>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={analyzing}
            placeholder="e.g. 2 rotis with dal and a glass of buttermilk"
            rows={3}
            autoFocus
            className="mb-4 w-full resize-none rounded-xl border border-borderColor bg-white px-4 py-3 text-sm text-blue placeholder:text-secondary focus:border-primary focus:outline-none disabled:opacity-60"
          />

          {error && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {analyzing && (
            <div className="mb-3 flex items-center gap-3 rounded-xl border border-borderColor bg-white px-4 py-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black opacity-40" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-black" />
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium text-blue">{phaseLabel(elapsedSec)}…</div>
                <div className="text-xs text-secondary">{elapsedSec}s elapsed · keep this open</div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-black text-sm font-medium text-white disabled:opacity-50"
          >
            {analyzing ? `${phaseLabel(elapsedSec)}…` : "Add to meal"}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
