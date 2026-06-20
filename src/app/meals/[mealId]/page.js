"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { mealAPI } from "@/services/api";
import MealReviewScreen from "@/components/MealReviewScreen";

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

export default function SavedMealPage() {
  const { mealId } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const userId = user?._id || user?.id;

  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dailySummary, setDailySummary] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Load the meal.
  useEffect(() => {
    if (authLoading || !userId || !mealId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    mealAPI
      .get(userId, mealId)
      .then((resp) => {
        if (cancelled) return;
        if (!resp?.data) {
          setError("Meal not found.");
          setMeal(null);
        } else {
          setMeal(resp.data);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const serverMsg = err?.response?.data?.message || err?.message;
        setError(serverMsg || "Couldn't load this meal.");
        setMeal(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, userId, mealId]);

  // Fetch today's summary (for the counter strip on the meal's consumed day).
  useEffect(() => {
    if (!userId) return;
    const dateForSummary = meal?.consumedAt
      ? new Date(meal.consumedAt).toISOString().slice(0, 10)
      : todayUTC();
    let cancelled = false;
    mealAPI
      .summary(userId, dateForSummary)
      .then((resp) => {
        if (!cancelled) setDailySummary(resp?.data || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId, meal?.consumedAt]);

  const handleSave = async (payload) => {
    if (!userId || !mealId) return;
    setBusy(true);
    setError("");
    try {
      const resp = await mealAPI.update(userId, mealId, {
        title: payload.title,
        consumedAt: payload.consumedAt,
      });
      if (resp?.data) setMeal(resp.data);
    } catch (err) {
      const serverMsg = err?.response?.data?.message || err?.message;
      setError(serverMsg || "Couldn't update meal.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!userId || !mealId) return;
    setBusy(true);
    setError("");
    try {
      await mealAPI.delete(userId, mealId);
      router.replace("/dashboard");
    } catch (err) {
      const serverMsg = err?.response?.data?.message || err?.message;
      setError(serverMsg || "Couldn't delete meal.");
      setBusy(false);
    }
  };

  const handleBack = () => router.replace("/dashboard");

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f5f9] text-sm text-[#6d6f7b]">
        Loading meal…
      </div>
    );
  }

  if (!meal) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 bg-[#f4f5f9] px-6 text-center">
        <p className="text-sm text-[#6d6f7b]">{error || "Meal not found."}</p>
        <button
          type="button"
          onClick={handleBack}
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  const initialData = {
    title: meal.title || "",
    consumedAt: meal.consumedAt,
    totals: meal.totals,
    items: meal.items,
    imageKeys: meal.imageKeys,
    inputText: meal.inputText,
    confidence: meal.confidence,
    tokensUsed: meal.tokensUsed,
  };

  return (
    <MealReviewScreen
      mode="saved"
      initialData={initialData}
      imagePreviews={[]}
      dailySummary={dailySummary}
      onSave={handleSave}
      onDelete={handleDelete}
      onBack={handleBack}
      isBusy={busy}
      error={error}
    />
  );
}
