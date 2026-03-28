"use client";

import { usePathname } from "next/navigation";
import UserActions from "./UserActions";
import BottomNavbar from "./BottomNavbar";

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  
  // Pages where BottomNavbar should appear
  const showBottomNavbar = [
    "/dashboard",
    "/market-place",
    "/data",
    "/protocol",
    "/concierge",
    "/settings",
    "/market-place/prescriptions/semaglutide",
  ].includes(pathname);

  // Pages where UserActions should appear
  const showUserActions = [
    "/dashboard",
    "/market-place",
    "/data",
    "/protocol",
    "/concierge",
    "/market-place/prescriptions/semaglutide",
  ].includes(pathname);

  return (
    <>
      {showUserActions && <UserActions />}
      {children}
      {showBottomNavbar && <BottomNavbar />}
    </>
  );
}
