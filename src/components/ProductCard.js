"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { cartAPI } from "@/services/api";

export default function ProductCard({ product, onAdded }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    try {
      await cartAPI.addItem(product.id, 1);
      setAdded(true);
      onAdded?.();
      setTimeout(() => setAdded(false), 1500);
    } catch (err) {
      // Most likely unauthenticated → send to login.
      if (String(err.message).toLowerCase().includes("token") || err.message === "Request failed") {
        router.push("/login");
      }
    } finally {
      setAdding(false);
    }
  };

  const discountPct =
    product.originalPrice && product.price
      ? Math.round((1 - Number(product.price) / Number(product.originalPrice)) * 100)
      : 0;

  const content = (
    <>
      {/* Product Image */}
      <div className="relative h-[150px] mb-3 flex items-center justify-center rounded-lg bg-[#f6f6f7] p-3 lg:mb-4 lg:h-[180px] lg:rounded-xl lg:p-4">
        <Image
          src={product.image || "/assets/preview/product-1.png"}
          alt={product.name || "Product"}
          width={100}
          height={100}
          className="h-full w-full object-contain lg:transition-transform lg:duration-300 lg:group-hover:scale-105"
        />
        {product.onSale && (
          <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded-full lg:bg-gradient-to-r lg:from-purple-600 lg:to-primary lg:shadow-sm lg:shadow-primary/30">
            Sale
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-1 font-inter">
        <p className="text-xs text-gray-500 lg:text-[13px] lg:text-secondary">{product.brand || product.category}</p>
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 lg:text-[15px] lg:leading-snug lg:text-blue">{product.name}</h3>

        {/* Price */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-lg font-bold text-gray-900 lg:text-xl lg:text-blue">${product.price}</span>
          {product.originalPrice && (
            <span className="text-sm text-gray-400 line-through lg:text-secondary/70">${product.originalPrice}</span>
          )}
          {discountPct > 0 && (
            <span className="hidden rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-600 lg:ml-auto lg:inline-flex lg:items-center">
              -{discountPct}%
            </span>
          )}
        </div>
      </div>
    </>
  );

  const cardClass =
    "group flex h-full flex-col rounded-xl p-4 shadow-sm transition hover:shadow-md lg:rounded-2xl lg:border lg:border-borderColor lg:bg-white lg:p-5 lg:transition-all lg:duration-300 lg:hover:-translate-y-1 lg:hover:border-purple-200 lg:hover:shadow-[0_18px_40px_rgba(91,36,135,0.12)]";

  if (product.link) {
    return (
      <Link href={product.link} className="block h-full">
        <div className={`${cardClass} cursor-pointer`}>{content}</div>
      </Link>
    );
  }

  return (
    <div className={cardClass}>
      {content}
      <button
        type="button"
        onClick={handleAdd}
        disabled={adding}
        className={`mt-auto w-full rounded-xl py-2.5 pt-3 text-sm font-semibold transition lg:flex lg:items-center lg:justify-center lg:gap-2 lg:py-3 lg:active:scale-[0.98] ${
          added
            ? "bg-green-600 text-white"
            : "bg-primary text-white hover:bg-purple-800 disabled:opacity-60 lg:hover:shadow-md lg:hover:shadow-primary/25"
        }`}
      >
        {!added && !adding && <ShoppingCart className="hidden h-4 w-4 lg:inline-block" />}
        {added ? "✓ Added" : adding ? "Adding…" : "Add to cart"}
      </button>
    </div>
  );
}
