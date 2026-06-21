"use client";

import { useRouter } from "next/navigation";

export default function SettingsTabs({ tabs, activeTab }) {
  const router = useRouter();

  const select = (id) => {
    router.push(`/settings?tab=${id}`, { scroll: false });
  };

  return (
    <nav className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex items-center gap-6 whitespace-nowrap lg:gap-8">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => select(tab.id)}
                aria-current={isActive ? "page" : undefined}
                className={`relative pb-2 text-base font-medium transition-colors lg:text-lg ${
                  isActive ? "text-black" : "text-secondary hover:text-black"
                }`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-black" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
