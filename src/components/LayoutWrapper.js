"use client";

import { usePathname } from "next/navigation";
import UserActions from "./UserActions";
import BottomNavbar from "./BottomNavbar";

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  
  // Pages where UserActions and BottomNavbar should appear
  const showComponents = ["/market-place", "/data", "/protocol", "/concierge", "/"].includes(pathname);

  return (
    <>
      {showComponents && <UserActions />}
      {children}
      {showComponents && <BottomNavbar />}
    </>
  );
}
