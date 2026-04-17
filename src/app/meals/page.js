"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { mealAPI } from "@/services/api";

// Group label for a meal's local-date bucket.
function bucketLabel(dateKey, todayKey, yesterdayKey) {
  if (dateKey === todayKey) return "Today";
  if (dateKey === yesterdayKey) return "Yesterday";
  // "Mon, Apr 14" — locale-formatted date.
  const d = new Date(`${dateKey}T00:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function localDateKey(isoDate) {
  const d = new Date(isoDate);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MealsHistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const userId = user?._id || user?.id;

  const [meals, setMeals] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    mealAPI
      .history(userId, 14)
      .then((resp) => {
        if (cancelled) return;
        setMeals(resp?.data?.meals || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.response?.data?.message || "Couldn't load meals.");
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, userId, router]);

  // Group meals by local-date key, preserving newest-first order.
  const groups = useMemo(() => {
    if (!meals) return null;
    const now = new Date();
    const todayKey = localDateKey(now);
    const yesterdayKey = localDateKey(new Date(now.getTime() - 86400000));
    const byDate = new Map();
    for (const m of meals) {
      const key = localDateKey(m.consumedAt);
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key).push(m);
    }
    return Array.from(byDate.entries()).map(([key, items]) => ({
      key,
      label: bucketLabel(key, todayKey, yesterdayKey),
      items,
    }));
  }, [meals]);

  if (authLoading || meals === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f5f9] text-sm text-[#6d6f7b]">
        Loading meals…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f9] pb-28">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-[#e4e6ef] bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4f5f9] text-[#1e2027]"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-[#14151a]">Your meals</h1>
      </header>

      {error && (
        <div className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && groups.length === 0 && (
        <div className="px-4 pt-16 text-center">
          <p className="text-sm text-[#6d6f7b]">
            No meals yet. Tap the + button on the dashboard to log one.
          </p>
        </div>
      )}

      <div className="px-4 pt-4 space-y-6">
        {groups.map((g) => (
          <section key={g.key}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6d6f7b]">
              {g.label}
            </h2>
            <div className="space-y-2">
              {g.items.map((m) => (
                <Link
                  key={m._id}
                  href={`/meals/${m._id}`}
                  className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm transition active:scale-[0.99]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-semibold text-[#14151a]">
                      {m.title || "Untitled meal"}
                    </div>
                    <div className="mt-0.5 text-xs text-[#6d6f7b]">
                      {formatTime(m.consumedAt)}
                      {m.items?.length
                        ? ` · ${m.items.length} item${m.items.length === 1 ? "" : "s"}`
                        : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-[#14151a]">
                      {Math.round(m.totals?.calories || 0)}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-[#6d6f7b]">
                      kcal
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
