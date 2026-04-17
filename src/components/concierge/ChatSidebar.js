"use client";
import { useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
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
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed z-50 top-0 left-0 h-full w-80 bg-white border-r border-borderColor flex flex-col transform transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-borderColor">
          <div className="font-semibold">Concierge</div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded hover:bg-gray-100"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3 pt-3">
          <button
            onClick={onNew}
            className="w-full flex items-center gap-2 bg-black text-white rounded-full px-4 py-2 text-sm hover:bg-gray-900 transition"
          >
            <Plus className="w-4 h-4" /> New chat
          </button>
        </div>

        <div className="px-3 pt-3">
          <div className="flex items-center gap-2 border border-borderColor rounded-lg px-3 py-1.5">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats"
              className="flex-1 outline-none text-sm bg-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto mt-3 pb-4">
          {ORDER.map((label) => {
            const rows = buckets[label];
            if (!rows || !rows.length) return null;
            return (
              <div key={label} className="mb-4">
                <div className="px-4 text-[11px] uppercase tracking-wider text-gray-400 mb-1">
                  {label}
                </div>
                {rows.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => onSelect(c._id)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition truncate ${
                      activeChatId === c._id
                        ? "bg-purple-50 text-purple-800 font-medium"
                        : ""
                    }`}
                    title={c.title}
                  >
                    {c.title || "New chat"}
                  </button>
                ))}
              </div>
            );
          })}
          {!Object.keys(buckets).length && (
            <div className="px-4 text-sm text-gray-400">No chats yet.</div>
          )}
        </div>
      </aside>
    </>
  );
}
