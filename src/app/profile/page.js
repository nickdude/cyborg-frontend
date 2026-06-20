"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { userAPI } from "@/services/api";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Button from "@/components/Button";

const US_STATES = [
  { label: "Alabama", value: "AL" },
  { label: "Alaska", value: "AK" },
  { label: "Arizona", value: "AZ" },
  { label: "Arkansas", value: "AR" },
  { label: "California", value: "CA" },
  { label: "Colorado", value: "CO" },
  { label: "Connecticut", value: "CT" },
  { label: "Delaware", value: "DE" },
  { label: "Florida", value: "FL" },
  { label: "Georgia", value: "GA" },
  { label: "Hawaii", value: "HI" },
  { label: "Idaho", value: "ID" },
  { label: "Illinois", value: "IL" },
  { label: "Indiana", value: "IN" },
  { label: "Iowa", value: "IA" },
  { label: "Kansas", value: "KS" },
  { label: "Kentucky", value: "KY" },
  { label: "Louisiana", value: "LA" },
  { label: "Maine", value: "ME" },
  { label: "Maryland", value: "MD" },
  { label: "Massachusetts", value: "MA" },
  { label: "Michigan", value: "MI" },
  { label: "Minnesota", value: "MN" },
  { label: "Mississippi", value: "MS" },
  { label: "Missouri", value: "MO" },
  { label: "Montana", value: "MT" },
  { label: "Nebraska", value: "NE" },
  { label: "Nevada", value: "NV" },
  { label: "New Hampshire", value: "NH" },
  { label: "New Jersey", value: "NJ" },
  { label: "New Mexico", value: "NM" },
  { label: "New York", value: "NY" },
  { label: "North Carolina", value: "NC" },
  { label: "North Dakota", value: "ND" },
  { label: "Ohio", value: "OH" },
  { label: "Oklahoma", value: "OK" },
  { label: "Oregon", value: "OR" },
  { label: "Pennsylvania", value: "PA" },
  { label: "Rhode Island", value: "RI" },
  { label: "South Carolina", value: "SC" },
  { label: "South Dakota", value: "SD" },
  { label: "Tennessee", value: "TN" },
  { label: "Texas", value: "TX" },
  { label: "Utah", value: "UT" },
  { label: "Vermont", value: "VT" },
  { label: "Virginia", value: "VA" },
  { label: "Washington", value: "WA" },
  { label: "West Virginia", value: "WV" },
  { label: "Wisconsin", value: "WI" },
  { label: "Wyoming", value: "WY" },
];

const CITIES = [
  { label: "Pleasant Prairie", value: "Pleasant Prairie" },
  { label: "Madison", value: "Madison" },
  { label: "Milwaukee", value: "Milwaukee" },
  { label: "Green Bay", value: "Green Bay" },
  { label: "Appleton", value: "Appleton" },
];

