"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { goalsAPI, actionPlanAPI } from "@/services/api";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import GoalDetail from "@/components/GoalDetail";
import ProtocolIntro from "@/components/protocol/ProtocolIntro";
import ActionPlan from "@/components/protocol/ActionPlan";
import { supplementImage } from "@/utils/supplementImage";
import { supplementInfo } from "@/utils/supplementInfo";

const TIMING_LABELS = {
  morning_fasted: "Morning (Fasted)",
  with_breakfast: "With Breakfast",
  with_food: "With Food",
  pre_workout: "Pre-Workout",
  post_workout: "Post-Workout",
  with_dinner: "With Dinner",
  bedtime: "Bedtime",
};

function formatPrice(price) {
  if (price == null || price === "") return null;
  if (typeof price === "number") return `₹${price.toFixed(2).replace(/\.00$/, "")}`;
  const str = String(price).trim();
  if (!str) return null;
  return str.startsWith("₹") ? str : `₹${str}`;
}

function buildSubtitle(item) {
  const parts = [];
  if (item.dosing) parts.push(item.dosing);
  const timing = TIMING_LABELS[item.timing] || item.timing;
  if (timing) parts.push(timing);
  return parts.join(" · ");
}

// Clean supplement-bottle illustration; cap/label accent varies by index so the
// list reads like a real product shelf (matches superpower's white-bottle look).
const BOTTLE_ACCENTS = ["#3b82f6", "#14b8a6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];
function SupplementBottle({ index = 0 }) {
  const c = BOTTLE_ACCENTS[index % BOTTLE_ACCENTS.length];
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center lg:h-16 lg:w-16" aria-hidden="true">
      <svg viewBox="0 0 56 72" width="50" height="64">
        <rect x="18" y="3" width="20" height="11" rx="2.5" fill={c} />
        <rect x="18" y="9.5" width="20" height="4" rx="1.5" fill="rgba(0,0,0,0.14)" />
        <rect x="20.5" y="13" width="15" height="5" fill="#e6e6ea" />
        <rect x="10" y="17" width="36" height="50" rx="7" fill="#f3f3f5" stroke="#e3e3e7" />
        <rect x="13.5" y="21" width="5" height="42" rx="2.5" fill="#ffffff" fillOpacity="0.75" />
        <rect x="14" y="31" width="28" height="27" rx="3" fill="#ffffff" stroke="#ededf1" />
        <rect x="18" y="36" width="20" height="3" rx="1.5" fill={c} fillOpacity="0.85" />
        <rect x="18" y="43" width="16" height="2.4" rx="1.2" fill="#cccccf" />
        <rect x="18" y="48" width="18" height="2.4" rx="1.2" fill="#cccccf" />
      </svg>
    </div>
  );
}

function ProtocolRow({ item, index = 0, onOpen }) {
  const subtitle = buildSubtitle(item);
  const price = formatPrice(item.price);
  const img = item.image || supplementImage(item.productName);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(item)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen?.(item); } }}
      className="flex cursor-pointer items-center gap-3 px-4 py-4 transition hover:bg-pageBackground/50 lg:gap-4 lg:px-5 lg:py-5"
    >
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt={item.productName} className="h-14 w-14 shrink-0 rounded-xl border border-borderColor bg-white object-contain p-1 lg:h-16 lg:w-16" />
      ) : (
        <SupplementBottle index={index} />
      )}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium text-black lg:text-base">{item.productName}</h3>
        <div className="mt-0.5 flex items-center gap-x-2 text-xs text-secondary lg:text-sm">
          {price && <span className="shrink-0 font-medium text-blue">{price}</span>}
          {price && subtitle && <span className="shrink-0 text-borderColor">·</span>}
          {subtitle && <span className="min-w-0 flex-1 truncate">{subtitle}</span>}
          {!price && !subtitle && <span>Recommended for you</span>}
        </div>
      </div>
      <Link
        href="/market-place"
        onClick={(e) => e.stopPropagation()}
        className="flex-shrink-0 rounded-full bg-black px-5 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-900 lg:px-6 lg:py-2.5 lg:text-sm"
      >
        Buy
      </Link>
    </div>
  );
}

