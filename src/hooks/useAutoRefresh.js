"use client";

import { useEffect, useRef } from "react";

/**
 * Keeps a page's data fresh without manual reloads.
 *
 * Silently re-runs `refresh` on a timer (only while the tab is visible) and
 * immediately whenever the tab regains focus / becomes visible again. This is
 * what makes cross-actor updates feel live — e.g. a doctor approves a plan and
 * the patient's screen updates on its own.
 *
 * IMPORTANT: pass a SILENT refetch (one that does NOT toggle the full-page
 * loading spinner) so the UI doesn't flash on every tick. Don't use this on
 * screens with active, unsaved edits (it would clobber in-progress input).
 *
 * @param {Function} refresh            async refetch fn (kept in a ref, so it
 *                                       can change between renders safely)
 * @param {Object}   [opts]
 * @param {number}   [opts.interval=15000]  ms between background polls; 0 disables polling
 * @param {boolean}  [opts.enabled=true]     master on/off switch
 * @param {boolean}  [opts.refetchOnFocus=true] refetch when tab regains focus/visibility
 */
export function useAutoRefresh(
  refresh,
  { interval = 15000, enabled = true, refetchOnFocus = true } = {}
) {
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return;

    const run = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      try {
        refreshRef.current && refreshRef.current();
      } catch {
        /* swallow — background refresh must never crash the page */
      }
    };

    let timer = null;
    if (interval > 0) timer = setInterval(run, interval);

    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };

    if (refetchOnFocus) {
      document.addEventListener("visibilitychange", onVisible);
      window.addEventListener("focus", run);
    }

    return () => {
      if (timer) clearInterval(timer);
      if (refetchOnFocus) {
        document.removeEventListener("visibilitychange", onVisible);
        window.removeEventListener("focus", run);
      }
    };
  }, [enabled, interval, refetchOnFocus]);
}

export default useAutoRefresh;
