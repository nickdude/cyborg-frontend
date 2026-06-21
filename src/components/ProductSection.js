"use client";

import ProductCard from "./ProductCard";

// Superpower-style section: heading + supporting description, then a card grid.
export default function ProductSection({ title, subtitle, products }) {
  return (
    <section className="space-y-5">
      <div className="max-w-2xl">
        <h2 className="font-inter text-2xl font-semibold tracking-[-0.02em] text-blue lg:text-[28px]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1.5 text-sm text-secondary lg:text-[15px]">{subtitle}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
