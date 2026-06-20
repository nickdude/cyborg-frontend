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
    <div className="border-t border-borderColor bg-white px-4 pb-3 pt-3 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-2 rounded-[20px] border border-borderColor bg-white py-1.5 pl-5 pr-1.5 transition-colors duration-200 focus-within:border-lightGray">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKey}
            placeholder={placeholder || "Message Cyborg…"}
            className="w-full resize-none self-center bg-transparent py-1.5 text-[16px] outline-none placeholder:text-secondary"
          />
          <button
            type="button"
            aria-label="Attach"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-2xl leading-none text-secondary transition-colors hover:text-blue"
          >
            +
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled || !value.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue text-white transition-all duration-150 hover:bg-blue/90 active:scale-95 disabled:opacity-25"
            aria-label="Send"
          >
            <ArrowUp className="h-[18px] w-[18px]" />
          </button>
        </div>
        <p className="mt-2.5 px-2 text-center text-[11px] leading-snug text-secondary">
          Cyborg AI offers education and suggestions, not medical advice. For
          urgent concerns, contact a licensed provider.
        </p>
      </div>
    </div>
  );
}
