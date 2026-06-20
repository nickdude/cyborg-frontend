"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Top navigation: a centered dark pill (Cyborg data page).
const ITEMS = [
  { label: "Home", href: "/dashboard" },
  { label: "Data", href: "/data" },
  { label: "Protocol", href: "/protocol" },
  { label: "Marketplace", href: "/market-place" },
];

export default function DataTopNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 -mx-4 mb-2 bg-pageBackground/80 px-4 py-3 backdrop-blur lg:-mx-8 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="hidden w-[180px] items-center lg:flex">
          <span className="select-none text-[19px] font-semibold leading-none tracking-tight text-black">
            cyborg
          </span>
        </div>

        <nav className="flex flex-1 items-center justify-center gap-1 lg:flex-none">
          <div className="flex items-center gap-1 rounded-full bg-[#0a0a0a] p-1 shadow-[0_12px_24px_-12px_rgba(0,0,0,0.5)]">
            {ITEMS.map((item) => {
              const active =
                pathname === item.href || (item.href === "/data" && pathname?.startsWith("/data"));
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`rounded-full px-3.5 py-1.5 text-[14px] transition-colors lg:px-4 lg:text-[15px] ${
                    active ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* spacer to balance the centered pill on desktop (UserActions sits fixed top-right) */}
        <div className="hidden w-[180px] lg:block" />
      </div>
    </header>
  );
}
