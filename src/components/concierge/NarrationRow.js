"use client";
import { useId, useState } from "react";
import { Sparkles, ChevronRight, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TOOL_META } from "./ToolChip";
import { thinkingMarkdownComponents } from "./ThinkingBlock";

export default function NarrationRow({ block, thinkingText }) {
  // Reasoning is expanded by default so users see the model's thinking without a click.
  const [open, setOpen] = useState(true);
  const panelId = useId();
  // Raw tool input/result ("View raw") is intentionally not surfaced to users —
  // a row is only expandable when there's human-readable reasoning to show.
  const hasDetail = Boolean(thinkingText);
  const running = block.status === "running" || block.status === "pending";
  const Icon = running ? Loader2 : (TOOL_META[block.name]?.Icon || Sparkles);

  const label = (
    <>
      <Icon aria-hidden="true" className={`mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70 ${running ? "animate-spin" : ""} motion-reduce:animate-none`} />
      <span className="min-w-0 flex-1 break-words">
        {block.narrationText || block.name}
        {block.endText && <span className="text-secondary"> · {block.endText}</span>}
      </span>
    </>
  );

  if (!hasDetail) {
    return (
      <div className="my-1">
        <div className="flex w-full items-start gap-2 py-1 text-sm text-secondary">{label}</div>
      </div>
    );
  }

  return (
    <div className="my-1">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={panelId}
        className="flex w-full items-start gap-2 py-1 -mx-2 px-2 rounded-xl text-left text-sm text-secondary hover:bg-pageBackground hover:text-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1">
        {label}
        <ChevronRight aria-hidden="true" className={`mt-0.5 ml-auto h-3 w-3 shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div id={panelId} className="ml-5 mt-1 space-y-2 border-l-2 border-primary/15 pl-3">
          {thinkingText && (
            <div className="text-xs italic text-secondary leading-relaxed [&_p]:m-0">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={thinkingMarkdownComponents}>{thinkingText}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
