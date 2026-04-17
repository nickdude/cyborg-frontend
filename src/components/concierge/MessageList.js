"use client";
import { useEffect } from "react";
import { ArrowDown, Sparkles } from "lucide-react";
import { useConciergeStore } from "@/stores/concierge";
import { useStickyScroll } from "@/hooks/useStickyScroll";
import Message from "./Message";

const QUICK_PROMPTS = [
  "Summarize my latest lab report",
  "How am I sleeping this week?",
  "What does my ApoB mean?",
];

const EMPTY_MESSAGES = [];

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
        className="h-full overflow-y-auto px-4 sm:px-6 py-6 space-y-4"
      >
        {isEmpty ? (
          <div className="max-w-md mx-auto text-center mt-20">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">
              Hi {firstName || "there"}
            </h1>
            <p className="text-secondary text-sm mb-6">
              Ask about your labs, wearables, or anything health-related.
            </p>
            <div className="flex flex-col gap-2">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => onQuickPrompt?.(p)}
                  className="text-sm text-left bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-primary/30 hover:bg-primary/[0.02] transition-all duration-200 text-gray-700 cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>

      {!isPinned && streaming && (
        <button
          onClick={jumpToBottom}
          className="absolute bottom-4 right-4 bg-primary text-white rounded-full w-9 h-9 shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all duration-150 flex items-center justify-center"
          aria-label="Jump to latest"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
