"use client";

import ProductCard from "./ProductCard";

export default function ProductSection({ title, subtitle, products }) {
  return (
    <div className="space-y-4 lg:space-y-5">
      <div>
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl lg:text-[22px] font-inter font-medium text-gray-900 lg:font-semibold lg:tracking-[-0.01em] lg:text-blue">
            {title}
          </h2>
          {products?.length > 0 && (
            <span className="hidden lg:inline-flex items-center rounded-full bg-pageBackground px-2.5 py-0.5 text-xs font-semibold text-secondary">
              {products.length}
            </span>
          )}
        </div>
        {subtitle && <p className="text-sm lg:text-base text-gray-600 mt-1 lg:text-secondary">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
