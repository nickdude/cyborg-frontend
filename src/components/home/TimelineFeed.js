"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { timelineAPI } from "@/services/api";
import TimelineDateNav from "./TimelineDateNav";
import TimelineMealCard from "./TimelineMealCard";
import TimelineActivityCard from "./TimelineActivityCard";
import ActionButtons from "./ActionButtons";
import ZoneScoreOverlay from "@/components/insights/ZoneScoreOverlay";

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

export default function TimelineFeed({ userId, actions }) {
  const router = useRouter();
  const [date, setDate] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);

  // Defer current-date computation to the client to avoid SSR/hydration mismatch.
  useEffect(() => {
    setDate(todayUTC());
  }, []);

  const fetchTimeline = useCallback(async () => {
    if (!userId || !date) return;
    setLoading(true);
    try {
      const resp = await timelineAPI.get(userId, date);
      setEntries(resp?.data?.entries || resp?.entries || resp?.data || []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [userId, date]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  return (
    <div>
      {date && <TimelineDateNav date={date} onChange={setDate} />}

      {/* Actions above the feed — logs for the day read below the buttons. */}
      {actions && actions.length > 0 && <ActionButtons actions={actions} />}

      <div className="mt-4 space-y-3">
        {loading && entries.length === 0 && (
          <p className="py-6 text-center text-sm text-[#6d6f7b]">Loading timeline...</p>
        )}

        {!loading && entries.length === 0 && (
          <div className="py-6 text-center">
            <p className="text-lg font-medium text-black lg:text-xl">No events today</p>
            <p className="mt-1 text-secondary">Log something to fill your timeline</p>
          </div>
        )}

        {entries.map((entry) => {
          if (entry.type === "meal") {
            return (
              <TimelineMealCard
                key={entry.id || entry._id}
                entry={entry}
                onClick={() => setSelectedMeal(entry)}
              />
            );
          }
          if (entry.type === "activity") {
            return (
              <TimelineActivityCard
                key={entry.id || entry._id}
                entry={entry}
                onClick={() => {
                  const id = entry.id || entry._id;
                  if (id) router.push(`/activities/${id}`);
                }}
              />
            );
          }
          return null;
        })}
      </div>

      {selectedMeal && (
        <ZoneScoreOverlay
          entry={selectedMeal}
          userId={userId}
          onClose={() => setSelectedMeal(null)}
          onDetails={() =>
            router.push(`/meals/${selectedMeal.id || selectedMeal._id}/review`)
          }
        />
      )}
    </div>
  );
}
