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

  const isOrdersListPage = pathname === "/orders";
  const isConcierge = pathname === "/concierge" || pathname.startsWith("/concierge/");

  // Top nav (desktop) + top padding apply to the standard patient pages.
  const showAppChrome = PATIENT_ONLY_PAGES.includes(pathname) || isOrdersListPage;
  // The mobile bottom nav ALSO shows on the concierge (a full-screen chat) so users
  // can navigate away — but the concierge keeps no desktop top nav / top padding.
  const showBottomNavbar = showAppChrome || isConcierge;

  const showUserActions = [
    "/dashboard",
    "/market-place",
    "/data",
    "/protocol",
    "/market-place/prescriptions/semaglutide",
  ].includes(pathname);

  return (
    <>
      {/* Desktop: superpower-style top nav. Mobile: bottom pill + the fixed
          top-right user actions (hidden on desktop since the top nav covers them). */}
      {showAppChrome && <TopNavbar />}
      {showUserActions && (
        <div className="lg:hidden">
          <UserActions />
        </div>
      )}
      <div className={showAppChrome ? "lg:pt-16" : ""}>{children}</div>
      {showBottomNavbar && <BottomNavbar />}
    </>
  );
}