const SEXES = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
  { label: "Prefer not to say", value: "Prefer not to say" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    biologicalSex: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const [existingProfile, setExistingProfile] = useState({
    firstName: "",
    lastName: "",
    biologicalSex: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const normalizeProfile = (profile = {}) => ({
    firstName: profile.firstName || "",
    lastName: profile.lastName || "",
    biologicalSex: profile.biologicalSex || "",
    addressLine1: profile.addressLine1 || "",
    addressLine2: profile.addressLine2 || "",
    city: profile.city || "",
    state: profile.state || "",
    zipCode: profile.zipCode || "",
  });

  const getErrorMessage = (err) => {
    if (!err) return "Failed to update profile";
    if (typeof err === "string") return err;
    if (err.message) return err.message;
    if (err.error) return err.error;
    if (Array.isArray(err.errors) && err.errors.length) {
      return err.errors.map((e) => e.msg || e.message || e).join(", ");
    }
    return "Failed to update profile";
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    if (!formData.biologicalSex) errors.biologicalSex = "Biological sex is required";
    if (!formData.addressLine1.trim()) errors.addressLine1 = "Address line 1 is required";
    if (!formData.city) errors.city = "City is required";
    if (!formData.state) errors.state = "State is required";

    const zip = formData.zipCode.trim();
    if (!zip) errors.zipCode = "ZIP code is required";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const loadProfile = async (userId) => {
    setProfileLoading(true);
    setError("");
    try {
      const response = await userAPI.getProfile(userId);
      const profile = response?.data || {};
      const normalized = normalizeProfile(profile);
      setExistingProfile(normalized);
      setFormData(normalized);
      updateUser({ ...(user || {}), ...profile });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    if (user?.id || user?._id) {
      const fallbackProfile = normalizeProfile(user);
      setExistingProfile(fallbackProfile);
      setFormData(fallbackProfile);
      loadProfile(user.id || user._id);
    }
  }, [token, user?.id, user?._id, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id && !user?._id) {
      setError("Unable to update profile. Please log in again.");
      return;
    }

    if (!validateForm()) {
      setError("Please fix the highlighted fields.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const userId = user.id || user._id;
      const payload = {
        ...formData,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim(),
        zipCode: formData.zipCode.trim(),
      };

      const response = await userAPI.updateProfile(userId, payload);
      const savedUser = response?.data?.user || {};
      const normalized = normalizeProfile(savedUser);

      setExistingProfile(normalized);
      setFormData(normalized);
      updateUser({ ...(user || {}), ...savedUser });
      setSuccess("Profile updated successfully!");
      setFieldErrors({});
      setTimeout(() => {
        setSuccess("");
        router.push("/settings");
      }, 800);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pageBackground pb-10 text-gray-900 font-inter">
      <main className="mx-auto w-full max-w-[1240px] px-4 pt-8 lg:px-8 lg:pt-10">
        <div className="mb-6 flex items-center justify-between lg:mb-8">
          <Link
            href="/settings"
            className="text-secondary text-sm font-semibold hover:text-black flex items-center gap-1"
          >
            <span aria-hidden>←</span>
            <span>Back</span>
          </Link>
        </div>

        <section className="mx-auto max-w-3xl rounded-3xl border border-borderColor bg-white px-5 py-6 shadow-sm lg:px-8 lg:py-8">
          <h1 className="mb-2 text-3xl font-semibold text-gray-900 lg:text-4xl">
            Edit your profile
          </h1>
          <p className="mb-6 text-sm text-secondary lg:mb-8 lg:text-base">
            Keep your personal details up to date.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="grid grid-cols-1 gap-x-5 lg:grid-cols-2">
              <Input
                label="First Name"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                placeholder={existingProfile.firstName || "Your first name"}
                error={fieldErrors.firstName}
                required
              />

              <Input
                label="Last Name"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                placeholder={existingProfile.lastName || "Your last name"}
                error={fieldErrors.lastName}
                required
              />
            </div>

            <Select
              label="Biological Sex"
              name="biologicalSex"
              value={formData.biologicalSex}
              onChange={handleChange}
              options={SEXES}
              placeholder={existingProfile.biologicalSex || "Select sex"}
              error={fieldErrors.biologicalSex}
              required
            />

            <Input
              label="Address Line 1"
              name="addressLine1"
              type="text"
              value={formData.addressLine1}
              onChange={handleChange}
              placeholder={existingProfile.addressLine1 || "Street address"}
              error={fieldErrors.addressLine1}
              required
            />

            <Input
              label="Address Line 2"
              name="addressLine2"
              type="text"
              value={formData.addressLine2}
              onChange={handleChange}
              placeholder={existingProfile.addressLine2 || "Apartments, suite, etc. (optional)"}
            />

            <div className="grid grid-cols-1 gap-x-5 lg:grid-cols-3">
              <Select
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                options={CITIES}
                placeholder={existingProfile.city || "Select city"}
                error={fieldErrors.city}
                required
              />

              <Select
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
                options={US_STATES}
                placeholder={existingProfile.state || "Select State"}
                error={fieldErrors.state}
                required
              />

              <Input
                label="ZIP Code"
                name="zipCode"
                type="text"
                value={formData.zipCode}
                onChange={handleChange}
                placeholder={existingProfile.zipCode || "Your zipcode"}
                error={fieldErrors.zipCode}
                required
              />
            </div>

            <div className="pt-3">
              <Button
                fullWidth
                size="lg"
                type="submit"
                disabled={loading}
                className="bg-black hover:bg-gray-900 text-white font-bold"
              >
                {loading ? "Saving profile..." : "Save Profile"}
              </Button>
            </div>
          </form>

          {profileLoading && (
            <p className="mt-4 text-center text-sm text-secondary">Refreshing profile details...</p>
          )}
        </section>
      </main>
    </div>
  );
}
