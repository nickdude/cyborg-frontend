"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, Search } from "lucide-react";
import { activityAPI } from "@/services/api";
import { normalize, tokenize, bestFuzzyScore, tokenSimilarity } from "@/utils/fuzzy";

const FUZZY_THRESHOLD = 0.72;
// No weight on the profile yet — the catalog's kcal/hour hints assume 70 kg.
const DEFAULT_WEIGHT_KG = 70;

export default function ActivitySearchSheet({ userId, onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // The activity catalog is a static list that the API returns in full, so we
  // fetch it ONCE when the sheet opens and match it in memory. That removes
  // the per-keystroke network request, the 300ms debounce, the duplicate
  // open-time fetch, and the out-of-order-response race entirely.
  useEffect(() => {
    if (!userId) return;
    let active = true;
    setLoading(true);
    setError(false);
    activityAPI
      .catalog(userId, "")
      .then((resp) => {
        if (active) setCatalog(resp?.data || resp || []);
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
  }, [userId, attempt]);

  // Pre-normalize names + aliases once per catalog load; each keystroke then
  // only scores against these.
  const indexed = useMemo(
    () =>
      catalog.map((a) => ({
        a,
        names: [a.name, ...(a.aliases || [])].map((n) => ({
          norm: normalize(n),
          toks: tokenize(n),
        })),
      })),
    [catalog]
  );

  // Exact > prefix > substring > fuzzy (typo-tolerant: "badmington" still
  // finds Badminton, "kabadi" finds Kabaddi).
  const results = useMemo(() => {
    const qn = normalize(query);
    // Idle shows the prompt, not the full A-Z catalog (see render below).
    if (!qn) return [];
    const qToks = qn.split(" ").filter(Boolean);
    const scored = [];
    for (const { a, names } of indexed) {
      let score = 0;
      for (const n of names) {
        if (n.norm === qn) {
          score = 3;
          break;
        }
        if (n.norm.startsWith(qn)) score = Math.max(score, 2.5);
        else if (n.norm.includes(qn)) score = Math.max(score, 2);
      }
      if (score === 0) {
        score = bestFuzzyScore(
          qToks,
          names.map((n) => n.toks)
        );
        if (score < FUZZY_THRESHOLD) score = 0;
      }
      if (score > 0) {
        // Tie-break: how well the first typed word matches the name's first
        // word, so "badmington" ranks Badminton (Casual) over Ball Badminton.
        const firstTokSim = tokenSimilarity(
          qToks[0] || "",
          names[0]?.toks?.[0] || ""
        );
        scored.push({ a, score, firstTokSim });
      }
    }
    scored.sort(
      (x, y) =>
        y.score - x.score ||
        y.firstTokSim - x.firstTokSim ||
        x.a.name.length - y.a.name.length
    );
    return scored.map((s) => s.a);
  }, [query, indexed]);

  return (
    <div className="fixed inset-0 z-50 bg-pageBackground">
      <div className="mx-auto flex h-full w-full max-w-md flex-col">
        {/* Header: back + centered title, per the Figma frame */}
        <div className="flex items-center justify-between px-3 pb-2 pt-[max(env(safe-area-inset-top,0px),12px)]">
          <button
            type="button"
            onClick={onClose}
            aria-label="Go back"
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/60"
          >
            <ChevronLeft size={22} className="text-black" />
          </button>
          <h1 className="text-base font-medium text-black">Add Activity</h1>
          <div className="w-9" aria-hidden="true" />
        </div>

        {/* Search pill */}
        <div className="px-5 pb-3 pt-2">
          <div className="flex h-10 items-center gap-2 rounded-full border border-borderColor bg-white px-5 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)]">
            <Search size={14} className="flex-shrink-0 text-secondary" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for activity"
              className="w-full bg-transparent text-sm font-medium text-black outline-none placeholder:text-secondary"
            />
          </div>
        </div>

        {/* Results populate the frame's blank canvas */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 pt-1">
          {loading && (
            <p className="mt-6 text-center text-sm text-secondary">Loading...</p>
          )}

          {!loading && error && catalog.length === 0 && (
            <div className="mt-6 text-center">
              <p className="text-sm text-secondary">
                Couldn&apos;t load activities. Check your connection.
              </p>
              <button
                type="button"
                onClick={() => setAttempt((n) => n + 1)}
                className="mt-3 rounded-full border border-borderColor bg-white px-4 py-2 text-sm font-medium text-ink transition hover:bg-white/70"
              >
                Try again
              </button>
            </div>
          )}

          {/* The frame shows a blank canvas under the search pill, and an
              A-Z dump of the whole catalog is a poor default — prompt instead,
              mirroring the food search's idle state. */}
          {!loading && !error && !query && (
            <p className="mt-6 text-center text-sm text-secondary">
              Search for an activity to log
            </p>
          )}

          {!loading && !error && query && results.length === 0 && (
            <p className="mt-6 text-center text-sm text-secondary">
              No activities found
            </p>
          )}

          <ul className="space-y-2">
            {results.map((activity) => (
              <li key={activity.id || activity.name || activity._id}>
                <button
                  type="button"
                  onClick={() => onSelect(activity)}
                  className="flex w-full items-center gap-3 rounded-xl border border-borderColor bg-white px-4 py-3 text-left transition hover:border-secondary/50 active:scale-[0.99]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {activity.name}
                    </p>
                    {activity.metPerHour != null && (
                      <p className="mt-0.5 text-xs text-secondary">
                        ~{Math.round(activity.metPerHour * DEFAULT_WEIGHT_KG)} kcal/hour
                      </p>
                    )}
                  </div>
                  {activity.category && (
                    <span className="flex-shrink-0 rounded-full bg-pageBackground px-2.5 py-0.5 text-xs font-medium capitalize text-secondary">
                      {String(activity.category).replace("_", " ")}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
