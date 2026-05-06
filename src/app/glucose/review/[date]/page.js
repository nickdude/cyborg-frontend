"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { glucoseAPI } from "@/services/api";
import DayReviewWalkthrough from "@/components/DayReviewWalkthrough";

export default function GlucoseDayReviewPage() {
  const { date } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const userId = user?._id || user?.id;

  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || !userId || !date) return;
    let cancelled = false;
    setLoading(true);
    setError("");

    glucoseAPI
      .dayReview(userId, date)
      .then((resp) => {
        if (cancelled) return;
        const data = resp?.data || resp;
        setReviewData(data || null);
      })
      .catch((err) => {
        if (cancelled) return;
        // Backend may not have this endpoint yet -- fall through to mock data
        console.warn("[GlucoseReview] API error, using mock data:", err?.message);
        setReviewData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, userId, date]);

  const handleComplete = () => {
    router.push("/dashboard");
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f5f9] text-sm text-[#6d6f7b]">
        Loading day review...
      </div>
    );
  }

  return (
    <DayReviewWalkthrough
      reviewData={reviewData}
      onComplete={handleComplete}
    />
  );
}
