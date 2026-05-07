"use client";

import { useRouter } from "next/navigation";
import { Utensils, Activity } from "lucide-react";

const ACTION_ROUTES = {
  "Log Food": "/dashboard",
  "Add an activity": "/activities/new",
};

const ICON_MAP = {
  "Log Food": Utensils,
  "Add an activity": Activity,
};

export default function ActionButtons({ actions }) {
  const router = useRouter();

  return (
    <div className="mt-4 flex items-center gap-3">
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
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-black px-4 py-3"
          >
            {Icon && <Icon size={14} className="text-[#F2F2F2]" />}
            <span className="text-[14px] font-medium leading-5 text-[#F2F2F2]">
              {action.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
