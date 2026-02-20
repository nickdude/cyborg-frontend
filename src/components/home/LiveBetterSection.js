"use client";

import Image from "next/image";
import { ChevronRight } from "lucide-react";

export default function LiveBetterSection({ data }) {
  return (
    <div className="mt-8">
      <h3 className="text-2xl font-semibold font-inter text-black mb-4">{data.title}</h3>

      <div className="space-y-4">
        {data.cards.map((card, index) => (
          <div key={index} className="relative overflow-hidden rounded-2xl h-[110px]">
            <Image
              src={card.image}
              alt={card.text || card.textLines?.join(" ") || ""}
              fill
              className="object-cover"
            />
            <div className={`absolute inset-0 ${index === 0 ? "bg-black/25" : "bg-black/35"}`} />
            <div className="relative z-10 h-full flex items-center justify-between px-5 text-white">
              <div>
                {card.text && (
                  <p className="text-base font-semibold font-inter max-w-[70%]">{card.text}</p>
                )}
                {card.textLines && (
                  <>
                    {card.textLines.map((line) => (
                      <p key={line} className="text-base font-semibold font-inter">
                        {line}
                      </p>
                    ))}
                  </>
                )}
                {card.subtext && (
                  <p className="text-sm font-inter opacity-90 mt-1">{card.subtext}</p>
                )}
              </div>
              {card.action?.type === "chevron" && <ChevronRight size={22} className="text-[#2F80FF]" />}
              {card.action?.type === "button" && (
                <button className="bg-white text-black text-sm font-semibold font-inter px-4 py-2 rounded-xl">
                  {card.action.label}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
