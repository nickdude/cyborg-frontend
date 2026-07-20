"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, Info, UtensilsCrossed } from "lucide-react";
import { timelineAPI } from "@/services/api";
import { MACRO_META } from "@/components/food/macros";

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase();
}

// Macro palette ring — the Figma frame marks meal rows with a colored ring.
const RING_GRADIENT =
  "conic-gradient(#EF1360 0deg 60deg, #DE8E4E 60deg 120deg, #34C759 120deg 200deg, #548ADE 200deg 280deg, #4F378B 280deg 360deg)";

/**
 * Today's food + activity logs (Figma "Timeline" frame): two compact action
 * pills with the day's log cards directly below — no heading, no panel.
 */
export default function DayLogSection({ userId }) {
  const router = useRouter();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(false);
    timelineAPI
      .get(userId, todayUTC())
      .then((r) => {
        if (active) setEntries(r?.data?.entries || r?.data || []);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const list = Array.isArray(entries) ? entries : [];

  // Day-level macro totals across every logged meal (Figma "MACRO SPLIT" grid
  // under the day cards) — activities don't contribute.
  const dayTotals = list.reduce((acc, entry) => {
    if (entry.type !== "meal") return acc;
    const totals = entry.data?.totals;
    if (!totals) return acc;
    MACRO_META.forEach(({ key }) => {
      if (totals[key] != null) acc[key] = (acc[key] || 0) + totals[key];
    });
    return acc;
  }, {});
  const hasMacros = Object.keys(dayTotals).length > 0;

  return (
    <div>
      {/* Compact action pills */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => router.push("/meals/log?from=timeline")}
          className="flex h-9 items-center gap-2 rounded-full bg-black px-4 text-sm font-medium text-white transition hover:bg-black/85"
        >
          <UtensilsCrossed size={15} />
          Log Food
        </button>
        <button
          type="button"
          onClick={() => router.push("/activities/new?from=timeline")}
          className="flex h-9 items-center gap-2 rounded-full bg-black px-4 text-sm font-medium text-white transition hover:bg-black/85"
        >
          <Flame size={15} fill="currentColor" />
          Add an activity
        </button>
      </div>

      {/* Day cards */}
      {loading ? (
        <p className="mt-4 text-sm text-secondary">Loading today&apos;s logs...</p>
      ) : error ? (
        <p className="mt-4 text-sm text-secondary">
          Couldn&apos;t load today&apos;s logs — try again later.
        </p>
      ) : list.length > 0 ? (
        <>
        <div className="mt-4 space-y-3">
          {list.map((entry) => {
            const id = entry.id || entry._id;
            if (entry.type === "meal") {
              return (
                <CompactLogCard
                  key={id}
                  Icon={UtensilsCrossed}
                  timeLine={formatTime(entry.time)}
                  bottom={
                    <>
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{
                          background: RING_GRADIENT,
                          WebkitMask:
                            "radial-gradient(circle, transparent 3px, #000 3.5px)",
                          mask: "radial-gradient(circle, transparent 3px, #000 3.5px)",
                        }}
                      />
                      <span className="truncate">
                        {(entry.data?.items || [])
                          .map((i) => i.name)
                          .filter(Boolean)
                          .join(", ") || entry.title || "Meal"}
                      </span>
                    </>
                  }
                  onClick={() => id && router.push(`/meals/${id}/score`)}
                />
              );
            }
            if (entry.type === "activity") {
              return (
                <CompactLogCard
                  key={id}
                  Icon={Flame}
                  iconFilled
                  timeLine={`${formatTime(entry.time)}${
                    entry.data?.durationMinutes != null
                      ? ` • ${entry.data.durationMinutes} min`
                      : ""
                  }${
                    Number.isFinite(entry.data?.caloriesBurned) && entry.data.caloriesBurned > 0
                      ? ` • ~${Math.round(entry.data.caloriesBurned)} kcal`
                      : ""
                  }`}
                  bottom={
                    <>
                      <Flame size={14} className="shrink-0 text-black" fill="currentColor" />
                      <span className="truncate">{entry.title || "Activity"}</span>
                    </>
                  }
                  onClick={() => id && router.push(`/activities/${id}`)}
                />
              );
            }
            return null;
          })}
        </div>

        {/* Day macro split — appears once at least one meal is logged */}
        {hasMacros && (
          <div className="mt-5">
            <p className="text-[14px] font-semibold uppercase leading-5 text-black">
              Macro Split
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {MACRO_META.map(({ key, label, unit, Icon, color }) => {
                const raw = dayTotals[key];
                return (
                  <div
                    key={key}
                    className="flex items-center gap-2 rounded-lg border border-borderColor bg-white px-2 py-2 shadow-sm"
                  >
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${color}1A` }}
                    >
                      <Icon size={11} color={color} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium uppercase leading-3 text-black">
                        {label}
                      </p>
                      <p className="truncate text-[14px] font-semibold leading-[18px] text-black">
                        {raw != null ? Math.round(raw) : "--"}
                        {unit}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        </>
      ) : (
        <p className="mt-4 text-sm text-secondary">
          Nothing logged today yet — add a meal or an activity.
        </p>
      )}
    </div>
  );
}

/* One bordered log card: [icon  time • meta          ⓘ] / divider / bottom row */
function CompactLogCard({ Icon, iconFilled, timeLine, bottom, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-lg border border-borderColor bg-white text-left shadow-sm transition hover:border-primary/30"
    >
      <div className="flex items-center gap-2 px-3.5 py-3">
        <Icon size={14} className="shrink-0 text-black" fill={iconFilled ? "currentColor" : "none"} />
        <span className="flex-1 truncate text-sm font-medium leading-5 text-black">
          {timeLine}
        </span>
        <Info size={13} className="shrink-0 text-secondary" />
      </div>
      <div className="mx-3 border-t border-borderColor" />
      <div className="flex items-center gap-2 px-3.5 py-3 text-sm font-medium leading-5 text-black">
        {bottom}
      </div>
    </button>
  );
}
