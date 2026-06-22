"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, Maximize2, X } from "lucide-react";
import { useConciergeStore } from "@/stores/concierge";
import { DEFAULT_PROMPTS } from "@/components/concierge/prompts";
import Message from "@/components/concierge/Message";

// Radiating "spark" loader mark used on the pill + panel header (brand color).
function Sparkle({ size = 18, spin = false }) {
  const rays = [];
  for (let a = 0; a < 360; a += 30) {
    const r = (a * Math.PI) / 180;
    rays.push(
      <line
        key={a}
        x1={20 + 5.5 * Math.cos(r)}
        y1={20 + 5.5 * Math.sin(r)}
        x2={20 + 15 * Math.cos(r)}
        y2={20 + 15 * Math.sin(r)}
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    );
  }
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={spin ? "animate-spin [animation-duration:3s]" : ""}
      aria-hidden="true"
    >
      {rays}
    </svg>
  );
}

// "Today" style day pill separator at the top of the thread.
function TodayPill() {
  return (
    <div className="flex justify-center py-1">
      <span className="rounded-full bg-pageBackground px-3 py-1 text-[11px] font-medium text-secondary">
        Today
      </span>
    </div>
  );
}

export default function AskCyborgAI() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState(null);
  const creatingRef = useRef(false);
  const scrollRef = useRef(null);

  // Reuse the SAME concierge store as /concierge so messages persist + appear there.
  const createChat = useConciergeStore((s) => s.createChat);
  const sendMessage = useConciergeStore((s) => s.sendMessage);

  // Subscribe to this chat's messages + stream status straight from the store —
  // streaming is handled by the store (no SSE re-implementation here).
  const messages = useConciergeStore((s) =>
    chatId ? s.messages[chatId] : undefined
  );
  const streamStatus = useConciergeStore((s) =>
    chatId ? s.streams[chatId]?.status ?? null : null
  );
  const streaming = streamStatus === "streaming";

  const list = messages || [];
  const isEmpty = list.length === 0;

  // Ensure a chat exists the first time the panel opens.
  useEffect(() => {
    if (!open || chatId || creatingRef.current) return;
    creatingRef.current = true;
    createChat()
      .then((id) => setChatId(id))
      .catch((err) => console.error("[AskCyborgAI] createChat failed", err))
      .finally(() => {
        creatingRef.current = false;
      });
  }, [open, chatId, createChat]);

  // Keep the thread pinned to the latest message while it grows / streams.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [list, streaming]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !chatId || streaming) return;
    sendMessage(chatId, text);
    setInput("");
  };

  const handlePrompt = (p) => {
    if (!chatId || streaming) return;
    sendMessage(chatId, p);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Floating pill — the only thing rendered while the panel is closed.
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black px-5 py-3 font-sans text-sm font-medium text-white shadow-[0_8px_30px_rgba(0,0,0,0.18)] transition hover:bg-black/90 active:scale-95 lg:left-auto lg:right-6 lg:translate-x-0"
        aria-label="Ask Cyborg AI"
      >
        <Sparkle size={16} spin />
        Ask Cyborg AI
      </button>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-0 font-sans sm:px-4 lg:inset-x-auto lg:right-6 lg:justify-end">
      <div className="flex h-[600px] max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-borderColor bg-white shadow-[0_12px_48px_rgba(0,0,0,0.22)] sm:max-w-[420px] sm:rounded-3xl">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-2 border-b border-borderColor px-4 py-3">
          <span className="text-primary">
            <Sparkle size={18} spin={streaming} />
          </span>
          <span className="flex-1 truncate text-[15px] font-semibold text-blue">
            Ask Cyborg AI
          </span>
          <Link
            href={chatId ? `/concierge?id=${chatId}` : "/concierge"}
            className="grid h-8 w-8 place-items-center rounded-full text-secondary transition hover:bg-pageBackground hover:text-blue"
            aria-label="Expand to fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid h-8 w-8 place-items-center rounded-full text-secondary transition hover:bg-pageBackground hover:text-blue"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Thread */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          <TodayPill />

          {isEmpty ? (
            <div className="mt-6 flex flex-col gap-2.5">
              <p className="px-1 text-[13px] text-secondary">
                Ask about your labs, wearables, or anything health-related.
              </p>
              {DEFAULT_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePrompt(p)}
                  disabled={!chatId || streaming}
                  className="rounded-2xl border border-borderColor bg-white px-4 py-3 text-left text-[13.5px] font-medium leading-snug text-blue transition-colors hover:border-lightGray hover:bg-pageBackground disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-5">
              {list.map((m) => {
                const isLastAssistant =
                  m.role === "assistant" && m.id === list[list.length - 1]?.id;
                return (
                  <Message
                    key={m.id}
                    message={m}
                    streaming={streaming && isLastAssistant}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="shrink-0 border-t border-borderColor bg-white px-3 pb-3 pt-3">
          <div className="flex items-center gap-2 rounded-2xl border border-borderColor bg-white py-1.5 pl-4 pr-1.5 transition-colors focus-within:border-lightGray">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={
                streaming ? "Wait for reply to finish…" : "Ask anything…"
              }
              className="w-full bg-transparent py-1.5 text-[15px] outline-none placeholder:text-secondary"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!chatId || streaming || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-white transition-all duration-150 hover:bg-black/90 active:scale-95 disabled:opacity-25"
              aria-label="Send"
            >
              <ArrowUp className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
