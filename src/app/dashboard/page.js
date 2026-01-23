"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { userAPI } from "@/services/api";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const { user, token, logout, loading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      if (user?.id) {
        const response = await userAPI.getProfile(user.id);
        setProfile(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoadingProfile(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!loading) {
      if (!token) {
        router.push("/login");
      } else {
        fetchProfile();
      }
    }
  }, [token, loading, fetchProfile, router]);

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl font-bold">Loading...</div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Cyborg Healthcare</h1>
          <div className="flex gap-4">
            <span className="text-gray-600">Welcome, {user?.firstName || "User"}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome, {profile?.firstName || user?.firstName || "User"}!
          </h2>
          <p className="text-gray-600">Account Type: {user?.userType === "doctor" ? "Doctor" : "Patient"}</p>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Hear About Us */}
          <Link href="/hear-about-us">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
              <h3 className="text-xl font-bold mb-2">🗣️ How did you hear about us?</h3>
              <p className="text-gray-600">Select social, search, or word-of-mouth channels</p>
            </div>
          </Link>
          {/* Membership Plans */}
          <Link href="/membership">
            <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer text-white">
              <h3 className="text-xl font-bold mb-2">🎁 Buy Membership</h3>
              <p className="text-purple-100">Get access to exclusive health features</p>
            </div>
          </Link>

          {/* Profile */}
          <Link href={`/profile/${user?.id}`}>
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
              <h3 className="text-xl font-bold mb-2">👤 My Profile</h3>
              <p className="text-gray-600">View and update your profile information</p>
            </div>
          </Link>

          {/* Onboarding */}
          {!profile?.onboardingCompleted && (
            <Link href="/onboarding">
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer border-2 border-blue-500">
                <h3 className="text-xl font-bold mb-2 text-blue-600">📋 Complete Onboarding</h3>
                <p className="text-gray-600">Complete your health questionnaire</p>
              </div>
            </Link>
          )}

          {/* Blood Reports (Patient Only) */}
          {user?.userType === "user" && (
            <>
              <Link href={`/blood-reports/${user?.id}`}>
                <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
                  <h3 className="text-xl font-bold mb-2">🩸 Blood Reports</h3>
                  <p className="text-gray-600">Upload and view blood reports</p>
                </div>
              </Link>

              <Link href={`/action-plan/${user?.id}`}>
                <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
                  <h3 className="text-xl font-bold mb-2">📊 Action Plan</h3>
                  <p className="text-gray-600">View AI-generated health action plans</p>
                </div>
              </Link>
            </>
          )}

          {/* Chatbot (Doctor Only) */}
          {user?.userType === "doctor" && (
            <Link href="/chatbot">
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
                <h3 className="text-xl font-bold mb-2">💬 Patient Chatbot</h3>
                <p className="text-gray-600">Interact with AI chatbot for patient queries</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
