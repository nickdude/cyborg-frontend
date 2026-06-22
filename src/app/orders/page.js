"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { purchaseHistoryAPI } from "@/services/api";
import { formatPaise } from "@/utils/money";

// Real order statuses are normalized (case-insensitive) into Active vs Past.
const ACTIVE_STATUSES = new Set([
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "scheduled",
]);
const PAST_STATUSES = new Set([
  "delivered",
  "completed",
  "cancelled",
  "canceled",
  "returned",
  "refunded",
]);

function bucketOf(order) {
  const s = String(order?.orderStatus || "").toLowerCase();
  if (PAST_STATUSES.has(s)) return "past";
  if (ACTIVE_STATUSES.has(s)) return "active";
  // Unknown statuses default to active so nothing silently disappears.
  return "active";
}

const STATUS_BADGE = {
  Delivered: "bg-green-50 text-green-700",
  Completed: "bg-green-50 text-green-700",
  Confirmed: "bg-green-50 text-green-700",
  Shipped: "bg-blue/10 text-blue",
  Processing: "bg-blue/10 text-blue",
  Scheduled: "bg-orange-50 text-orange-600",
  Pending: "bg-amber-50 text-amber-700",
  Cancelled: "bg-red-50 text-red-700",
  Returned: "bg-amber-50 text-amber-700",
  Refunded: "bg-gray-100 text-secondary",
};
const badge = (s) => STATUS_BADGE[s] || "bg-primary/10 text-primary";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const TABS = [
  { id: "all", label: "All orders" },
  { id: "active", label: "Active orders" },
  { id: "past", label: "Past orders" },
];

function OrderCard({ order }) {
  const title =
    order.items?.length
      ? order.items
          .slice(0, 2)
          .map((i) => i.productName)
          .join(", ") + (order.items.length > 2 ? ` +${order.items.length - 2} more` : "")
      : order.orderNumber || "Cyborg Order";

  return (
    <Link
      href={`/orders/${order.id}`}
      className="flex items-center gap-4 rounded-2xl border border-borderColor bg-white p-4 transition hover:shadow-md"
    >
      <div className="min-w-0 flex-1">
        <span
          className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${badge(order.orderStatus)}`}
        >
          {order.orderStatus}
        </span>
        <p className="mt-2 truncate text-base font-medium text-blue">{title}</p>
        <p className="mt-0.5 text-sm text-secondary">
          {fmtDate(order.createdAt)} · {formatPaise(order.totalAmount, order.currency)}
        </p>
      </div>
      <svg
        className="h-5 w-5 shrink-0 text-secondary"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </Link>
  );
}

function EmptyState({ title, subtitle }) {
  return (
    <div className="mt-6 flex flex-col items-center justify-center rounded-3xl border border-dashed border-borderColor bg-white/40 px-6 py-20 text-center">
      <p className="text-lg font-medium text-blue">{title}</p>
      <p className="mt-1 text-sm text-secondary">{subtitle}</p>
    </div>
  );
}

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();

  const tabParam = searchParams.get("tab");
  const tab = TABS.some((t) => t.id === tabParam) ? tabParam : "all";

  const [data, setData] = useState({ plans: [], orders: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await purchaseHistoryAPI.get();
      setData(res.data || { plans: [], orders: [] });
    } catch (e) {
      setError(e.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    load();
  }, [token, load, router]);

  const { active, past } = useMemo(() => {
    const a = [];
    const p = [];
    for (const o of data.orders || []) {
      (bucketOf(o) === "past" ? p : a).push(o);
    }
    return { active: a, past: p };
  }, [data.orders]);

  const selectTab = (id) => {
    router.push(id === "all" ? "/orders" : `/orders?tab=${id}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-pageBackground pb-24 font-inter md:pb-10">
      <div className="mx-auto w-full max-w-[820px] px-4 py-8 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-blue">Your tests</h1>

        {/* Tabs */}
        <div className="mt-5 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTab(t.id)}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
                tab === t.id
                  ? "bg-blue text-white"
                  : "border border-borderColor bg-white text-secondary hover:text-blue"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-16 text-center text-secondary">Loading…</div>
        ) : (
          <div className="mt-6">
            {/* Active section: shown in "all" and "active" */}
            {tab !== "past" && (
              <section>
                <h2 className="text-xl font-semibold text-blue">Active orders</h2>
                {active.length === 0 ? (
                  <EmptyState
                    title="No active orders"
                    subtitle="You have no active orders right now."
                  />
                ) : (
                  <div className="mt-4 space-y-3">
                    {active.map((o) => (
                      <OrderCard key={o.id} order={o} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Past section: shown in "all" and "past" */}
            {tab !== "active" && (
              <section className={tab === "all" ? "mt-10" : ""}>
                {tab === "all" && (
                  <h2 className="text-xl font-semibold text-blue">Past orders</h2>
                )}
                {past.length === 0 ? (
                  <EmptyState
                    title="No past orders"
                    subtitle="You have no completed orders."
                  />
                ) : (
                  <div className="mt-4 space-y-3">
                    {past.map((o) => (
                      <OrderCard key={o.id} order={o} />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-pageBackground font-inter">
          <div className="mx-auto w-full max-w-[820px] px-4 py-8 lg:px-8">
            <div className="mt-16 text-center text-secondary">Loading…</div>
          </div>
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
