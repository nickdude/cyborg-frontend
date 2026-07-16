"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { timelineAPI } from "@/services/api";
import ActionButtons from "./ActionButtons";
import TimelineMealCard from "./TimelineMealCard";
import TimelineActivityCard from "./TimelineActivityCard";

// The timeline endpoint buckets strictly by UTC day, so query the UTC date
// (same convention as TimelineFeed) — the local calendar date's UTC window
// doesn't contain "now" near midnight, which would hide just-saved entries.
function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Today's food + activity logs, shown right below the Log Food / Add an
 * activity buttons (per the Figma Timeline frame). The meal/activity cards
 * are white, so the section sits on a pageBackground panel.
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

  return (
    <div className="rounded-3xl bg-pageBackground p-4 lg:p-5">
      <h3 className="text-[18px] font-semibold text-black">Timeline</h3>

      <ActionButtons
        actions={[
          { label: "Log Food", href: "/meals/log" },
          { label: "Add an activity", href: "/activities/new" },
        ]}
      />

      {loading ? (
        <p className="mt-4 text-sm text-secondary">Loading today&apos;s logs...</p>
      ) : error ? (
        <p className="mt-4 text-sm text-secondary">
          Couldn&apos;t load today&apos;s logs — pull to refresh or try again later.
        </p>
      ) : list.length > 0 ? (
        <div className="mt-4 space-y-3">
          {list.map((entry) => {
            const id = entry.id || entry._id;
            if (entry.type === "meal") {
              return (
                <TimelineMealCard
                  key={id}
                  entry={entry}
                  onClick={() => id && router.push(`/meals/${id}/score`)}
                />
              );
            }
            if (entry.type === "activity") {
              return (
                <TimelineActivityCard
                  key={id}
                  entry={entry}
                  onClick={() => id && router.push(`/activities/${id}`)}
                />
              );
            }
            return null;
          })}
        </div>
      ) : (
        <p className="mt-4 text-sm text-secondary">
          Nothing logged today yet — add a meal or an activity.
        </p>
      )}
    </div>
  );
}
