"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { paymentAPI } from "@/services/api";

function fmtExpiry(sub) {
  // Best-effort: prefer an explicit card expiry, else fall back to subscription expiry.
  const raw = sub?.cardExpiry || sub?.expiryDate || sub?.endDate;
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  return `${d.getMonth() + 1}/${d.getFullYear()}`;
}

export default function BillingSection() {
  const { user } = useAuth();
  const userId = user?.id || user?._id;

  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await paymentAPI.getUserSubscription(userId);
      setSub(res?.data || null);
    } catch (e) {
      setError(e.message || "Failed to load billing information");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const brand = sub?.cardBrand || sub?.paymentMethod;
  const last4 = sub?.cardLast4 || sub?.last4;
  const expiry = fmtExpiry(sub);

  return (
    <section className="rounded-3xl bg-white px-5 py-7 shadow-sm lg:px-10 lg:py-10">
      <h2 className="text-2xl font-semibold text-black lg:text-3xl">Payment Methods</h2>

      <div className="mt-6 lg:mt-8">
        {loading ? (
          <div className="py-10 text-center text-secondary">Loading payment methods…</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : last4 || brand ? (
          <div className="max-w-md rounded-2xl border-2 border-black px-6 py-5">
            <p className="text-xl font-semibold text-black">
              {(brand && String(brand).charAt(0).toUpperCase() + String(brand).slice(1)) || "Card"}
              {last4 ? ` ****${last4}` : ""}
            </p>
            {expiry && <p className="mt-1 text-secondary">Expires on {expiry}</p>}
          </div>
        ) : (
          <div className="max-w-xl rounded-2xl border border-borderColor bg-pageBackground/60 px-6 py-6">
            <p className="font-medium text-black">No saved payment method</p>
            <p className="mt-1 text-sm text-secondary">
              Payments are collected securely at checkout. Start a membership to add a card on file.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-end">
        <Link
          href="/membership"
          className="rounded-xl bg-black px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-900"
        >
          Add payment method
        </Link>
      </div>
    </section>
  );
}
