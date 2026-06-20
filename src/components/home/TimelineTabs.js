"use client";

import { Lock } from "lucide-react";

export default function TimelineTabs({ tabs }) {
  return (
    <div className="flex items-center gap-6 border-b border-borderColor pb-4 lg:gap-8 lg:pb-5">
      {tabs.map((tab) => (
        <button
          key={tab.label}
          className={`text-base font-semibold font-inter flex items-center gap-2 pb-2 transition-all duration-200 border-b-2 ${
            tab.locked
              ? "text-secondary border-transparent opacity-60 cursor-not-allowed"
              : "text-black border-black hover:opacity-80"
          } lg:text-lg`}
        >
          {tab.locked && <Lock size={16} />}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
