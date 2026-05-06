"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { mealAPI, foodScoreAPI } from "@/services/api";
import FoodScoreScreen from "@/components/FoodScoreScreen";

export default function MealScorePage() {
  const { mealId } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const userId = user?._id || user?.id;

  const [meal, setMeal] = useState(null);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || !userId || !mealId) return;
    let cancelled = false;
    setLoading(true);
    setError("");

    Promise.all([
      mealAPI.get(userId, mealId).catch(() => null),
      foodScoreAPI.get(userId, mealId).catch(() => null),
    ])
      .then(([mealResp, scoreResp]) => {
        if (cancelled) return;
        const mealData = mealResp?.data || mealResp;
        const scoreData = scoreResp?.data || scoreResp;

        if (!mealData) {
          setError("Meal not found.");
        } else {
          setMeal(mealData);
          setScore(scoreData || null);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || "Failed to load meal score.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, userId, mealId]);

  const handleBack = () => router.back();

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f5f9] text-sm text-[#6d6f7b]">
        Loading score...
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
          Go back
        </button>
      </div>
    );
  }

  return (
    <FoodScoreScreen
      meal={meal}
      score={score}
      userId={userId}
      onBack={handleBack}
    />
  );
}
