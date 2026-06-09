"use client";

import ProductCard from "./ProductCard";

export default function ProductSection({ title, subtitle, products }) {
  return (
    <div className="space-y-4 lg:space-y-5">
      <div>
        <h2 className="text-xl lg:text-[22px] font-inter font-medium text-gray-900 lg:font-semibold lg:tracking-[-0.01em]">{title}</h2>
        {subtitle && <p className="text-sm lg:text-base text-gray-600 mt-1">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 ">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
