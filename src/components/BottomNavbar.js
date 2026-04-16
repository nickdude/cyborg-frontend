"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import FloatingActionButton from "./FloatingActionButton";
import MealUploadSheet from "./MealUploadSheet";

export default function BottomNavbar() {
  const pathname = usePathname();
  const isActive = (path) => pathname === path;

  const [sheetOpen, setSheetOpen] = useState(false);

  // Task 3 will replace this with a handoff to MealDetailsSheet.
  const handleFilesPicked = (files) => {
    console.log("[MealUpload] picked files:", files.map((f) => `${f.name} (${f.size}B ${f.type})`));
  };

  return (
    <>
      <FloatingActionButton />
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white shadow-lg lg:bottom-4 lg:bg-transparent lg:shadow-none">
        <div className="mx-auto flex max-w-md items-center justify-center py-3 text-[10px] font-bold lg:max-w-[900px] lg:rounded-2xl lg:border lg:border-borderColor lg:bg-white lg:px-6 lg:py-3.5 lg:text-xs lg:shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
          <Link href="/dashboard" className={`flex-1 flex flex-col items-center gap-1 ${isActive("/dashboard") ? "text-black" : "text-secondary"}`}>
            <Image src="/assets/icons/house.svg" alt="home" width={24} height={24} className={isActive("/dashboard") ? "" : "opacity-60"} />
            <span>Home</span>
          </Link>
          <Link href="/data" className={`flex-1 flex flex-col items-center gap-1 ${isActive("/data") ? "text-black" : "text-secondary"}`}>
            <Image src="/assets/icons/chart.svg" alt="data" width={24} height={24} className={isActive("/data") ? "" : "opacity-60"} />
            <span>Data</span>
          </Link>
          <button
            type="button"
            onClick={() => setSheetOpen((v) => !v)}
            aria-label={sheetOpen ? "Close add meal" : "Add meal"}
            className="flex-1 flex flex-col items-center gap-1 text-black"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full border-8 border-gray-50 bg-black text-2xl text-white lg:h-14 lg:w-14 lg:border-4 lg:text-xl">
              {sheetOpen ? "×" : "＋"}
            </span>
          </button>
          <Link href="/protocol" className={`flex-1 flex flex-col items-center gap-1 ${isActive("/protocol") ? "text-black" : "text-secondary"}`}>
            <Image src="/assets/icons/protocol.svg" alt="protocol" width={24} height={24} className={isActive("/protocol") ? "" : "opacity-60"} />
            <span>Protocol</span>
          </Link>
          <Link href="/market-place" className={`flex-1 flex flex-col items-center gap-1 ${isActive("/market-place") ? "text-black" : "text-secondary"}`}>
            <Image src="/assets/icons/store.svg" alt="marketplace" width={24} height={24} className={isActive("/market-place") ? "" : "opacity-60"} />
            <span>Marketplace</span>
          </Link>
        </div>
      </nav>

      <MealUploadSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onFilesPicked={handleFilesPicked}
      />
    </>
  );
}
