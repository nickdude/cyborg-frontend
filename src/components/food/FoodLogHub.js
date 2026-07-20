"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, PencilLine, ScanBarcode, Search, X } from "lucide-react";
import MealUploadSheet from "@/components/MealUploadSheet";
import MealDetailsSheet from "@/components/MealDetailsSheet";
import MealReviewScreen from "@/components/MealReviewScreen";
import QuickAddSheet from "./QuickAddSheet";
import FoodSearchResults from "./FoodSearchResults";
import RecentLogsList from "./RecentLogsList";
import { mealAPI } from "@/services/api";
import {
  addItems,
  clearDraft,
  computeTotals,
  readDraft,
  toCommitItems,
  writeDraft,
} from "@/utils/mealDraft";

/**
 * Log Food flow — review-first, per the Figma "Log Food" frames.
 *
 * Lands on the REVIEW SHELL (draft basket + macro grid). From there:
 *   "Scan food"   → existing photo→AI sheet flow (MealUploadSheet/Details)
 *   "Add An Item" → in-route SEARCH VIEW (local food DB search, recents,
 *                   Quick Add). Adds STAY in the search view with the query
 *                   and results intact so several foods can go in a row; the
 *                   row's green check is the confirmation and the header's
 *                   "N items · Review" pill is the way back to the shell.
 * Save commits the draft via mealAPI.commit. The draft-basket architecture
 * is unchanged: sessionStorage via mealDraft utils, server-side only on Save.
 */
