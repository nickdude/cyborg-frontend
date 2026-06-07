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
      <div className="relative aspect-square mb-3 flex items-center justify-center rounded-lg ">
        <Image
          src={product.image || "/assets/preview/product-1.png"}
          alt={product.name || "Product"}
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
      </div>
    </>
  );

  if (product.link) {
    return (
      <Link href={product.link}>
        <div className="rounded-xl p-4 lg:p-5 shadow-sm hover:shadow-md transition cursor-pointer lg:border lg:border-borderColor lg:bg-white">
          {content}
        </div>
      </Link>
    );
  }

  return (
    <div className="flex flex-col rounded-xl p-4 lg:p-5 shadow-sm hover:shadow-md transition lg:border lg:border-borderColor lg:bg-white">
      {content}
      <button
        type="button"
        onClick={handleAdd}
        disabled={adding}
        className={`mt-3 w-full rounded-xl py-2.5 text-sm font-semibold transition ${
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
