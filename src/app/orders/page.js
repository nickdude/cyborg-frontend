"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { purchaseHistoryAPI } from "@/services/api";
import { formatPaise } from "@/utils/money";

const STATUS_COLORS = {
  Delivered: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
  Returned: "bg-amber-100 text-amber-700",
  Refunded: "bg-gray-200 text-gray-700",
  Active: "bg-green-100 text-green-700",
  Expired: "bg-gray-200 text-gray-600",
  Pending: "bg-amber-100 text-amber-700",
};
const badge = (s) => STATUS_COLORS[s] || "bg-purple-100 text-primary";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function OrdersPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [tab, setTab] = useState("orders");
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
      setError(e.message || "Failed to load purchases");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    load();
  }, [token, load, router]);

  const tabs = [
    { id: "orders", label: `Product Orders (${data.orders.length})` },
    { id: "plans", label: `Plans (${data.plans.length})` },
  ];

  return (
    <div className="min-h-screen bg-pageBackground pb-24">
      <div className="mx-auto w-full max-w-[900px] px-4 py-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900">My Purchases</h1>

        <div className="mt-4 flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${tab === t.id ? "bg-black text-white" : "bg-gray-100 text-secondary hover:bg-gray-200"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="mt-10 text-center text-gray-500">Loading…</div>
        ) : tab === "orders" ? (
          data.orders.length === 0 ? (
            <div className="mt-16 text-center">
              <p className="text-lg font-medium text-gray-700">No product orders yet</p>
              <Link href="/market-place" className="mt-4 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white">Shop the Marketplace</Link>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {data.orders.map((o) => (
                <Link key={o.id} href={`/orders/${o.id}`} className="block rounded-2xl border border-borderColor bg-white p-4 transition hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-500">{o.orderNumber} · {fmtDate(o.createdAt)}</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {o.items.slice(0, 2).map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
                        {o.items.length > 2 ? ` +${o.items.length - 2} more` : ""}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">{o.itemCount} item(s) · {formatPaise(o.totalAmount, o.currency)} · Payment: {o.paymentStatus}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${badge(o.orderStatus)}`}>{o.orderStatus}</span>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : data.plans.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-lg font-medium text-gray-700">No plans purchased yet</p>
            <Link href="/membership" className="mt-4 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white">View Membership</Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {data.plans.map((p) => (
              <div key={p.id} className="rounded-2xl border border-borderColor bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{p.planName}</p>
                    <p className="mt-1 text-sm text-gray-500">Purchased {fmtDate(p.purchaseDate)} · {formatPaise(p.amount, p.currency)}</p>
                    <p className="text-sm text-gray-500">{fmtDate(p.startDate)} → {fmtDate(p.endDate)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${badge(p.status)}`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
