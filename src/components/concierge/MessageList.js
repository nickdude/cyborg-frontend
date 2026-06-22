"use client";
import { useEffect } from "react";
import { ArrowDown, ChevronUp, MessageCircleQuestion } from "lucide-react";
import { useConciergeStore } from "@/stores/concierge";
import { useStickyScroll } from "@/hooks/useStickyScroll";
import { DEFAULT_PROMPTS } from "./prompts";
import Message from "./Message";

const EMPTY_MESSAGES = [];

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

// Today / Yesterday / weekday (last 7 days) / "Jun 14" separator label.
function dayLabel(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const today = startOfDay(new Date());
  const dayStart = startOfDay(d);
  const diffDays = Math.floor((today - dayStart) / DAY_MS);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return WEEKDAYS[d.getDay()];
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function DaySeparator({ label }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-borderColor" />
      <span className="text-[11px] font-medium uppercase tracking-wider text-secondary">
        {label}
      </span>
      <div className="h-px flex-1 bg-borderColor" />
    </div>
  );
}

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

function CareTeamCard() {
  return (
    <a
      href="mailto:care@cyborg.men?subject=Question%20for%20my%20care%20team"
      className="block rounded-2xl border border-borderColor bg-white p-4 text-left transition-colors hover:border-lightGray hover:bg-pageBackground"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <MessageCircleQuestion className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[14px] font-semibold text-blue">
              Ask your care team
            </p>
            <span className="shrink-0 rounded-full bg-pageBackground px-2 py-0.5 text-[10px] font-medium text-secondary">
              &lt;24h on weekdays
            </span>
          </div>
          <p className="mt-0.5 text-[12.5px] text-secondary">
            Complex topics and customer service
          </p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-secondary">
            Ask questions about your health from longevity advisors and get help
            from our customer service team.
          </p>
        </div>
      </div>
    </a>
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

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

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
              {DEFAULT_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => onQuickPrompt?.(p)}
                  className="flex-none rounded-2xl border border-borderColor bg-white px-5 py-3.5 text-center text-[14px] font-medium leading-snug text-blue transition-colors hover:border-lightGray hover:bg-pageBackground cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="mx-auto mt-4 w-full max-w-md px-1">
              <CareTeamCard />
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            <button
              onClick={scrollToTop}
              className="mx-auto -mt-2 mb-1 flex flex-col items-center gap-1 text-secondary transition-colors hover:text-blue cursor-pointer"
              aria-label="Scroll for chat history"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full border border-borderColor">
                <ChevronUp className="h-4 w-4" />
              </span>
              <span className="text-[12.5px]">Scroll for chat history</span>
            </button>

            {messages.map((m, i) => {
              const isLastAssistant =
                m.role === "assistant" &&
                m.id === messages[messages.length - 1]?.id;

              const prev = messages[i - 1];
              const curLabel = dayLabel(m.createdAt);
              const prevLabel = prev ? dayLabel(prev.createdAt) : null;
              const showSeparator =
                curLabel && (i === 0 || curLabel !== prevLabel);

              return (
                <div key={m.id} className="flex flex-col gap-6">
                  {showSeparator && <DaySeparator label={curLabel} />}
                  <Message
                    message={m}
                    streaming={streaming && isLastAssistant}
                  />
                </div>
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
