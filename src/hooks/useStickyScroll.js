"use client";
import { useCallback, useEffect, useRef, useState } from "react";

const THRESHOLD = 100;

export function useStickyScroll() {
  const containerRef = useRef(null);
  const pinnedRef = useRef(true);
  const [isPinned, setIsPinned] = useState(true);

  const computePinned = useCallback(() => {
    const el = containerRef.current;
    if (!el) return true;
    const distance = el.scrollHeight - el.clientHeight - el.scrollTop;
    return distance <= THRESHOLD;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const next = computePinned();
      pinnedRef.current = next;
      setIsPinned(next);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [computePinned]);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  const notifyContentChanged = useCallback(() => {
    if (pinnedRef.current) {
      requestAnimationFrame(() => scrollToBottom(false));
    }
  }, [scrollToBottom]);

  const jumpToBottom = useCallback(() => {
    pinnedRef.current = true;
    setIsPinned(true);
    scrollToBottom(true);
  }, [scrollToBottom]);

  return { containerRef, isPinned, notifyContentChanged, jumpToBottom };
}
