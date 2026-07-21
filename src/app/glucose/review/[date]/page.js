"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { glucoseAPI } from "@/services/api";
import dynamic from "next/dynamic";

// Lazy-load the walkthrough so recharts stays out of this route's initial bundle.
const DayReviewWalkthrough = dynamic(() => import("@/components/DayReviewWalkthrough"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f5f9] text-sm text-[#6d6f7b]">
      Loading day review...
    </div>
  ),
});

export default function GlucoseDayReviewPage() {
  const { date } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const userId = user?._id || user?.id;

  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setLoading(false);
      return;
    }
    if (!date) return;
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

  const formattedDate = (() => {
    try {
      const d = new Date(date + "T00:00:00");
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch { return date; }
  })();

  return (
    <div className="lg:min-h-screen lg:bg-pageBackground">
      <DayReviewWalkthrough
        reviewData={reviewData ? { ...reviewData, date: formattedDate } : { date: formattedDate }}
        onComplete={handleComplete}
      />
    </div>
  );
}
