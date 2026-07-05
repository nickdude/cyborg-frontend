"use client";
import { ArrowUp, Plus, Mic } from "lucide-react";
import { useEffect, useRef } from "react";

// Superpower-style composer: a rounded card with a "+" attach affordance on the
// left, the growing textarea in the middle, and a mic (when empty) / send arrow
// (when there's text) on the right.
export default function Composer({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder,
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSubmit();
    }
  };

  const hasText = Boolean(value.trim());

  return (
    <div className="relative flex min-h-[56px] flex-col justify-center rounded-2xl border border-borderColor bg-white py-4 shadow-lg shadow-black/5 transition-all focus-within:border-primary/40">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder || "Ask anything…"}
        aria-label="Message"
        className="w-full resize-none border-none bg-transparent p-1 pl-14 pr-14 text-base outline-none placeholder:text-secondary sm:text-sm"
      />

      {/* Left: attach */}
      <div className="absolute bottom-[13px] left-4 flex items-end">
        <button
          type="button"
          onClick={() => textareaRef.current?.focus()}
          aria-label="Add attachment"
          className="rounded-full bg-pageBackground p-1.5 text-secondary transition-colors hover:bg-primary hover:text-white"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Right: mic when empty, send when there's text */}
      <div className="absolute bottom-[13px] right-4 flex items-end">
        {hasText ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled}
            aria-label="Send"
            className="rounded-full bg-primary p-1.5 text-white transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-40"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Voice input"
            title="Voice input"
            className="rounded-full bg-pageBackground p-1.5 text-secondary transition-colors hover:bg-primary hover:text-white"
          >
            <Mic className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
