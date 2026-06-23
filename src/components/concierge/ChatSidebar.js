"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, MoreVertical, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useConciergeStore } from "@/stores/concierge";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function startOfDay(date) {
  const x = new Date(date);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

// Day-grouped label: Today / Yesterday / weekday (last 7 days) / "Jun 14".
function dayLabel(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Older";
  const today = startOfDay(new Date());
  const dayStart = startOfDay(d);
  const diffDays = Math.floor((today - dayStart) / DAY_MS);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return WEEKDAYS[d.getDay()];
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function ChatRow({ chat, active, onSelect, onDelete, onRename }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(chat.title || "");
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const commitRename = () => {
    const next = draft.trim();
    setEditing(false);
    if (next && next !== chat.title) onRename(chat._id, next);
    else setDraft(chat.title || "");
  };

  if (editing) {
    return (
      <div className="mx-1 px-3 py-1.5">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") {
              setDraft(chat.title || "");
              setEditing(false);
            }
          }}
          className="w-full rounded-lg border border-primary/30 bg-white px-2 py-1 text-[13px] text-blue outline-none focus:border-primary/50"
        />
      </div>
    );
  }

  return (
    <div className="group relative mx-1 flex items-center">
      <button
        onClick={() => onSelect(chat._id)}
        className={`flex-1 min-w-0 truncate rounded-lg px-4 py-2 pr-9 text-left text-[13px] transition-colors cursor-pointer ${
          active
            ? "bg-primary/10 text-primary font-medium"
            : "text-blue hover:bg-pageBackground"
        }`}
        title={chat.title}
      >
        {chat.title || "New chat"}
      </button>

      <div ref={menuRef} className="absolute right-1.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((o) => !o);
          }}
          className={`grid h-7 w-7 place-items-center rounded-lg text-secondary transition-all hover:bg-borderColor/60 hover:text-blue ${
            menuOpen
              ? "opacity-100"
              : "opacity-0 focus:opacity-100 group-hover:opacity-100"
          }`}
          aria-label="Chat options"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-8 z-50 w-36 overflow-hidden rounded-xl border border-borderColor bg-white py-1 shadow-lg shadow-black/5">
            <button
              onClick={() => {
                setMenuOpen(false);
                setDraft(chat.title || "");
                setEditing(true);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-blue transition-colors hover:bg-pageBackground"
            >
              <Pencil className="h-3.5 w-3.5 text-secondary" />
              Rename
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onDelete(chat._id);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatSidebar({
  open,
  onClose,
  activeChatId,
  onSelect,
  onNew,
  onDelete,
}) {
  const chatOrder = useConciergeStore((s) => s.chatOrder);
  const chats = useConciergeStore((s) => s.chats);
  const renameChat = useConciergeStore((s) => s.renameChat);
  const [query, setQuery] = useState("");

  // Ordered list of { label, chats[] } grouped by day, preserving chatOrder.
  const groups = useMemo(() => {
    const filtered = chatOrder.filter((id) => {
      const c = chats[id];
      if (!c) return false;
      if (!query.trim()) return true;
      return (c.title || "").toLowerCase().includes(query.trim().toLowerCase());
    });
    const out = [];
    const indexByLabel = {};
    for (const id of filtered) {
      const c = chats[id];
      const label = dayLabel(c.updatedAt || c.createdAt || Date.now());
      if (indexByLabel[label] === undefined) {
        indexByLabel[label] = out.length;
        out.push({ label, chats: [] });
      }
      out[indexByLabel[label]].chats.push(c);
    }
    return out;
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
        className={`fixed z-50 top-0 left-0 h-full w-72 bg-white/95 backdrop-blur-xl border-r border-borderColor flex flex-col transform transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-3 py-3">
          <div className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-lg hover:bg-pageBackground transition-colors"
              aria-label="Back to dashboard"
            >
              <ChevronLeft className="w-5 h-5 text-secondary" />
            </Link>
            <span className="text-sm font-semibold text-blue">Messages</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-pageBackground transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4 text-secondary" />
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
          <div className="flex items-center gap-2 bg-pageBackground border border-borderColor rounded-lg px-3 py-2 focus-within:bg-white focus-within:border-primary/30 transition-all duration-200">
            <Search className="w-3.5 h-3.5 text-secondary" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="flex-1 outline-none text-sm bg-transparent placeholder:text-secondary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto mt-2 pb-4">
          {groups.map(({ label, chats: rows }) => (
            <div key={label} className="mt-3">
              <div className="px-4 text-[10px] uppercase tracking-wider text-secondary font-medium mb-1">
                {label}
              </div>
              {rows.map((c) => (
                <ChatRow
                  key={c._id}
                  chat={c}
                  active={activeChatId === c._id}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onRename={renameChat}
                />
              ))}
            </div>
          ))}
          {!groups.length && (
            <div className="px-4 py-8 text-center text-sm text-secondary">
              No chats yet
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
