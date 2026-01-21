"use client";

import Image from "next/image";

export default function CyborgLogo({ className = "" }) {
  return (
    <Image src="/assets/cyborg.png" alt="Cyborg Logo" width={180} height={40} className={className} />
  );
}
