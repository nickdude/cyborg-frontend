"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import FoodLogHub from "@/components/food/FoodLogHub";

/**
 * /meals/new — kept alive as an alias of the Log Food review shell.
 * BottomNavbar's "+" scan flow and MealDetailsSheet push here after an AI
 * analyze; it renders the exact same review-first flow as /meals/log so the
 * two routes never diverge. Commit-time item stripping (toCommitItems) and
 * Save/Add-more handling live inside FoodLogHub.
 */
export default function NewMealPage() {
  const router = useRouter();
  // Where the user came from (e.g. the Insights view) — preserved through the flow.
  const from = useSearchParams().get("from");
  const { user, loading: authLoading } = useAuth();
  const userId = user?._id || user?.id;

  // Guard: redirect to login if not authenticated.
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pageBackground text-sm text-secondary">
        Loading...
      </div>
    );
  }

  if (!user) return null;

  return <FoodLogHub userId={userId} from={from} />;
}
