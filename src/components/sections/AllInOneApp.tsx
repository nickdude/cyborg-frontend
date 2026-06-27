"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Lock,
  Utensils,
  Activity,
  Moon,
  Smile,
  Check,
  ShoppingBag,
} from "lucide-react";
import { Container } from "@/components/Container";
import BottomNavbar from "@/components/BottomNavbar";

const easeOut = [0.22, 1, 0.36, 1] as const;

/* ----------------------------- in-phone screens ----------------------------- */
/* Built with components (not screenshots); the BottomNavbar selects between them. */

function ScreenHome() {
  return (
    <div className="px-5">
      <div className="mt-5 flex items-start justify-between">
        <div className="leading-tight">
          <p className="text-[15px] font-bold tracking-[-0.01em] text-neutral-900">
            Good morning Yaman,
          </p>
          <p className="text-[15px] font-bold tracking-[-0.01em] text-neutral-400">
            Welcome to CYBORG
          </p>
        </div>
        <span className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-amber-300 via-orange-400 to-fuchsia-500 ring-2 ring-white" />
      </div>

      {/* score card */}
      <div className="mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#7b35c6] via-[#5b2487] to-[#3a1559] p-4 shadow-lg shadow-purple-900/30">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white/90">score</span>
          <Lock className="h-3.5 w-3.5 text-white/70" />
        </div>
        <div className="mt-6 flex items-end gap-1">
          {["h-3", "h-5", "h-4", "h-6", "h-4", "h-5", "h-3"].map((h, i) => (
            <span key={i} className={`w-3 rounded-sm bg-white/35 ${h}`} />
          ))}
        </div>
        <p className="mt-3 text-[11px] text-white/70">Awaiting lab results</p>
      </div>

      {/* tabs */}
      <div className="mt-5 flex items-center gap-4 text-[12px]">
        {["Timeline", "Deep Insights", "Digital Twin"].map((tab, i) => (
          <span
            key={tab}
            className={
              i === 1
                ? "border-b-2 border-neutral-900 pb-1 font-semibold text-neutral-900"
                : "pb-1 font-medium text-neutral-400"
            }
          >
            {tab}
          </span>
        ))}
      </div>

      {/* today's goal */}
      <div className="mt-4 rounded-2xl border border-neutral-100 bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        <p className="text-[13px] font-semibold text-neutral-900">Today&apos;s Goal</p>
        <div className="mt-3 flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0">
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_180deg,#ef4444,#f59e0b,#10b981,#ef4444)]" />
            <div className="absolute inset-[6px] rounded-full bg-white" />
          </div>
          <p className="text-[12px] leading-relaxed text-neutral-500">
            You are half way there! Keep up the good work.
          </p>
        </div>
      </div>
    </div>
  );
}

