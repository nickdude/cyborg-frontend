"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Floating pill navigation (superpower-style). "Cyborg AI" is the concierge —
// the equivalent of superpower's "Superpower AI" nav item.
const NAV_ITEMS = [
  { label: "Home", href: "/dashboard" },
  { label: "Data", href: "/data" },
  { label: "Cyborg AI", href: "/concierge" },
  { label: "Protocol", href: "/protocol" },
  { label: "Marketplace", href: "/market-place" },
];

export default function BottomNavbar() {
  const pathname = usePathname();

  const isActive = (href) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-[60] -translate-x-1/2 px-3 pb-3 md:hidden"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
      aria-label="Primary"
    >
      <div className="flex items-center gap-0.5 rounded-full bg-[#1b1b1d] p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.28)] ring-1 ring-white/5 sm:gap-1 sm:p-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`whitespace-nowrap rounded-full px-3 py-2 text-[12px] font-medium transition-colors sm:px-4 sm:text-sm lg:px-5 lg:text-[15px] ${
                active
                  ? "border border-white/80 text-white"
                  : "border border-transparent text-white/55 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
