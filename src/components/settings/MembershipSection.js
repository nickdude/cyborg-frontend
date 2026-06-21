"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  FlaskConical,
  MessageSquare,
  Dna,
  Tag,
  Repeat,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { paymentAPI } from "@/services/api";

const BENEFITS = [
  { icon: ClipboardList, text: "Personalized action plan backed by the latest science" },
  { icon: FlaskConical, text: "Annual full-body lab testing across 100+ biomarkers" },
  { icon: MessageSquare, text: "Unlimited concierge SMS for bookings, orders, and navigation" },
  { icon: Dna, text: "Access specialty tests for hormones, genetics, toxins" },
  { icon: Tag, text: "Insider prices on 300+ curated longevity products" },
  { icon: Repeat, text: "Additional follow-up testing at insider prices" },
];

function fmtDate(d) {
  if (!d) return null;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function MembershipSection() {
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
      setError(e.message || "Failed to load membership");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.name || "Member";
  const renewal = fmtDate(sub?.expiryDate || sub?.endDate);
  const since = sub?.startDate ? new Date(sub.startDate).getFullYear() : null;
  const isActive = sub && sub.status === "active";

  if (loading) {
    return (
      <section className="rounded-3xl bg-white px-5 py-16 text-center text-secondary shadow-sm">
        Loading your membership…
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-3xl bg-white px-5 py-7 shadow-sm lg:px-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </section>
    );
  }

  if (!isActive) {
    return (
      <section className="rounded-3xl bg-white px-5 py-10 text-center shadow-sm lg:px-10 lg:py-14">
        <h2 className="text-2xl font-semibold text-black lg:text-3xl">No active membership</h2>
        <p className="mx-auto mt-2 max-w-md text-secondary">
          Join Cyborg to unlock full-body lab testing, a personalized action plan, and unlimited concierge.
        </p>
        <Link
          href="/membership"
          className="mt-6 inline-block rounded-xl bg-black px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-900"
        >
          View membership plans
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Current membership summary */}
      <section className="flex flex-col gap-4 rounded-3xl bg-white px-5 py-6 shadow-sm sm:flex-row sm:items-center sm:justify-between lg:px-10 lg:py-8">
        <span className="text-secondary">Current Membership</span>
        <div className="flex flex-wrap items-center gap-x-12 gap-y-4">
          {renewal && (
            <div>
              <p className="text-sm text-secondary">Renewal Date</p>
              <p className="font-medium text-black">{renewal}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-secondary">Manage</p>
            <Link href="/membership" className="font-medium text-black underline-offset-2 hover:underline">
              Membership
            </Link>
            <p className="text-xs text-secondary">Update, cancel, and more</p>
          </div>
        </div>
      </section>

      {/* Membership card */}
      <section className="rounded-3xl bg-white p-5 shadow-sm lg:p-8">
        <div className="relative mx-auto flex aspect-[1.6/1] w-full max-w-md flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 p-6 text-white shadow-lg">
          <p className="text-2xl font-semibold">{fullName}</p>
          <p className="text-sm font-medium text-white/90">
            {sub?.planName || "Cyborg Membership"}
            {since ? ` · Since ${since}` : ""}
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="rounded-3xl bg-white px-5 py-6 shadow-sm lg:px-10 lg:py-9">
        <h3 className="text-lg font-semibold text-black lg:text-xl">Your Cyborg Membership benefits</h3>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:gap-4">
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.text}
                className="flex items-center gap-3 rounded-2xl border border-borderColor bg-pageBackground/40 px-4 py-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm text-black">{b.text}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
