// Lightweight read-through cache with in-flight de-duplication for the few
// heavy, slow-changing GETs that several screens fetch independently (the
// biomarker panel + trends, and the subscription). It removes the redundant
// refetches on every mount / back-navigation / focus-refetch burst WITHOUT any
// page changes — the API methods opt in per key (see services/api.js).
//
// Deliberately NOT used for plan / goals / notifications / timeline / the report
// list: those must stay live (a doctor approving a plan, or a freshly uploaded
// report, should appear on the very next fetch), so they keep hitting the
// network every time. Only cache aggregates that are safe to serve a few seconds
// stale.

const inflight = new Map(); // key -> Promise  (dedupes concurrent identical calls)
const cache = new Map(); // key -> { at:number, data:any }

/**
 * Read-through cache. Returns a cached value while it's within `ttl`, otherwise
 * runs `fn` (sharing a single in-flight promise across concurrent callers).
 *
 * @param {string} key                unique key; include userId for per-user data
 * @param {() => Promise<any>} fn      the actual request
 * @param {number} [ttl=20000]        ms the cached value stays fresh
 * @returns {Promise<any>}
 */
export function cachedQuery(key, fn, ttl = 20000) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return Promise.resolve(hit.data);
  if (inflight.has(key)) return inflight.get(key);

  const p = Promise.resolve()
    .then(fn)
    .then((data) => {
      cache.set(key, { at: Date.now(), data });
      inflight.delete(key);
      return data;
    })
    .catch((err) => {
      inflight.delete(key); // never cache a failure
      throw err;
    });

  inflight.set(key, p);
  return p;
}

/** Drop cached entries by exact key or `prefix:*` so the next read re-fetches. */
export function invalidateQuery(prefix) {
  for (const k of [...cache.keys()]) {
    if (k === prefix || k.startsWith(`${prefix}:`)) cache.delete(k);
  }
  for (const k of [...inflight.keys()]) {
    if (k === prefix || k.startsWith(`${prefix}:`)) inflight.delete(k);
  }
}
