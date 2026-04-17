"use client";
import { ArrowUp } from "lucide-react";
import { useEffect, useRef } from "react";

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

  return (
    <div className="border-t border-gray-100 bg-white px-4 py-3 sm:px-6">
      <div className="max-w-3xl mx-auto flex items-end gap-2">
        <div className="flex-1 border border-gray-200 rounded-2xl bg-gray-50/50 px-4 py-2.5 focus-within:bg-white focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKey}
            placeholder={placeholder || "Message Cyborg…"}
            className="w-full resize-none outline-none text-sm bg-transparent placeholder:text-gray-400"
          />
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-30 hover:bg-primary/90 active:scale-95 transition-all duration-150 shrink-0 shadow-sm"
          aria-label="Send"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
