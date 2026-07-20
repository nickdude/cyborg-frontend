"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { actionPlanAPI, userAPI } from "@/services/api";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import ActionPlan from "@/components/protocol/ActionPlan";

// Standalone Action Plan route. The full-report view used to live in a tab on
// /protocol; it is now reached directly (Digital Twin "Action plan" card and the
// Timeline journey), while /protocol keeps the daily checklist and goals.
// `?planId=<id>` shows that specific plan (notification / blood-report deep
// links); without it, the latest plan is shown.
export default function ActionPlanHome() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId");

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noActionPlan, setNoActionPlan] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [linkedDoctor, setLinkedDoctor] = useState(undefined); // undefined=unknown, null=none, {name}=linked

  useEffect(() => {
    const uid = user?.id || user?._id;
    if (!uid) return;
    let cancelled = false;
    userAPI
      .getProfile(uid)
      .then((res) => { if (!cancelled) setLinkedDoctor(res?.data?.linkedDoctor || null); })
      .catch(() => { if (!cancelled) setLinkedDoctor(null); });
    return () => { cancelled = true; };
  }, [user]);

  const status = plan?.status;

  const fetchPlan = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const res = planId ? await actionPlanAPI.get(planId) : await actionPlanAPI.getLatest();
      const data = res?.data || res;
      setPlan(data || null);
      setNoActionPlan(false);
      setLoadError(false);
    } catch (err) {
      if (err?.statusCode === 404 || err?.message?.includes("No action plan") || err?.message?.includes("not found")) {
        setPlan(null);
        setNoActionPlan(true);
        setLoadError(false);
      } else if (!silent) {
        setLoadError(true);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [planId]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  // Poll while the plan is still generating.
  useEffect(() => {
    if (status !== "generating" && status !== "pending") return;
    const id = setInterval(() => fetchPlan({ silent: true }), 6000);
    return () => clearInterval(id);
  }, [status, fetchPlan]);

  // Silent live refresh so a doctor approval shows up without a reload.
  useAutoRefresh(useCallback(() => fetchPlan({ silent: true }), [fetchPlan]), { interval: 15000 });

  const handleRetry = async () => {
    setRetrying(true);
    try {
      if (typeof actionPlanAPI.retry === "function" && plan?._id) await actionPlanAPI.retry(plan._id);
      else if (plan?.reportId) await actionPlanAPI.create(plan.reportId);
    } catch {
      /* fall through to a re-fetch */
    }
    await fetchPlan();
    setRetrying(false);
  };

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/dashboard");
  };

  const firstName =
    user?.firstName ||
    user?.name?.split(" ")?.[0] ||
    user?.fullName?.split(" ")?.[0] ||
    user?.email?.split("@")?.[0] ||
    "there";

  const Message = ({ tone = "amber", title, children, cta }) => (
    <div className="mx-auto max-w-md py-20 text-center">
      <div className={`mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full ${tone === "rose" ? "bg-rose-50" : "bg-amber-50"}`}>
        <svg className={`h-6 w-6 ${tone === "rose" ? "text-rose-500" : "text-amber-600"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
      </div>
      <h2 className="text-2xl font-bold text-black">{title}</h2>
      <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-secondary">{children}</p>
      {cta}
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-pageBackground pb-24 font-inter lg:pb-16">
      <div className="mx-auto w-full max-w-[1240px] px-4 pt-6 lg:max-w-[704px] lg:px-8 lg:pt-10">
        <button
          type="button"
          onClick={goBack}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-secondary transition hover:text-black"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Back
        </button>

        {loading && !plan && !noActionPlan ? (
          <div className="py-20 text-center text-sm text-secondary">Loading your action plan…</div>
        ) : loadError && !plan ? (
          <Message
            tone="rose"
            title="Couldn't load your action plan"
            cta={
              <button
                type="button"
                onClick={() => fetchPlan()}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
              >
                Try again
              </button>
            }
          >
            Something went wrong reaching our servers. Your data is safe — please try again.
          </Message>
        ) : noActionPlan ? (
          <Message
            title="No action plan yet"
            cta={
              <Link href="/data?tab=records" className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-900">
                Upload a blood report
              </Link>
            }
          >
            Upload your blood report and we&apos;ll generate your personalized action plan.
          </Message>
        ) : status === "generating" || status === "pending" ? (
          <Message title="Generating your action plan">
            We&apos;re analyzing your results. This usually takes a couple of minutes — this page refreshes automatically.
          </Message>
        ) : status === "failed" ? (
          <Message
            tone="rose"
            title="We couldn't generate your plan"
            cta={
              <button
                type="button"
                onClick={handleRetry}
                disabled={retrying}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:opacity-60"
              >
                {retrying ? "Retrying…" : "Try again"}
              </button>
            }
          >
            Something went wrong while building your action plan. Please try again.
          </Message>
        ) : status === "awaiting_review" ? (
          linkedDoctor === null ? (
            <Message
              title="Add your doctor to review your plan"
              cta={
                <Link href="/settings?tab=profile" className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-900">
                  Add doctor code in Settings
                </Link>
              }
            >
              Your plan is ready for review. Add your doctor&apos;s referral code in Settings — they&apos;ll review it and you&apos;ll appear on their dashboard right away.
            </Message>
          ) : (
            <Message
              title="Your doctor is reviewing your plan"
              cta={
                <Link href="/settings?tab=profile" className="mt-5 inline-block text-sm font-medium text-primary hover:underline">
                  Change doctor code in Settings
                </Link>
              }
            >
              {linkedDoctor?.name ? `Connected to ${linkedDoctor.name}. ` : ""}You&apos;ll be notified the moment your action plan is ready.
            </Message>
          )
        ) : (
          <ActionPlan plan={plan} userName={firstName} />
        )}
      </div>
    </div>
  );
}
