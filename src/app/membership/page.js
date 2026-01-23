"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { paymentAPI } from "@/services/api";
import Input from "@/components/Input";
import Button from "@/components/Button";
import Navbar from "@/components/Navbar";
import { getNextRoute } from "@/utils/navigationFlow";

export default function MembershipPage() {
  const router = useRouter();
  const { user, token, updateUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subscription, setSubscription] = useState(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [plansLoading, setPlansLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [zip, setZip] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [phone, setPhone] = useState("");
  const [agreePolicies, setAgreePolicies] = useState(false);
  const [agreeBilling, setAgreeBilling] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      const response = await paymentAPI.getAllPlans();
      // API returns envelope with data array
      const plansData = response.data || response;
      if (plansData && Array.isArray(plansData)) {
        setPlans(plansData);
        // Select first plan by default
        if (plansData.length > 0) {
          setSelectedPlan(plansData[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch plans:", err);
      setError("Failed to load membership plans");
    } finally {
      setPlansLoading(false);
    }
  }, []);

  const fetchSubscription = useCallback(async () => {
    try {
      const response = await paymentAPI.getUserSubscription(user.id);
      if (response.data) {
        setSubscription(response.data);
      }
    } catch (err) {
      console.log("No active subscription");
    }
  }, [user?.id]);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    fetchPlans();
    if (user?.id) {
      fetchSubscription();
    }
  }, [token, user?.id, fetchPlans, fetchSubscription, router]);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
    if (user?.phone) setPhone(user.phone);
  }, [user?.email, user?.phone]);

  useEffect(() => {
    if (document.querySelector("script[data-razorpay]") || typeof window === "undefined") {
      setScriptReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpay = "true";
    script.onload = () => setScriptReady(true);
    script.onerror = () => setError("Failed to load payment gateway. Please retry.");
    document.body.appendChild(script);
  }, []);

  const handlePurchase = async () => {
    if (!selectedPlan) {
      setError("Please select a plan");
      return;
    }

    if (!agreePolicies || !agreeBilling) {
      setError("Please agree to the terms and billing authorization.");
      return;
    }

    if (!scriptReady || !window?.Razorpay) {
      setError("Payment gateway not ready. Please refresh and try again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const orderResponse = await paymentAPI.createOrder({
        userId: user.id,
        planType: selectedPlan.id,
        email,
        zip,
        dob: `${dobYear}-${dobMonth}-${dobDay}`,
        phone,
      });

      const { orderId, amount, key_id } = orderResponse.data;

      const options = {
        key: key_id,
        amount,
        currency: "INR",
        name: "Cyborg Healthcare",
        description: selectedPlan.name,
        order_id: orderId,
        handler: async function (response) {
          try {
            const verifyResponse = await paymentAPI.verifyPayment({
              userId: user.id,
              orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              planType: selectedPlan.id,
            });

            if (verifyResponse.data) {
              setSubscription(verifyResponse.data.subscription);
              // Update user context with subscription status
              updateUser({ ...user, hasActiveSubscription: true });
              setLoading(false);
              // Navigate to next step in flow
              const nextRoute = getNextRoute({ ...user, hasActiveSubscription: true });
              router.push(nextRoute);
            }
          } catch (err) {
            setError("Payment verification failed. Please contact support.");
            setLoading(false);
          }
        },
        prefill: {
          email,
          contact: phone,
        },
        theme: {
          color: "#7c3aed",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setError("Payment cancelled");
          },
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (err) {
      setError(err.message || "Failed to create payment order");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pageBackground text-gray-900">
      <Navbar backHref="/dashboard" />

      <main className="max-w-6xl mx-auto px-4 py-6">

        {subscription && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            You already have an active subscription: {subscription.planName}. Expires {new Date(subscription.expiryDate).toLocaleDateString()}.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {plansLoading ? (
          <div className="flex justify-center items-center min-h-96">
            <p className="text-gray-600">Loading plans...</p>
          </div>
        ) : (
          <>
            {/* Plans Grid */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Select a Membership Plan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlan(p)}
                    className={`rounded-2xl p-6 cursor-pointer transition border-2 ${
                      selectedPlan?.id === p.id
                        ? "border-primary bg-primary/5"
                        : "border-tertiary hover:border-primary/50"
                    }`}
                  >
                    {p.highlighted && (
                      <div className="inline-block bg-gradient-to-r from-primary to-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold mb-3">
                        Most Popular
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{p.name}</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-primary">₹{p.price}</span>
                      <span className="text-gray-600 ml-2">/year</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{p.description}</p>
                    <ul className="space-y-2 mb-6">
                      {p.features?.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                          <span className="text-primary">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <div className={`h-1 w-full rounded-full ${selectedPlan?.id === p.id ? "bg-primary" : "bg-gray-200"}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Purchase Section */}
            {selectedPlan && (
              <section className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start font-inter">
                <div className="rounded-2xl bg-white p-5 shadow-sm lg:sticky lg:top-20">
                  <p className="text-lg font-medium text-secondary">Order Summary</p>
                  <div className="mt-4 flex justify-center">
                    <div className="h-48 w-full max-w-xs rounded-xl border border-tertiary bg-gray-50" aria-label="membership artwork placeholder" />
                  </div>

                  <div className="mt-4 text-sm text-gray-800 space-y-3">
                    <p className="font-semibold text-xl">{selectedPlan.name}</p>
                    <p className="font-medium text-[16px] text-secondary">{selectedPlan.description}</p>
                    <div className="flex justify-between font-medium">
                      <span>{selectedPlan.name}</span>
                      <span>₹{selectedPlan.price}</span>
                    </div>
                    <div className="flex justify-between border-t-[1px] border-tertiary pt-2 font-semibold">
                      <span className="text-secondary">Total</span>
                      <span>₹{selectedPlan.price}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl shadow-sm py-5">
                  <h2 className="text-xl font-medium text-black">Purchase Membership</h2>
                  <p className="text-secondary font-medium text-[16px] mt-3">Your membership auto-renews each year. Cancel anytime.</p>
                  <div className="mt-4 space-y-3">
              <Input
                label="Email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />

              <Input
                label="ZIP Code"
                name="zip"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="12345"
              />

              <div>
                <label className="block text-secondary font-medium mb-2 text-sm">Date of Birth</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={dobMonth}
                    onChange={(e) => setDobMonth(e.target.value)}
                    placeholder="MM"
                    className="w-full rounded-xl border border-tertiary px-4 py-3 focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={dobDay}
                    onChange={(e) => setDobDay(e.target.value)}
                    placeholder="DD"
                    className="w-full rounded-xl border border-tertiary px-4 py-3 focus:outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={dobYear}
                    onChange={(e) => setDobYear(e.target.value)}
                    placeholder="YYYY"
                    className="w-full rounded-xl border border-tertiary px-4 py-3 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <Input
                label="Phone"
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91"
              />
            </div>

            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={agreePolicies}
                  onChange={(e) => setAgreePolicies(e.target.checked)}
                  className="mt-1"
                />
                <p className="text-secondary text-[14px]">
                  By checking this box and confirming below, I acknowledge that I have read, understand, and agree to Cyborg&apos;s <span className="text-black">Terms of Service, Informed Medical Consent, Membership Agreement, Privacy Policy and Notice of Medical Group Privacy Practices</span>.
                </p>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={agreeBilling}
                  onChange={(e) => setAgreeBilling(e.target.checked)}
                  className="mt-1"
                />
                <p className="text-secondary text-[14px]">
                  I agree to receive personalized offers & reminders based on my Action Plan & Lab results. I consent to Cyborg using my health data for this. Opt out anytime.
                </p>
              </label>
            </div>

            <div className="mt-5">
              <Button fullWidth size="lg" onClick={handlePurchase} disabled={loading}>
                {loading ? "Processing..." : `Pay ₹${selectedPlan?.price || 199}`}
              </Button>
            </div>
            <p className="text-secondary text-[14px] mt-10">
                By purchasing this subscription, you agree that your membership will automatically renew at the end of each term for the same duration and at the then-current rate, unless you cancel in accordance with the Membership Agreement. You authorize Superpower to charge your payment method for the initial term and any subsequent renewal terms unless canceled. To cancel, email concierge@superpower.com or log into your account and follow the cancellation instructions. No refunds are provided for the remainder of the subscription term after cancellation. For full details, please refer to your Membership Agreement.
            </p>
          </div>
        </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
