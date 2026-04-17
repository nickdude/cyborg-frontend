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
    <div className="border-t border-borderColor bg-white px-4 py-3 sm:px-6">
      <div className="max-w-3xl mx-auto flex items-end gap-2">
        <div className="flex-1 border border-borderColor rounded-2xl bg-white px-4 py-2 focus-within:ring-2 focus-within:ring-purple-200">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKey}
            placeholder={placeholder || "Message Cyborg…"}
            className="w-full resize-none outline-none text-sm bg-transparent"
          />
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center disabled:opacity-40 hover:bg-gray-900 transition shrink-0"
          aria-label="Send"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
