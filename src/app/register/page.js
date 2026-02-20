"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import Button from "@/components/Button";
import Input from "@/components/Input";
import SocialButton from "@/components/SocialButton";
import CyborgLogo from "@/components/CyborgLogo";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { getNextRoute } from "@/utils/navigationFlow";

function DoctorToggle({ value, onChange, className = "" }) {
  const isDoctor = value === "doctor";
  return (
    <div className={`flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm ${className}`}>
      <span className="text-gray-800 font-medium">Register as a doctor</span>
      <button
        type="button"
        onClick={() => onChange(isDoctor ? "user" : "doctor")}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isDoctor ? "bg-primary" : "bg-borderColor"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow ${
            isDoctor ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function Register() {
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: phone, 4: email-password, 5: phone-password
  const [registrationMethod, setRegistrationMethod] = useState("email-otp"); // email-otp, email-password, phone-otp, phone-password
  const [useOTP, setUseOTP] = useState(true); // Toggle between OTP and password
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    userType: "user",
  });
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const { login, user, token } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user && token) {
      const nextRoute = getNextRoute(user);
      router.push(nextRoute);
    }
  }, [user, token, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleUserTypeChange = (userType) => {
    setFormData((prev) => ({ ...prev, userType }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (!formData.email && !formData.phone) {
      setError("Please enter an email or phone number");
      setLoading(false);
      return;
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    // Phone validation (10 digits)
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      setError("Please enter a valid 10-digit phone number");
      setLoading(false);
      return;
    }

    // Password validation for password-based registration
    if (!useOTP) {
      if (!formData.password) {
        setError("Password is required");
        setLoading(false);
        return;
      }
      if (formData.password.length < 8) {
        setError("Password must be at least 8 characters");
        setLoading(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }
    }

    try {
      const payload = {
        userType: formData.userType,
      };

      if (formData.email) payload.email = formData.email;
      if (formData.phone) payload.phone = formData.phone;
      if (!useOTP && formData.password) payload.password = formData.password;

      const response = await authAPI.register(payload);

      setUserId(response.data.userId);
      
      // Always go to OTP verification step
      setStep(2);
      if (useOTP) {
        setSuccessMsg("OTP sent successfully! Check your " + (formData.email ? "email" : "phone"));
      } else {
        setSuccessMsg("Account created! Please verify your " + (formData.email ? "email" : "phone") + " with the OTP we sent.");
      }
    } catch (err) {
      const errorMsg = err.message || "Registration failed";
      // Check if it's an "already exists" error
      if (errorMsg.toLowerCase().includes("already exists")) {
        setError(
          <span>
            {errorMsg}{" "}
            <Link href="/login" className="underline font-semibold">
              Go to Login
            </Link>
          </span>
        );
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const type = formData.email ? "email" : "phone";
      await authAPI.verifyOTP({
        userId,
        otp,
        type,
      });

      setSuccessMsg("Email/Phone verified! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError(err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSignUp = () => {
    setStep(3);
    setRegistrationMethod("phone-otp");
    setFormData({ ...formData, email: "", password: "", confirmPassword: "" });
    setError("");
    setSuccessMsg("");
  };

  const handleEmailWithPassword = () => {
    setStep(4);
    setRegistrationMethod("email-password");
    setError("");
    setSuccessMsg("");
  };

  const handlePhoneWithPassword = () => {
    setStep(5);
    setRegistrationMethod("phone-password");
    setFormData({ ...formData, email: "" });
    setError("");
    setSuccessMsg("");
  };

  // OTP Verification Step
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 font-inter">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl">
          <div className="mb-8 w-32">
            <CyborgLogo />
          </div>

          <h2 className="text-2xl font-medium text-black mb-2">Verify OTP</h2>
          <p className="text-secondary text-sm mb-8">
            Enter the 6-digit code sent to{" "}
            <span className="font-semibold text-gray-900">
              {formData.email || formData.phone}
            </span>
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleVerifyOTP}>
            <Input
              type="text"
              placeholder="000000"
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="text-center text-3xl tracking-widest font-semibold mb-6"
            />

            <Button
              type="submit"
              fullWidth
              variant="primary"
              disabled={loading || otp.length !== 6}
              className="disabled:opacity-50 mb-4"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
          </form>

          <p className="text-center text-secondary text-sm">
            Didn&apos;t receive the code?{" "}
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-primary font-semibold hover:underline"
            >
              Change {formData.email ? "email" : "phone"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Phone Sign Up Step
  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 font-inter">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl">
          <div className="mb-8 w-32">
            <CyborgLogo />
          </div>

          <h2 className="text-2xl font-medium text-black mb-2">Sign up with Phone</h2>
          <p className="text-secondary text-sm mb-8">Enter your phone number to get started</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister}>
            <Input
              type="tel"
              name="phone"
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={handleInputChange}
            />

            <DoctorToggle
              value={formData.userType}
              onChange={handleUserTypeChange}
              className="mt-4 mb-3"
            />

            <Button fullWidth variant="primary" disabled={loading || !formData.phone}>
              {loading ? "Sending OTP..." : "Get Started"}
            </Button>
          </form>

          <p className="text-center mt-6 text-secondary text-sm">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-primary font-semibold hover:underline"
            >
              Back to email
            </button>
            {" · "}
            <button
              type="button"
              onClick={handlePhoneWithPassword}
              className="text-primary font-semibold hover:underline"
            >
              Use password instead
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Email with Password Step
  if (step === 4) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 font-inter">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl">
          <div className="mb-8 w-32">
            <CyborgLogo />
          </div>

          <h2 className="text-2xl font-medium text-black mb-2">Create Account</h2>
          <p className="text-secondary text-sm mb-8">Set up your account with email and password</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister}>
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your.email@example.com"
              required
              className="mb-4"
            />

            <div className="relative mb-4">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="At least 8 characters"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[42px] text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Re-enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-[42px] text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <DoctorToggle
              value={formData.userType}
              onChange={handleUserTypeChange}
              className="mt-4 mb-3"
            />

            <Button fullWidth variant="primary" disabled={loading || !formData.email || !formData.password}>
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center mt-6 text-secondary text-sm">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-primary font-semibold hover:underline"
            >
              Back to email signup
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Phone with Password Step
  if (step === 5) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 font-inter">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl">
          <div className="mb-8 w-32">
            <CyborgLogo />
          </div>

          <h2 className="text-2xl font-medium text-black mb-2">Create Account</h2>
          <p className="text-secondary text-sm mb-8">Set up your account with phone and password</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister}>
            <Input
              label="Phone Number"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+1 (555) 000-0000"
              required
              className="mb-4"
            />

            <div className="relative mb-4">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="At least 8 characters"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[42px] text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Re-enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-[42px] text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <DoctorToggle
              value={formData.userType}
              onChange={handleUserTypeChange}
              className="mt-4 mb-3"
            />

            <Button fullWidth variant="primary" disabled={loading || !formData.phone || !formData.password}>
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center mt-6 text-secondary text-sm">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="text-primary font-semibold hover:underline"
            >
              Back to phone signup
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Main Registration Step
  return (
    <div className="min-h-screen flex items-center justify-center font-inter">
      <div className="w-full max-w-md bg-white p-4 pt-20">
        <div className="mb-8 w-32">
          <CyborgLogo />
        </div>

        <h2 className="text-secondary text-2xl font-medium tracking-wide mb-1 mt-20">Welcome to Cyborg</h2>
        <h1 className="text-2xl font-medium text-black  mb-4">Get actionable insights in<br />10 days</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="sushrut.baporikar@gmail.com"
          />

          {!useOTP && (
            <>
              <div className="relative mb-4">
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[42px] text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-[42px] text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </>
          )}

          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 mb-2">
              {useOTP 
                ? "We'll send a one-time password to your email for verification." 
                : "Create a secure password to protect your account. You'll still need to verify your email with an OTP."}
            </p>
            <button
              type="button"
              onClick={() => {
                setUseOTP(!useOTP);
                setFormData({ ...formData, password: "", confirmPassword: "" });
                setError("");
              }}
              className="text-primary text-sm font-semibold hover:underline"
            >
              {useOTP ? "Use password instead" : "Use OTP instead"}
            </button>
          </div>

          <DoctorToggle
            value={formData.userType}
            onChange={handleUserTypeChange}
            className="mb-3"
          />

          <Button
            type="submit"
            fullWidth
            variant="primary"
            disabled={loading || !formData.email || (!useOTP && !formData.password)}
            className="mb-4"
          >
            {loading ? (useOTP ? "Sending OTP..." : "Creating Account...") : "Get Started"}
          </Button>
        </form>

        <p className="text-center text-secondary text-sm mb-4">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Sign in here
          </Link>
        </p>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 border-t border-lightGray"></div>
          <span className="text-gray text-xs">or</span>
          <div className="flex-1 border-t border-lightGray"></div>
        </div>

        <SocialButton
          icon="/assets/icons/google.svg"
          className="mb-3"
        >
          Sign up using Google
        </SocialButton>

        <SocialButton
          icon="/assets/icons/phone.svg"
          onClick={handlePhoneSignUp}
        >
          Sign up using Phone
        </SocialButton>

        <div className="mt-8 pt-6 text-center space-y-1">
          <Link href="/privacy" className="text-secondary hover:text-gray-900 text-lg block">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-secondary hover:text-gray-900 text-lg block">
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
