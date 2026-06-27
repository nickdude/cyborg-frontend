"use client";
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

export default function Message({ message, streaming }) {
  if (message.role === "user") {
    const text = message.content?.[0]?.text || "";
    return (
      <div className="flex justify-end animate-[fadeIn_0.2s_ease-out]">
        <div className="max-w-[80%] bg-primary text-white rounded-[20px] rounded-br-md px-4 py-3 text-sm whitespace-pre-wrap shadow-sm">
          {text}
        </div>
      </div>
    );
  }

  const hasText = message.content?.some((b) => b.type === "text");
  const hasAnyContent =
    (message.content?.length || 0) > 0 || message.thinking;

  // Real thinking is keyed by segment; attach each step's segment reasoning inline.
  const thinkingBySegment = Object.fromEntries(
    (message.thinking?.segments || []).map((s) => [s.toolIndex, s.text])
  );
  // Segments already shown inline on a step must NOT also appear in the top ThinkingBlock.
  const claimedSegments = new Set(
    (message.content || [])
      .filter((b) => b.type === "step" && typeof b.segmentIndex === "number")
      .map((b) => b.segmentIndex)
  );
  const orphanThinking = message.thinking
    ? { ...message.thinking, segments: (message.thinking.segments || []).filter((s) => !claimedSegments.has(s.toolIndex)) }
    : message.thinking;

  return (
    <div className="flex justify-start gap-2.5 animate-[fadeIn_0.2s_ease-out]">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center shrink-0 mt-1">
        <span className="text-[10px] font-bold text-white">C</span>
      </div>
      <div className="max-w-[85%] min-w-0">
        <ThinkingBlock
          thinking={orphanThinking}
          streaming={streaming}
          hasText={hasText}
        />

        {!hasAnyContent && streaming && (
          <div className="flex items-center gap-1.5 py-2 text-gray-400">
            <div className="flex gap-1">
              <div
                className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}

        <div className="text-sm text-gray-800 leading-relaxed">
          {(message.content || []).map((block, i) => {
            if (block.type === "text") {
              const isLastText =
                streaming &&
                i ===
                  message.content.length - 1 -
                    [...message.content]
                      .reverse()
                      .findIndex((b) => b.type === "text");
              return isLastText ? (
                <TypewriterMarkdown key={i} text={block.text} />
              ) : (
                <MarkdownBody key={i} text={block.text} />
              );
            }
            if (block.type === "step") {
              return (
                <NarrationRow
                  key={block.id || i}
                  block={block}
                  thinkingText={thinkingBySegment[block.segmentIndex]}
                />
              );
            }
            return null;
          })}
        </div>

        <Sources content={message.content} />
      </div>
    </div>
  );
}
