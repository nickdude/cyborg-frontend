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
      <nav className="fixed bottom-0 inset-x-0 z-40 lg:bottom-4 lg:bg-transparent lg:shadow-none">
        {/* Masked nav background — a big radial cutout lifts the top edge into
            a visible scoop around the center button. Radius 48px, centered 14px
            below the top edge so the hole reads as a deep concave arc. */}
        <div
          className="absolute inset-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.10)] lg:rounded-2xl lg:border lg:border-borderColor lg:shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
          style={{
            WebkitMaskImage:
              "radial-gradient(circle 48px at 50% 14px, transparent 46px, black 48px)",
            maskImage:
              "radial-gradient(circle 48px at 50% 14px, transparent 46px, black 48px)",
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto flex max-w-md items-end justify-center pt-6 pb-3 text-[10px] font-bold lg:max-w-[900px] lg:items-center lg:px-6 lg:py-3.5 lg:text-xs">
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
            className="flex-1 flex flex-col items-center"
          >
            {/* Big white circle, straddles the notch. -mt-12 lifts it so ~half of
                the button rises above the nav's top edge, sitting in the scoop. */}
            <span className="-mt-12 flex h-16 w-16 items-center justify-center rounded-full bg-white text-[28px] leading-none font-normal text-black shadow-[0_6px_18px_rgba(0,0,0,0.18)] ring-1 ring-gray-200 lg:-mt-0 lg:h-12 lg:w-12 lg:text-xl">
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
