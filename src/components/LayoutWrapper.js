"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
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

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const isDoctor = user?.userType === "doctor";

  useEffect(() => {
    if (isDoctor && PATIENT_ONLY_PAGES.includes(pathname)) {
      router.replace("/doctor-dashboard");
    }
  }, [isDoctor, pathname, router]);

  if (isDoctor && PATIENT_ONLY_PAGES.includes(pathname)) {
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
