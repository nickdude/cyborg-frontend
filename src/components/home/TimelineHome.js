"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import DayLogSection from "./DayLogSection";
import { LiveBetterCards } from "./LiveBetterSection";
import {
  Lock, ChevronRight, Check,
  ShieldCheck, Watch, ScanFace, ClipboardList,
} from "lucide-react";

/* ─────────────────────── Upcoming-card scroll-collapse knobs ───────────────────────
   As you scroll, the dark "Upcoming" card pins to the top of the screen, shrinks from
   EXPANDED_H down to COLLAPSED_H over SHRINK_PX of scroll, holds briefly, then scrolls
   up out of view — and every step reverses as you scroll back up. Tune to taste. */
const EXPANDED_H = 260;   // full card height (px)
const COLLAPSED_H = 64;   // collapsed notification-banner height (px)
const SHRINK_PX = 150;    // scroll distance over which the card shrinks
const LINGER_PX = 24;     // extra scroll it stays pinned + collapsed before leaving
const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);

/* ─────────────────────────── Blood-draw vials icon ─────────────────────────── */
function BloodVialsIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {[
        { x: 4.5, fill: "#E23B58" },
        { x: 10, fill: "#F2B705" },
        { x: 15.5, fill: "#2E9BE6" },
      ].map((t) => (
        <g key={t.x}>
          <rect x={t.x} y={3} width={4} height={18} rx={2} fill="#fff" stroke="#D5D5DB" strokeWidth={0.75} />
          <rect x={t.x} y={11} width={4} height={9.2} rx={2} fill={t.fill} />
          <rect x={t.x - 0.6} y={2} width={5.2} height={2} rx={1} fill="#C7C7CE" />
        </g>
      ))}
    </svg>
  );
}

/* ════════════════════════ Score carousel (over the hero) ════════════════════════ */
function Dashes() {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 0.85, 0.7].map((o, i) => (
        <span key={i} className="h-[3px] w-8 rounded-full bg-white" style={{ opacity: o }} />
      ))}
    </div>
  );
}

function ScoreCard({ card }) {
  const awaiting = !card.ready;
  return (
    <div className="relative flex min-h-[224px] flex-col rounded-lg bg-white/25 p-4">
      <div className="flex items-start justify-between">
        <p className="text-[14px] font-medium text-white/90">{card.title}</p>
        {awaiting && <Lock className="h-4 w-4 text-white/70" />}
      </div>

      {card.type === "plan" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2.5 py-2">
          {card.ready ? (
            <Link
              href={card.href || "#"}
              className="rounded-xl bg-white px-8 py-2.5 text-[14px] font-semibold text-[#3f1f8f] transition hover:bg-white/90"
            >
              View Action Plan
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[12px] font-medium text-white/85 ring-1 ring-white/15">
              <Lock className="h-3 w-3" /> Action plan coming soon
            </span>
          )}
        </div>
      ) : (
        <div className="mt-auto">
          {card.ready ? (
            <p className="text-[54px] font-semibold leading-none text-white">
              {card.value}
              {card.suffix && (
                <span className="ml-1.5 text-[16px] font-medium text-white/70">{card.suffix}</span>
              )}
            </p>
          ) : (
            <Dashes />
          )}
        </div>
      )}

      {awaiting && <p className="mt-2.5 text-[12px] text-white/70">Awaiting lab results</p>}
    </div>
  );
}

