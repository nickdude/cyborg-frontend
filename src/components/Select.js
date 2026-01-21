"use client";

import React, { useState } from "react";
import Image from "next/image";

export default function Select({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  required = false,
  disabled = false,
  error,
  className = "",
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder;

  return (
    <div className="mb-5">
      {label && (
        <label
          htmlFor={name}
          className="block text-secondary font-medium mb-2 text-sm"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full px-4 py-3 border-[1px] border-tertiary rounded-xl focus:outline-none focus:border-primary text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors flex items-center justify-between bg-white ${
            error ? "border-red-500 focus:border-red-500" : ""
          } ${className}`}
        >
          <span className="text-left">{selectedLabel}</span>
          <Image
            src="/assets/icons/arrow-down.svg"
            alt="dropdown"
            width={20}
            height={20}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-tertiary rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange({ target: { name, value: option.value } });
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-gray-100 transition ${
                  value === option.value ? "bg-primary/10 text-primary font-semibold" : "text-gray-900"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
