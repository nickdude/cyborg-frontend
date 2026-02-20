"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNavbar() {
    const pathname = usePathname();
    const isActive = (path) => {
        return pathname === path;
      };
    return (
      <nav className="fixed bottom-0 inset-x-0 bg-white shadow-lg">
        <div className="max-w-md mx-auto py-3 flex items-center justify-center text-[10px] font-bold">
          <Link href="/" className={`flex-1 flex flex-col items-center gap-1 ${isActive("/") ? "text-black" : "text-secondary"}`}>
            <Image src="/assets/icons/house.svg" alt="home" width={24} height={24} className={isActive("/") ? "" : "opacity-60"} />
            <span>Home</span>
          </Link>
          <Link href="/data" className={`flex-1 flex flex-col items-center gap-1 ${isActive("/data") ? "text-black" : "text-secondary"}`}>
            <Image src  ="/assets/icons/chart.svg" alt="data" width={24} height={24} className={isActive("/data") ? "" : "opacity-60"} />
            <span>Data</span>
          </Link>   
            <Link href="/concierge" className="flex-1 flex flex-col items-center gap-1 text-black">     
            <span className="text-2xl flex justify-center items-center bg-black text-white rounded-full w-20 h-20 border-8 border-gray-50">＋</span>
            </Link>
          <Link href="/protocol" className={`flex-1 flex flex-col items-center gap-1 ${isActive("/protocol") ? "text-black" : "text-secondary"}`}>
            <Image src="/assets/icons/protocol.svg" alt="protocol" width={24} height={24} className={isActive("/protocol") ? "" : "opacity-60"} />
            <span>Protocol</span>
          </Link>
          <Link href="/market-place" className={`flex-1 flex flex-col items-center gap-1 ${isActive("/marketplace") ? "text-black" : "text-secondary"}`}>
            <Image src="/assets/icons/store.svg" alt="marketplace" width={24} height={24} className={isActive("/marketplace") ? "" : "opacity-60"} />
            <span>Marketplace</span>
          </Link>
        </div>
      </nav>
    )
}       