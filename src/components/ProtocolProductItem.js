"use client";

import Image from "next/image";

export default function ProtocolProductItem({ product, onBuyClick }) {
  return (
    <div className="font-inter lg:rounded-2xl lg:border lg:border-borderColor lg:bg-white lg:px-5">
      <div className="flex items-center justify-between py-4 lg:py-5">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-16 h-16 relative flex-shrink-0 lg:h-20 lg:w-20">
            <Image
              src="/assets/sample-medicine.png"
              alt={product.name}
              fill
              className="object-contain"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-black font-inter lg:text-base">{product.name}</h3>
            <p className="text-sm text-secondary mt-1 font-inter lg:text-base">${product.price}</p>
          </div>
        </div>
        <button
          onClick={() => onBuyClick(product)}
          className="bg-black text-white rounded-lg px-6 py-2 text-xs font-medium hover:bg-gray-900 transition flex-shrink-0 lg:px-7 lg:py-2.5 lg:text-sm"
        >
          Buy
        </button>
      </div>
      <div className="border-b border-borderColor lg:hidden" />
    </div>
  );
}