function ScreenTwin() {
  const markers = [
    { label: "Glucose", value: "92 mg/dL", tone: "bg-emerald-500" },
    { label: "HRV", value: "68 ms", tone: "bg-amber-500" },
    { label: "VO₂ max", value: "48", tone: "bg-emerald-500" },
    { label: "Resting HR", value: "58 bpm", tone: "bg-emerald-500" },
  ];
  return (
    <div className="px-5">
      <p className="mt-5 text-[17px] font-bold tracking-[-0.01em] text-neutral-900">
        Digital Twin
      </p>
      <div className="mt-4 flex items-center gap-4 rounded-2xl bg-gradient-to-br from-[#7b35c6] to-[#3a1559] p-4 text-white shadow-lg shadow-purple-900/30">
        <div className="relative grid h-16 w-16 shrink-0 place-items-center">
          <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_140deg,#a855f7_0deg,#a855f7_290deg,rgba(255,255,255,0.2)_290deg)]" />
          <div className="absolute inset-[5px] rounded-full bg-[#43196b]" />
          <span className="relative text-lg font-bold">29</span>
        </div>
        <div>
          <p className="text-[12px] text-white/70">Biological age</p>
          <p className="text-sm font-semibold">3 yrs younger</p>
        </div>
      </div>
      <div className="mt-4 space-y-2.5">
        {markers.map((m) => (
          <div
            key={m.label}
            className="flex items-center justify-between rounded-xl border border-neutral-100 bg-white px-3.5 py-3 shadow-[0_6px_20px_rgba(0,0,0,0.05)]"
          >
            <span className="flex items-center gap-2.5 text-[13px] font-medium text-neutral-700">
              <span className={`h-2 w-2 rounded-full ${m.tone}`} />
              {m.label}
            </span>
            <span className="text-[13px] font-semibold text-neutral-900">{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenLog() {
  const tiles = [
    { label: "Meal", Icon: Utensils, tone: "from-orange-400 to-rose-500" },
    { label: "Activity", Icon: Activity, tone: "from-emerald-400 to-teal-500" },
    { label: "Sleep", Icon: Moon, tone: "from-indigo-400 to-violet-500" },
    { label: "Mood", Icon: Smile, tone: "from-amber-400 to-orange-500" },
  ];
  return (
    <div className="px-5">
      <p className="mt-5 text-[17px] font-bold tracking-[-0.01em] text-neutral-900">
        Log your day
      </p>
      <p className="mt-1 text-[12px] text-neutral-400">Capture what matters in seconds.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {tiles.map(({ label, Icon, tone }) => (
          <div
            key={label}
            className="flex flex-col items-start gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.05)]"
          >
            <span
              className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-md`}
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="text-[13px] font-semibold text-neutral-800">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenProtocol() {
  const items = [
    { label: "Vitamin D3 + K2", done: true },
    { label: "Zone 2 cardio · 30 min", done: true },
    { label: "Magnesium glycinate", done: false },
    { label: "10k steps", done: false },
  ];
  return (
    <div className="px-5">
      <p className="mt-5 text-[17px] font-bold tracking-[-0.01em] text-neutral-900">
        Your Protocol
      </p>
      <p className="mt-1 text-[12px] text-neutral-400">2 of 4 completed today.</p>
      <div className="mt-4 space-y-2.5">
        {items.map((it) => (
          <div
            key={it.label}
            className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-white px-3.5 py-3 shadow-[0_6px_20px_rgba(0,0,0,0.05)]"
          >
            <span
              className={`grid h-5 w-5 place-items-center rounded-full ${
                it.done
                  ? "bg-cyborg-purple text-white"
                  : "border-2 border-neutral-200 bg-white"
              }`}
            >
              {it.done && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
            <span
              className={`text-[13px] ${
                it.done
                  ? "font-medium text-neutral-400 line-through"
                  : "font-semibold text-neutral-800"
              }`}
            >
              {it.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenMarketplace() {
  const items = [
    { name: "Amino 9", price: "₹2,499", tone: "from-violet-400 to-fuchsia-400" },
    { name: "Mito Heart", price: "₹2,999", tone: "from-fuchsia-400 to-orange-300" },
  ];
  return (
    <div className="px-5">
      <p className="mt-5 text-[17px] font-bold tracking-[-0.01em] text-neutral-900">
        Marketplace
      </p>
      <p className="mt-1 text-[12px] text-neutral-400">Curated for your biology.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {items.map((p) => (
          <div
            key={p.name}
            className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.05)]"
          >
            <div className={`flex h-20 items-center justify-center bg-gradient-to-br ${p.tone}`}>
              <ShoppingBag className="h-6 w-6 text-white/90" />
            </div>
            <div className="p-3">
              <p className="text-[13px] font-semibold text-neutral-900">{p.name}</p>
              <p className="mt-0.5 text-[12px] font-medium text-neutral-500">
                from {p.price}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const SCREENS = [ScreenHome, ScreenTwin, ScreenLog, ScreenProtocol, ScreenMarketplace];

/* ------------------------------- phone shell -------------------------------- */

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-6 pt-3 text-[11px] font-semibold text-neutral-800">
      <span>9:41</span>
      <span className="flex items-center gap-1 opacity-70">
        <span className="h-2 w-4 rounded-[2px] bg-neutral-800/80" />
        <span className="h-2 w-1.5 rounded-[2px] bg-neutral-800/80" />
      </span>
    </div>
  );
}

function PhoneScreen({
  activeScreen,
  onTabChange,
}: {
  activeScreen: number;
  onTabChange: (index: number) => void;
}) {
  const Active = SCREENS[activeScreen];
  return (
    <div className="relative flex h-full flex-col bg-white">
      <StatusBar />

      {/* Only the screen content fades/slides — the frame & navbar stay fixed. */}
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence initial={false}>
          <motion.div
            key={activeScreen}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="absolute inset-0 overflow-y-auto pb-20"
          >
            <Active />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* live, interactive navigation — drives the demo screens (no routing) */}
      <BottomNavbar
        demoMode
        activeTab={activeScreen}
        onTabChange={onTabChange}
      />
    </div>
  );
}

function PhoneMockup() {
  const [activeScreen, setActiveScreen] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.8, ease: easeOut }}
      className="relative mx-auto w-[300px] sm:w-[336px]"
    >
      {/* floating loop + subtle hover lift */}
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.02 }}
        className="relative"
      >
        {/* device frame */}
        <div className="relative rounded-[2.75rem] bg-neutral-950 p-[10px] shadow-[0_40px_90px_-20px_rgba(0,0,0,0.85)] ring-1 ring-white/10">
          {/* screen */}
          <div className="relative aspect-[9/19.3] overflow-hidden rounded-[2.2rem] bg-white">
            {/* dynamic island */}
            <div className="absolute left-1/2 top-2 z-30 h-6 w-[84px] -translate-x-1/2 rounded-full bg-black" />
            {/* glass reflection */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-tr from-transparent via-white/0 to-white/10"
            />
            <PhoneScreen activeScreen={activeScreen} onTabChange={setActiveScreen} />
          </div>
        </div>

        {/* soft shadow puddle beneath the phone */}
        <div
          aria-hidden
          className="absolute -bottom-8 left-1/2 -z-10 h-12 w-3/4 -translate-x-1/2 rounded-[100%] bg-black/60 blur-2xl"
        />
      </motion.div>
    </motion.div>
  );
}

/** "All in one app." — black hero with a live phone whose BottomNavbar drives the demo. */
export function AllInOneApp() {
  return (
    <section className="relative overflow-hidden bg-black py-20 md:py-28">
      {/* subtle purple glow behind the phone */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(123,53,198,0.32),transparent_65%)] blur-3xl"
      />

      <Container className="relative">
        <div className="flex flex-col items-center text-center">
          {/* heading */}
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.7, ease: easeOut }}
            className="text-5xl font-bold leading-[0.95] tracking-[-0.04em] text-white sm:text-6xl md:text-7xl"
          >
            All in
            <br />
            one app.
          </motion.h2>

          {/* phone */}
          <div className="mt-14 md:mt-16">
            <PhoneMockup />
          </div>

          {/* supporting text */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.7, delay: 0.1, ease: easeOut }}
            className="mt-16 max-w-[700px] text-balance text-lg leading-relaxed text-white/60 md:text-xl"
          >
            Leverage the Cyborg&apos;s advanced, discreet and preventive health
            monitoring to guide your path toward vitality and a longer, healthier
            life.
          </motion.p>
        </div>
      </Container>
    </section>
  );
}
