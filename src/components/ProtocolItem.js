"use client";

import Image from "next/image";

export default function ProtocolItem({ item }) {
  return (
    <div className="bg-white rounded-3xl p-6 flex flex-col justify-center items-center gap-4 mb-10">
      {/* Product Image */}
      <div className="flex-shrink-0 w-40 h-40 relative">
        <Image
          src="/assets/sample-medicine.png"
          alt={item.name}
          fill
          className="object-contain"
        />
      </div>

      {/* Product Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-semibold font-inter text-black mb-3">{item.name}</h3>
          
          {/* Description and Instruction as bullets */}
          <div className="space-y-2">
            <p className="text-sm font-inter text-secondary leading-relaxed flex gap-2">
              <span className="flex-shrink-0">•</span>
              <span>{item.description}</span>
            </p>
            <p className="text-sm font-inter text-secondary leading-relaxed flex gap-2">
              <span className="flex-shrink-0">•</span>
              <span>{item.instruction}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
