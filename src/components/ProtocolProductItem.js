"use client";

import Image from "next/image";

export default function ProtocolProductItem({ product, onBuyClick }) {
  return (
    <div className="font-inter">
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-16 h-16 relative flex-shrink-0">
            <Image
              src="/assets/sample-medicine.png"
              alt={product.name}
              fill
              className="object-contain"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-black font-inter">{product.name}</h3>
            <p className="text-sm text-secondary mt-1 font-inter">${product.price}</p>
          </div>
        </div>
        <button
          onClick={() => onBuyClick(product)}
          className="bg-black text-white rounded-lg px-6 py-2 text-xs font-medium hover:bg-gray-900 transition flex-shrink-0"
        >
          Buy
        </button>
      </div>
      <div className="border-b border-borderColor" />
    </div>
  );
}
