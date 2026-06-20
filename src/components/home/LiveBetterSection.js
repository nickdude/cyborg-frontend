"use client";

import Image from "next/image";
import { ChevronRight } from "lucide-react";

export default function LiveBetterSection({ data }) {
  return (
    <div className="mt-8">
      <h3 className="text-2xl font-semibold font-inter text-black mb-5 lg:text-2xl">{data.title}</h3>

      <div className="space-y-4 lg:space-y-5">
        {data.cards.map((card, index) => (
          <div key={index} className="relative overflow-hidden rounded-2xl h-[120px] lg:h-[150px] group">
            <Image
              src={card.image}
              alt={card.text || card.textLines?.join(" ") || ""}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className={`absolute inset-0 ${index === 0 ? "bg-black/30" : "bg-black/40"}`} />
            <div className="relative z-10 h-full flex items-center justify-between px-5 text-white">
              <div className="flex-1">
                {card.text && (
                  <p className="text-base font-semibold font-inter max-w-[70%] lg:max-w-[75%] lg:text-lg leading-snug">{card.text}</p>
                )}
                {card.textLines && (
                  <>
                    {card.textLines.map((line) => (
                      <p key={line} className="text-base font-semibold font-inter lg:text-lg leading-snug">
                        {line}
                      </p>
                    ))}
                  </>
                )}
                {card.subtext && (
                  <p className="text-xs font-inter opacity-90 mt-2 lg:text-sm">{card.subtext}</p>
                )}
              </div>
              {card.action?.type === "chevron" && <ChevronRight size={24} className="text-white opacity-80" />}
              {card.action?.type === "button" && (
                <button className="bg-white text-black text-sm font-semibold font-inter px-4 py-2 rounded-lg hover:bg-gray-100 transition flex-shrink-0 lg:px-5">
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
