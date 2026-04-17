"use client";
import { useEffect } from "react";
import { ArrowDown } from "lucide-react";
import { useConciergeStore } from "@/stores/concierge";
import { useStickyScroll } from "@/hooks/useStickyScroll";
import Message from "./Message";

const QUICK_PROMPTS = [
  "Summarize my latest lab report",
  "How am I sleeping this week?",
  "What does my ApoB mean?",
];

export default function MessageList({ chatId, firstName, onQuickPrompt }) {
  const messages = useConciergeStore((s) =>
    chatId ? s.messages[chatId] || [] : []
  );
  const streamStatus = useConciergeStore((s) =>
    chatId ? s.streams[chatId]?.status : null
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
        className="h-full overflow-y-auto px-4 sm:px-6 py-6 space-y-3"
      >
        {isEmpty ? (
          <div className="max-w-xl mx-auto text-center mt-16">
            <h1 className="text-2xl font-semibold mb-1">
              Hi {firstName || "there"}, how can we help you?
            </h1>
            <p className="text-secondary text-sm mb-6">
              Ask about your labs, wearables, or anything health-related.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => onQuickPrompt?.(p)}
                  className="text-sm bg-white border border-borderColor rounded-full px-4 py-2 hover:bg-gray-50 transition"
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
          className="absolute bottom-4 right-4 bg-black text-white rounded-full w-10 h-10 shadow-lg hover:bg-gray-800 transition flex items-center justify-center"
          aria-label="Jump to latest"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
