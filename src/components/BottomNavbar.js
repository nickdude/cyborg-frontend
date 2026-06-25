"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Home, BarChart3, ClipboardList, Store, MoreHorizontal, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import MealUploadSheet from "@/components/MealUploadSheet";
import MealDetailsSheet from "@/components/MealDetailsSheet";

// Superpower-style mobile nav: a light icon bar + a separate floating "Cyborg AI"
// orb (the concierge). Mobile only — desktop uses TopNavbar.
const NAV_ITEMS = [
  { label: "Home", href: "/dashboard", Icon: Home },
  { label: "Twin", href: "/data", Icon: BarChart3 },
  { label: "Protocol", href: "/protocol", Icon: ClipboardList },
  { label: "Marketplace", href: "/market-place", Icon: Store },
];

// Matches the "•••" menu in the Superpower mobile app.
const MORE_ITEMS = [
  { label: "Your Orders", href: "/orders" },
  { label: "Consults", href: "/consults" },
  { label: "Settings", href: "/settings" },
  { label: "Invite friend", href: "/invite" },
];

export default function BottomNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  // Food-log flow: "+" opens the camera/gallery picker → details sheet → AI
  // analyze → /meals/new review → commit.
  const [mealSheet, setMealSheet] = useState(null); // null | "upload" | "details"
  const [mealFiles, setMealFiles] = useState([]);

  useEffect(() => {
    const onClick = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const isActive = (href) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };
  const conciergeActive =
    pathname === "/concierge" || pathname.startsWith("/concierge/");

  const handleLogout = () => {
    setMoreOpen(false);
    logout();
    router.push("/login");
  };

  return (
    <>
    <div
      className="fixed inset-x-0 bottom-0 z-[60] flex items-center gap-2.5 px-4 lg:hidden"
      style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom, 0px))" }}
    >
      {/* Icon bar */}
      <nav
        className="flex flex-1 items-center justify-around rounded-full bg-white/95 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.12)] ring-1 ring-black/5 backdrop-blur"
        aria-label="Primary"
      >
        {NAV_ITEMS.slice(0, 2).map(({ label, href, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`grid h-10 w-10 place-items-center rounded-full transition ${
                active
                  ? "bg-pageBackground text-blue ring-1 ring-borderColor"
                  : "text-secondary hover:text-blue"
              }`}
            >
              <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2.2 : 1.8} />
            </Link>
          );
        })}

        {/* + — log a meal from a photo (camera or gallery → AI estimate) */}
        <button
          type="button"
          onClick={() => setMealSheet("upload")}
          aria-label="Log a meal"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-black text-white shadow-md transition hover:bg-black/85 active:scale-95"
        >
          <Plus className="h-5 w-5" strokeWidth={2.4} />
        </button>

        {NAV_ITEMS.slice(2).map(({ label, href, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`grid h-10 w-10 place-items-center rounded-full transition ${
                active
                  ? "bg-pageBackground text-blue ring-1 ring-borderColor"
                  : "text-secondary hover:text-blue"
              }`}
            >
              <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2.2 : 1.8} />
            </Link>
          );
        })}

        {/* More (•••) */}
        <div className="relative grid place-items-center" ref={moreRef}>
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-label="More"
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            className={`grid h-10 w-10 place-items-center rounded-full transition ${
              moreOpen
                ? "bg-pageBackground text-blue ring-1 ring-borderColor"
                : "text-secondary hover:text-blue"
            }`}
          >
            <MoreHorizontal className="h-[21px] w-[21px]" strokeWidth={1.8} />
          </button>

          {moreOpen && (
            <div
              role="menu"
              className="absolute bottom-[calc(100%+0.75rem)] right-0 z-[61] w-52 overflow-hidden rounded-2xl border border-borderColor bg-white py-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
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
      </nav>

      {/* Floating Cyborg AI orb (the concierge) */}
      <Link
        href="/concierge"
        aria-label="Cyborg AI"
        aria-current={conciergeActive ? "page" : undefined}
        className={`grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-white shadow-[0_10px_30px_rgba(0,0,0,0.15)] ring-1 transition ${
          conciergeActive ? "ring-orange-200" : "ring-black/5"
        }`}
      >
        <span
          className={`block rounded-full bg-gradient-to-br from-orange-400 to-orange-600 transition-all ${
            conciergeActive
              ? "h-9 w-9 shadow-[0_0_16px_rgba(249,115,22,0.65)]"
              : "h-6 w-6 opacity-90"
          }`}
        />
      </Link>
    </div>

      <MealUploadSheet
        open={mealSheet === "upload"}
        onClose={() => setMealSheet(null)}
        onFilesPicked={(files) => {
          setMealFiles(files);
          setMealSheet("details");
        }}
      />
      <MealDetailsSheet
        open={mealSheet === "details"}
        initialFiles={mealFiles}
        onClose={() => setMealSheet(null)}
      />
    </>
  );
}
