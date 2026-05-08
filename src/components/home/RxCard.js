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
      <div className="bg-white rounded-2xl border border-borderColor p-6 lg:p-7 shadow-sm hover:shadow-md transition">
        <p className="text-lg font-inter text-secondary text-center mb-4 lg:text-xl font-medium">{data.title}</p>
        <div className="flex gap-5 lg:gap-6">
          <div className="w-24 h-32 bg-gray-50 rounded-xl relative overflow-hidden flex-shrink-0 lg:h-36 lg:w-28 border border-borderColor">
            <Image src={data.image} alt="Rx sample" fill className="object-contain" />
          </div>
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h4 className="text-lg font-semibold font-inter text-black mb-4 lg:text-xl">{data.headline}</h4>
              <div className="space-y-3.5 text-sm font-inter text-secondary lg:text-base">
                {data.benefits.map((benefit) => {
                  const Icon = iconMap[benefit.icon] || DollarSign;
                  return (
                    <div key={benefit.text} className="flex items-center gap-3">
                      <Icon size={18} className="text-primary flex-shrink-0" />
                      <span className="font-medium">{benefit.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
