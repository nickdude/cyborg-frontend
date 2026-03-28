"use client";

import Image from "next/image";
import { Activity, CreditCard, DollarSign } from "lucide-react";

const iconMap = {
  DollarSign,
  CreditCard,
  Activity,
};

export default function RxCard({ data }) {
  return (
    <div className="mt-6">
      <div className="bg-white rounded-3xl border border-borderColor p-6 lg:p-7">
        <p className="text-xl font-inter text-secondary text-center mb-3 lg:text-2xl">{data.title}</p>
        <div className="flex gap-4 lg:gap-5">
          <div className="w-24 h-32 bg-gray-50 rounded-xl relative overflow-hidden lg:h-36 lg:w-28">
            <Image src={data.image} alt="Rx sample" fill className="object-contain" />
          </div>
          <div className="flex-1">
            <h4 className="text-xl font-semibold font-inter text-black mb-4 lg:text-2xl">{data.headline}</h4>
            <div className="space-y-3 text-sm font-inter text-secondary lg:text-[15px]">
              {data.benefits.map((benefit) => {
                const Icon = iconMap[benefit.icon] || DollarSign;
                return (
                  <div key={benefit.text} className="flex items-center gap-3">
                    <Icon size={18} className="text-secondary" />
                    <span>{benefit.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
