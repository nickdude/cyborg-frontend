"use client";

import { usePathname } from "next/navigation";
import UserActions from "./UserActions";
import BottomNavbar from "./BottomNavbar";

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const isOrdersListPage = pathname === "/orders";
  
  // Pages where BottomNavbar should appear
  const showBottomNavbar = [
    "/dashboard",
    "/market-place",
    "/data",
    "/protocol",
    "/concierge",
    "/settings",
    "/orders",
    "/market-place/prescriptions/semaglutide",
  ].includes(pathname) || isOrdersListPage;

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
