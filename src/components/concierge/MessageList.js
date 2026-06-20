"use client";
import { useEffect } from "react";
import { ArrowDown, ChevronUp } from "lucide-react";
import { useConciergeStore } from "@/stores/concierge";
import { useStickyScroll } from "@/hooks/useStickyScroll";
import Message from "./Message";

const QUICK_PROMPTS = [
  "Summarize my latest lab report",
  "How am I sleeping this week?",
  "What does my ApoB mean?",
];

const EMPTY_MESSAGES = [];

// Radiating "spark" mark, shown above the greeting (brand color via currentColor).
function Sunburst({ size = 30 }) {
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
        strokeWidth="2.3"
        strokeLinecap="round"
      />
    );
  }
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className="text-primary">
      {rays}
    </svg>
  );
}

export default function MessageList({ chatId, firstName, onQuickPrompt }) {
  const rawMessages = useConciergeStore((s) =>
    chatId ? s.messages[chatId] : undefined
  );
  const messages = rawMessages || EMPTY_MESSAGES;
  const streamStatus = useConciergeStore((s) =>
    chatId ? s.streams[chatId]?.status ?? null : null
  );
  const streaming = streamStatus === "streaming";

  const { containerRef, isPinned, notifyContentChanged, jumpToBottom } =
    useStickyScroll();

  useEffect(() => {
    notifyContentChanged();
  }, [messages, notifyContentChanged]);

  const isEmpty = messages.length === 0;

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={containerRef}
        className="h-full overflow-y-auto px-4 py-6 sm:px-6 sm:py-8"
      >
        {isEmpty ? (
          <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col">
            <div className="flex flex-1 flex-col items-center justify-center px-2 text-center">
              <div className="mb-2 grid h-9 w-9 place-items-center rounded-full border border-borderColor text-secondary">
                <ChevronUp className="h-4 w-4" />
              </div>
              <p className="text-[13.5px] text-secondary">
                Scroll for chat history
              </p>
              <div className="mt-5 mb-4">
                <Sunburst size={30} />
              </div>
              <h1 className="max-w-[18ch] text-[26px] font-bold leading-tight tracking-tight text-blue">
                Hi {firstName || "there"}, how can we help you?
              </h1>
              <p className="mt-3 max-w-[30ch] text-[15px] text-secondary">
                Ask about your labs, wearables, or anything health-related.
              </p>
            </div>
            <div className="-mx-4 flex gap-2.5 overflow-x-auto scrollbar-hide px-4 pb-1 pt-6 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => onQuickPrompt?.(p)}
                  className="flex-none rounded-2xl border border-borderColor bg-white px-5 py-3.5 text-center text-[14px] font-medium leading-snug text-blue transition-colors hover:border-lightGray hover:bg-pageBackground cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            {messages.map((m) => {
              const isLastAssistant =
                m.role === "assistant" &&
                m.id === messages[messages.length - 1]?.id;
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

      {!isPinned && streaming && (
        <button
          onClick={jumpToBottom}
          className="absolute bottom-5 left-1/2 grid h-10 w-10 -translate-x-1/2 place-items-center rounded-full border border-borderColor bg-white text-blue shadow-md transition-all duration-150 hover:bg-pageBackground active:scale-95"
          aria-label="Jump to latest"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
