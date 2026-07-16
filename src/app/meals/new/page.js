"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { mealAPI } from "@/services/api";
import MealReviewScreen from "@/components/MealReviewScreen";
import { clearDraft, computeTotals, readDraft, writeDraft } from "@/utils/mealDraft";

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

export default function NewMealPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const userId = user?._id || user?.id;

  const [draft, setDraft] = useState(null);
  const [dailySummary, setDailySummary] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // Read the draft once on mount (readDraft normalizes legacy shapes).
  useEffect(() => {
    setDraft(readDraft());
    setHydrated(true);
  }, []);

  // No draft? Send the user to the Log Food hub so they can start one.
  useEffect(() => {
    if (!hydrated || authLoading) return;
    if (!draft) {
      router.replace("/meals/log");
    }
  }, [hydrated, authLoading, draft, router]);

  // Fetch today's summary in the background so the counter strip is accurate.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    mealAPI
      .summary(userId, todayUTC())
      .then((resp) => {
        if (!cancelled) setDailySummary(resp?.data || null);
      })
      .catch(() => {
        // Non-blocking — the strip just shows zeros if this fails.
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleSave = async (payload) => {
    if (!userId) return;
    setSaving(true);
    setError("");
    try {
      const resp = await mealAPI.commit(userId, payload);
      const saved = resp?.data;
      if (!saved?._id) throw new Error("No meal id returned");
      clearDraft();
      // Land on the dashboard: remount refetches the timeline + macro split,
      // so the just-logged meal is immediately visible.
      router.replace("/dashboard");
    } catch (err) {
      const serverMsg = err?.response?.data?.message || err?.message;
      setError(serverMsg || "Couldn't save meal. Try again.");
      setSaving(false);
    }
  };

  // "Add more" — persist the review edits back into the draft, then return to
  // the hub so search/scan/quick-add can append to the same meal.
  const handleAddMore = (current) => {
    writeDraft({
      ...draft,
      items: current.items,
      title: current.title,
      mealType: current.mealType,
      consumedAt: current.consumedAt,
    });
    router.push("/meals/log");
  };

  // Back keeps the draft — the hub is the place to abandon it.
  const handleBack = () => {
    router.push("/meals/log");
  };

  // Auth still hydrating or draft hasn't loaded yet.
  if (authLoading || !hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pageBackground text-sm text-secondary">
        Loading…
      </div>
    );
  }

  if (!draft) {
    // Redirect effect is about to fire; render nothing.
    return null;
  }

  const initialData = {
    title: draft.title || "",
    consumedAt: draft.consumedAt || new Date(),
    mealType: draft.mealType || null,
    totals: computeTotals(draft.items),
    items: draft.items,
    imageKeys: draft.imageKeys || [],
    inputText: draft.inputText || null,
    confidence: draft.confidence,
    notes: draft.notes,
    tokensUsed: draft.tokensUsed || { input: 0, output: 0 },
  };

  return (
    <MealReviewScreen
      mode="new"
      initialData={initialData}
      imagePreviews={draft.imagePreviews || []}
      dailySummary={dailySummary}
      onSave={handleSave}
      onAddMore={handleAddMore}
      onBack={handleBack}
      isBusy={saving}
      error={error}
    />
  );
}
