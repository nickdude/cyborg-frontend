"use client";

import Image from "next/image";

export default function ProductCard({ product }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition">
      {/* Product Image */}
      <div className="relative aspect-square mb-3 flex items-center justify-center bg-gray-50 rounded-lg">
        <Image
          src={product.image}
          alt={product.name}
          width={100}
          height={100}
          className="object-contain"
        />
        {product.onSale && (
          <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
            Sale
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-1 font-inter">
        <p className="text-xs text-gray-500">{product.brand || product.category}</p>
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">{product.name}</h3>
        
        {/* Price */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-lg font-bold text-gray-900">${product.price}</span>
          {product.originalPrice && (
            <span className="text-sm text-gray-400 line-through">${product.originalPrice}</span>
          )}
        </div>

        {/* Sale Badge */}
        {product.onSale && (
          <div className="flex items-center gap-1 bg-saleBadgeBg text-purple-600 text-xs font-semibold px-3 py-1 rounded-md w-fit">
            <span>✓</span>
            <span>Sale</span>
          </div>
        )}
      </div>
    </div>
  );
}
