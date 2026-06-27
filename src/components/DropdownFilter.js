"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export default function DropdownFilter({ label, options, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.id === value);
  const hasSelection = selectedOption && value !== "all";

  return (
    <div className="relative w-full font-inter" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition ${
          isOpen
            ? "border-primary/40 bg-white ring-2 ring-primary/10"
            : "border-borderColor bg-white hover:bg-gray-50"
        }`}
      >
        <span className={`truncate ${hasSelection ? "text-gray-900" : "text-secondary"}`}>
          {selectedOption?.label || label}
        </span>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-xl border border-borderColor bg-white py-1 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.18)]">
          {options.map((option) => {
            const active = value === option.id;
            return (
              <button
                key={option.id}
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm transition ${
                  active
                    ? "bg-primary/5 font-semibold text-primary"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="truncate">{option.label}</span>
                {active && <Check className="h-4 w-4 flex-shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
