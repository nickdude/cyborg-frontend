"use client";
import { useEffect } from "react";
import { ArrowDown, Sparkles } from "lucide-react";
import { useConciergeStore } from "@/stores/concierge";
import { useStickyScroll } from "@/hooks/useStickyScroll";
import Message from "./Message";

const EMPTY_MESSAGES = [];

const MASK =
  "linear-gradient(rgba(0,0,0,0) 0px, rgb(0,0,0) 32px, rgb(0,0,0) calc(100% - 32px), rgba(0,0,0,0) 100%)";

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// "Today" / "Yesterday" / "Jun 23rd" — matches the reference date dividers.
function dayLabel(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = startOfDay(new Date());
  const day = startOfDay(d);
  const diff = Math.round((today - day) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  const month = d.toLocaleDateString(undefined, { month: "short" });
  return `${month} ${ordinal(d.getDate())}`;
}

export default function MessageList({ chatId, firstName }) {
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
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        className="flex min-h-0 flex-1 flex-col"
        style={{
          maskImage: MASK,
          WebkitMaskImage: MASK,
          maskRepeat: "no-repeat",
          maskSize: "100% 100%",
        }}
      >
        <div
          ref={containerRef}
          className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-4 pb-4 pt-5 [overflow-anchor:none]"
        >
          <div aria-hidden="true" className="h-px w-full shrink-0" />

          {isEmpty ? (
            <div className="m-auto flex max-w-md flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-cyborg-purple-light shadow-lg shadow-primary/20">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h1 className="mb-1 text-xl font-semibold text-blue">
                How can I help, {firstName || "there"}?
              </h1>
              <p className="text-sm text-secondary">
                Ask about your labs, wearables, or anything health-related.
              </p>
            </div>
          ) : (
            <div className="mt-auto flex flex-col gap-6">
              {messages.map((m, i) => {
                const isLastAssistant =
                  m.role === "assistant" &&
                  m.id === messages[messages.length - 1]?.id;
                const prev = messages[i - 1];
                const showDivider =
                  i === 0 ||
                  (prev &&
                    startOfDay(m.createdAt) !== startOfDay(prev.createdAt));
                return (
                  <div key={m.id} className="flex flex-col gap-6">
                    {showDivider && (
                      <div className="mx-auto w-full max-w-3xl px-0.5">
                        <div className="flex w-full items-center gap-3 py-1 text-xs font-medium text-secondary">
                          <div
                            aria-hidden="true"
                            className="h-px flex-1 bg-borderColor"
                          />
                          <time>{dayLabel(m.createdAt)}</time>
                          <div
                            aria-hidden="true"
                            className="h-px flex-1 bg-borderColor"
                          />
                        </div>
                      </div>
                    )}
                    <Message
                      message={m}
                      streaming={streaming && isLastAssistant}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div aria-hidden="true" className="min-h-[24px] shrink-0" />
        </div>
      </div>

      {!isPinned && (
        <button
          onClick={jumpToBottom}
          className="absolute bottom-4 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-borderColor bg-white text-secondary shadow-lg transition-all duration-150 hover:text-blue active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label="Jump to latest"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
