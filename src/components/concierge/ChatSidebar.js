"use client";
import { useMemo, useState } from "react";
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
        />
      )}
      <aside
        className={`fixed z-50 top-0 left-0 h-full w-72 bg-white/95 backdrop-blur-xl border-r border-gray-100 flex flex-col transform transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-3 py-3">
          <div className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Back to dashboard"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <span className="text-sm font-semibold text-gray-900">Chats</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-3">
          <button
            onClick={onNew}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 shadow-sm shadow-primary/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New chat
          </button>
        </div>

        <div className="px-3 pt-3">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus-within:bg-white focus-within:border-primary/30 transition-all duration-200">
            <Search className="w-3.5 h-3.5 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="flex-1 outline-none text-sm bg-transparent placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto mt-2 pb-4">
          {ORDER.map((label) => {
            const rows = buckets[label];
            if (!rows || !rows.length) return null;
            return (
              <div key={label} className="mt-3">
                <div className="px-4 text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-1">
                  {label}
                </div>
                {rows.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => onSelect(c._id)}
                    className={`w-full text-left px-4 py-2 text-[13px] transition-colors truncate rounded-lg mx-1 cursor-pointer ${
                      activeChatId === c._id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-gray-700 hover:bg-gray-50"
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
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              No chats yet
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
