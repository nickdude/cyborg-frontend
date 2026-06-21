"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import CyborgLogo from "@/components/CyborgLogo";
import { useAuth } from "@/contexts/AuthContext";

// superpower-style top nav: wordmark (left) · pill (center) · Invite Friend + More (right).
// Desktop only — mobile uses the bottom pill (BottomNavbar).
const NAV_ITEMS = [
  { label: "Home", href: "/dashboard" },
  { label: "Data", href: "/data" },
  { label: "Cyborg AI", href: "/concierge" },
  { label: "Protocol", href: "/protocol" },
  { label: "Marketplace", href: "/market-place" },
];

const MORE_ITEMS = [
  { label: "Orders", href: "/orders" },
  { label: "Consults", href: "/consults" },
  { label: "Membership", href: "/membership" },
  { label: "Settings", href: "/settings" },
];

export default function TopNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const isActive = (href) =>
    href === "/dashboard"
      ? pathname === "/dashboard" || pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 hidden border-b border-borderColor/70 bg-pageBackground/90 backdrop-blur md:block">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6 lg:px-8">
        {/* Left: wordmark */}
        <Link href="/dashboard" className="flex shrink-0 items-center" aria-label="Cyborg home">
          <CyborgLogo width={108} height={28} />
        </Link>

        {/* Center: pill */}
        <nav className="flex items-center gap-0.5 rounded-full bg-[#1b1b1d] p-1.5" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors lg:px-5 ${
                  active ? "border border-white/80 text-white" : "border border-transparent text-white/55 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Invite Friend + More */}
        <div className="flex shrink-0 items-center gap-4">
          <Link href="/invite" className="text-sm font-medium text-secondary transition-colors hover:text-black">
            Invite Friend
          </Link>
          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className="flex items-center gap-1 text-sm font-medium text-secondary transition-colors hover:text-black"
              aria-haspopup="menu"
              aria-expanded={moreOpen}
            >
              More
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {moreOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-2xl border border-borderColor bg-white py-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.12)]"
              >
                {MORE_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    onClick={() => setMoreOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-blue transition hover:bg-pageBackground"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="my-1 h-px bg-borderColor" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="block w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
