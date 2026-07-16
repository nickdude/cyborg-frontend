"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, ChevronRight, PencilLine, Search, X } from "lucide-react";
import MealUploadSheet from "@/components/MealUploadSheet";
import MealDetailsSheet from "@/components/MealDetailsSheet";
import QuickAddSheet from "./QuickAddSheet";
import FoodSearchResults from "./FoodSearchResults";
import RecentLogsList from "./RecentLogsList";
import { addItems, clearDraft, readDraft } from "@/utils/mealDraft";

/**
 * Log Food hub — full-screen entry point for logging a meal.
 *
 * Three ways in, one basket out:
 *   search (local food DB) · Scan Food (existing photo→AI flow) ·
 *   Quick Add (text→AI). Everything accumulates in the shared meal draft;
 *   the pill in the header carries the user to the Review screen.
 */
export default function FoodLogHub({ userId }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  // null | "upload" | "details" | "quickadd"
  const [sheet, setSheet] = useState(null);
  const [pendingFiles, setPendingFiles] = useState(null);
  const [quickAddSeed, setQuickAddSeed] = useState("");
  // Bumped after every draft mutation so the header pill re-reads storage.
  const [draftVersion, setDraftVersion] = useState(0);
  const [draftCount, setDraftCount] = useState(0);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  useEffect(() => {
    setDraftCount(readDraft()?.items?.length || 0);
  }, [draftVersion]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  }, []);

  const handleAddItem = useCallback(
    (item) => {
      addItems([item]);
      setDraftVersion((v) => v + 1);
      showToast(`Added ${item.name}`);
    },
    [showToast]
  );

  const handleQuickAdded = useCallback(
    (estimate) => {
      setDraftVersion((v) => v + 1);
      const n = estimate?.items?.length || 0;
      showToast(n === 1 ? `Added ${estimate.items[0].name}` : `Added ${n} items`);
    },
    [showToast]
  );

  const handleDiscard = () => {
    clearDraft();
    setDraftVersion((v) => v + 1);
  };

  const openDescribe = (seedText) => {
    setQuickAddSeed(seedText || "");
    setSheet("quickadd");
  };

  return (
    // --meal-nav-offset: this route has no bottom nav, so the reused
    // MealDetailsSheet should hug the bottom edge instead of floating
    // above a nav that isn't there.
    <div
      className="fixed inset-0 z-50 flex flex-col bg-white"
      style={{ "--meal-nav-offset": "16px" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-3 pt-[max(env(safe-area-inset-top,0px),12px)]">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          aria-label="Go back"
          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-pageBackground"
        >
          <ArrowLeft size={20} className="text-blue" />
        </button>
        <h1 className="flex-1 text-lg font-semibold tracking-tight text-blue">Log Food</h1>
        {draftCount > 0 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => router.push("/meals/new")}
              className="inline-flex items-center gap-1 rounded-full bg-black px-3 py-1.5 text-xs font-medium text-white"
            >
              {draftCount} {draftCount === 1 ? "item" : "items"} · Review
              <ChevronRight size={13} />
            </button>
            <button
              type="button"
              onClick={handleDiscard}
              aria-label="Discard draft"
              className="flex h-7 w-7 items-center justify-center rounded-full text-secondary hover:bg-pageBackground"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Search bar */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 rounded-xl border border-borderColor bg-pageBackground px-3 py-2.5">
          <Search size={18} className="flex-shrink-0 text-secondary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for food"
            className="w-full bg-transparent text-sm text-blue outline-none placeholder:text-secondary"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white text-secondary"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {query.trim() ? (
          <FoodSearchResults
            userId={userId}
            query={query}
            onAdd={handleAddItem}
            onDescribe={openDescribe}
          />
        ) : (
          <>
            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSheet("upload")}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-borderColor bg-white px-4 py-6 transition hover:border-primary/40 active:scale-[0.98]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Camera size={22} />
                </span>
                <span className="text-sm font-semibold text-blue">Scan Food</span>
                <span className="text-xs text-secondary">Snap or upload a photo</span>
              </button>
              <button
                type="button"
                onClick={() => openDescribe("")}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-borderColor bg-white px-4 py-6 transition hover:border-primary/40 active:scale-[0.98]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-biomarkerOptimal/10 text-biomarkerOptimal">
                  <PencilLine size={22} />
                </span>
                <span className="text-sm font-semibold text-blue">Quick Add</span>
                <span className="text-xs text-secondary">Describe it in words</span>
              </button>
            </div>

            {/* Recent logs */}
            <div className="mt-7">
              <h2 className="mb-3 text-base font-semibold tracking-tight text-blue">
                From your past logs
              </h2>
              <RecentLogsList userId={userId} onAdd={handleAddItem} />
            </div>
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none absolute bottom-6 left-0 right-0 flex justify-center px-4">
          <div className="rounded-full bg-black/85 px-4 py-2 text-sm font-medium text-white shadow-lg">
            {toast} ·{" "}
            <button
              type="button"
              onClick={() => router.push("/meals/new")}
              className="pointer-events-auto underline underline-offset-2"
            >
              Review
            </button>
          </div>
        </div>
      )}

      {/* Scan Food — the existing photo→AI flow, reused verbatim */}
      <MealUploadSheet
        open={sheet === "upload"}
        onClose={() => setSheet(null)}
        onFilesPicked={(files) => {
          setPendingFiles(files);
          setSheet("details");
        }}
      />
      <MealDetailsSheet
        open={sheet === "details"}
        initialFiles={pendingFiles}
        onClose={() => {
          setSheet(null);
          setPendingFiles(null);
          setDraftVersion((v) => v + 1);
        }}
      />

      {/* Quick Add — text → AI estimate */}
      <QuickAddSheet
        open={sheet === "quickadd"}
        initialText={quickAddSeed}
        onClose={() => setSheet(null)}
        onAdded={handleQuickAdded}
      />
    </div>
  );
}
