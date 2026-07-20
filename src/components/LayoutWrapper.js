"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { paymentAPI } from "@/services/api";
import UserActions from "./UserActions";
import BottomNavbar from "./BottomNavbar";
import TopNavbar from "./TopNavbar";

const PATIENT_ONLY_PAGES = [
  "/dashboard",
  "/market-place",
  "/data",
  "/protocol",
  "/action-plan",
  "/settings",
  "/orders",
  "/invite",
  "/consults",
  "/market-place/prescriptions/semaglutide",
];

// Free (AMINO9 Baseline) members can ONLY use the AI Concierge. Everything else
// bounces them to /concierge — except /settings and /membership so they can still
// manage their account and upgrade.
const FREE_ALLOWED_PREFIXES = ["/concierge", "/settings", "/membership"];

// Desktop top-nav chrome shows across whole route FAMILIES (prefix match) so that
// drill-downs keep the nav bar — e.g. /orders → /orders/[orderId],
// /protocol → /protocol/goals/[goalId], /dashboard → /dashboard/biological-age no
// longer drop the nav. Safe to widen this beyond the mobile bottom-nav set because
// TopNavbar is `hidden lg:block` — it never renders on mobile, so mobile is frozen.
const CHROME_FAMILIES = [
  "/dashboard",
  "/data",
  "/protocol",
  "/action-plan",
  "/market-place",
  "/settings",
  "/orders",
  "/invite",
  "/consults",
];
// Focus-mode leaves that must stay chrome-less even under a chrome'd parent (a
// deliberate distraction-free wizard). Deny wins over the family match above.
const CHROME_LEAF_DENY = ["/market-place/prescriptions/semaglutide/onboarding"];

const matchesPrefix = (pathname, prefixes) =>
  prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const isDoctor = user?.userType === "doctor";

  // Determine the member's plan (baseline = free) so we can gate feature access.
  const [planType, setPlanType] = useState(undefined); // undefined = unknown yet
  useEffect(() => {
    if (!user?.id || isDoctor) {
      setPlanType(null);
      return;
    }
    let active = true;
    paymentAPI
      .getUserSubscription(user.id)
      .then((res) => { if (active) setPlanType(res?.data?.planType ?? null); })
      .catch(() => { if (active) setPlanType(null); });
    return () => { active = false; };
  }, [user?.id, isDoctor]);

  const isFreeMember = planType === "baseline";
  const freeAllowed = FREE_ALLOWED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  useEffect(() => {
    if (isDoctor && PATIENT_ONLY_PAGES.includes(pathname)) {
      router.replace("/doctor-dashboard");
      return;
    }
    // Free members are confined to the AI Concierge (+ settings/membership).
    if (isFreeMember && !freeAllowed) {
      router.replace("/concierge");
    }
  }, [isDoctor, isFreeMember, freeAllowed, pathname, router]);

  if (isDoctor && PATIENT_ONLY_PAGES.includes(pathname)) {
    return null;
  }
  // Don't flash a locked page before the redirect lands.
  if (isFreeMember && !freeAllowed) {
    return null;
  }

  const isConcierge = pathname === "/concierge" || pathname.startsWith("/concierge/");

  // Desktop top nav + its top padding follow whole route families (drill-downs keep
  // the nav), minus the focus-mode leaves. TopNavbar is desktop-only, so this never
  // touches mobile.
  const showTopNav =
    matchesPrefix(pathname, CHROME_FAMILIES) &&
    !matchesPrefix(pathname, CHROME_LEAF_DENY);
  // The mobile bottom nav stays on the ORIGINAL exact-match patient set (+ concierge,
  // a full-screen chat) so the finished mobile layout is unchanged.
  const showBottomNavbar = PATIENT_ONLY_PAGES.includes(pathname) || isConcierge;

  const showUserActions = [
    // /dashboard is intentionally excluded — the dashboard renders its own
    // top-right controls per home tab (the Timeline hero owns its avatar).
    "/market-place",
    "/data",
    "/protocol",
    "/market-place/prescriptions/semaglutide",
  ].includes(pathname);

  return (
    <>
      {/* Desktop: superpower-style top nav. Mobile: bottom pill + the fixed
          top-right user actions (hidden on desktop since the top nav covers them). */}
      {showTopNav && <TopNavbar />}
      {showUserActions && (
        <div className="lg:hidden">
          <UserActions />
        </div>
      )}
      <div className={showTopNav ? "lg:pt-16" : ""}>{children}</div>
      {showBottomNavbar && <BottomNavbar />}
    </>
  );
}
