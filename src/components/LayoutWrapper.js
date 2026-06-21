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

  const showBottomNavbar = PATIENT_ONLY_PAGES.includes(pathname) || isOrdersListPage;

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
      {showBottomNavbar && <TopNavbar />}
      {showUserActions && (
        <div className="md:hidden">
          <UserActions />
        </div>
      )}
      <div className={showBottomNavbar ? "md:pt-16" : ""}>{children}</div>
      {showBottomNavbar && <BottomNavbar />}
    </>
  );
}
