"use client";

import Link from "next/link";

export default function FloatingActionButton() {
  return (
    <Link href="/concierge">
      <button className="fixed bottom-24 right-6 z-40 flex items-center justify-center transition-all active:scale-95 hover:shadow-2xl">
        {/* Outer purple circle */}
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg">
          {/* White circle middle ring */}
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            {/* Black C text */}
            <span className="text-2xl font-bold text-black">C</span>
          </div>
        </div>
      </button>
    </Link>
  );
}
