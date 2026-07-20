"use client";

import { useState } from "react";
import { goalBackground } from "@/utils/goalBackgrounds";

// Goals-list photo card: full-bleed per-category background, bottom-heavy scrim,
// priority chip top-right, title + "How to solve this" bottom-left. Tapping
// opens the goal detail.
const PRIORITY_LABELS = { high: "High", medium: "Medium", low: "Low" };

export default function GoalStepCard({ goal, index = 0, onOpen }) {
  const [imgOk, setImgOk] = useState(true);
  const priority = PRIORITY_LABELS[String(goal?.priority || "").trim().toLowerCase()] || null;
  const snippet = goal?.summary || goal?.description || "";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative flex min-h-[333px] w-full cursor-pointer overflow-hidden rounded-xl text-left lg:min-h-[200px]"
    >
      {/* solid dark fallback keeps the white copy legible if the image 404s */}
      <div className="absolute inset-0 bg-ink" />
      {imgOk && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={goalBackground(goal)}
          alt=""
          onError={() => setImgOk(false)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/70" />
      <div className="relative z-10 flex w-full flex-col justify-between p-5">
        <div className="flex justify-end">
          {priority && (
            <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
              {priority} priority
            </span>
          )}
        </div>
        <div>
          <h3 className="text-lg font-bold leading-tight text-white">{goal?.title}</h3>
          {priority === "High" && snippet && (
            <p className="mt-1.5 line-clamp-2 text-[11px] leading-normal text-white/80">{snippet}</p>
          )}
          <p className="mt-2.5 text-xs font-semibold text-white">
            How to solve this<span className="ml-1">›</span>
          </p>
        </div>
      </div>
    </button>
  );
}
