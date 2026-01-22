"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import Button from "@/components/Button";
import Input from "@/components/Input";
import SocialButton from "@/components/SocialButton";
import CyborgLogo from "@/components/CyborgLogo";
import { Eye, EyeOff } from "lucide-react";
import { getNextRoute } from "@/utils/navigationFlow";

export default function Login() {
  const [step, setStep] = useState(1); // 1: email, 2: phone, 3: password, 4: otp
  const [loginMethod, setLoginMethod] = useState("email-otp"); // "email-otp", "phone-otp", or "password"
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
  });
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
        
    // Ensure correct method when submitting from password screen
    const activeMethod = step === 3 ? "password" : loginMethod;

    try {
      const loginPayload = {};

      if (activeMethod === "email-otp") {
        loginPayload.email = formData.email;
      } else if (activeMethod === "phone-otp") {
        loginPayload.phone = formData.phone;
      } else if (activeMethod === "password") {
        loginPayload.email = formData.email;
        loginPayload.password = formData.password;
      }

      const response = await authAPI.login(loginPayload); // interceptor returns { success, data }

      if (response?.data?.token) {
        // Login successful with password
        login(response.data.user, response.data.token);
        const nextRoute = getNextRoute(response.data.user);
        router.push(nextRoute);
      } else if (response?.data?.userId) {
        // OTP needed (email or phone)
        setUserId(response.data.userId);
        setStep(4);
      } else {
        setError("Unexpected login response. Please try OTP.");
      }
    } catch (err) {
      const errorMsg = err.message || "Login failed";
      // Check if it's an "already exists" error
      if (errorMsg.toLowerCase().includes("already exists")) {
        setError(
          <span>
            {errorMsg}{" "}
            <Link href="/register" className="underline font-semibold">
              Register here
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
      const response = await authAPI.verifyLoginOTP({
        userId,
        otp,
      });

      login(response.data.user, response.data.token);
      const nextRoute = getNextRoute(response.data.user);
      router.push(nextRoute);
    } catch (err) {
      setError(err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = () => {
    setStep(2);
    setLoginMethod("phone-otp");
    setFormData({ ...formData, email: "", password: "" });
    setError("");
  };

  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 font-inter">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl">
          <div className="mb-8 w-32">
            <CyborgLogo />
          </div>

          <h2 className="text-2xl font-medium text-black mb-2">Sign in with Phone</h2>
          <p className="text-secondary text-sm mb-8">Enter your phone number to continue</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <Input
              type="tel"
              name="phone"
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={handleInputChange}
            />

            <Button fullWidth variant="primary" disabled={loading || !formData.phone} className="mb-4">
              {loading ? "Sending OTP..." : "Send OTP"}
            </Button>
          </form>

          <p className="text-center text-secondary text-sm">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-primary font-semibold hover:underline"
            >
              Back to email
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Password Login Step
  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 font-inter">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl">
          <div className="mb-8 w-32">
            <CyborgLogo />
          </div>

          <h2 className="text-2xl font-medium text-black mb-2">Sign in with Password</h2>
          <p className="text-secondary text-sm mb-8">Enter your email and password</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
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

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
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

            <Link href="/forgot-password" className="text-primary text-sm font-semibold hover:underline block mb-6">
              Forgot password?
            </Link>

            <Button type="submit" fullWidth variant="primary" disabled={loading || !formData.email || !formData.password} className="mb-4">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="text-center text-secondary text-sm">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-primary font-semibold hover:underline"
            >
              Back to email OTP
            </button>
          </p>
        </div>
      </div>
    );
  }

  // OTP Verification Step
  if (step === 4) {
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

  // Main Login Step
  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-inter">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl">
        <div className="mb-8 w-32">
          <CyborgLogo />
        </div>

        <h2 className="text-secondary text-2xl font-medium tracking-wide mb-1 mt-20">Welcome back to Cyborg</h2>
        <h1 className="text-2xl font-medium text-black mb-8">Sign in to your account</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="your.email@example.com"
            required
            className="mb-2"
          />

          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 mb-2">
              We'll send a one-time password to your email for verification.
            </p>
            <button
              type="button"
              onClick={() => {
                setStep(3);
                setLoginMethod("password");
                setError("");
              }}
              className="text-primary text-sm font-semibold hover:underline"
            >
              Use password instead
            </button>
          </div>

          <Button
            type="submit"
            fullWidth
            variant="primary"
            disabled={loading || !formData.email}
            className="mb-4"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </Button>
        </form>

        <p className="text-center text-secondary text-sm mb-4">
          Don't have an account?{" "}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Create one
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
          Sign in with Google
        </SocialButton>

        <SocialButton
          icon="/assets/icons/phone.svg"
          onClick={handlePhoneLogin}
        >
          Sign in using Phone
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
