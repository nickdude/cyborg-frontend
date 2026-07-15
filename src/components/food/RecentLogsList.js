"use client";

import { useEffect, useState } from "react";
import { mealAPI } from "@/services/api";
import FoodResultRow from "./FoodResultRow";
import { macroLine, portionText } from "./macros";

/**
 * "From your past logs" — distinct items from the user's recent meals,
 * most-frequently logged first. Tap to re-add with the same portion.
 */
export default function RecentLogsList({ userId, onAdd }) {
  const [items, setItems] = useState(null); // null = loading

  useEffect(() => {
    if (!userId) return;
    let active = true;
    mealAPI
      .recentItems(userId)
      .then((resp) => {
        if (active) setItems(Array.isArray(resp?.data) ? resp.data : []);
      })
      .catch(() => {
        if (active) setItems([]);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  if (items === null) {
    return <p className="mt-2 text-center text-sm text-secondary">Loading…</p>;
  }

  if (items.length === 0) {
    return (
      <p className="mt-2 rounded-xl border border-dashed border-borderColor bg-white px-4 py-6 text-center text-sm text-secondary">
        Foods you log will appear here for quick re-adding.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, idx) => {
        const line = [portionText(item.portion), macroLine(item)].filter(Boolean).join(" · ");
        const subtitle = item.count > 1 ? `${line} · logged ${item.count}×` : line;
        return (
          <FoodResultRow
            key={`${item.name}-${idx}`}
            food={item}
            subtitle={subtitle}
            onAdd={onAdd}
          />
        );
      })}
    </div>
  );
}
