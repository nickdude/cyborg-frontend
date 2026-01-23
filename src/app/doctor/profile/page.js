"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookie from "js-cookie";
import { useAuth } from "@/contexts/AuthContext";
import HeaderActions from "@/components/HeaderActions";
import { CheckCircle, Loader2 } from "lucide-react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

const SEX_OPTIONS = [
  "Male",
  "Female",
  "Other",
  "Prefer not to say",
];

export default function DoctorProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const userId = user?._id || user?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    biologicalSex: "",
    dateOfBirth: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    bio: "",
  });

  useEffect(() => {
    if (!user) return;
    if (user.userType !== "doctor") {
      router.push("/profile");
      return;
    }

    if (!userId) {
      setError("Missing user id. Please re-login.");
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");
        const token = Cookie.get("authToken");
        const res = await fetch(`${apiUrl}/api/users/${userId}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to load profile");
        }

        const profile = data.data || {};
        setForm({
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          email: profile.email || user.email || "",
          phone: profile.phone || "",
          biologicalSex: profile.biologicalSex || profile.gender || "",
          dateOfBirth: profile.dateOfBirth
            ? new Date(profile.dateOfBirth).toISOString().split("T")[0]
            : "",
          addressLine1: profile.addressLine1 || "",
          addressLine2: profile.addressLine2 || "",
          city: profile.city || "",
          state: profile.state || "",
          zipCode: profile.zipCode || "",
          bio: profile.bio || "",
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, userId, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !userId) {
      setError("Missing user session. Please re-login.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const token = Cookie.get("authToken");
      const res = await fetch(`${apiUrl}/api/users/${userId}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          biologicalSex: form.biologicalSex,
          dateOfBirth: form.dateOfBirth || null,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2,
          city: form.city,
          state: form.state,
          zipCode: form.zipCode,
          phone: form.phone,
          bio: form.bio,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update profile");
      }

      const updatedUser = data.data?.user;
      if (updatedUser) {
        updateUser({ ...user, ...updatedUser });
      }
      setSuccess("Profile updated successfully");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-white font-inter">
      {/* Header */}
      <header className="border-b border-borderColor bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1200px] mx-auto flex h-16 items-center px-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white shadow-lg">
              <span className="text-lg font-bold">YB</span>
            </div>
            <div>
              <h1 className="text-base md:text-lg font-semibold text-black">Doctor Profile</h1>
              <p className="text-xs text-gray-500">Manage your details</p>
            </div>
          </div>

          <div className="ml-auto">
            <HeaderActions />
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 md:px-8 py-6 md:py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Profile</p>
            <h2 className="text-2xl font-bold text-black">Doctor Information</h2>
            <p className="text-gray-500 text-sm">Keep your contact and practice info up to date.</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-borderColor rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="doctor-profile-form"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-purple-800 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>

        <div className="bg-white border border-borderColor rounded-2xl shadow-sm p-4 md:p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {success}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading profile...
            </div>
          ) : (
            <form id="doctor-profile-form" className="space-y-6" onSubmit={handleSubmit}>
              {/* Basic Info */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">First name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-borderColor px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Last name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-borderColor px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Enter last name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    disabled
                    className="w-full rounded-lg border border-borderColor bg-gray-50 px-3 py-2 text-sm text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-borderColor px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Enter phone number"
                  />
                </div>
              </section>

              {/* Demographics */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Biological sex</label>
                  <select
                    name="biologicalSex"
                    value={form.biologicalSex}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-borderColor px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                  >
                    <option value="">Select</option>
                    {SEX_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Date of birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-borderColor px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">ZIP / Postal code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={form.zipCode}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-borderColor px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="e.g. 94107"
                  />
                </div>
              </section>

              {/* Address */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Address line 1</label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={form.addressLine1}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-borderColor px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Street address"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Address line 2</label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={form.addressLine2}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-borderColor px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Apartment, suite, etc."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-borderColor px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">State / Province</label>
                  <input
                    type="text"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-borderColor px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="State"
                  />
                </div>
              </section>

              {/* Bio */}
              <section className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-lg border border-borderColor px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Tell patients about your experience, specialties, and approach."
                />
              </section>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
