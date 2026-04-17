"use client";
import { useEffect, useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";

export default function ThinkingBlock({ thinking, streaming, hasText }) {
  const [expanded, setExpanded] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!streaming || thinking?.elapsedMs) return;
    const h = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(h);
  }, [streaming, thinking?.elapsedMs]);

  if (!thinking || !thinking.segments?.length) return null;

  const elapsedMs =
    thinking.elapsedMs ??
    (thinking.startedAt ? now - thinking.startedAt : 0);
  const seconds = Math.max(1, Math.round(elapsedMs / 1000));

  const showLiveTicker = streaming && !hasText;

  if (showLiveTicker) {
    const latest = thinking.segments[thinking.segments.length - 1];
    return (
      <div className="mb-3 rounded-xl bg-gradient-to-r from-primary/5 to-purple-50 border border-primary/10 px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-primary text-xs font-medium mb-1.5">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Thinking… {seconds}s</span>
        </div>
        <div className="text-xs text-gray-500 italic line-clamp-3 leading-relaxed">
          {latest?.text || ""}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <ChevronRight
          className={`w-3 h-3 transition-transform duration-200 ${
            expanded ? "rotate-90" : ""
          }`}
        />
        <Sparkles className="w-3 h-3" />
        <span>Thought for {seconds}s</span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-out ${
          expanded ? "max-h-[2000px] opacity-100 mt-2" : "max-h-0 opacity-0"
        }`}
      >
        <div className="text-xs text-gray-400 border-l-2 border-primary/15 pl-3 space-y-2 italic leading-relaxed">
          {thinking.segments.map((s, i) => (
            <div key={i} className="whitespace-pre-wrap">{s.text}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
