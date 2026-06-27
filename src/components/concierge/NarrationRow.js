"use client";
import { useState } from "react";
import { Sparkles, ChevronRight } from "lucide-react";
import ToolChip from "./ToolChip";

export default function NarrationRow({ block, thinkingText }) {
  const [open, setOpen] = useState(false);
  const hasToolDetail = block.input !== undefined || block.result !== undefined;
  const hasDetail = Boolean(thinkingText) || hasToolDetail;
  const running = block.status === "running" || block.status === "pending";

  return (
    <div className="my-1">
      <button
        type="button"
        onClick={() => hasDetail && setOpen((o) => !o)}
        className={`flex items-start gap-2 text-sm text-gray-500 text-left ${hasDetail ? "cursor-pointer hover:text-gray-700" : "cursor-default"}`}
      >
        <Sparkles className={`mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400 ${running ? "animate-pulse" : ""}`} />
        <span>
          {block.narrationText || block.name}
          {block.endText && <span className="text-gray-400"> · {block.endText}</span>}
        </span>
        {hasDetail && (
          <ChevronRight className={`mt-0.5 h-3 w-3 shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
        )}
      </button>

      {open && hasDetail && (
        <div className="ml-5 mt-1 space-y-2 border-l-2 border-violet-200 pl-3">
          {thinkingText && (
            <div className="whitespace-pre-wrap text-xs italic text-gray-400">{thinkingText}</div>
          )}
          {hasToolDetail && (
            <ToolChip
              block={{
                type: "tool",
                name: block.name,
                input: block.input,
                result: block.result,
                status: block.status,
                ok: block.ok,
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
