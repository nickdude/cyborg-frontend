"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

/* Card list shared by the Timeline, Digital Twin, and Insights homes so the
   "Live better, longer together" cards stay identical across tabs.
   Card shape: { image, imagePos?, href?, text? | textLines?, subtext?, action? } */
export function LiveBetterCards({ cards }) {
  return (
    <div className="space-y-4">
      {cards.map((card, i) => {
        const inner = (
          <>
            <Image
              src={card.image}
              alt=""
              fill
              className="object-cover"
              style={card.imagePos ? { objectPosition: card.imagePos } : undefined}
            />
            <div className={`absolute inset-0 ${i === 0 ? "bg-black/30" : "bg-black/45"}`} />
            <div
              className={`relative z-10 flex h-full items-center gap-3 px-5 text-white ${
                i === 0 ? "justify-end" : "justify-between"
              }`}
            >
              <div className="min-w-0">
                {card.text && (
                  <p className="max-w-[62%] text-[15px] font-semibold leading-snug">{card.text}</p>
                )}
                {card.textLines?.map((line) => (
                  <p key={line} className="text-[15px] font-semibold leading-snug">{line}</p>
                ))}
                {card.subtext && <p className="mt-1 text-[12px] text-white/90">{card.subtext}</p>}
              </div>
              {card.action?.type === "chevron" && <ChevronRight className="h-6 w-6 shrink-0 text-white/85" />}
              {card.action?.type === "button" && (
                <span className="shrink-0 rounded-lg bg-white px-4 py-2 text-[14px] font-semibold text-black">
                  {card.action.label}
                </span>
              )}
            </div>
          </>
        );
        const cls = "relative block h-[120px] overflow-hidden rounded-2xl transition hover:brightness-105";
        return card.href ? (
          <Link key={i} href={card.href} className={cls}>{inner}</Link>
        ) : (
          <div key={i} className={cls}>{inner}</div>
        );
      })}
    </div>
  );
}

export default function LiveBetterSection({ data }) {
  return (
    <div className="mt-8">
      <h3 className="text-2xl font-semibold font-inter text-black mb-5 lg:text-2xl">{data.title}</h3>
      <LiveBetterCards cards={data.cards} />
    </div>
  );
}
