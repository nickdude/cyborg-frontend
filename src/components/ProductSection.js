"use client";

import ProductCard from "./ProductCard";

export default function ProductSection({ title, subtitle, products }) {
  return (
    <div className="space-y-4 bg-pageBackground">
      <div>
        <h2 className="text-xl font-inter font-medium text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      </div>
      
      <div className="grid grid-cols-2 gap-4 bg-pageBackground">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
