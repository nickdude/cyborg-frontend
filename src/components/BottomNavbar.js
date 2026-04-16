"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import FloatingActionButton from "./FloatingActionButton";
import MealUploadSheet from "./MealUploadSheet";
import MealDetailsSheet from "./MealDetailsSheet";

export default function BottomNavbar() {
  const pathname = usePathname();
  const isActive = (path) => pathname === path;

  const [activeSheet, setActiveSheet] = useState(null); // "upload" | "details" | null
  const [pickedFiles, setPickedFiles] = useState([]);

  const handleFilesPicked = (files) => {
    setPickedFiles(files);
    setActiveSheet("details");
  };

  const navIconLabel = activeSheet ? "×" : "＋";

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
            onClick={() => setActiveSheet((s) => (s ? null : "upload"))}
            aria-label={activeSheet ? "Close add meal" : "Add meal"}
            className="flex-1 flex flex-col items-center gap-1 text-black"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full border-8 border-gray-50 bg-black text-2xl text-white lg:h-14 lg:w-14 lg:border-4 lg:text-xl">
              {navIconLabel}
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
        open={activeSheet === "upload"}
        onClose={() => setActiveSheet(null)}
        onFilesPicked={handleFilesPicked}
      />

      <MealDetailsSheet
        open={activeSheet === "details"}
        initialFiles={pickedFiles}
        onClose={() => setActiveSheet(null)}
      />
    </>
  );
}
