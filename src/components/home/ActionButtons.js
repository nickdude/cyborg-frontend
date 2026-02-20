"use client";

import { ChevronDown } from "lucide-react";

export default function ActionButtons({ actions }) {
  return (
    <div className="mt-4 flex items-center gap-3">
      {actions.map((action) => (
        <button
          key={action.label}
          className={`flex-1 h-11 rounded-xl text-sm font-semibold font-inter flex items-center justify-center gap-2 ${
            action.variant === "solid"
              ? "bg-black text-white"
              : "border border-borderColor text-black"
          }`}
        >
          {action.label}
          {action.chevron && <ChevronDown size={16} />}
        </button>
      ))}
    </div>
  );
}
