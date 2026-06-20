"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { activityAPI } from "@/services/api";

export default function ActivitySearchSheet({ userId, onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCatalog = useCallback(
    async (q) => {
      if (!userId) return;
      setLoading(true);
      try {
        const resp = await activityAPI.catalog(userId, q);
        setResults(resp?.data || resp || []);
      } catch {
        // Non-blocking — show empty list on error.
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  // Initial load.
  useEffect(() => {
    fetchCatalog("");
  }, [fetchCatalog]);

  // Debounced search.
  useEffect(() => {
    const timer = setTimeout(() => fetchCatalog(query), 300);
    return () => clearTimeout(timer);
  }, [query, fetchCatalog]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-3 pt-[max(env(safe-area-inset-top,0px),12px)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Go back"
          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[#f6f7fb]"
        >
          <ArrowLeft size={20} className="text-black" />
        </button>
        <h1 className="text-lg font-semibold text-black">Add an Activity</h1>
      </div>

      {/* Search bar */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 rounded-xl border border-borderColor bg-[#f6f7fb] px-3 py-2.5">
          <Search size={18} className="flex-shrink-0 text-[#6d6f7b]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for activity"
            className="w-full bg-transparent text-sm text-black placeholder:text-[#6d6f7b] outline-none"
          />
        </div>
      </div>

      {/* Results list */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {loading && results.length === 0 && (
          <p className="mt-6 text-center text-sm text-[#6d6f7b]">Searching...</p>
        )}

        {!loading && results.length === 0 && (
          <p className="mt-6 text-center text-sm text-[#6d6f7b]">
            {query ? "No activities found" : "No activities available"}
          </p>
        )}

        <ul className="space-y-1">
          {results.map((activity) => (
            <li key={activity.name || activity._id}>
              <button
                type="button"
                onClick={() => onSelect(activity)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-[#f6f7fb] active:bg-[#eef0f5]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#1e2027]">
                    {activity.name}
                  </p>
                </div>
                {activity.category && (
                  <span className="flex-shrink-0 rounded-full bg-[#f6f7fb] px-2.5 py-0.5 text-xs font-medium text-[#6d6f7b]">
                    {activity.category}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
