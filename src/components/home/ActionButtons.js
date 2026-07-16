"use client";

import { useRouter } from "next/navigation";
import { Utensils, Activity } from "lucide-react";

const ACTION_ROUTES = {
  "Log Food": "/meals/log",
  "Add an activity": "/activities/new",
};

const ICON_MAP = {
  "Log Food": Utensils,
  "Add an activity": Activity,
};

export default function ActionButtons({ actions }) {
  const router = useRouter();

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 lg:gap-4">
      {actions.map((action) => {
        const Icon = ICON_MAP[action.label];
        return (
          <button
            key={action.label}
            onClick={() => {
              if (action.onClick) {
                action.onClick();
              } else if (action.href) {
                router.push(action.href);
              } else {
                const route = ACTION_ROUTES[action.label];
                if (route) router.push(route);
              }
            }}
            className={`flex h-full min-h-[72px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-3 py-3 text-center font-medium text-sm leading-tight transition-all duration-200 ${
              action.variant === "outline"
                ? "border-2 border-gray-300 text-black hover:bg-gray-50"
                : "bg-black text-white hover:bg-gray-900 shadow-sm"
            } lg:min-h-[60px] lg:flex-row lg:gap-2 lg:px-4 lg:py-3 lg:text-left`}
          >
            {Icon && <Icon size={16} className="shrink-0" />}
            <span className="max-w-[7rem]">{action.label}</span>
            {action.chevron && <span className="lg:ml-auto">›</span>}
          </button>
        );
      })}
    </div>
  );
}
