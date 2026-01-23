"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function Profile() {
  const params = useParams();
  const userId = params.userId;
  const router = useRouter();
  const { user, token, updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({});

  const fetchProfile = useCallback(async () => {
    try {
      const response = await userAPI.getProfile(userId);
      setProfile(response.data);
      setFormData({
        firstName: response.data.firstName || "",
        lastName: response.data.lastName || "",
        biologicalSex: response.data.biologicalSex || "",
        phone: response.data.phone || "",
        dateOfBirth: response.data.dateOfBirth?.split("T")[0] || "",
        addressLine1: response.data.addressLine1 || "",
        addressLine2: response.data.addressLine2 || "",
        city: response.data.city || "",
        state: response.data.state || "",
        zipCode: response.data.zipCode || "",
      });
    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!token) {
      router.push("/login");
    } else {
      fetchProfile();
    }
  }, [token, fetchProfile, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError("");
    setSuccess("");

    try {
      const response = await userAPI.updateProfile(userId, formData);
      setProfile(response.data.user || response.data);
      updateUser({
        ...user,
        firstName: formData.firstName,
        lastName: formData.lastName,
        biologicalSex: formData.biologicalSex,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
      });
      setEditing(false);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pageBackground text-gray-900">
      <Navbar backHref="/dashboard" />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Logo */}
        {/* <div className="mb-8 flex justify-center">
          <Image
            src="/assets/cyborg.png"
            alt="Cyborg"
            width={150}
            height={50}
            priority
          />
        </div> */}

        {/* Title */}
        <h1 className="text-xl font-medium text-black mb-2 text-left">
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

        {editing ? (
          <form onSubmit={handleUpdate} className="space-y-6">
            {/* First Name */}
            <Input
              label="First Name"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="Your first name"
              required
            />

            {/* Last Name */}
            <Input
              label="Last Name"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Your last name"
              required
            />

            {/* Biological Sex */}
            <Select
              label="Biological Sex"
              name="biologicalSex"
              value={formData.biologicalSex}
              onChange={handleInputChange}
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
              onChange={handleInputChange}
              placeholder="Street address"
              required
            />

            {/* Address Line 2 */}
            <Input
              label="Address Line 2"
              name="addressLine2"
              type="text"
              value={formData.addressLine2}
              onChange={handleInputChange}
              placeholder="Apartments, suite, etc. (optional)"
            />

            {/* City */}
            <Select
              label="City"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              options={CITIES}
              placeholder="Select city"
              required
            />

            {/* State */}
            <Select
              label="State"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
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
              onChange={handleInputChange}
              placeholder="Your zipcode"
              required
            />

            {/* Buttons */}
            <div className="pt-4 flex flex-col gap-3">
              <Button
                fullWidth
                size="lg"
                onClick={handleUpdate}
                disabled={updating}
                className="bg-black hover:bg-gray-900 text-white font-bold"
              >
                {updating ? "Updating..." : "Update"}
              </Button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-8">
            {/* Profile Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-tertiary rounded-xl p-4">
                <p className="text-gray-600 text-sm font-medium">First Name</p>
                <p className="font-semibold text-lg mt-1">
                  {profile?.firstName || "—"}
                </p>
              </div>
              <div className="border border-tertiary rounded-xl p-4">
                <p className="text-gray-600 text-sm font-medium">Last Name</p>
                <p className="font-semibold text-lg mt-1">
                  {profile?.lastName || "—"}
                </p>
              </div>
              <div className="border border-tertiary rounded-xl p-4">
                <p className="text-gray-600 text-sm font-medium">Email</p>
                <p className="font-semibold text-lg mt-1">{profile?.email || "—"}</p>
              </div>
              <div className="border border-tertiary rounded-xl p-4">
                <p className="text-gray-600 text-sm font-medium">Phone</p>
                <p className="font-semibold text-lg mt-1">{profile?.phone || "—"}</p>
              </div>
              <div className="border border-tertiary rounded-xl p-4">
                <p className="text-gray-600 text-sm font-medium">Biological Sex</p>
                <p className="font-semibold text-lg mt-1">
                  {profile?.biologicalSex || "—"}
                </p>
              </div>
              <div className="border border-tertiary rounded-xl p-4">
                <p className="text-gray-600 text-sm font-medium">Date of Birth</p>
                <p className="font-semibold text-lg mt-1">
                  {profile?.dateOfBirth
                    ? new Date(profile.dateOfBirth).toLocaleDateString()
                    : "—"}
                </p>
              </div>
              <div className="md:col-span-2 border border-tertiary rounded-xl p-4">
                <p className="text-gray-600 text-sm font-medium">Address</p>
                <p className="font-semibold text-lg mt-1">
                  {profile?.addressLine1 || "—"}
                  {profile?.addressLine2 && `, ${profile.addressLine2}`}
                </p>
                <p className="font-semibold mt-1">
                  {profile?.city && profile?.state && profile?.zipCode
                    ? `${profile.city}, ${profile.state} ${profile.zipCode}`
                    : "—"}
                </p>
              </div>
            </div>

            {/* Edit Button */}
            <Button
              fullWidth
              size="lg"
              onClick={() => setEditing(true)}
              className="bg-black hover:bg-gray-900 text-white font-bold"
            >
              Edit Profile
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}