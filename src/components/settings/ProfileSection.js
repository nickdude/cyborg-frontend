"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Lock, MoreHorizontal, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { userAPI, addressAPI } from "@/services/api";

function ReadField({ label, value, locked = false, hint }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <label className="text-sm font-medium text-secondary">{label}</label>
        {hint && <span className="text-xs text-secondary/70">{hint}</span>}
      </div>
      <div className="flex items-center justify-between rounded-xl border border-borderColor bg-pageBackground/60 px-4 py-3.5">
        <span className={value ? "text-black" : "text-secondary"}>{value || "—"}</span>
        {locked && <Lock className="h-4 w-4 text-secondary/60" />}
      </div>
    </div>
  );
}

function fmtDate(d) {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function ProfileSection() {
  const { user } = useAuth();
  const userId = user?.id || user?._id;

  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
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
      const [profileRes, addressRes] = await Promise.allSettled([
        userAPI.getProfile(userId),
        addressAPI.list(),
      ]);

      if (profileRes.status === "fulfilled") {
        setProfile(profileRes.value?.data || {});
      } else {
        // fall back to cached auth user so the form still renders something real
        setProfile(user || {});
      }

      if (addressRes.status === "fulfilled") {
        setAddresses(addressRes.value?.data || []);
      }
    } catch (e) {
      setError(e.message || "Failed to load your profile");
      setProfile(user || {});
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div className="py-16 text-center text-secondary">Loading your profile…</div>;
  }

  const p = profile || {};

  return (
    <div className="space-y-6 lg:space-y-8">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Personal Information */}
      <section className="rounded-3xl bg-white px-5 py-6 shadow-sm lg:px-10 lg:py-9">
        <h2 className="text-2xl font-semibold text-black lg:text-3xl">Personal Information</h2>
        <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-6 lg:mt-8">
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-2">
            <ReadField label="First Name" value={p.firstName} />
            <ReadField label="Last Name" value={p.lastName} />
          </div>
          <ReadField label="Birth Date" value={fmtDate(p.dateOfBirth)} locked />
          <ReadField label="Biological Sex" value={p.biologicalSex} locked />
        </div>
      </section>

      {/* Contact */}
      <section className="rounded-3xl bg-white px-5 py-6 shadow-sm lg:px-10 lg:py-9">
        <h2 className="text-2xl font-semibold text-black lg:text-3xl">Contact</h2>
        <div className="mt-6 space-y-6 lg:mt-8">
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-2">
            <ReadField label="Email" value={p.email} />
            <ReadField label="Phone" value={p.phone} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-secondary">Active addresses</label>
            <div className="overflow-hidden rounded-2xl border border-borderColor">
              {addresses.length === 0 ? (
                <div className="px-4 py-5 text-sm text-secondary">No addresses on file yet.</div>
              ) : (
                addresses.map((a, i) => (
                  <div
                    key={a.id || i}
                    className={`flex items-start justify-between gap-3 px-4 py-4 ${
                      i !== addresses.length - 1 ? "border-b border-borderColor" : ""
                    }`}
                  >
                    <div>
                      <p className="font-medium text-black">
                        {a.addressLine1 || a.fullName || "Address"}
                        {a.isDefault && (
                          <span className="ml-2 text-sm font-normal text-secondary">· Default address</span>
                        )}
                      </p>
                      <p className="mt-0.5 text-sm text-secondary">
                        {[a.addressLine2, a.city, a.state, a.pincode, a.country]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                    <MoreHorizontal className="mt-1 h-5 w-5 shrink-0 text-secondary/60" />
                  </div>
                ))
              )}
              <Link
                href="/addresses"
                className="flex items-center gap-2 border-t border-borderColor px-4 py-4 text-sm font-medium text-secondary transition hover:text-black"
              >
                <Plus className="h-4 w-4" />
                Add address
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Edit / Password */}
      <section className="rounded-3xl bg-white px-5 py-6 shadow-sm lg:px-10 lg:py-9">
        <h2 className="text-2xl font-semibold text-black lg:text-3xl">Account</h2>
        <p className="mt-2 max-w-xl text-sm text-secondary">
          Update your personal details or change your password by receiving a secure reset link via email.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/profile"
            className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
          >
            Edit profile
          </Link>
          <Link
            href="/forgot-password"
            className="rounded-xl border border-borderColor bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-50"
          >
            Change Password
          </Link>
        </div>
      </section>
    </div>
  );
}
