"use client";

import dynamic from "next/dynamic";

// Load the WebGL body model client-side only (no SSR) to avoid hydration/WebGL issues.
export const BodyModelClient = dynamic(() => import("./BodyModel").then((m) => m.BodyModel), {
  ssr: false,
  loading: () => <div className="h-full w-full" aria-hidden />,
});

export default BodyModelClient;
