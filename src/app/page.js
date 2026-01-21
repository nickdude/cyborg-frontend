"use client";

import Link from "next/link";
import Button from "@/components/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && token) {
      router.push("/dashboard");
    }
  }, [token, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-end p-6">
      <div className="h-[60vh] flex flex-col text-center max-w-xl mx-auto gap-9">
        <h1 className="text-3xl font-semibold text-black font-inter leading-tight">
          Unlock your new<br />health intelligence
        </h1>
        
        <p className="text-xl text-black font-inter font-normal leading-7 px-4">
          100+ lab tests. Every year. Detect early signs of 1,000+ conditions. All for only $17/month
        </p>

        <Button href="/register" variant="primary" size="md" fullWidth>
          Join Today →
        </Button>

        <div className="flex items-center justify-center gap-2 text-sm text-black font-inter mt-[-20px]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>HSA/FSA eligible</span>
        </div>
      </div>
    </div>
  );
}
