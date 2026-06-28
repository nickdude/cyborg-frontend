"use client";
import { useEffect, useId, useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const thinkingMarkdownComponents = {
  p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold text-secondary not-italic">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  code: ({ inline, children }) =>
    inline ? (
      <code className="bg-pageBackground px-1 py-0.5 rounded text-[11px] font-mono not-italic">
        {children}
      </code>
    ) : (
      <pre className="bg-pageBackground border border-borderColor rounded-md p-2 my-1.5 overflow-x-auto text-[11px] font-mono not-italic">
        <code>{children}</code>
      </pre>
    ),
  h2: ({ children }) => (
    <h2 className="text-xs font-semibold mt-2 mb-1 not-italic">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xs font-semibold mt-1.5 mb-0.5 not-italic">{children}</h3>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="text-primary hover:underline"
    >
      {children}
    </a>
  ),
};

export default function ThinkingBlock({ thinking, displaySegments, streaming, hasText }) {
  // Default to expanded so the "Thought for Xs" reasoning shows without a click.
  const [expanded, setExpanded] = useState(true);
  const [now, setNow] = useState(Date.now());
  const panelId = useId();

  useEffect(() => {
    if (!streaming || thinking?.elapsedMs) return;
    const h = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(h);
  }, [streaming, thinking?.elapsedMs]);

  if (!thinking || !thinking.segments?.length) return null;

  const body = displaySegments ?? thinking.segments;
  const totalSteps = thinking.segments.length;
  const elapsedMs =
    thinking.elapsedMs ??
    (thinking.startedAt ? now - thinking.startedAt : 0);
  // Hydrated history carries neither elapsedMs nor startedAt, so any computed
  // duration would be a fake "1s". Only show a seconds count when it's real.
  const elapsedKnown = thinking.elapsedMs != null || thinking.startedAt != null;
  const seconds = Math.max(1, Math.round(elapsedMs / 1000));
  const hasBody = body.length > 0;
  const showLiveTicker = streaming && !hasText && hasBody;

  if (showLiveTicker) {
    const latest = body[body.length - 1];
    return (
      <div className="mb-3 rounded-xl bg-gradient-to-r from-primary/5 to-purple-50 border border-primary/10 px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-primary text-xs font-medium mb-1.5">
          <Sparkles aria-hidden="true" className="w-3.5 h-3.5 animate-pulse motion-reduce:animate-none" />
          <span>Thinking… {seconds}s</span>
        </div>
        <div className="text-xs text-secondary italic line-clamp-3 leading-relaxed [&_p]:m-0">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={thinkingMarkdownComponents}
          >
            {latest?.text || ""}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => hasBody && setExpanded((v) => !v)}
        aria-expanded={hasBody ? expanded : undefined}
        aria-controls={hasBody ? panelId : undefined}
        className={`inline-flex items-center gap-1.5 text-xs text-secondary hover:text-blue transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 ${hasBody ? "cursor-pointer" : "cursor-default"}`}
      >
        {hasBody && (
          <ChevronRight
            aria-hidden="true"
            className={`w-3 h-3 transition-transform duration-200 ${
              expanded ? "rotate-90" : ""
            }`}
          />
        )}
        <Sparkles aria-hidden="true" className="w-3 h-3" />
        <span>
          {elapsedKnown ? `Thought for ${seconds}s` : "Thought"}
          {!hasBody && totalSteps > 1 ? ` · reasoned across ${totalSteps} steps` : ""}
        </span>
      </button>
      {expanded && hasBody && (
        <div
          id={panelId}
          className="mt-2 text-xs text-secondary border-l-2 border-primary/15 pl-3 space-y-2 italic leading-relaxed"
        >
          {body.map((s, i) => (
            <div key={i}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={thinkingMarkdownComponents}
              >
                {s.text || ""}
              </ReactMarkdown>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
