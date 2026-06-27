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

/**
 * BottomNavbar.
 *
 * @param {object}   props
 * @param {boolean}  [props.embedded=false] — when true, the bar renders absolutely
 *   inside its positioned parent (e.g. the landing-page phone mockup) at all
 *   breakpoints, with slightly smaller controls. Default (false) keeps the
 *   original global app behaviour: a fixed, mobile-only bar — unchanged.
 * @param {boolean}  [props.demoMode=false] — when true, items act as a screen
 *   selector for the landing-page phone demo instead of routing: each control
 *   calls `onTabChange(index)` and highlights `activeTab`. The "More" menu, the
 *   Cyborg AI orb and the meal sheets are suppressed so nothing navigates away.
 *   Implies the embedded layout. Default (false) → normal routing behaviour.
 * @param {number}   [props.activeTab=0] — active screen index (demoMode only).
 * @param {(index:number)=>void} [props.onTabChange] — screen setter (demoMode only).
 */
export default function BottomNavbar({
  embedded = false,
  demoMode = false,
  activeTab = 0,
  onTabChange,
}) {
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

  // demoMode also uses the compact, in-phone layout.
  const inPhone = embedded || demoMode;

  // In demoMode an item selects a phone-demo screen instead of routing.
  const renderNavItem = ({ label, href, Icon }, demoIndex) => {
    const active = demoMode ? activeTab === demoIndex : isActive(href);
    const className = `${S.item} ${
      active
        ? "bg-pageBackground text-blue ring-1 ring-borderColor"
        : "text-secondary hover:text-blue"
    }`;
    const icon = <Icon className={S.icon} strokeWidth={active ? 2.2 : 1.8} />;

    if (demoMode) {
      return (
        <button
          key={href}
          type="button"
          onClick={() => onTabChange?.(demoIndex)}
          aria-label={label}
          aria-pressed={active}
          className={className}
        >
          {icon}
        </button>
      );
    }
    return (
      <Link
        key={href}
        href={href}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className={className}
      >
        {icon}
      </Link>
    );
  };

  // Size/position tokens — in-phone (embedded/demo) vs default (global app chrome).
  const S = inPhone
    ? {
        wrap: "absolute inset-x-0 bottom-0 z-20 flex items-center gap-1.5 px-2.5 pb-2.5",
        bar: "flex flex-1 items-center justify-around rounded-full bg-white/95 p-1 shadow-[0_8px_24px_rgba(0,0,0,0.18)] ring-1 ring-black/5 backdrop-blur",
        item: "grid h-8 w-8 place-items-center rounded-full transition",
        icon: "h-[16px] w-[16px]",
        plus: "grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black text-white shadow-md transition hover:bg-black/85 active:scale-95",
        plusIcon: "h-4 w-4",
        orb: "grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.2)] ring-1 transition",
        orbDotActive: "h-7 w-7 shadow-[0_0_16px_rgba(249,115,22,0.65)]",
        orbDot: "h-5 w-5 opacity-90",
      }
    : {
        wrap: "fixed inset-x-0 bottom-0 z-[60] flex items-center gap-2.5 px-4 lg:hidden",
        bar: "flex flex-1 items-center justify-around rounded-full bg-white/95 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.12)] ring-1 ring-black/5 backdrop-blur",
        item: "grid h-10 w-10 place-items-center rounded-full transition",
        icon: "h-[21px] w-[21px]",
        plus: "grid h-11 w-11 shrink-0 place-items-center rounded-full bg-black text-white shadow-md transition hover:bg-black/85 active:scale-95",
        plusIcon: "h-5 w-5",
        orb: "grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-white shadow-[0_10px_30px_rgba(0,0,0,0.15)] ring-1 transition",
        orbDotActive: "h-9 w-9 shadow-[0_0_16px_rgba(249,115,22,0.65)]",
        orbDot: "h-6 w-6 opacity-90",
      };

  return (
    <>
    <div
      className={S.wrap}
      style={inPhone ? undefined : { paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom, 0px))" }}
    >
      {/* Icon bar */}
      <nav className={S.bar} aria-label="Primary">
        {/* Home → screen 0, Twin → screen 1 (demoMode) */}
        {NAV_ITEMS.slice(0, 2).map((item, i) => renderNavItem(item, i))}

        {/* + — demoMode: select screen 2; otherwise log a meal from a photo */}
        <button
          type="button"
          onClick={demoMode ? () => onTabChange?.(2) : () => setMealSheet("upload")}
          aria-label={demoMode ? "Demo screen 3" : "Log a meal"}
          aria-pressed={demoMode ? activeTab === 2 : undefined}
          className={`${S.plus} ${
            demoMode && activeTab === 2
              ? "ring-2 ring-cyborg-purple ring-offset-2 ring-offset-white"
              : ""
          }`}
        >
          <Plus className={S.plusIcon} strokeWidth={2.4} />
        </button>

        {/* Protocol → screen 3, Marketplace → screen 4 (demoMode) */}
        {NAV_ITEMS.slice(2).map((item, i) => renderNavItem(item, i + 3))}

        {/* More (•••) — hidden in demoMode so nothing routes away */}
        {!demoMode && (
        <div className="relative grid place-items-center" ref={moreRef}>
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-label="More"
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            className={`${S.item} ${
              moreOpen
                ? "bg-pageBackground text-blue ring-1 ring-borderColor"
                : "text-secondary hover:text-blue"
            }`}
          >
            <MoreHorizontal className={S.icon} strokeWidth={1.8} />
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
        )}
      </nav>

      {/* Floating Cyborg AI orb (the concierge) — hidden in demoMode */}
      {!demoMode && (
      <Link
        href="/concierge"
        aria-label="Cyborg AI"
        aria-current={conciergeActive ? "page" : undefined}
        className={`${S.orb} ${conciergeActive ? "ring-orange-200" : "ring-black/5"}`}
      >
        <span
          className={`block rounded-full bg-gradient-to-br from-orange-400 to-orange-600 transition-all ${
            conciergeActive ? S.orbDotActive : S.orbDot
          }`}
        />
      </Link>
      )}
    </div>

      {!demoMode && (
        <>
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
      )}
    </>
  );
}
