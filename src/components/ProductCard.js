"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
          <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
            Sale
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-1 font-inter">
        <p className="text-xs text-gray-500 lg:text-[13px]">{product.brand || product.category}</p>
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 lg:text-[15px] lg:leading-snug">{product.name}</h3>

        {/* Price */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-lg font-bold text-gray-900 lg:text-xl">${product.price}</span>
          {product.originalPrice && (
            <span className="text-sm text-gray-400 line-through">${product.originalPrice}</span>
          )}
        </div>
      </div>
    </>
  );

  if (product.link) {
    return (
      <Link href={product.link} className="block h-full">
        <div className="group flex h-full flex-col rounded-xl p-4 lg:p-5 shadow-sm hover:shadow-md transition cursor-pointer lg:border lg:border-borderColor lg:bg-white lg:transition-all lg:duration-300 lg:hover:-translate-y-1 lg:hover:border-purple-200 lg:hover:shadow-[0_18px_40px_rgba(91,36,135,0.12)]">
          {content}
        </div>
      </Link>
    );
  }

  return (
    <div className="group flex h-full flex-col rounded-xl p-4 lg:p-5 shadow-sm hover:shadow-md transition lg:border lg:border-borderColor lg:bg-white lg:transition-all lg:duration-300 lg:hover:-translate-y-1 lg:hover:border-purple-200 lg:hover:shadow-[0_18px_40px_rgba(91,36,135,0.12)]">
      {content}
      <button
        type="button"
        onClick={handleAdd}
        disabled={adding}
        className={`mt-auto w-full rounded-xl py-2.5 pt-3 text-sm font-semibold transition lg:py-3 ${
          added
            ? "bg-green-600 text-white"
            : "bg-primary text-white hover:bg-purple-800 disabled:opacity-60"
        }`}
      >
        {added ? "✓ Added" : adding ? "Adding…" : "Add to cart"}
      </button>
    </div>
  );
}
