"use client";
import { memo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, ThumbsUp, ThumbsDown, Clock, BarChart3 } from "lucide-react";
import { useTypewriter } from "@/hooks/useTypewriter";
import ThinkingBlock from "./ThinkingBlock";
import Sources, { getCitations } from "./Sources";
import NarrationRow from "./NarrationRow";

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function plainText(content) {
  if (!Array.isArray(content)) return "";
  return content
    .filter((b) => b?.type === "text" && b.text)
    .map((b) => b.text)
    .join("\n\n")
    .trim();
}

function MarkdownBody({ text }) {
  return (
    <div className="space-y-4">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="leading-relaxed">{children}</p>,
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        h2: ({ children }) => (
          <h2 className="mb-2 mt-6 text-2xl font-semibold">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-1.5 mt-4 text-lg font-semibold">{children}</h3>
        ),
        ul: ({ children }) => (
          <ul className="ml-4 list-outside list-disc space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="ml-4 list-outside list-decimal space-y-1">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="py-0.5 leading-relaxed">{children}</li>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-1 border-l-2 border-primary/30 pl-3 italic text-secondary">
            {children}
          </blockquote>
        ),
        code: ({ inline, children }) =>
          inline ? (
            <code className="rounded-md bg-pageBackground px-1.5 py-0.5 font-mono text-[13px] text-primary">
              {children}
            </code>
          ) : (
            <pre className="my-1 overflow-x-auto rounded-xl border border-borderColor bg-pageBackground p-3 font-mono text-[13px]">
              <code>{children}</code>
            </pre>
          ),
        table: ({ children }) => (
          <div className="my-1 overflow-x-auto rounded-xl border border-borderColor">
            <table className="w-full text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-pageBackground text-left">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="border-b border-borderColor px-3 py-2 font-medium text-secondary">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border-b border-borderColor px-3 py-2">{children}</td>
        ),
        hr: () => <hr className="my-2 border-borderColor" />,
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
      }}
    >
      {text}
    </ReactMarkdown>
    </div>
  );
}

function TypewriterMarkdown({ text }) {
  const displayed = useTypewriter(text, true);
  return <MarkdownBody text={displayed} />;
}

const actionBtn =
  "flex size-8 items-center justify-center rounded-lg p-0 text-secondary transition-colors hover:bg-pageBackground hover:text-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

function MessageActions({ content, createdAt }) {
  const [copied, setCopied] = useState(false);
  const [vote, setVote] = useState(null); // "up" | "down" | null
  const [showSources, setShowSources] = useState(false);
  const citations = getCitations(content);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plainText(content));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row items-center gap-0.5 transition-opacity lg:opacity-0 lg:group-hover/message:opacity-100 lg:group-focus-within/message:opacity-100">
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy"}
          className={actionBtn}
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setVote((v) => (v === "up" ? null : "up"))}
          aria-label="Mark response as good"
          aria-pressed={vote === "up"}
          className={`${actionBtn} ${vote === "up" ? "text-primary" : ""}`}
        >
          <ThumbsUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setVote((v) => (v === "down" ? null : "down"))}
          aria-label="Mark response as poor"
          aria-pressed={vote === "down"}
          className={`${actionBtn} ${vote === "down" ? "text-primary" : ""}`}
        >
          <ThumbsDown className="h-4 w-4" />
        </button>
        {citations.length > 0 && (
          <button
            type="button"
            onClick={() => setShowSources((v) => !v)}
            aria-expanded={showSources}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-secondary transition-colors hover:bg-pageBackground hover:text-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="text-sm font-semibold leading-none">
              {citations.length} {citations.length === 1 ? "Source" : "Sources"}
            </span>
          </button>
        )}
        <time className="inline-flex select-none items-center gap-1 rounded-full px-2.5 py-1.5 text-sm font-semibold leading-none text-secondary">
          <Clock className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{formatTime(createdAt)}</span>
        </time>
      </div>
      {showSources && <Sources content={content} />}
    </div>
  );
}

