"use client";
import { useId, useState } from "react";
import { Sparkles, ChevronRight, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ToolChip, { TOOL_META } from "./ToolChip";
import { thinkingMarkdownComponents } from "./ThinkingBlock";

export default function NarrationRow({ block, thinkingText }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const hasToolDetail = block.input !== undefined || block.result !== undefined;
  const hasDetail = Boolean(thinkingText) || hasToolDetail;
  const running = block.status === "running" || block.status === "pending";
  const Icon = running ? Loader2 : (TOOL_META[block.name]?.Icon || Sparkles);

  const label = (
    <>
      <Icon aria-hidden="true" className={`mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70 ${running ? "animate-spin" : ""} motion-reduce:animate-none`} />
      <span className="min-w-0 flex-1 break-words">
        {block.narrationText || block.name}
        {block.endText && <span className="text-gray-500"> · {block.endText}</span>}
      </span>
    </>
  );

  if (!hasDetail) {
    return (
      <div className="my-1">
        <div className="flex w-full items-start gap-2 py-1 text-sm text-gray-500">{label}</div>
      </div>
    );
  }

  return (
    <div className="my-1">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={panelId}
        className="flex w-full items-start gap-2 py-1 -mx-2 px-2 rounded-md text-left text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1">
        {label}
        <ChevronRight aria-hidden="true" className={`mt-0.5 ml-auto h-3 w-3 shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div id={panelId} className="ml-5 mt-1 space-y-2 border-l-2 border-primary/15 pl-3">
          {thinkingText && (
            <div className="text-xs italic text-gray-400 leading-relaxed [&_p]:m-0">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={thinkingMarkdownComponents}>{thinkingText}</ReactMarkdown>
            </div>
          )}
          {hasToolDetail && (
            <ToolChip bare block={{ type: "tool", name: block.name, input: block.input, result: block.result, status: block.status, ok: block.ok }} />
          )}
        </div>
      )}
    </div>
  );
}
