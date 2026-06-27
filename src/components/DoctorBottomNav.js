"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, UserCircle } from "lucide-react";

// Top-level doctor destinations. Shown as a fixed pill bar on phones + all iPads
// (incl. 12.9" landscape at 1366px); hidden on true desktops (≥1367px) where the
// header + wider layout already make navigation easy. (No "Settings" — that page
// is patient-only; a doctor's settings live on their Profile.)
const ITEMS = [
  { label: "Patients", href: "/doctor-dashboard", Icon: Users },
  { label: "Profile", href: "/doctor/profile", Icon: UserCircle },
];

export default function DoctorBottomNav() {
  const pathname = usePathname();

  const isActive = (href) => {
    if (href === "/doctor-dashboard") {
      return pathname === "/doctor-dashboard" || pathname.startsWith("/doctor/patients");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      aria-label="Doctor navigation"
      className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 min-[1367px]:hidden"
      style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="flex w-full max-w-[320px] items-center justify-around gap-1 rounded-[28px] bg-white/95 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.14)] ring-1 ring-black/5 backdrop-blur">
        {ITEMS.map(({ label, href, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 transition-colors ${
                active ? "text-primary" : "text-secondary hover:text-primary"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-2xl transition-colors ${
                  active ? "bg-primary/10" : "bg-transparent"
                }`}
              >
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.3 : 1.8} />
              </span>
              <span className="text-[11px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
