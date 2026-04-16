"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { mealAPI } from "@/services/api";

const MAX_FILES = 5;

function phaseLabel(elapsedSec) {
  if (elapsedSec < 3) return "Uploading photos";
  if (elapsedSec < 10) return "Reading the food";
  if (elapsedSec < 30) return "Estimating macros";
  if (elapsedSec < 60) return "Almost there";
  return "Still working";
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Second-stage bottom sheet: user confirms image set and adds optional text.
 * Continue fires POST /meals/analyze, stages the response in sessionStorage,
 * and navigates to /meals/new which will render the Review screen.
 */
export default function MealDetailsSheet({ open, initialFiles, onClose }) {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?._id || user?.id;

  const [files, setFiles] = useState([]);
  const [description, setDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [error, setError] = useState("");
  const addMoreRef = useRef(null);

  // Derive and cache object URLs so we don't regenerate on every render.
  const previews = useMemo(
    () => files.map((f) => ({ file: f, url: URL.createObjectURL(f) })),
    [files]
  );
  useEffect(() => {
    return () => previews.forEach((p) => URL.revokeObjectURL(p.url));
  }, [previews]);

  // When the sheet opens with new incoming files, seed state.
  useEffect(() => {
    if (open && initialFiles && initialFiles.length > 0) {
      setFiles(initialFiles.slice(0, MAX_FILES));
      setDescription("");
      setError("");
      setElapsedSec(0);
    }
    if (!open) {
      // Release state on close so re-opens start fresh.
      setFiles([]);
      setDescription("");
      setError("");
      setAnalyzing(false);
      setElapsedSec(0);
    }
  }, [open, initialFiles]);

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

  const handleRemove = (idx) => {
    if (analyzing) return;
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddMore = (event) => {
    const picked = Array.from(event.target.files || []);
    if (picked.length === 0) return;
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_FILES));
    if (addMoreRef.current) addMoreRef.current.value = "";
  };

  const canContinue = (files.length > 0 || description.trim().length > 0) && !analyzing;

  const handleContinue = async () => {
    if (!canContinue || !userId) return;

    setError("");
    setAnalyzing(true);

    try {
      const formData = new FormData();
      for (const f of files) formData.append("images", f);
      if (description.trim()) formData.append("description", description.trim());

      const resp = await mealAPI.analyze(userId, formData);
      // Due to the axios response interceptor, `resp` is the unwrapped body
      // ({ success, statusCode, message, data, timestamp }).
      const data = resp?.data;
      if (!data?.estimate) {
        throw new Error("Unexpected response from server");
      }

      // Pre-encode previews as data URLs for the review route.
      const dataUrls = await Promise.all(files.map((f) => fileToDataUrl(f)));

      const draft = {
        estimate: data.estimate,
        imageKeys: data.imageKeys || [],
        imagePreviews: dataUrls,
        pickedAt: new Date().toISOString(),
      };
      try {
        sessionStorage.setItem("cyborg.mealDraft", JSON.stringify(draft));
      } catch (storageErr) {
        // Quota exceeded or private-mode fallback: still navigate but without previews.
        console.warn("[MealDetails] sessionStorage write failed:", storageErr?.message);
        const lite = { ...draft, imagePreviews: [] };
        sessionStorage.setItem("cyborg.mealDraft", JSON.stringify(lite));
      }

      // Navigate to the review route (Task 5 will build that page).
      onClose?.();
      router.push("/meals/new");
    } catch (err) {
      const serverMsg = err?.response?.data?.message || err?.message;
      setError(serverMsg || "Couldn't analyze this meal. Try again in a moment.");
      setAnalyzing(false);
    }
  };

  if (!open) return null;

  const atLimit = files.length >= MAX_FILES;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Add meal details">
      <button
        type="button"
        aria-label="Close"
        onClick={() => !analyzing && onClose?.()}
        className="absolute inset-0 bg-black/50"
      />

      <div className="relative w-full max-w-md rounded-t-3xl bg-white px-5 pt-6 pb-8 shadow-2xl animate-[slideUp_200ms_ease-out]">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-gray-200" aria-hidden="true" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#14151a]">Add details</h2>
          <button
            type="button"
            onClick={() => !analyzing && onClose?.()}
            disabled={analyzing}
            aria-label="Close sheet"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white disabled:opacity-40"
          >
            ×
          </button>
        </div>

        {/* Thumbnail strip */}
        <div className="mb-4 flex gap-3 overflow-x-auto pb-2">
          {previews.map((p, idx) => (
            <div key={idx} className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={`Food ${idx + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                disabled={analyzing}
                aria-label={`Remove image ${idx + 1}`}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-white disabled:opacity-40"
              >
                ×
              </button>
            </div>
          ))}

          {!atLimit && (
            <button
              type="button"
              onClick={() => addMoreRef.current?.click()}
              disabled={analyzing}
              aria-label="Add more images"
              className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-[#9ea3b1] text-2xl text-[#6d6f7b] disabled:opacity-40"
            >
              +
            </button>
          )}

          <input
            ref={addMoreRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleAddMore}
            className="hidden"
          />
        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={analyzing}
          placeholder="Add details (optional — e.g. 'large bowl')"
          rows={3}
          className="mb-4 w-full resize-none rounded-xl border border-[#e4e6ef] bg-white px-4 py-3 text-sm text-[#1e2027] placeholder:text-[#9ea3b1] focus:border-[#9ea3b1] focus:outline-none disabled:opacity-60"
        />

        {error && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {analyzing && (
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-[#e4e6ef] bg-white px-4 py-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-black opacity-40" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-black" />
            </span>
            <div className="flex-1">
              <div className="text-sm font-medium text-[#1e2027]">{phaseLabel(elapsedSec)}…</div>
              <div className="text-xs text-[#6d6f7b]">{elapsedSec}s elapsed · keep this sheet open</div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue}
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-black text-sm font-medium text-white disabled:opacity-50"
        >
          {analyzing ? `${phaseLabel(elapsedSec)}…` : "Continue"}
        </button>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
