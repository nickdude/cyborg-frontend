"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { activityAPI } from "@/services/api";
import dynamic from "next/dynamic";

// Lazy-load the deep screen so recharts stays out of this route's initial bundle.
const ActivityDeepScreen = dynamic(() => import("@/components/ActivityDeepScreen"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f5f9] text-sm text-[#6d6f7b]">
      Loading activity...
    </div>
  ),
});

export default function ActivityDetailPage() {
  const { activityId } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const userId = user?._id || user?.id;

  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!userId) { setLoading(false); return; }
    if (!activityId) return;
    let cancelled = false;
    setLoading(true);
    setError("");

    activityAPI
      .get(userId, activityId)
      .then((resp) => {
        if (cancelled) return;
        const data = resp?.data || resp;
        if (!data) {
          setError("Activity not found.");
        } else {
          setActivity(data);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || "Failed to load activity.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, userId, activityId]);

  const handleBack = () => router.back();

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f5f9] text-sm text-[#6d6f7b]">
        Loading activity...
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 bg-[#f4f5f9] px-6 text-center">
        <p className="text-sm text-[#6d6f7b]">{error || "Activity not found."}</p>
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
    <ActivityDeepScreen
      activity={activity}
      userId={userId}
      onBack={handleBack}
    />
  );
}
