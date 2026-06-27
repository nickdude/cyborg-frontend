"use client";
import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTypewriter } from "@/hooks/useTypewriter";
import ThinkingBlock from "./ThinkingBlock";
import Sources from "./Sources";
import NarrationRow from "./NarrationRow";

function MarkdownBody({ text }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        h2: ({ children }) => (
          <h2 className="text-base font-semibold mt-4 mb-2">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold mt-3 mb-1.5">{children}</h3>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-primary/30 pl-3 my-3 text-gray-600 italic">
            {children}
          </blockquote>
        ),
        code: ({ inline, children }) =>
          inline ? (
            <code className="bg-gray-100 text-primary px-1.5 py-0.5 rounded text-[13px] font-mono">
              {children}
            </code>
          ) : (
            <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 my-3 overflow-x-auto text-[13px] font-mono">
              <code>{children}</code>
            </pre>
          ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-3 rounded-lg border border-gray-200">
            <table className="w-full text-[13px]">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-gray-50 text-left">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 font-medium text-gray-600 border-b border-gray-200">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 border-b border-gray-100">{children}</td>
        ),
        hr: () => <hr className="my-4 border-gray-200" />,
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
  );
}

function TypewriterMarkdown({ text }) {
  const displayed = useTypewriter(text, true);
  return <MarkdownBody text={displayed} />;
}

function Message({ message, streaming }) {
  if (message.role === "user") {
    const text = message.content?.[0]?.text || "";
    return (
      <div className="flex justify-end animate-[fadeIn_0.2s_ease-out]">
        <div className="max-w-[88%] sm:max-w-[80%] bg-primary text-white rounded-[20px] rounded-br-md px-4 py-3 text-sm whitespace-pre-wrap break-words shadow-sm">
          {text}
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
      const isLastText = streaming && k === lastTextIdx;
      rendered.push(
        isLastText ? <TypewriterMarkdown key={k} text={block.text} /> : <MarkdownBody key={k} text={block.text} />
      );
      k++;
    } else {
      k++;
    }
  }

  return (
    <div className="flex justify-start gap-2.5 animate-[fadeIn_0.2s_ease-out]" aria-busy={streaming || undefined}>
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center shrink-0 mt-1">
        <span className="text-[10px] font-bold text-white">C</span>
      </div>
      <div className="max-w-full min-w-0">
        <ThinkingBlock
          thinking={message.thinking}
          displaySegments={orphanThinking?.segments}
          streaming={streaming}
          hasText={hasText}
        />

        {!hasAnyContent && streaming && (
          <div className="flex items-center gap-1.5 py-2 text-gray-400" role="status" aria-label="Cyborg is thinking">
            <div className="flex gap-1">
              <div
                className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce motion-reduce:animate-none"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce motion-reduce:animate-none"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce motion-reduce:animate-none"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}

        <div className="text-sm text-gray-800 leading-relaxed break-words">{rendered}</div>

        <Sources content={message.content} />
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
