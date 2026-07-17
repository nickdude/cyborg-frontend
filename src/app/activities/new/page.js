"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ActivitySearchSheet from "@/components/ActivitySearchSheet";
import ActivityDetailScreen from "@/components/ActivityDetailScreen";

export default function NewActivityPage() {
  const router = useRouter();
  const from = useSearchParams().get("from");
  const dashboardHref =
    from === "insights"
      ? "/dashboard?view=insights"
      : from === "timeline"
        ? "/dashboard?tab=timeline"
        : "/dashboard";
  const { user, loading: authLoading } = useAuth();
  const userId = user?._id || user?.id;

  const [step, setStep] = useState("search"); // "search" | "detail"
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Guard: redirect to login if not authenticated.
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f5f9] text-sm text-[#6d6f7b]">
        Loading...
      </div>
    );
  }

  if (!user) return null;

  if (step === "detail" && selectedActivity) {
    return (
      <ActivityDetailScreen
        activity={selectedActivity}
        userId={userId}
        onSave={() => router.replace(dashboardHref)}
        onBack={() => {
          setSelectedActivity(null);
          setStep("search");
        }}
      />
    );
  }

  return (
    <ActivitySearchSheet
      userId={userId}
      onSelect={(activity) => {
        setSelectedActivity(activity);
        setStep("detail");
      }}
      onClose={() => router.back()}
    />
  );
}
