"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { mealAPI } from "@/services/api";
import MealReviewScreen from "@/components/MealReviewScreen";

const DRAFT_KEY = "cyborg.mealDraft";

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

  // Read the draft once on mount.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) setDraft(JSON.parse(raw));
    } catch (e) {
      console.warn("[NewMealPage] Failed to parse meal draft:", e?.message);
    }
    setHydrated(true);
  }, []);

  // If there's no draft and auth has settled, bounce back to the dashboard.
  useEffect(() => {
    if (!hydrated || authLoading) return;
    if (!draft) {
      router.replace("/dashboard");
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
      sessionStorage.removeItem(DRAFT_KEY);
      router.replace("/meals");
    } catch (err) {
      const serverMsg = err?.response?.data?.message || err?.message;
      setError(serverMsg || "Couldn't save meal. Try again.");
      setSaving(false);
    }
  };

  const handleBack = () => {
    sessionStorage.removeItem(DRAFT_KEY);
    router.replace("/dashboard");
  };

  // Auth still hydrating or draft hasn't loaded yet.
  if (authLoading || !hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f5f9] text-sm text-[#6d6f7b]">
        Loading…
      </div>
    );
  }

  if (!draft) {
    // Redirect effect is about to fire; render nothing.
    return null;
  }

  // Normalize the draft.estimate into the shape MealReviewScreen expects.
  const initialData = {
    title: draft.estimate?.title || "",
    consumedAt: new Date(),
    totals: draft.estimate?.totals,
    items: draft.estimate?.items,
    imageKeys: draft.imageKeys || [],
    inputText: null,
    confidence: draft.estimate?.confidence,
    notes: draft.estimate?.notes,
    tokensUsed: draft.estimate?.tokensUsed || { input: 0, output: 0 },
  };

  return (
    <MealReviewScreen
      mode="new"
      initialData={initialData}
      imagePreviews={draft.imagePreviews || []}
      dailySummary={dailySummary}
      onSave={handleSave}
      onBack={handleBack}
      isBusy={saving}
      error={error}
    />
  );
}
