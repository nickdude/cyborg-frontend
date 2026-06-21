"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { cartAPI } from "@/services/api";

// Superpower-style marketplace card:
// [category label] · [product image] · [name] · [description] · [price] + [black pill button]
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

  const ctaLabel = product.type === "test" ? "Learn More" : "View Product";

  const content = (
    <>
      {/* Category label */}
      {(product.brand || product.category) && (
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.04em] text-secondary lg:text-xs">
          {product.category || product.brand}
        </p>
      )}

      {/* Product image */}
      <div className="relative mb-5 flex h-[150px] items-center justify-center lg:h-[180px]">
        <Image
          src={product.image || "/assets/preview/product-1.png"}
          alt={product.name || "Product"}
          width={120}
          height={120}
          className="h-full w-auto max-w-[70%] object-contain transition-transform duration-300 group-hover:scale-105"
        />
        {product.onSale && (
          <div className="absolute right-0 top-0 rounded-full bg-black px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
            Sale
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className="font-inter text-[17px] font-semibold leading-snug tracking-[-0.01em] text-blue lg:text-lg">
        {product.name}
      </h3>

      {/* Description */}
      {product.description && (
        <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-secondary lg:text-sm">
          {product.description}
        </p>
      )}
    </>
  );

  // Price + action row, pinned to the bottom of the card.
  const footer = (handler) => (
    <div className="mt-5 flex items-center justify-between gap-3 pt-1">
      <div className="flex items-baseline gap-2">
        <span className="text-[17px] font-semibold text-blue lg:text-lg">${product.price}</span>
        {product.originalPrice && (
          <span className="text-sm text-secondary/70 line-through">${product.originalPrice}</span>
        )}
      </div>
      {handler ? (
        <button
          type="button"
          onClick={handler}
          disabled={adding}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition active:scale-[0.98] ${
            added
              ? "bg-green-600 text-white"
              : "bg-black text-white hover:bg-black/85 disabled:opacity-60"
          }`}
        >
          {added ? "Added" : adding ? "Adding…" : ctaLabel}
          {!added && !adding && <ArrowRight className="h-3.5 w-3.5" />}
        </button>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-black/85">
          {ctaLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      )}
    </div>
  );

  const cardClass =
    "group flex h-full flex-col rounded-3xl border border-borderColor bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,16,19,0.08)] lg:p-6";

  // Cards that link to a product detail page → whole card is a link, CTA is decorative.
  if (product.link) {
    return (
      <Link href={product.link} className="block h-full">
        <div className={`${cardClass} cursor-pointer`}>
          <div className="flex-1">{content}</div>
          {footer(null)}
        </div>
      </Link>
    );
  }

  // Otherwise → add-to-cart action button.
  return (
    <div className={cardClass}>
      <div className="flex-1">{content}</div>
      {footer(handleAdd)}
    </div>
  );
}
