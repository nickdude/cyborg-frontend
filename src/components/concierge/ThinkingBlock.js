"use client";
import { useEffect, useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const thinkingMarkdownComponents = {
  p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-500 not-italic">{children}</strong>
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
      <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px] font-mono not-italic">
        {children}
      </code>
    ) : (
      <pre className="bg-gray-50 border border-gray-200 rounded p-2 my-1.5 overflow-x-auto text-[11px] font-mono not-italic">
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
        <div className="text-xs text-gray-500 italic line-clamp-3 leading-relaxed [&_p]:m-0">
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
      </div>
    </div>
  );
}
