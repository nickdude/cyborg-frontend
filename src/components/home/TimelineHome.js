"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  Lock, ChevronRight, Check, DollarSign, CreditCard, Activity,
  ShieldCheck, Watch, ScanFace, ClipboardList,
} from "lucide-react";

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
    <div className="relative flex min-h-[168px] flex-col rounded-2xl bg-white/12 p-4 ring-1 ring-white/15 backdrop-blur-md">
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
  return (
    <div className="mt-5">
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
    <section className="relative isolate overflow-hidden text-white">
      <Image
        src="/assets/timeline/hero.jpg"
        alt=""
        fill
        priority
        className="-z-20 object-cover object-[55%_22%]"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#3d1a6b]/50 via-[#3a1a75]/45 to-[#25105a]/72" />
      <div className="absolute inset-0 -z-10 bg-[#5b2487]/28 mix-blend-multiply" />

      <div className="px-5 pb-14 pt-9">
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
function UpcomingCard({ upcoming, processing }) {
  return (
    <div className="flex min-h-[260px] flex-col rounded-[20px] bg-[#1b1b1d] p-5 text-white">
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
      <div className="space-y-4">
        {data.cards.map((card, i) => (
          <div key={i} className="relative h-[120px] overflow-hidden rounded-2xl">
            <Image src={card.image} alt="" fill className="object-cover" />
            <div className={`absolute inset-0 ${i === 0 ? "bg-black/30" : "bg-black/45"}`} />
            <div
              className={`relative z-10 flex h-full items-center gap-3 px-5 text-white ${
                i === 0 ? "justify-end" : "justify-between"
              }`}
            >
              <div className="min-w-0">
                {card.text && (
                  <p className="max-w-[62%] text-[15px] font-semibold leading-snug">{card.text}</p>
                )}
                {card.textLines?.map((line) => (
                  <p key={line} className="text-[15px] font-semibold leading-snug">{line}</p>
                ))}
                {card.subtext && <p className="mt-1 text-[12px] text-white/90">{card.subtext}</p>}
              </div>
              {card.action?.type === "chevron" && <ChevronRight className="h-6 w-6 shrink-0 text-white/85" />}
              {card.action?.type === "button" && (
                <button
                  type="button"
                  className="shrink-0 rounded-lg bg-white px-4 py-2 text-[14px] font-semibold text-black transition hover:bg-white/90"
                >
                  {card.action.label}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════ Cyborg for Rx ═══════════════════════════ */
const RX_ICON = { DollarSign, CreditCard, Activity };
function RxCard({ data }) {
  return (
    <div className="rounded-2xl border border-borderColor bg-white p-5">
      <div className="flex items-center gap-4">
        <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-xl">
          <Image src={data.image} alt="" fill className="object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-secondary">{data.eyebrow || data.title}</p>
          <h4 className="mt-1 text-[17px] font-semibold leading-snug text-black">{data.headline}</h4>
          <div className="mt-3 space-y-3">
            {data.benefits.map((b) => {
              const Icon = RX_ICON[b.icon] || DollarSign;
              return (
                <div key={b.text} className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-primary" />
                  <span className="text-[13px] text-secondary">{b.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════ TimelineHome ═══════════════════════════ */
export default function TimelineHome({
  data, greeting, name, initials, activeTab, onTabChange,
  cyborgScore, bioAge, planReady, actionPlanHref, journey, processing,
}) {
  const safeInitials =
    initials ||
    (name ? name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() : "CY");

  const scoreCards = [
    { key: "score", type: "value", title: "Cyborg score", ready: cyborgScore != null, value: cyborgScore != null ? String(Math.round(cyborgScore)) : null, suffix: "/ 100" },
    { key: "bioage", type: "value", title: "Biological Age", ready: bioAge != null, value: bioAge != null ? bioAge.toFixed(1) : null, suffix: null },
    { key: "plan", type: "plan", title: "Your Action Plan", ready: !!planReady, href: actionPlanHref },
  ];

  return (
    <div className="min-h-screen bg-white pb-32 lg:pb-16">
      <div className="mx-auto w-full max-w-[520px]">
        <Hero greeting={greeting} name={name} initials={safeInitials} scoreCards={scoreCards} />

        <div className="relative z-10 -mt-6 rounded-t-[28px] bg-white px-4 pt-5">
          <Tabs active={activeTab} onChange={onTabChange} />

          <div className="mt-5 flex flex-col gap-6">
            <UpcomingCard upcoming={data.timeline.upcoming} processing={processing} />

            {journey?.length > 0 && (
              <div className="space-y-3">
                {journey.map((m) => <MilestoneRow key={m.key} m={m} />)}
              </div>
            )}

            {data.onboarding && <OnboardingSection data={data.onboarding} />}
            <LiveBetter data={data.liveBetter} />
            <RxCard data={data.rx} />
          </div>
        </div>
      </div>
    </div>
  );
}
