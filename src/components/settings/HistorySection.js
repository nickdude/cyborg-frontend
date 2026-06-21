"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { purchaseHistoryAPI } from "@/services/api";
import { formatPaise } from "@/utils/money";

function monthKey(d) {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "Other";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
}

function fmtDate(d) {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function HistorySection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await purchaseHistoryAPI.get();
      const data = res?.data || { plans: [], orders: [] };

      const planItems = (data.plans || []).map((p) => ({
        key: `plan-${p.id}`,
        title: p.planName || "Cyborg Membership",
        subtitle: p.amount != null ? formatPaise(p.amount, p.currency) : "Included",
        date: p.purchaseDate || p.startDate,
        category: "Membership",
      }));

      const orderItems = (data.orders || []).map((o) => ({
        key: `order-${o.id}`,
        title:
          o.items && o.items.length
            ? o.items.map((i) => i.productName).slice(0, 2).join(", ") +
              (o.items.length > 2 ? ` +${o.items.length - 2} more` : "")
            : o.orderNumber || "Order",
        subtitle: o.totalAmount != null ? formatPaise(o.totalAmount, o.currency) : "",
        date: o.createdAt,
        category: "Service",
        href: `/orders/${o.id}`,
      }));

      const merged = [...planItems, ...orderItems].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setItems(merged);
    } catch (e) {
      setError(e.message || "Failed to load purchase history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Group by month, preserving the already-sorted order.
  const groups = [];
  const groupIndex = {};
  for (const item of items) {
    const key = monthKey(item.date);
    if (groupIndex[key] === undefined) {
      groupIndex[key] = groups.length;
      groups.push({ key, items: [] });
    }
    groups[groupIndex[key]].items.push(item);
  }

  return (
    <section className="rounded-3xl bg-white px-5 py-7 shadow-sm lg:px-10 lg:py-9">
      {loading ? (
        <div className="py-10 text-center text-secondary">Loading history…</div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : groups.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-lg font-medium text-black">No purchase history yet</p>
          <p className="mt-1 text-sm text-secondary">Your orders and memberships will appear here.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map((group) => {
            const [month, year] = group.key.split(" ");
            return (
              <div key={group.key}>
                <h3 className="text-2xl font-semibold lg:text-3xl">
                  <span className="text-black">{month}</span>{" "}
                  <span className="text-secondary/70">{year}</span>
                </h3>
                <div className="mt-4 divide-y divide-borderColor">
                  {group.items.map((item) => {
                    const Row = (
                      <div className="flex items-center justify-between gap-4 py-4">
                        <div className="flex items-center gap-4">
                          <span className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-orange-400 to-red-500" />
                          <div>
                            <p className="font-medium text-black">{item.title}</p>
                            {item.subtitle && (
                              <p className="text-sm text-secondary">{item.subtitle}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm text-black">{fmtDate(item.date)}</p>
                          </div>
                          <span className="hidden text-sm text-secondary sm:inline">
                            {item.category}
                          </span>
                          <MoreVertical className="h-5 w-5 text-secondary/50" />
                        </div>
                      </div>
                    );
                    return item.href ? (
                      <Link key={item.key} href={item.href} className="block transition hover:bg-gray-50">
                        {Row}
                      </Link>
                    ) : (
                      <div key={item.key}>{Row}</div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