function ScoreCarousel({ cards }) {
  const ref = useRef(null);
  const [active, setActive] = useState(0);
  const onScroll = () => {
    const el = ref.current;
    if (el) setActive(Math.round(el.scrollLeft / el.clientWidth));
  };
  const goTo = (i) => {
    const el = ref.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  // Auto-advance: gently swipe to the next card on a timer (looping). Reads the
  // current index from scroll position so a manual swipe isn't fought. Honors
  // reduced-motion and pauses while the user is touching the strip.
  useEffect(() => {
    if (cards.length < 2) return undefined;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return undefined;
    const el = ref.current;
    let paused = false;
    const pause = () => { paused = true; };
    const resume = () => { paused = false; };
    el?.addEventListener("pointerdown", pause);
    el?.addEventListener("pointerup", resume);
    el?.addEventListener("pointercancel", resume);
    const id = setInterval(() => {
      if (paused || !el) return;
      const cur = Math.round(el.scrollLeft / el.clientWidth);
      el.scrollTo({ left: ((cur + 1) % cards.length) * el.clientWidth, behavior: "smooth" });
    }, 4500);
    return () => {
      clearInterval(id);
      el?.removeEventListener("pointerdown", pause);
      el?.removeEventListener("pointerup", resume);
      el?.removeEventListener("pointercancel", resume);
    };
  }, [cards.length]);
  return (
    <div className="mt-5 lg:max-w-[460px]">
      <div
        ref={ref}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((c) => (
          <div key={c.key} className="min-w-full shrink-0 snap-start">
            <ScoreCard card={c} />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {cards.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to card ${i + 1}`}
            onClick={() => goTo(i)}
            className={`h-1.5 w-1.5 rounded-full transition-all ${i === active ? "bg-white" : "bg-white/40"}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════ Hero ═══════════════════════════════ */
function Hero({ greeting, name, initials, scoreCards }) {
  return (
    <section className="relative isolate overflow-hidden bg-[#371A80] text-white">
      <Image
        src="/assets/timeline/hero.webp"
        alt=""
        fill
        priority
        className="-z-20 object-cover object-[52%_18%]"
      />
      {/* Solid brand purple (#371A80) sits behind the photo (section bg); this overlay
          tints the photo to the same hue and keeps the white text legible. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#371A80]/40 via-[#371A80]/15 to-[#371A80]/65" />

      <div className="px-5 pb-20 pt-14">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[24px] font-bold leading-tight tracking-tight">
              {greeting || "Good morning"} {name},
            </p>
            <p className="mt-1 text-[17px] font-normal leading-snug text-white/90">
              Welcome to<br />CYBORG
            </p>
          </div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/85 text-[13px] font-semibold text-[#1F2937]">
            {initials}
          </span>
        </div>

        <ScoreCarousel cards={scoreCards} />
      </div>
    </section>
  );
}

/* ═══════════════════════════════ Tabs ═══════════════════════════════ */
function Tabs({ active, onChange }) {
  const tabs = [
    { key: "timeline", label: "Timeline", locked: false },
    { key: "twin", label: "Digital Twin", locked: true },
  ];
  return (
    <div className="flex items-center gap-7 border-b border-borderColor px-0">
      {tabs.map((t) => {
        const on = active === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={`-mb-px flex items-center gap-1.5 border-b-2 pb-3 text-[16px] font-semibold transition-colors ${
              on ? "border-black text-black" : "border-transparent text-secondary hover:text-black"
            }`}
          >
            {t.locked && <Lock className="h-3.5 w-3.5" />}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/* ═════════════════════════════ Upcoming ═════════════════════════════ */
// Expanded state — the original "Upcoming" title + 2-week calendar dot grid (look unchanged).
function UpcomingExpanded({ upcoming, processing }) {
  return (
    <div className="flex min-h-[260px] flex-col p-5">
      <h3 className="text-[20px] font-bold">{upcoming.title}</h3>
      <p className="mt-0.5 text-[14px] text-white/45">
        {processing ? "Results processing — check back soon" : upcoming.subtitle}
      </p>

      <div className="mt-auto space-y-3">
        {upcoming.rows.map((row, ri) => (
          <div key={ri} className="grid grid-cols-7 gap-2">
            {row.map((cell) => (
              <div key={cell.day} className="flex justify-center">
                {cell.bloodDraw ? (
                  <span
                    className="grid h-9 w-9 place-items-center rounded-full bg-white"
                    title="Blood draw"
                    aria-label="Blood draw day"
                  >
                    <BloodVialsIcon className="h-[18px] w-[18px]" />
                  </span>
                ) : (
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-[13px] font-semibold text-white/90">
                    {cell.day}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Collapsed state — a slim black notification banner summarising the next upcoming event.
function UpcomingCompact({ upcoming, processing, nextEvent }) {
  const Icon = nextEvent?.Icon || ClipboardList;
  const d = nextEvent?.date ? fmtDate(nextEvent.date) : null;
  const line1 = `${upcoming.title}${d ? ` • ${d.mon} ${d.day}` : ""}`;
  const line2 = processing ? "Results processing" : nextEvent?.title || upcoming.subtitle;
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white">
        {nextEvent?.img ? (
          <img src={nextEvent.img} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.remove(); }} />
        ) : (
          <Icon className="h-[18px] w-[18px] text-[#1b1b1d]" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-white/50">{line1}</p>
        <p className="truncate text-[15px] font-semibold text-white">{line2}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-white/40" />
    </div>
  );
}

// The scroll-collapsing card. It's `position: sticky` so it pins to the top of the
// screen; as you scroll past its pin point the height springs from EXPANDED_H → COLLAPSED_H
// (expanded content cross-fades out, the compact banner cross-fades in), then a raw-scroll
// `y` slides the collapsed banner up out of view. Everything reverses on scroll-up.
// Enabled on mobile only — desktop keeps a plain static card. Must sit as a direct child
// of a `relative` column so the absolute sentinel measures its true top.
function UpcomingCard({ upcoming, processing, nextEvent }) {
  const sentinelRef = useRef(null);
  const [enabled, setEnabled] = useState(false);
  const [pinTop, setPinTop] = useState(Infinity); // scrollY at which the card pins (Infinity = no collapse yet)

  // Scope the effect to mobile widths (< lg / 1100px). Desktop renders the static card.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1099px)");
    const sync = () => setEnabled(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Measure the card's natural document-top = the scrollY at which its top hits the viewport top.
  useEffect(() => {
    if (!enabled) { setPinTop(Infinity); return undefined; }
    const measure = () => {
      const el = sentinelRef.current;
      if (el) setPinTop(el.getBoundingClientRect().top + window.scrollY);
    };
    measure();
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("load", measure);
    };
  }, [enabled]);

  const { scrollY } = useScroll();

  // Height + content cross-fade map 1:1 to scroll, so the card shrinks exactly under your
  // finger (no lag). The cross-fade swaps expanded content out and the banner in mid-shrink.
  const height = useTransform(scrollY, (v) => EXPANDED_H - (EXPANDED_H - COLLAPSED_H) * clamp01((v - pinTop) / SHRINK_PX));
  const expandedOpacity = useTransform(scrollY, (v) => 1 - clamp01((v - pinTop) / (SHRINK_PX * 0.5)));
  const compactOpacity = useTransform(scrollY, (v) => clamp01((v - (pinTop + SHRINK_PX * 0.45)) / (SHRINK_PX * 0.55)));
  // Once collapsed, slide the banner up out of view (also 1:1 with scroll).
  const y = useTransform(scrollY, (v) => {
    const over = v - (pinTop + SHRINK_PX + LINGER_PX);
    return over > 0 ? -Math.min(over, COLLAPSED_H + 24) : 0;
  });

  // Desktop: plain static card, no scroll behaviour.
  if (!enabled) {
    return (
      <div className="overflow-hidden rounded-[20px] bg-[#1b1b1d] text-white">
        <UpcomingExpanded upcoming={upcoming} processing={processing} />
      </div>
    );
  }

  return (
    <>
      {/* Out-of-flow marker: measures the card's true top without adding layout height. */}
      <div ref={sentinelRef} aria-hidden className="pointer-events-none absolute left-0 top-0 h-0 w-0" />
      <motion.div
        style={{ height, y }}
        className="sticky top-0 z-20 overflow-hidden rounded-[20px] bg-[#1b1b1d] text-white shadow-lg shadow-black/10"
      >
        <motion.div style={{ opacity: expandedOpacity }}>
          <UpcomingExpanded upcoming={upcoming} processing={processing} />
        </motion.div>
        <motion.div
          style={{ opacity: compactOpacity }}
          className="pointer-events-none absolute inset-0 flex items-center"
        >
          <div className="w-full">
            <UpcomingCompact upcoming={upcoming} processing={processing} nextEvent={nextEvent} />
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

/* ═══════════════════════════ Milestone rows ═══════════════════════════ */
const MILESTONE_TONE = {
  purple: "bg-[#ece7f6] text-primary",
  red: "bg-red-50 text-red-500",
  blue: "bg-blue/10 text-blue",
  green: "bg-emerald-50 text-emerald-600",
  orange: "bg-orange-50 text-orange-500",
};

function fmtDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return { day: String(d.getDate()).padStart(2, "0"), mon: d.toLocaleString("en-US", { month: "short" }) };
}

function MilestoneRow({ m }) {
  const Icon = m.Icon || ClipboardList;
  const d = m.date ? fmtDate(m.date) : null;
  const clickable = m.status !== "locked";

  const right =
    m.status === "complete" ? (
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    ) : m.status === "locked" ? (
      <Lock className="h-4 w-4 shrink-0 text-secondary/50" />
    ) : (
      <ChevronRight className="h-5 w-5 shrink-0 text-secondary" />
    );

  const inner = (
    <>
      <div className="flex w-9 shrink-0 flex-col items-start leading-none">
        {d ? (
          <>
            <span className="text-[11px] text-secondary">{d.mon}</span>
            <span className="mt-1 text-[16px] font-semibold text-blue">{d.day}</span>
          </>
        ) : (
          <span className="text-[13px] text-secondary/50">—</span>
        )}
      </div>
      <span className={`relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl ${MILESTONE_TONE[m.tone] || MILESTONE_TONE.purple}`}>
        <Icon className="h-[18px] w-[18px]" />
        {m.img && (
          <img
            src={m.img}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => { e.currentTarget.remove(); }}
          />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-blue">{m.title}</p>
        {m.note && <p className="mt-0.5 text-[13px] text-secondary">{m.note}</p>}
      </div>
      {right}
    </>
  );

  const cls = "flex items-center gap-3 rounded-2xl border border-borderColor bg-white px-3.5 py-3";
  return clickable ? (
    <Link href={m.href || "#"} className={`${cls} transition hover:shadow-sm`}>{inner}</Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/* ══════════════════════ Finish onboarding ══════════════════════ */
const ONB_ICON = { ShieldCheck, Watch, ScanFace };
function OnboardingSection({ data }) {
  return (
    <div>
      <h3 className="mb-3 px-1 text-[13px] font-medium text-secondary">{data.title}</h3>
      <div className="space-y-3">
        {data.items.map((it) => {
          const Icon = ONB_ICON[it.icon] || ShieldCheck;
          return (
            <Link
              key={it.key}
              href={it.href || "#"}
              className="flex items-center gap-3 rounded-2xl border border-borderColor bg-white px-3.5 py-3 transition hover:shadow-sm"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#ece7f6] text-primary">
                {it.image ? (
                  <img src={it.image} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.remove(); }} />
                ) : (
                  <Icon className="h-[18px] w-[18px]" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-blue">{it.title}</p>
                <p className="mt-0.5 text-[13px] text-secondary">{it.sub}</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-secondary" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════ Live better, longer together ═══════════════════ */
function LiveBetter({ data }) {
  return (
    <div>
      <h3 className="mb-4 text-[18px] font-semibold text-black">{data.title}</h3>
      <LiveBetterCards cards={data.cards} />
    </div>
  );
}

/* ═══════════════════════════ TimelineHome ═══════════════════════════ */
export default function TimelineHome({
  data, greeting, name, initials, activeTab, onTabChange,
  cyborgScore, bioAge, planReady, actionPlanHref, journey, processing, userId,
}) {
  const safeInitials =
    initials ||
    (name ? name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() : "CY");

  const scoreCards = [
    { key: "score", type: "value", title: "Cyborg score", ready: cyborgScore != null, value: cyborgScore != null ? String(Math.round(cyborgScore)) : null, suffix: "/ 100" },
    { key: "bioage", type: "value", title: "Biological Age", ready: bioAge != null, value: bioAge != null ? bioAge.toFixed(1) : null, suffix: null },
    { key: "plan", type: "plan", title: "Your Action Plan", ready: !!planReady, href: actionPlanHref },
  ];

  // The next actionable milestone → summarised in the collapsed banner.
  const nextEvent =
    journey?.find((m) => m.status === "active" || m.status === "upcoming") ||
    journey?.find((m) => m.status && m.status !== "complete" && m.status !== "locked") ||
    journey?.find((m) => m.status !== "complete") ||
    journey?.[0] ||
    null;

  return (
    // overflow-anchor:none — the Upcoming card animates its layout height on scroll;
    // without this the browser's scroll-anchoring readjusts scrollY every frame and the
    // collapse fights the scroll (feedback loop / jump).
    <div className="min-h-screen bg-white pb-32 [overflow-anchor:none] lg:bg-pageBackground lg:pb-16">
      <div className="mx-auto w-full max-w-[520px] lg:max-w-[1040px] lg:px-6 lg:pt-6">
        {/* Hero — full-bleed on mobile, a contained rounded banner on desktop. */}
        <div className="lg:overflow-hidden lg:rounded-3xl lg:shadow-sm">
          <Hero greeting={greeting} name={name} initials={safeInitials} scoreCards={scoreCards} />
        </div>

        {/* Sheet — overlaps the hero on mobile; a separate card on desktop. */}
        <div className="relative z-10 -mt-6 rounded-t-[28px] bg-white px-4 pt-5 lg:mt-6 lg:rounded-[28px] lg:px-8 lg:pt-7 lg:shadow-sm">
          <Tabs active={activeTab} onChange={onTabChange} />

          {/* Feed — single column on mobile, primary + promo columns on desktop.
              `relative` anchors the Upcoming card's measurement sentinel. */}
          <div className="mt-5 lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="relative flex flex-col gap-6 lg:col-span-7">
              <UpcomingCard
                upcoming={data.timeline.upcoming}
                processing={processing}
                nextEvent={nextEvent}
              />

              {journey?.length > 0 && (
                <div className="space-y-3">
                  {journey.map((m) => <MilestoneRow key={m.key} m={m} />)}
                </div>
              )}

              {data.onboarding && <OnboardingSection data={data.onboarding} />}
            </div>

            <div className="mt-6 flex flex-col gap-6 lg:col-span-5 lg:mt-0">
              <LiveBetter data={data.liveBetter} />
              <DayLogSection userId={userId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
