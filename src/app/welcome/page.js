"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { userAPI } from "@/services/api";
import { getNextRoute } from "@/utils/navigationFlow";

export default function WelcomeFlow() {
  const [step, setStep] = useState(1);

  const next = () => setStep((s) => Math.min(3, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="min-h-screen bg-pageBackground flex items-center justify-center">
      <div className="max-w-md w-full h-[100vh] bg-white shadow-lg p-4 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/welcome/welcome.jpg"
            alt="Welcome background"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="flex justify-between items-center mb-16 relative z-10 text-white ">
          <h1 className="text-2xl font-extrabold tracking-tight">CYBORG</h1>
          <div className="text-sm text-gray-400">Step {step} / 3</div>
        </div>

        <div className="relative z-10">
          {step === 1 && <SlideOne onNext={next} />}
          {step === 2 && <SlideTwo onNext={next} onPrev={prev} />}
          {step === 3 && <SlideThree onPrev={prev} />}
        </div>
      </div>
    </div>
  );
}

function SlideOne({ onNext }) {
  const trackRef = useRef(null);
  const knobRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const KNOB_SIZE = 52; // knob diameter
  const TRACK_PADDING = 4; // inner padding

  // Measure track width for drag bounds
  useEffect(() => {
    const measure = () => {
      if (trackRef.current) {
        const rect = trackRef.current.getBoundingClientRect();
        setTrackWidth(rect.width);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Handle drag interactions (mouse + touch)
  useEffect(() => {
    const handleMove = (clientX) => {
      if (!dragging || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const maxDrag = rect.width - KNOB_SIZE - TRACK_PADDING * 2;
      const delta = Math.min(Math.max(clientX - rect.left - KNOB_SIZE / 2 - TRACK_PADDING, 0), maxDrag);
      setOffset(delta);
    };

    const onMouseMove = (e) => {
      e.preventDefault();
      handleMove(e.clientX);
    };
    
    const onTouchMove = (e) => {
      e.preventDefault();
      handleMove(e.touches[0]?.clientX || 0);
    };

    const onEnd = () => {
      if (!dragging || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const maxDrag = rect.width - KNOB_SIZE - TRACK_PADDING * 2;
      const threshold = maxDrag * 0.7;
      
      if (offset >= threshold) {
        // Success - proceed to next step
        onNext();
      } else {
        // Snap back with animation
        setOffset(0);
      }
      setDragging(false);
    };

    if (dragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onEnd);
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onEnd);
    }

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [dragging, offset, onNext]);

  // Calculate progress percentage
  const maxDrag = trackWidth - KNOB_SIZE - TRACK_PADDING * 2;
  const progress = maxDrag > 0 ? (offset / maxDrag) * 100 : 0;

  return (
    <div className="space-y-8 text-center flex flex-col justify-between min-h-[70vh] items-center font-inter">
      
      <div className="flex flex-col justify-center items-center gap-5">
        <div className="text-[32px] text-white font-medium leading-tight w-2/3">Every body has 100 year potential</div>
        <p className="text-white font-medium text-[16px] leading-relaxed px-10">
            No matter where you come from, your body holds that potential.
        </p>
        <p className="text-white font-medium text-[16px] leading-relaxed px-8">We give you the system to unlock it.</p>
      </div>
      <div className="w-full px-2">
        <div
          ref={trackRef}
          className="relative w-full bg-tertiary/60 rounded-full h-[60px] flex items-center overflow-hidden shadow-inner"
          style={{ padding: `${TRACK_PADDING}px` }}
        >
          {/* Background gradient fill showing progress */}
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-150 ease-out"
            style={{ 
              width: `${Math.min(progress + 15, 100)}%`,
              opacity: dragging ? 0.8 : 0.4
            }}
          />

          {/* Ghost text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-sm font-semibold text-gray-700">
            {progress > 60 ? "Release to unlock!" : "Slide to unlock your potential"}
          </div>

          {/* Draggable knob */}
          <button
            ref={knobRef}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            className="relative z-10 flex items-center justify-center bg-white rounded-full text-2xl font-bold text-black select-none cursor-grab active:cursor-grabbing touch-none"
            style={{
              width: `${KNOB_SIZE}px`,
              height: `${KNOB_SIZE}px`,
              transform: dragging ? `translateX(${offset}px)` : `translateX(${offset}px)`,
              transition: dragging ? 'box-shadow 0.1s ease' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.1s ease',
              boxShadow: dragging 
                ? `0 8px 20px rgba(0, 0, 0, 0.25), 0 4px 8px rgba(0, 0, 0, 0.15)`
                : `0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)`,
            }}
            aria-label="Slide to continue"
          >
            <span style={{ transform: 'translateX(2px)' }}>➜</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function SlideTwo({ onNext, onPrev }) {
  const bullets = [
    "100+ biomarkers tested",
    "A personalized plan than evolves with you",
    "Deep insights across score areas of health and your biological age",
    "24/7 access to your concierge care team, right from your pocket",
    "An ecosystem of the best diagnostics, supplements, Rx’s and more",
  ];

  return (
    <div className="space-y-8 text-center flex flex-col justify-between min-h-[70vh] items-center font-inter text-white">
            <div className="flex flex-col justify-center items-center gap-5">
                    <div className="text-center space-y-2">
                        <p className="text-sm text-gray-500">Payment Successful</p>
                        <div className="text-3xl font-bold leading-tight">Welcome to Cyborg</div>
                    </div>

                    <div className="rounded-xl p-4 space-y-3 bg-white/30">
                        {bullets.map((item) => (
                        <div key={item} className="flex gap-3 text-left text-gray-800 font-bold">
                            <span className="text-white">✓</span>
                            <span className="text-sm leading-relaxed">{item}</span>
                        </div>
                        ))}
                    </div>
            </div>
            <div className=" w-full px-2">
                <button
                onClick={onNext}
                className="flex-1 py-3 w-full transition rounded-lg bg-white text-black font-semibold hover:bg-gray-900"
                >
                Continue
                </button>
            </div>
    </div>
  );
}

function SlideThree({ onPrev }) {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    try {
      // Mark welcome as seen in backend
      await userAPI.markWelcomeSeen(user.id);
      // Update user context
      updateUser({ ...user, hasSeenWelcome: true });
      // Navigate to next step
      const nextRoute = getNextRoute({ ...user, hasSeenWelcome: true });
      router.push(nextRoute);
    } catch (e) {
      console.error("Failed to mark welcome seen", e);
      // Still navigate even if marking fails
      const nextRoute = getNextRoute({ ...user, hasSeenWelcome: true });
      router.push(nextRoute);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 text-center flex flex-col justify-between min-h-[70vh] items-center font-inter text-white">
        <div className="flex flex-col justify-center items-center gap-5">
            <div className="text-[32px] w-1/2 font-bold leading-tight">Let&apos;s get to know you</div>
            <p className="text-gray-700 leading-relaxed px-4 text-sm w-2/3">
                We&apos;re going to ask a few short questions about your health.
            </p>
            <p className="text-gray-700 leading-relaxed px-4 text-sm w-5/6">
                Everything you share - your goals, challenges, & experience - helps us
                personalize your health insights, action plan, and journey with Cyborg.
            </p>
            <div className="text-gray-700 leading-relaxed px-4 text-sm mt-20">
                This is required to schedule your lab test.
                <br />
                Estimated time to complete: 10 min
            </div>
        </div>
      <div className="w-full px-2">
        <button
          onClick={handleContinue}
          disabled={loading}
          className="flex-1 py-3 px-20 w-full rounded-lg bg-white text-black font-semibold hover:bg-gray-900 text-center disabled:opacity-50"
        >
          {loading ? "Loading..." : "Complete Intake"}
        </button>
      </div>
    </div>
  );
}