export default function FoodLogHub({ userId, from }) {
  const router = useRouter();
  // Return to the view the user came from (Insights keeps its tab).
  const dashboardHref =
    from === "insights"
      ? "/dashboard?view=insights"
      : from === "timeline"
        ? "/dashboard?tab=timeline"
        : "/dashboard";

  // "review" (default) | "search"
  const [view, setView] = useState("review");
  const [query, setQuery] = useState("");
  // null | "upload" | "details" | "quickadd"
  const [sheet, setSheet] = useState(null);
  const [pendingFiles, setPendingFiles] = useState(null);
  const [quickAddSeed, setQuickAddSeed] = useState("");
  // Bumped after every draft mutation so the review shell re-reads storage.
  const [draftVersion, setDraftVersion] = useState(0);
  const [draft, setDraft] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  // Draft lives in sessionStorage — client only.
  useEffect(() => {
    setDraft(readDraft());
    setHydrated(true);
  }, [draftVersion]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  }, []);

  // Memoized on the stable draft object — rebuilding it every render would
  // make MealReviewScreen's reset effect wipe live edits on unrelated
  // re-renders (saving flag, toast).
  const initialData = useMemo(
    () => ({
      title: draft?.title || "",
      consumedAt: draft?.consumedAt || null,
      mealType: draft?.mealType || null,
      totals: computeTotals(draft?.items || []),
      items: draft?.items || [],
      imageKeys: draft?.imageKeys || [],
      inputText: draft?.inputText || null,
      confidence: draft?.confidence || null,
      notes: draft?.notes || null,
      tokensUsed: draft?.tokensUsed || { input: 0, output: 0 },
    }),
    [draft]
  );

  // Persist the review shell's current edits into the draft before leaving
  // it (search view / scan sheet), then re-read so state stays canonical.
  const persistFromReview = useCallback((current) => {
    const existing = readDraft();
    // Don't materialize a phantom draft on an untouched empty shell — same
    // guard MealReviewScreen's mirror effect applies. Writing items: [] here
    // would leave an empty draft behind for a user who only peeked at search.
    const untouched =
      !existing &&
      !(current.items?.length > 0) &&
      !current.title &&
      !current.mealType &&
      !current.consumedAt;
    if (untouched) return;
    writeDraft({
      ...(existing || {}),
      items: current.items,
      title: current.title ?? existing?.title ?? null,
      mealType: current.mealType ?? existing?.mealType ?? null,
      consumedAt: current.consumedAt ?? existing?.consumedAt ?? null,
      // currentState() only emits consumedAt once the user has touched the
      // time chip, so its presence here means the pin was deliberate.
      timePinned: Boolean(current.consumedAt) || Boolean(existing?.timePinned),
    });
    setDraftVersion((v) => v + 1);
  }, []);

  const goToSearch = useCallback(
    (current) => {
      persistFromReview(current);
      setQuery("");
      setView("search");
    },
    [persistFromReview]
  );

  const openScan = useCallback(
    (current) => {
      persistFromReview(current);
      setSheet("upload");
    },
    [persistFromReview]
  );

  const backToReview = useCallback(() => {
    setDraftVersion((v) => v + 1);
    setView("review");
  }, []);

  const handleSave = async (payload) => {
    if (!userId) return;
    setSaving(true);
    setSaveError("");
    try {
      // Draft items may carry v3 portion-editing extras (per100g/servings/
      // servingIdx) the backend Meal schema doesn't know — strip at POST time.
      const resp = await mealAPI.commit(userId, { ...payload, items: toCommitItems(payload.items) });
      const saved = resp?.data;
      if (!saved?._id) throw new Error("No meal id returned");
      clearDraft();
      // Land on the dashboard: remount refetches the timeline + macro split,
      // so the just-logged meal is immediately visible.
      router.replace(dashboardHref);
    } catch (err) {
      const serverMsg = err?.response?.data?.message || err?.message;
      setSaveError(serverMsg || "Couldn't save meal. Try again.");
      setSaving(false);
    }
  };

  // Search-view adds: into the basket, and STAY here. Ejecting to the review
  // shell after every add (and wiping the query) made adding a second food a
  // full round trip. FoodResultRow's 1500ms green check is the per-row
  // confirmation and the header count pill shows the basket filling, so no
  // toast here — that would be a third signal for one action.
  const handleAddItem = useCallback((item) => {
    addItems([item]);
    setDraftVersion((v) => v + 1);
  }, []);

  // Quick Add closes its own sheet and drops the user back where they were
  // (the search view). It has no inline confirmation of its own, so this is
  // the one add path that still toasts.
  const handleQuickAdded = useCallback(
    (estimate) => {
      const n = estimate?.items?.length || 0;
      showToast(n === 1 ? `Added ${estimate.items[0].name}` : `Added ${n} items`);
      setDraftVersion((v) => v + 1);
    },
    [showToast]
  );

  // Discard the whole basket (confirmed inside MealReviewScreen). Nothing else
  // clears the draft short of a successful save, so without this an abandoned
  // basket silently merges into the user's next log — including a later
  // BottomNavbar "+" scan.
  const handleDiscard = useCallback(() => {
    clearDraft();
    setSaveError("");
    setDraftVersion((v) => v + 1);
  }, []);

  const openDescribe = (seedText) => {
    setQuickAddSeed(seedText || "");
    setSheet("quickadd");
  };

  if (!hydrated) {
    return <div className="min-h-screen bg-pageBackground" />;
  }

  // Basket size, surfaced in the search header so the user can see items
  // landing without leaving the search view.
  const draftCount = draft?.items?.length || 0;

  return (
    // --meal-nav-offset: this route has no bottom nav, so the reused
    // MealDetailsSheet should hug the bottom edge instead of floating
    // above a nav that isn't there.
    <div style={{ "--meal-nav-offset": "16px" }}>
      {view === "search" ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-pageBackground">
          {/* Header */}
          <div className="mx-auto flex w-full max-w-md items-center gap-3 px-4 pb-3 pt-[max(env(safe-area-inset-top,0px),12px)]">
            <button
              type="button"
              onClick={backToReview}
              aria-label="Back to review"
              className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-pageBackground"
            >
              <ArrowLeft size={20} className="text-black" />
            </button>
            <h1 className="flex-1 text-lg font-semibold tracking-tight text-black">
              Add an item
            </h1>
            {draftCount > 0 && (
              <button
                type="button"
                onClick={backToReview}
                aria-label={`Review ${draftCount} ${draftCount === 1 ? "item" : "items"}`}
                className="inline-flex h-8 flex-shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-semibold text-white transition active:scale-[0.97]"
              >
                {draftCount} {draftCount === 1 ? "item" : "items"}
                <span aria-hidden="true" className="opacity-60">
                  ·
                </span>
                Review
              </button>
            )}
          </div>

          {/* Search bar */}
          <div className="mx-auto w-full max-w-md px-4 pb-3">
            <div className="flex items-center gap-2 rounded-xl border border-borderColor bg-pageBackground px-3 py-2.5">
              <Search size={18} className="flex-shrink-0 text-secondary" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for food"
                className="w-full bg-transparent text-sm text-black outline-none placeholder:text-secondary"
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
          <div className="mx-auto w-full max-w-md flex-1 overflow-y-auto px-4 pb-8">
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
                    <span className="text-sm font-semibold text-black">Scan Food</span>
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
                    <span className="text-sm font-semibold text-black">Quick Add</span>
                    <span className="text-xs text-secondary">Describe it in words</span>
                  </button>
                  {/* Barcode scan — not wired yet; disabled "coming soon" tile */}
                  <div
                    aria-disabled="true"
                    className="relative col-span-2 flex items-center gap-3 rounded-2xl border border-borderColor bg-white px-4 py-4 opacity-70"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                      <ScanBarcode size={22} />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-sm font-semibold text-black">Scan Barcode</span>
                      <span className="text-xs text-secondary">
                        Look up packaged foods instantly
                      </span>
                    </span>
                    <span className="ml-auto rounded-full bg-pageBackground px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-secondary">
                      Coming soon
                    </span>
                  </div>
                </div>

                {/* Recent logs */}
                <div className="mt-7">
                  <h2 className="mb-3 text-base font-semibold tracking-tight text-black">
                    From your past logs
                  </h2>
                  <RecentLogsList userId={userId} onAdd={handleAddItem} />
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <MealReviewScreen
          mode="new"
          userId={userId}
          initialData={initialData}
          imagePreviews={draft?.imagePreviews || []}
          onSave={handleSave}
          onAddMore={goToSearch}
          onScanFood={openScan}
          onDiscard={handleDiscard}
          onBack={() => router.push(dashboardHref)}
          isBusy={saving}
          error={saveError}
        />
      )}

      {/* Toast — Quick Add only (row adds confirm inline with a green check) */}
      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-0 right-0 z-[60] flex justify-center px-4">
          <div className="rounded-full bg-black/85 px-4 py-2 text-sm font-medium text-white shadow-lg">
            {toast}
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
