"use client";
import { useEffect, useState } from "react";
import { Brain, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

function segLabel(toolIndex) {
  if (toolIndex === -1) return "Before tools";
  return `After tool ${toolIndex + 1}`;
}

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
      <div className="mb-3 text-xs text-gray-500 border-l-2 border-purple-300 pl-3">
        <div className="flex items-center gap-1.5 text-purple-600 font-medium mb-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Thinking… {seconds}s</span>
        </div>
        <div className="italic text-gray-400 line-clamp-4 whitespace-pre-wrap">
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
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition"
      >
        <Brain className="w-3 h-3" />
        <span>Thought for {seconds}s</span>
        {expanded ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>
      {expanded && (
        <div className="mt-2 text-xs text-gray-500 border-l-2 border-gray-200 pl-3 space-y-3">
          {thinking.segments.map((s, i) => (
            <div key={i}>
              <div className="font-medium text-gray-400 mb-0.5">
                {segLabel(s.toolIndex)}
              </div>
              <div className="italic whitespace-pre-wrap">{s.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
