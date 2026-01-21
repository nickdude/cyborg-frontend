"use client";

import Link from "next/link";
import CyborgLogo from "@/components/CyborgLogo";
import Image from "next/image";

export default function Navbar({ backHref = "/", showBack = true }) {
  return (
    <header className="w-full bg-pageBackground backdrop-blur px-4 pt-10 flex items-center justify-between">
      <div className="">
        {showBack && (
          <Link href={backHref} className="text-secondary text-[16px] font-semibold hover:text-black flex items-center gap-1">
            <Image src="/assets/icons/arrow-left.svg" alt="Back" width={16} height={16} />
            <span>Back</span>
          </Link>
        )}
      </div>
      <div className="h-10 flex items-center justify-center ">
        <CyborgLogo width={100} height={40} />
      </div>
    </header>
  );
}
