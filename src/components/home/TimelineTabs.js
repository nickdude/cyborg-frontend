"use client";

import { Lock } from "lucide-react";

export default function TimelineTabs({ tabs }) {
  return (
    <div className="flex items-center gap-6 border-b border-borderColor pb-3">
      {tabs.map((tab) => (
        <button
          key={tab.label}
          className={`text-base font-semibold font-inter flex items-center gap-2 ${
            tab.locked ? "text-secondary" : "text-black"
          }`}
        >
          {tab.locked && <Lock size={14} />}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
