"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

const ACTION_ROUTES = {
  "Log Food": "/dashboard",       // Handled via FAB in BottomNavbar on dashboard
  "Add an activity": "/activities/new",
};

export default function ActionButtons({ actions }) {
  const router = useRouter();

  return (
    <div className="mt-4 flex items-center gap-3 lg:gap-4">
      {actions.map((action) => (
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
          className={`flex-1 h-11 rounded-xl text-sm font-semibold font-inter flex items-center justify-center gap-2 lg:h-12 lg:text-base ${
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
