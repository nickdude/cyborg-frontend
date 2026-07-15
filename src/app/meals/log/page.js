"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import FoodLogHub from "@/components/food/FoodLogHub";

export default function LogFoodPage() {
  const router = useRouter();
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

  return <FoodLogHub userId={userId} />;
}
