"use client";
import ThinkingBlock from "./ThinkingBlock";
import ToolChip from "./ToolChip";
import Sources from "./Sources";

export default function Message({ message, streaming }) {
  if (message.role === "user") {
    const text = message.content?.[0]?.text || "";
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] bg-black text-white rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap shadow-sm">
          {text}
        </div>
      </div>
    );
  }

  const hasText = message.content?.some((b) => b.type === "text");
  const hasAnyContent =
    (message.content?.length || 0) > 0 || message.thinking;

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] bg-white text-gray-800 border border-borderColor rounded-2xl px-4 py-3 text-sm shadow-sm">
        <ThinkingBlock
          thinking={message.thinking}
          streaming={streaming}
          hasText={hasText}
        />

        {!hasAnyContent && streaming && (
          <div className="flex items-center gap-2 text-gray-400">
            <div className="flex gap-1">
              <div
                className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}

        {(message.content || []).map((block, i) => {
          if (block.type === "text") {
            return (
              <div key={i} className="whitespace-pre-wrap leading-relaxed">
                {block.text}
              </div>
            );
          }
          if (block.type === "tool") {
            return <ToolChip key={block.id || i} block={block} />;
          }
          return null;
        })}

        <Sources content={message.content} />
      </div>
    </div>
  );
}