/* Clean white supplement-bottle glyph (matches Superpower's detail modal icon). */
function BottleGlyph({ px = 44 }) {
  const s = Math.round(px * 0.66);
  return (
    <span className="grid shrink-0 place-items-center overflow-hidden rounded-xl border border-borderColor bg-white" style={{ width: px, height: px }}>
      <svg viewBox="0 0 56 72" width={s} height={s} aria-hidden="true">
        <rect x="18" y="3" width="20" height="11" rx="2.5" fill="#3b82f6" />
        <rect x="18" y="9.5" width="20" height="4" rx="1.5" fill="rgba(0,0,0,0.14)" />
        <rect x="20.5" y="13" width="15" height="5" fill="#e6e6ea" />
        <rect x="10" y="17" width="36" height="50" rx="7" fill="#f3f3f5" stroke="#e3e3e7" />
        <rect x="13.5" y="21" width="5" height="42" rx="2.5" fill="#ffffff" fillOpacity="0.75" />
        <rect x="14" y="31" width="28" height="27" rx="3" fill="#ffffff" stroke="#ededf1" />
        <rect x="18" y="36" width="20" height="3" rx="1.5" fill="#3b82f6" fillOpacity="0.85" />
        <rect x="18" y="43" width="16" height="2.4" rx="1.2" fill="#cccccf" />
        <rect x="18" y="48" width="18" height="2.4" rx="1.2" fill="#cccccf" />
      </svg>
    </span>
  );
}

/* Protocol item detail (Superpower-style) — opens when a "today's plan" row is tapped. */
function ProtocolItemModal({ item, onClose }) {
  useEffect(() => {
    if (!item) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [item, onClose]);
  if (!item) return null;
  const timing = TIMING_LABELS[item.timing] || item.timing || "";
  const tl = timing.toLowerCase();
  const timingPhrase = timing ? (tl.startsWith("with") || tl.startsWith("pre") || tl.startsWith("post") ? tl : `at ${tl}`) : "";
  const title = timingPhrase ? `Take ${item.productName} ${timingPhrase}` : `Take ${item.productName}`;
  const bullets = [];
  if (item.dosing) bullets.push(item.dosing);
  if (timing) bullets.push(`Take ${tl}`);
  if (item.howToTake && !bullets.includes(item.howToTake)) bullets.push(item.howToTake);
  if (bullets.length === 0) bullets.push("Recommended as part of your protocol");
  const triggers = Array.isArray(item.triggerBiomarkers) ? item.triggerBiomarkers.filter(Boolean) : [];
  const info = supplementInfo(item, timing);
  const why = item.whyItMatters || info.why;
  const how = item.howToTake || info.how;
  const evidence = info.evidence;
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/25 p-4 backdrop-blur-md sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-[680px] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-9 sm:pt-8">
          <div className="flex items-center gap-4">
            <BottleGlyph px={52} />
            <div>
              <h2 className="text-[20px] font-semibold leading-snug text-black sm:text-[23px]">{title}</h2>
              <p className="mt-0.5 text-[15px] text-secondary">Supplement</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-secondary transition hover:bg-pageBackground hover:text-black">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 pb-9 pt-6 sm:px-9">
          {/* product row */}
          <Link href="/market-place" className="flex items-center gap-4 rounded-2xl border border-borderColor bg-pageBackground/50 p-4 transition hover:bg-pageBackground">
            <BottleGlyph px={46} />
            <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-black sm:text-base">{item.productName}</span>
            <svg className="h-5 w-5 shrink-0 text-secondary" viewBox="0 0 24 24" fill="none"><path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>

          {/* instruction bullets */}
          <ul className="mt-7 space-y-3.5">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3 text-[16px] leading-relaxed text-black">
                <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-secondary/70" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          {triggers.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {triggers.map((t) => (
                <span key={t} className="rounded-full bg-pageBackground px-3 py-1.5 text-[13px] font-medium text-secondary">{t}</span>
              ))}
            </div>
          )}

          {why && (
            <div className="mt-8 border-t border-borderColor pt-7">
              <h3 className="text-[17px] font-semibold text-black">Why We Recommend This</h3>
              <p className="mt-2.5 text-[16px] leading-relaxed text-secondary">{why}</p>
            </div>
          )}
          {how && (
            <div className="mt-7">
              <h3 className="text-[17px] font-semibold text-black">How to take this?</h3>
              <p className="mt-2.5 text-[16px] leading-relaxed text-secondary">{how}</p>
            </div>
          )}
          {evidence && (
            <div className="mt-7">
              <h3 className="text-[17px] font-semibold text-black">What&apos;s the evidence behind this?</h3>
              <p className="mt-2.5 text-[16px] leading-relaxed text-secondary">{evidence}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Colored gradient goal card (superpower-style) for the Goals column. */
const GOAL_GRADIENTS = [
  "radial-gradient(125% 125% at 80% 12%, #8a5a2e 0%, #4a2c14 48%, #2a1709 100%)",
  "radial-gradient(125% 125% at 80% 12%, #8c3527 0%, #48160e 48%, #280c07 100%)",
  "radial-gradient(125% 125% at 75% 18%, #52799f 0%, #274c6f 48%, #102942 100%)",
  "radial-gradient(125% 125% at 80% 12%, #7f2c3d 0%, #46161f 48%, #260c13 100%)",
];
function GoalGradientCard({ goal, index, onClick }) {
  const grad = GOAL_GRADIENTS[index % GOAL_GRADIENTS.length];
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ backgroundImage: grad }}
      className="group relative w-full overflow-hidden rounded-2xl p-5 text-left shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition hover:brightness-[1.08] active:scale-[0.99]"
    >
      <h3 className="text-[15px] font-semibold leading-snug text-white">{goal.title}</h3>
      <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-white/75">
        How to solve this
        <svg className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    </button>
  );
}

