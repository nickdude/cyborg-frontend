"use client";

import { useEffect, useRef, useState } from "react";
import { PencilLine } from "lucide-react";
import { foodSearchAPI } from "@/services/api";
import FoodResultRow from "./FoodResultRow";

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

/**
 * Debounced food search list. Results come from the provider-agnostic
 * backend search (local INDB first). Empty result set offers the AI
 * quick-add path instead.
 */
export default function FoodSearchResults({ userId, query, onAdd, onDescribe }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errored, setErrored] = useState(false);
  // Monotonic request counter guards against out-of-order responses
  // (fast typing can resolve an older, longer query after a newer one).
  const requestSeq = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (!userId || q.length < MIN_CHARS) {
      setResults([]);
      setLoading(false);
      setErrored(false);
      return;
    }
    setLoading(true);
    setErrored(false);
    const seq = ++requestSeq.current;
    const timer = setTimeout(() => {
      foodSearchAPI
        .search(userId, q)
        .then((resp) => {
          if (seq !== requestSeq.current) return; // stale
          setResults(Array.isArray(resp?.data) ? resp.data : []);
          setLoading(false);
        })
        .catch(() => {
          if (seq !== requestSeq.current) return;
          setResults([]);
          setErrored(true);
          setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [userId, query]);

  const q = query.trim();
  if (q.length < MIN_CHARS) {
    return (
      <p className="mt-6 text-center text-sm text-secondary">
        Keep typing to search foods…
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {loading && (
        <p className="mt-4 text-center text-sm text-secondary">Searching…</p>
      )}

      {!loading &&
        results.map((food, idx) => (
          <FoodResultRow
            key={food.refId || `${food.name}-${idx}`}
            food={food}
            onAdd={onAdd}
            // userId makes the row body expand the inline details card
            // (macros + AI insight); the + still quick-adds.
            userId={userId}
          />
        ))}

      {!loading && results.length === 0 && (
        <div className="mt-4 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-secondary">
            {errored ? "Search isn't available right now." : `No foods found for “${q}”.`}
          </p>
          <button
            type="button"
            onClick={() => onDescribe(q)}
            className="inline-flex items-center gap-2 rounded-full border border-borderColor bg-white px-4 py-2.5 text-sm font-medium text-blue"
          >
            <PencilLine size={15} />
            Describe it instead
          </button>
        </div>
      )}
    </div>
  );
}
