"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { paymentAPI, userAPI } from "@/services/api";
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
  // True until we've confirmed (via API) whether the user already has an active
  // plan. While true we render only a loader, so the Membership UI never flickers
  // before a redirect.
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [phone, setPhone] = useState("");
  const [agreePolicies, setAgreePolicies] = useState(false);
  const [agreeBilling, setAgreeBilling] = useState(false);

  // Refs for auto-tab functionality
  const dobDayRef = useRef(null);
  const dobYearRef = useRef(null);

  // Auto-tab handlers for date of birth
  const handleDobMonthChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only digits
    if (value.length <= 2) {
      setDobMonth(value);
      // Auto-advance to day field when 2 digits entered
      if (value.length === 2 && dobDayRef.current) {
        dobDayRef.current.focus();
      }
    }
  };

  const handleDobDayChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only digits
    if (value.length <= 2) {
      setDobDay(value);
      // Auto-advance to year field when 2 digits entered
      if (value.length === 2 && dobYearRef.current) {
        dobYearRef.current.focus();
      }
    }
  };

  const handleDobYearChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only digits
    if (value.length <= 4) {
      setDobYear(value);
    }
  };

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

  // API-backed active-plan gate. If the user already has a valid active plan we
  // never render Membership — we mark the context and redirect to the next step.
  const checkActivePlan = useCallback(async () => {
    if (!user?.id) {
      setCheckingAccess(false);
      return;
    }
    try {
      const response = await paymentAPI.getUserSubscription(user.id);
      const sub = response?.data;
      // Backend already returns only active + non-expired; re-validate defensively.
      const isActive =
        sub &&
        sub.status === "active" &&
        (!sub.expiryDate || new Date(sub.expiryDate) > new Date());

      if (isActive) {
        setSubscription(sub);
        const updatedUser = { ...user, hasActiveSubscription: true };
        updateUser(updatedUser);
        // Skip the Membership step → go to the next appropriate screen.
        router.replace(getNextRoute(updatedUser));
        return; // keep the loader up during redirect (no Membership flicker)
      }
    } catch (err) {
      // Fail open: if the check fails, show Membership so the user isn't blocked.
      console.log("Subscription check failed; showing membership");
    }
    setCheckingAccess(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Hydrate the form from the authoritative profile (DB) rather than relying on
  // the trimmed user object returned by login/social-login. This is what makes
  // Pincode / Mobile / DOB persist across logout → re-login.
  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await userAPI.getProfile(user.id);
      const p = response?.data;
      if (!p) return;

      if (p.firstName) setFirstName(p.firstName);
      if (p.lastName) setLastName(p.lastName);
      if (p.email) setEmail(p.email);
      if (p.phone) setPhone(p.phone);
      if (p.zipCode) setZip(p.zipCode);
      if (p.dateOfBirth) {
        const dob = new Date(p.dateOfBirth);
        setDobMonth(String(dob.getMonth() + 1).padStart(2, "0"));
        setDobDay(String(dob.getDate()).padStart(2, "0"));
        setDobYear(String(dob.getFullYear()));
      }

      // Persist the complete profile into the auth context (and localStorage) so
      // other screens and future sessions have the full set of fields.
      updateUser({ ...user, ...p });
    } catch (err) {
      console.log("Could not load profile; falling back to cached values");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    fetchPlans();
    if (user?.id) {
      checkActivePlan();
      fetchProfile();
    }
  }, [token, user?.id, fetchPlans, checkActivePlan, fetchProfile, router]);

  useEffect(() => {
    if (user?.firstName) setFirstName(user.firstName);
    if (user?.lastName) setLastName(user.lastName);
    if (user?.email) setEmail(user.email);
    if (user?.phone) setPhone(user.phone);
    if (user?.zipCode) setZip(user.zipCode);
    if (user?.dateOfBirth) {
      const dob = new Date(user.dateOfBirth);
      setDobMonth(String(dob.getMonth() + 1).padStart(2, '0'));
      setDobDay(String(dob.getDate()).padStart(2, '0'));
      setDobYear(String(dob.getFullYear()));
    }
  }, [user]);

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

    // Validate all mandatory fields
    if (!firstName || !firstName.trim()) {
      setError("First name is required");
      return;
    }
    if (!lastName || !lastName.trim()) {
      setError("Last name is required");
      return;
    }
    if (!email || !email.trim()) {
      setError("Email is required");
      return;
    }
    if (!zip || !zip.trim()) {
      setError("ZIP code is required");
      return;
    }
    if (!dobMonth || !dobDay || !dobYear) {
      setError("Date of birth is required");
      return;
    }
    if (!phone || !phone.trim()) {
      setError("Phone number is required");
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
        firstName,
        lastName,
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

      <main className="mx-auto w-full max-w-6xl px-4 py-6 lg:max-w-[1200px] lg:px-8 lg:py-10 xl:max-w-[1280px] 2xl:max-w-[1320px]">

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

        {checkingAccess || plansLoading ? (
          <div className="flex justify-center items-center min-h-96">
            <p className="text-gray-600">{checkingAccess ? "Checking your membership…" : "Loading plans..."}</p>
          </div>
        ) : (
          <>
            {/* Plans Grid */}
            <div className="mb-8 lg:mb-14">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 lg:mb-8 lg:text-center lg:text-[32px] lg:leading-tight">Select a Membership Plan</h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:mx-auto lg:max-w-[1040px] lg:gap-8 xl:max-w-[1100px] xl:gap-10">
                {plans.map((p) => {
                  const selected = selectedPlan?.id === p.id;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setSelectedPlan(p)}
                      aria-pressed={selected}
                      className={`relative flex flex-col rounded-3xl bg-white p-5 text-left shadow-sm transition lg:p-7 ${
                        selected
                          ? "ring-2 ring-primary shadow-md"
                          : "ring-1 ring-black/5 hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/40"
                      }`}
                    >
                      {p.highlighted && (
                        <span className="absolute right-4 top-4 z-10 rounded-full bg-gradient-to-r from-primary to-purple-600 px-3 py-1 text-xs font-semibold text-white shadow">
                          Most Popular
                        </span>
                      )}

                      <div className="overflow-hidden rounded-2xl border border-tertiary">
                        <Image
                          src="/assets/plans/plan1.jpg"
                          alt={p.name}
                          width={480}
                          height={240}
                          className="h-44 w-full object-cover lg:h-56"
                        />
                      </div>

                      <h3 className="mt-5 text-2xl font-bold text-gray-900">{p.name}</h3>
                      <p className="mt-2 text-[15px] leading-relaxed text-secondary">{p.description}</p>

                      <ul className="mt-4 space-y-2">
                        {p.features?.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="mt-0.5 text-primary">✓</span>
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-auto flex items-end gap-1 border-t border-tertiary pt-6">
                        <span className="text-3xl font-bold text-primary">₹{p.price?.toLocaleString("en-IN")}</span>
                        <span className="mb-1 text-sm text-secondary">/{p.billingPeriod || "month"}</span>
                      </div>

                      <span
                        className={`mt-4 flex h-10 items-center justify-center rounded-xl text-sm font-semibold transition ${
                          selected ? "bg-primary text-white" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {selected ? "✓ Selected" : "Select plan"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Purchase Section */}
            {selectedPlan && (
              <section className="mx-auto max-w-2xl font-inter lg:max-w-[720px]">
                <div className="rounded-2xl bg-white p-5 shadow-sm lg:rounded-3xl lg:p-8">
                  <h2 className="text-xl font-medium text-black lg:text-2xl">Purchase Membership</h2>
                  <p className="text-secondary font-medium text-[16px] mt-3">Your subscription renews at the end of each term. Cancel anytime.</p>
                  <div className="mt-5 space-y-3 lg:space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  name="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                />
                <Input
                  label="Last Name"
                  name="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>

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
                    onChange={handleDobMonthChange}
                    placeholder="MM"
                    className="w-full rounded-xl border border-tertiary px-4 py-3 focus:outline-none focus:border-primary"
                  />
                  <input
                    ref={dobDayRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={dobDay}
                    onChange={handleDobDayChange}
                    placeholder="DD"
                    className="w-full rounded-xl border border-tertiary px-4 py-3 focus:outline-none focus:border-primary"
                  />
                  <input
                    ref={dobYearRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={dobYear}
                    onChange={handleDobYearChange}
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

            <div className="mt-5 space-y-3 text-sm text-gray-700">
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

            <div className="mt-6">
              <Button fullWidth size="lg" onClick={handlePurchase} disabled={loading}>
                {loading ? "Processing..." : `Pay ₹${(selectedPlan?.price || 0).toLocaleString("en-IN")}`}
              </Button>
            </div>
            <p className="text-secondary text-[14px] mt-8 lg:mt-9">
                By purchasing this subscription, you agree that your membership will automatically renew at the end of each term for the same duration and at the then-current rate, unless you cancel in accordance with the Membership Agreement. You authorize Cyborg to charge your payment method for the initial term and any subsequent renewal terms unless canceled. To cancel, email concierge@cyborg.men or log into your account and follow the cancellation instructions. No refunds are provided for the remainder of the subscription term after cancellation. For full details, please refer to your Membership Agreement.
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
