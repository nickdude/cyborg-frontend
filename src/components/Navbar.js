"use client";

import Link from "next/link";
import CyborgLogo from "@/components/CyborgLogo";
import Image from "next/image";
import UserActions from "@/components/UserActions";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar({ backHref = "/", showBack = true, showUserActions = true }) {
  const { token } = useAuth();

  // No `backdrop-filter` (e.g. backdrop-blur) on the header: it would establish a
  // stacking context AND become the containing block for the `position: fixed`
  // UserActions, trapping the bell/avatar dropdowns inside the header so they
  // render *behind* later-in-DOM page content (e.g. the membership plan cards).
  // The header has a solid background and isn't sticky, so a blur has no visual
  // effect anyway — keep it out so UserActions stays at the root layer.
  return (
    <header className="w-full bg-pageBackground px-4 pt-10 flex items-center justify-between font-inter lg:px-8">
      <div className="flex-1">
        {showBack && (
          <Link
            href={backHref}
            className="text-secondary text-[16px] font-semibold hover:text-black flex items-center gap-1"
          >
            <Image src="/assets/icons/arrow-left.svg" alt="Back" width={16} height={16} />
            <span>Back</span>
          </Link>
        )}
      </div>

      <div className="h-10 flex items-center justify-center mt-3 lg:mt-0 flex-1">
        <CyborgLogo width={100} height={40} />
      </div>

      {/*
        Right zone. UserActions is `position: fixed`, so it leaves the flex flow.
        Without this spacer the logo gets pushed to the far-right edge by
        `justify-between` and ends up underneath the fixed bell/avatar. This empty
        flex zone balances the left zone so the logo stays centered and clear of
        the fixed actions at every screen size.
      */}
      <div className="flex-1" aria-hidden="true" />

      {/* Bell Icon + User Menu */}
      {token && showUserActions && <UserActions />}
    </header>
  );
}
