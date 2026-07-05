"use client";

import Image from "next/image";
import { Lock, ChevronRight, ChevronDown, DollarSign, CreditCard, Activity } from "lucide-react";

/* ─────────────────────────── Blood-draw vials icon ───────────────────────────
   Small multicolour test-tube mark that marks the blood-draw day on the calendar
   and could be reused elsewhere. Pure SVG so it stays crisp at any size.        */
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

/* ═══════════════════════════════ Hero ═══════════════════════════════ */
function Hero({ greeting, name, initials }) {
  return (
    <section className="relative isolate overflow-hidden text-white">
      <Image
        src="/assets/timeline/hero.jpg"
        alt=""
        fill
        priority
        className="-z-20 object-cover object-[50%_30%]"
      />
      {/* Purple wash so the design reads as the Cyborg brand regardless of the photo,
          plus a bottom darkening for text legibility. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#3d1a6b]/45 via-[#2c1257]/45 to-[#1d1046]/75" />
      <div className="absolute inset-0 -z-10 bg-[#5b2487]/25 mix-blend-multiply" />

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

        {/* Appointment glass card */}
        <div className="mt-7 flex min-h-[172px] max-w-[340px] flex-col justify-between rounded-2xl bg-white/15 p-4 backdrop-blur-md ring-1 ring-white/15">
          <div>
            <p className="text-[11px] font-medium text-white/75">Cyborg Blood Panel</p>
            <p className="mt-1.5 text-[17px] font-semibold leading-snug">Your appointment is in 3 days</p>
          </div>
          <div>
            <div className="flex items-center gap-2">
              {[1, 0.8, 0.55].map((o, i) => (
                <span key={i} className="h-[3px] w-8 rounded-full bg-white" style={{ opacity: o }} />
              ))}
            </div>
            <p className="mt-2.5 text-[12px] text-white/80">Awaiting lab results</p>
          </div>
        </div>
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
function UpcomingCard({ upcoming }) {
  return (
    <div className="flex min-h-[248px] flex-col rounded-[20px] bg-[#1b1b1d] p-5 text-white">
      <h3 className="text-[20px] font-bold">{upcoming.title}</h3>
      <p className="mt-0.5 text-[14px] text-white/45">{upcoming.subtitle}</p>

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
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-[13px] font-semibold text-white/85">
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

/* ═══════════════════════ Blood-draw status + actions ═══════════════════════ */
function StatusCard({ status, actions }) {
  const steps = status.steps || [];
  const active = status.activeStep ?? 0;
  return (
    <div>
      <div className="rounded-2xl border border-borderColor bg-white p-5">
        <p className="text-[16px] font-semibold text-black">{status.title}</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-secondary">{status.description}</p>

        <div className="mt-5 flex items-center justify-between text-[12px]">
          {steps.map((s, i) => (
            <span key={s} className={i === active ? "font-semibold text-black" : "text-secondary"}>{s}</span>
          ))}
        </div>
        <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-[#E4E4E7]">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${Math.max(0, Math.min(1, status.progress)) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            className={`flex h-11 items-center justify-center gap-1.5 rounded-lg text-[14px] font-semibold transition ${
              a.variant === "solid"
                ? "bg-black text-white hover:bg-black/90"
                : "border border-[#D4D4D8] text-black hover:bg-gray-50"
            }`}
          >
            {a.label}
            {a.chevron && <ChevronDown className="h-4 w-4" />}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═════════════════════ Before your appointment (carousel) ═════════════════════ */
function BeforeAppointment({ data }) {
  return (
    <div>
      <div className="text-center">
        <h3 className="text-[17px] font-semibold text-black">{data.title}</h3>
        <p className="mt-0.5 text-[13px] text-secondary">{data.subtitle}</p>
      </div>

      <div className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {data.cards.map((card) => (
          <div
            key={card.index}
            className="flex min-h-[220px] w-[72vw] max-w-[268px] shrink-0 snap-start flex-col justify-between rounded-xl border border-borderColor bg-white p-5"
          >
            <div>
              <h4 className="text-[15px] font-semibold text-black">{card.title}</h4>
              <p className="mt-2 text-[13px] leading-relaxed text-secondary">{card.description}</p>
            </div>
            <p className="mt-4 text-[12px] font-medium text-secondary">{card.index}</p>
          </div>
        ))}
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
                  <p className="max-w-[72%] text-[15px] font-semibold leading-snug">{card.text}</p>
                )}
                {card.textLines?.map((line) => (
                  <p key={line} className="text-[16px] font-semibold leading-snug">{line}</p>
                ))}
                {card.subtext && <p className="mt-2 text-[12px] text-white/90">{card.subtext}</p>}
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
export default function TimelineHome({ data, greeting, name, initials, activeTab, onTabChange }) {
  const safeInitials =
    initials ||
    (name ? name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() : "CY");

  return (
    <div className="min-h-screen bg-white pb-32 lg:pb-16">
      <div className="mx-auto w-full max-w-[520px]">
        <Hero greeting={greeting} name={name} initials={safeInitials} />

        {/* White sheet overlapping the hero */}
        <div className="relative z-10 -mt-6 rounded-t-[28px] bg-white px-4 pt-5">
          <Tabs active={activeTab} onChange={onTabChange} />

          <div className="mt-5 flex flex-col gap-7">
            <UpcomingCard upcoming={data.timeline.upcoming} />
            <StatusCard status={data.timeline.status} actions={data.timeline.actions} />
            <BeforeAppointment data={data.beforeAppointment} />
            <LiveBetter data={data.liveBetter} />
            <RxCard data={data.rx} />
          </div>
        </div>
      </div>
    </div>
  );
}
