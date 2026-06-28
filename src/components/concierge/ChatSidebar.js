"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { useConciergeStore } from "@/stores/concierge";

function bucketFor(updatedAt) {
  const now = new Date();
  const d = new Date(updatedAt);
  const startOfDay = (date) => {
    const x = new Date(date);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
  };
  const ms = 24 * 60 * 60 * 1000;
  const today = startOfDay(now);
  const dayStart = startOfDay(d);
  const diffDays = Math.floor((today - dayStart) / ms);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 7) return "Last 7 days";
  if (diffDays <= 30) return "Last 30 days";
  return "Older";
}

const ORDER = ["Today", "Yesterday", "Last 7 days", "Last 30 days", "Older"];

export default function ChatSidebar({
  open,
  onClose,
  activeChatId,
  onSelect,
  onNew,
}) {
  const chatOrder = useConciergeStore((s) => s.chatOrder);
  const chats = useConciergeStore((s) => s.chats);
  const [query, setQuery] = useState("");

  // Track the lg breakpoint. The drawer is an off-canvas overlay on small
  // screens (translated off-screen when closed) but static/visible on desktop
  // (lg:static lg:translate-x-0). We only want to hide it from the tab order /
  // AT when it is closed AND on a small screen.
  // Initialize to false (the SSR value) so the server-rendered HTML and the
  // first client render agree. Reading matchMedia during render (e.g. in a lazy
  // useState initializer) returns the real breakpoint on the client's initial
  // hydration render while the server saw `false`, which diverges the
  // offscreen-derived aria-hidden/inert attributes (hydration mismatch). The
  // effect below reads the real breakpoint right after mount.
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  // When closed on a small screen the panel is translated off-screen but its
  // controls remain focusable — pull them out of the tab order and hide from AT.
  const offscreen = !open && !isDesktop;

  // Escape-to-close while the drawer is open (mobile)
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const buckets = useMemo(() => {
    const filtered = chatOrder.filter((id) => {
      const c = chats[id];
      if (!c) return false;
      if (!query.trim()) return true;
      return (c.title || "")
        .toLowerCase()
        .includes(query.trim().toLowerCase());
    });
    const map = {};
    for (const id of filtered) {
      const c = chats[id];
      const b = bucketFor(c.updatedAt || c.createdAt || Date.now());
      (map[b] ||= []).push(c);
    }
    return map;
  }, [chatOrder, chats, query]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        aria-hidden={offscreen || undefined}
        inert={offscreen ? "" : undefined}
        className={`fixed z-50 top-0 left-0 h-full w-72 bg-white/95 backdrop-blur-xl border-r border-borderColor flex flex-col transform transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-3 py-3">
          <div className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-xl hover:bg-pageBackground transition-colors"
              aria-label="Back to dashboard"
            >
              <ChevronLeft className="w-5 h-5 text-secondary" />
            </Link>
            <span className="text-sm font-semibold text-blue">Chats</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl hover:bg-pageBackground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4 text-secondary" />
          </button>
        </div>

        <div className="px-3">
          <button
            onClick={onNew}
            className="w-full flex items-center justify-center gap-2 bg-black text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-black/85 active:scale-[0.98] transition-all duration-150 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New chat
          </button>
        </div>

        <div className="px-3 pt-3">
          <div className="flex items-center gap-2 bg-pageBackground border border-borderColor rounded-full px-3 py-2 focus-within:bg-white focus-within:border-primary/40 transition-all duration-200">
            <Search className="w-3.5 h-3.5 text-secondary" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search chats"
              className="flex-1 outline-none text-base sm:text-sm bg-transparent placeholder:text-secondary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto mt-2 pb-4">
          {ORDER.map((label) => {
            const rows = buckets[label];
            if (!rows || !rows.length) return null;
            return (
              <div key={label} className="mt-3">
                <div className="px-4 text-[11px] uppercase tracking-wide text-secondary font-semibold mb-1">
                  {label}
                </div>
                {rows.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => onSelect(c._id)}
                    className={`w-full text-left px-4 py-2 min-h-[44px] text-[13px] transition-colors truncate rounded-xl mx-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                      activeChatId === c._id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-secondary hover:bg-pageBackground hover:text-blue"
                    }`}
                    style={{ maxWidth: "calc(100% - 8px)" }}
                    title={c.title}
                  >
                    {c.title || "New chat"}
                  </button>
                ))}
              </div>
            );
          })}
          {!Object.keys(buckets).length && (
            <div className="px-4 py-8 text-center text-sm text-secondary">
              No chats yet
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