/* "General" tab — lifestyle / nutrition recommendations from the plan. */
function GeneralRecommendations({ protocol }) {
  const ls = protocol?.lifestyle || {};
  const sections = [];
  if (ls.sleep?.length) sections.push({ title: "Sleep", items: ls.sleep });
  if (ls.exercise?.length) sections.push({ title: "Exercise", items: ls.exercise });
  if (ls.stress?.length) sections.push({ title: "Stress", items: ls.stress });
  if (protocol?.nutrition?.length) sections.push({ title: "Nutrition", items: protocol.nutrition });

  if (!sections.length) {
    return (
      <div className="mt-7 rounded-3xl border border-borderColor bg-white p-10 text-center text-sm text-secondary">
        General lifestyle recommendations will appear here once your plan is ready.
      </div>
    );
  }
  return (
    <div className="mt-7 flex flex-col gap-4">
      {sections.map((s) => (
        <div key={s.title} className="rounded-2xl border border-borderColor bg-white p-5">
          <h3 className="text-base font-semibold text-black">{s.title}</h3>
          <ul className="mt-3 flex flex-col gap-2">
            {s.items.map((it, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-secondary">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                {it.text || it}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ── empty: no report uploaded yet — locked "awaiting results" layout ── */
function NoActionPlan({ onUpload }) {
  return (
    <div className="animate-fade-in grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-12">
      {/* LEFT — Protocol (locked placeholders) */}
      <div>
        <h1 className="font-inter text-3xl font-semibold text-black lg:text-4xl">Protocol</h1>
        <h2 className="mt-7 font-inter text-xl font-semibold text-black lg:text-2xl">Your protocol items</h2>
        <div className="mt-4 space-y-2.5">
          {["Thyroid support complex", "Vitamin D3 + K2", "NAC + choline"].map((name, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-borderColor bg-white px-4 py-3.5"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pageBackground text-secondary/50">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                {/* blurred product name — locked until results are in (matches Superpower) */}
                <p className="select-none truncate text-[14px] font-medium text-gray-500 blur-[3px]" aria-hidden="true">
                  {name}
                </p>
                <p className="mt-1.5 text-[12px] font-medium text-secondary">Awaiting results</p>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onUpload}
          className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-black px-6 py-3.5 text-[15px] font-medium text-white transition hover:bg-black/90 active:scale-[0.99]"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          Upload a blood report
        </button>
      </div>

      {/* RIGHT — Goals (pending / awaiting-results card) */}
      <div>
        <h1 className="font-inter text-3xl font-semibold text-black lg:text-4xl">Goals</h1>
        <div className="relative mt-7 flex min-h-[240px] flex-col justify-end overflow-hidden rounded-3xl p-6 text-white shadow-sm">
          <img
            src="/assets/protocol/goals-awaiting.webp"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* light touch of darkening at the very bottom only — keep the image bright like Superpower */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          <span className="absolute right-4 top-4 z-10 rounded-full bg-white/20 px-3 py-1 text-[12px] font-semibold backdrop-blur-sm">
            Pending
          </span>
          <div className="relative z-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">Awaiting results</p>
            <h3 className="mt-2 max-w-[24ch] text-[20px] font-semibold leading-snug lg:text-[22px]">
              Your health goals will unlock once your test results are processed
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── generating: live checklist ── */
function GeneratingState() {
  const steps = ["Reading your biomarkers", "Finding what needs attention", "Writing your health goals", "Building your protocol"];
  const [active, setActive] = useState(1);
  useEffect(() => {
    // Pace the checklist so it doesn't race to the last step and sit there — the
    // protocol step intentionally holds while the AI finishes writing it.
    const id = setInterval(() => setActive((a) => (a < steps.length - 1 ? a + 1 : a)), 6000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="mx-auto max-w-md py-12 text-center lg:py-20">
      <svg className="mx-auto mb-6 h-12 w-12 animate-spin text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
      <h2 className="text-2xl font-bold text-black">Generating your action plan</h2>
      <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-secondary">
        We&apos;re analysing your biomarkers, detecting issues, and writing your personalised protocol. This usually takes about a minute.
      </p>
      <ul className="mx-auto mt-7 max-w-xs space-y-3 text-left">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-3">
            {i < active ? (
              <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-white">
                <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            ) : i === active ? (
              <span className="h-4 w-4 animate-pulse rounded-full bg-primary ring-4 ring-primary/15" />
            ) : (
              <span className="h-4 w-4 rounded-full bg-borderColor" />
            )}
            <span className={`text-sm ${i <= active ? "font-semibold text-blue" : "text-secondary"}`}>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── failed: retry ── */
function FailedState({ attempts, onRetry, retrying }) {
  return (
    <div className="mx-auto max-w-md py-14 text-center lg:py-24">
      <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-rose-100">
        <svg className="h-7 w-7 text-rose-500" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" /><path d="M12 8v5M12 16.4h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
      </div>
      <h2 className="text-2xl font-bold text-black">We couldn&apos;t finish your plan</h2>
      <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-secondary">
        Something went wrong while generating your protocol. Your data is safe — you can retry now.
      </p>
      <button type="button" onClick={onRetry} disabled={retrying} className="mt-7 w-full max-w-[360px] rounded-2xl bg-black px-6 py-4 text-[15px] font-medium text-white transition hover:bg-black/90 disabled:opacity-60">
        {retrying ? "Retrying…" : "Retry generation"}
      </button>
      {attempts != null && <p className="mt-3 text-xs text-secondary">Attempt {Math.min((attempts || 1) + 1, 3)} of 3</p>}
    </div>
  );
}

export default function Protocol() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noActionPlan, setNoActionPlan] = useState(false);
  const [introState, setIntroState] = useState("idle"); // idle | show | done
  const [retrying, setRetrying] = useState(false);

  const [mainTab, setMainTab] = useState("protocol"); // protocol | actionplan
  const [protoTab, setProtoTab] = useState("products"); // products | general
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [openItem, setOpenItem] = useState(null);

  const [goals, setGoals] = useState([]);
  const [goalsStatus, setGoalsStatus] = useState(null);

  const planId = plan?._id || null;
  const healthReport = plan?.healthReport || null;
  const status = plan?.status;
  const protocolItems = plan?.deduplicatedProtocol || [];
  const monitoredIssues = plan?.monitoredIssues || [];
  const protocolData = plan?.protocol || null;

  const fetchPlan = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const res = await actionPlanAPI.getLatest();
      const data = res?.data || res;
      setPlan(data || null);
      setNoActionPlan(false);
    } catch (err) {
      if (err?.statusCode === 404 || err?.message?.includes("No action plan")) {
        setPlan(null);
        setNoActionPlan(true);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const fetchGoals = useCallback(async ({ silent = false } = {}) => {
    try {
      const response = await goalsAPI.list();
      const data = response?.data || response;
      setGoals(data?.goals || []);
      setGoalsStatus(data?.meta?.status || null);
    } catch {
      if (!silent) setGoals([]);
    }
  }, []);

  useEffect(() => {
    fetchPlan();
    fetchGoals();
  }, [fetchPlan, fetchGoals]);

  // Poll while the plan / goals are still generating.
  useEffect(() => {
    const generating =
      status === "generating" || status === "pending" || goalsStatus === "generating" || goalsStatus === "pending";
    if (!generating) return;
    const id = setInterval(() => {
      fetchPlan({ silent: true });
      fetchGoals({ silent: true });
    }, 6000);
    return () => clearInterval(id);
  }, [status, goalsStatus, fetchPlan, fetchGoals]);

  // Always-on live refresh (silent) so doctor-side changes — e.g. an approved
  // plan or newly published goals — appear without a manual reload.
  useAutoRefresh(
    useCallback(() => {
      fetchPlan({ silent: true });
      fetchGoals({ silent: true });
    }, [fetchPlan, fetchGoals]),
    { interval: 15000 }
  );

  // Auto-show the onboarding flow once per NEW ready plan (tracked in localStorage).
  // Gate on a FULLY generated plan — otherwise the reveal screens render a stub
  // health report (score 0, bio-age "—") while the plan is still generating.
  useEffect(() => {
    if (introState !== "idle") return;
    if (!planId || healthReport == null) return;
    if (status !== "ready" && status !== "approved") return;
    try {
      setIntroState(localStorage.getItem("cyborg_protocol_intro_seen") === planId ? "done" : "show");
    } catch {
      setIntroState("done");
    }
  }, [planId, healthReport, introState, status]);

  const firstName =
    user?.firstName ||
    user?.name?.split(" ")?.[0] ||
    user?.fullName?.split(" ")?.[0] ||
    user?.email?.split("@")?.[0] ||
    "there";

  // ── Onboarding insights flow (auto once per new plan; ?intro=1 forces a preview) ──
  const introPreview = searchParams.get("intro") === "1";
  if (introPreview || introState === "show") {
    const dob = user?.dateOfBirth || user?.birthDate || user?.dob;
    const d = dob ? new Date(dob) : null;
    const chronoAge =
      d && !isNaN(d.getTime())
        ? Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000))
        : null;
    const sex = String(user?.biologicalSex || "").toLowerCase().startsWith("f") ? "female" : "male";
    const completeIntro = () => {
      if (planId) {
        try { localStorage.setItem("cyborg_protocol_intro_seen", planId); } catch {}
      }
      setIntroState("done");
      if (introPreview) router.replace("/protocol");
    };
    return (
      <ProtocolIntro
        userName={firstName}
        sex={sex}
        bioAge={healthReport?.bioAge ?? null}
        chronoAge={chronoAge}
        cyborgScore={healthReport?.cyborgScore ?? null}
        categoryGrades={healthReport?.categoryGrades}
        goals={monitoredIssues}
        onComplete={completeIntro}
      />
    );
  }

  // Goal detail (from a Goals card)
  if (selectedGoal) {
    return <GoalDetail goal={selectedGoal} onBack={() => setSelectedGoal(null)} />;
  }

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

  return (
    <div className="min-h-screen overflow-x-hidden bg-pageBackground pb-24 font-inter lg:pb-16">
      <ProtocolItemModal item={openItem} onClose={() => setOpenItem(null)} />
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
      `}</style>

      <div className="mx-auto w-full max-w-[1240px] px-4 pt-6 lg:px-8 lg:pt-10">
        {loading && !plan && !noActionPlan ? (
          <div className="py-20 text-center text-sm text-secondary">Loading your protocol…</div>
        ) : noActionPlan ? (
          <NoActionPlan onUpload={() => router.push("/data?tab=records")} />
        ) : status === "generating" || status === "pending" ? (
          <GeneratingState />
        ) : status === "failed" ? (
          <FailedState attempts={plan?.generationAttempts} onRetry={handleRetry} retrying={retrying} />
        ) : status === "awaiting_review" ? (
          <div className="mx-auto max-w-md py-20 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-amber-50">
              <svg className="h-6 w-6 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-black">Your doctor is reviewing your plan</h2>
            <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-secondary">You&apos;ll be notified the moment your action plan is ready.</p>
          </div>
        ) : (
          <>
            {/* Top tabs: Protocol (products/goals) · Action Plan (full report) */}
            <div className="mb-8 flex items-center gap-6 border-b border-borderColor lg:gap-8">
              {[["protocol", "Protocol"], ["actionplan", "Action Plan"]].map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setMainTab(k)}
                  className={`-mb-px border-b-2 pb-3 text-base font-medium transition-colors duration-300 lg:text-lg ${
                    mainTab === k ? "border-black text-black" : "border-transparent text-secondary hover:text-black"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {mainTab === "actionplan" ? (
              <div className="animate-fade-in">
                <ActionPlan plan={plan} userName={firstName} />
              </div>
            ) : (
              <div className="animate-fade-in grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-12">
                {/* LEFT — Protocol (Products / General) */}
                <div>
                  <h1 className="font-inter text-3xl font-semibold text-black lg:text-4xl">Protocol</h1>
                  <div className="mt-5 flex gap-2">
                    {["products", "general"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setProtoTab(t)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
                          protoTab === t ? "bg-black text-white" : "border border-borderColor bg-white text-secondary hover:text-black"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {protoTab === "products" ? (
                    <>
                      <h2 className="mt-7 font-inter text-xl font-semibold text-black lg:text-2xl">Today&apos;s plan</h2>
                      {protocolItems.length === 0 ? (
                        <div className="mt-4 rounded-3xl border border-borderColor bg-white p-10 text-center text-sm text-secondary">
                          Your protocol items will appear here once your results are reviewed.
                        </div>
                      ) : (
                        <>
                          <p className="mt-1 text-sm text-secondary">What to take today — tap any item for how &amp; why.</p>
                          <div className="mt-4 overflow-hidden rounded-3xl border border-borderColor bg-white">
                            <div className="divide-y divide-borderColor">
                              {protocolItems.map((item, index) => (
                                <div key={item.productName + index} style={{ animation: `fadeIn 0.4s ease-out ${index * 0.05}s both` }}>
                                  <ProtocolRow item={item} index={index} onOpen={setOpenItem} />
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <GeneralRecommendations protocol={protocolData} />
                  )}
                </div>

                {/* RIGHT — Goals (gradient cards) */}
                <div>
                  <h1 className="font-inter text-3xl font-semibold text-black lg:text-4xl">Goals</h1>
                  <div className="mt-5 flex flex-col gap-3">
                    {goals.length === 0 ? (
                      <div className="rounded-2xl border border-borderColor bg-white p-6 text-center">
                        <h3 className="text-sm font-semibold text-black">No health goals yet</h3>
                        <p className="mt-1 text-xs text-secondary">They unlock once your results are processed.</p>
                      </div>
                    ) : (
                      goals.map((goal, index) => (
                        <div key={goal.goalId || index} style={{ animation: `fadeIn 0.4s ease-out ${index * 0.08}s both` }}>
                          <GoalGradientCard goal={goal} index={index} onClick={() => setSelectedGoal(goal)} />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