function Message({ message, streaming }) {
  if (message.role === "user") {
    const text = message.content?.[0]?.text || "";
    return (
      <div className="group/message mx-auto w-full max-w-3xl px-0.5">
        <div className="ml-auto flex w-full max-w-2xl flex-col gap-2">
          <div className="flex flex-row items-center gap-2">
            <div className="ml-auto break-words rounded-2xl border border-borderColor bg-white px-3.5 py-2 text-[15px] text-blue shadow-sm">
              <div className="whitespace-pre-wrap">{text}</div>
            </div>
          </div>
          <div className="flex flex-row items-center justify-end transition-opacity lg:opacity-0 lg:group-hover/message:opacity-100">
            <time className="inline-flex select-none items-center rounded-full px-2.5 py-1.5 text-sm font-semibold leading-none text-secondary">
              {formatTime(message.createdAt)}
            </time>
          </div>
        </div>
      </div>
    );
  }

  const content = message.content || [];
  const hasText = content.some((b) => b.type === "text");
  const hasAnyContent = content.length > 0 || message.thinking;

  // Real thinking is keyed by segment; attach each step's segment reasoning inline.
  const thinkingBySegment = Object.fromEntries(
    (message.thinking?.segments || []).map((s) => [s.toolIndex, s.text])
  );
  // Segments already shown inline on a step must NOT also appear in the top ThinkingBlock.
  const claimedSegments = new Set(
    content
      .filter((b) => b.type === "step" && typeof b.segmentIndex === "number")
      .map((b) => b.segmentIndex)
  );
  const orphanThinking = message.thinking
    ? { ...message.thinking, segments: (message.thinking.segments || []).filter((s) => !claimedSegments.has(s.toolIndex)) }
    : message.thinking;

  // last text block index (for the typewriter) + latest narration (for the live region)
  let lastTextIdx = -1;
  for (let k = 0; k < content.length; k++) if (content[k].type === "text") lastTextIdx = k;
  let latestStep = null;
  for (const b of content) if (b.type === "step") latestStep = b;
  const latestNarration = latestStep
    ? [latestStep.narrationText, latestStep.endText].filter(Boolean).join(" — ")
    : "";

  // build render groups: runs of consecutive steps share one rail
  const rendered = [];
  // Parallel tools in one model turn SHARE one segmentIndex, so
  // thinkingBySegment[segmentIndex] returns the SAME reasoning for every parallel
  // step. Attach the real-thinking text only to the FIRST step with a given
  // segmentIndex; later steps with the same segmentIndex get thinkingText=undefined
  // so the reasoning isn't duplicated under each parallel tool.
  // The top-level "Thought for Xs" block carries the reasoning segments NOT shown
  // inline under a step — i.e. the FINAL, post-tool reasoning. Chronologically
  // that happens AFTER the tool steps and BEFORE the answer, so inject it there
  // (not above the steps, which inverted the order). Pre-tool reasoning stays
  // nested under the tool chip that it motivated.
  const thinkingEl = (
    <ThinkingBlock
      key="thinking"
      thinking={message.thinking}
      displaySegments={orphanThinking?.segments}
      streaming={streaming}
      hasText={hasText}
    />
  );
  let thinkingInjected = false;

  const shownSegs = new Set();
  for (let k = 0; k < content.length; ) {
    const block = content[k];
    if (block.type === "step") {
      const steps = [];
      const startKey = block.id || `s${k}`;
      while (k < content.length && content[k].type === "step") { steps.push(content[k]); k++; }
      rendered.push(
        <div key={`rail-${startKey}`} className="my-2 ml-1 border-l-2 border-primary/15 pl-3">
          {steps.map((s, j) => {
            const tt =
              typeof s.segmentIndex === "number" && !shownSegs.has(s.segmentIndex)
                ? thinkingBySegment[s.segmentIndex]
                : undefined;
            if (tt !== undefined) shownSegs.add(s.segmentIndex);
            return <NarrationRow key={s.id || j} block={s} thinkingText={tt} />;
          })}
        </div>
      );
    } else if (block.type === "text") {
      // Final reasoning sits just before the answer.
      if (!thinkingInjected) { rendered.push(thinkingEl); thinkingInjected = true; }
      const isLastText = streaming && k === lastTextIdx;
      rendered.push(
        isLastText ? <TypewriterMarkdown key={k} text={block.text} /> : <MarkdownBody key={k} text={block.text} />
      );
      k++;
    } else {
      k++;
    }
  }
  // No answer text yet (pure thinking, or tools still running): reasoning renders
  // after whatever steps exist.
  if (!thinkingInjected) rendered.push(thinkingEl);

  return (
    <div
      className="group/message mx-auto w-full max-w-3xl px-0.5"
      aria-busy={streaming || undefined}
    >
      <div className="flex w-full flex-col gap-2">
        {!hasAnyContent && streaming && (
          <div className="flex items-center gap-1.5 py-2 text-secondary" role="status" aria-label="Cyborg is thinking">
            <div className="flex gap-1">
              <div
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary motion-reduce:animate-none"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/70 motion-reduce:animate-none"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/40 motion-reduce:animate-none"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 break-words text-base leading-relaxed text-ink [&_*:nth-child(1)]:mt-0">
          {rendered}
        </div>

        {hasAnyContent && !streaming && (
          <MessageActions content={content} createdAt={message.createdAt} />
        )}

        {/* Only the actively-streaming message carries a live region, so a screen
            reader doesn't re-announce historical/static assistant messages. */}
        {streaming && (
          <span className="sr-only" role="status" aria-live="polite">{latestNarration}</span>
        )}
      </div>
    </div>
  );
}

// Memoized: each streamed token gives the streaming message a NEW object ref (so
// it still re-renders), while stable past messages keep their ref and skip
// re-render. Default shallow compare over (message, streaming) is correct here.
export default memo(Message);
