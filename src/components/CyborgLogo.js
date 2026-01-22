"use client";

import Image from "next/image";

export default function CyborgLogo({ className = "", width = 180, height = 40 }) {
  return (
    <Image src="/assets/cyborg.png" alt="Cyborg Logo" width={width} height={height} className={className} />
  );
}
