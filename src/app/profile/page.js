"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { userAPI } from "@/services/api";
import Image from "next/image";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Button from "@/components/Button";
import Navbar from "@/components/Navbar";

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
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        biologicalSex: user.biologicalSex || "",
        addressLine1: user.addressLine1 || "",
        addressLine2: user.addressLine2 || "",
        city: user.city || "",
        state: user.state || "",
        zipCode: user.zipCode || "",
      });
    }
  }, [token, user, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await userAPI.updateProfile(user.id, formData);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar backHref="/dashboard" />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/assets/cyborg.png"
            alt="Cyborg"
            width={150}
            height={50}
            priority
          />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Let&apos;s set up your Cyborg account
        </h1>

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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* First Name */}
          <Input
            label="First Name"
            name="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Your first name"
            required
          />

          {/* Last Name */}
          <Input
            label="Last Name"
            name="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Your last name"
            required
          />

          {/* Biological Sex */}
          <Select
            label="Biological Sex"
            name="biologicalSex"
            value={formData.biologicalSex}
            onChange={handleChange}
            options={SEXES}
            placeholder="Select sex"
            required
          />

          {/* Address Line 1 */}
          <Input
            label="Address Line 1"
            name="addressLine1"
            type="text"
            value={formData.addressLine1}
            onChange={handleChange}
            placeholder="Street address"
            required
          />

          {/* Address Line 2 */}
          <Input
            label="Address Line 2"
            name="addressLine2"
            type="text"
            value={formData.addressLine2}
            onChange={handleChange}
            placeholder="Apartments, suite, etc. (optional)"
          />

          {/* City */}
          <Select
            label="City"
            name="city"
            value={formData.city}
            onChange={handleChange}
            options={CITIES}
            placeholder="Select city"
            required
          />

          {/* State */}
          <Select
            label="State"
            name="state"
            value={formData.state}
            onChange={handleChange}
            options={US_STATES}
            placeholder="Select State"
            required
          />

          {/* ZIP Code */}
          <Input
            label="ZIP Code"
            name="zipCode"
            type="text"
            value={formData.zipCode}
            onChange={handleChange}
            placeholder="Your zipcode"
            required
          />

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              fullWidth
              size="lg"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-black hover:bg-gray-900 text-white font-bold"
            >
              {loading ? "Updating..." : "Update"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
