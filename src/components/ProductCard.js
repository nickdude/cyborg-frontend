"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, Minus } from "lucide-react";
import { cartAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

// Superpower-style marketplace card:
// [category label] · [product image] · [name] · [description] · [price] + quantity stepper.
// First click adds it to the cart (qty 1); each tap of + / − updates the cart quantity.
export default function ProductCard({ product, onAdded }) {
  const router = useRouter();
  const { token } = useAuth();
  const [qty, setQty] = useState(0);
  const [busy, setBusy] = useState(false);

  const changeQty = async (next) => {
    if (busy || next < 0) return;
    if (!token) {
      // Browsing is public; acting on the cart requires an account.
      router.push("/login");
      return;
    }
    const prev = qty;
    setBusy(true);
    setQty(next); // optimistic
    try {
      if (prev === 0 && next > 0) {
        await cartAPI.addItem(product.id, next);
      } else if (next === 0) {
        await cartAPI.removeItem(product.id);
      } else {
        await cartAPI.updateItem(product.id, next);
      }
      onAdded?.();
    } catch (err) {
      setQty(prev); // revert on failure
      const msg = String(err?.message || "").toLowerCase();
      if (msg.includes("token") || msg.includes("unauth") || err?.message === "Request failed") {
        router.push("/login");
      }
    } finally {
      setBusy(false);
    }
  };

  const cardClass =
    "group flex h-full flex-col rounded-3xl border border-borderColor bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,16,19,0.08)] lg:p-6";

  return (
    <div className={cardClass}>
      <div className="flex-1">
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
      </div>

      {/* Price + quantity stepper, pinned to the bottom of the card. */}
      <div className="mt-5 flex items-center justify-between gap-3 pt-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[17px] font-semibold text-blue lg:text-lg">₹{Number(product.price).toLocaleString("en-IN")}</span>
          {product.originalPrice && (
            <span className="text-sm text-secondary/70 line-through">₹{Number(product.originalPrice).toLocaleString("en-IN")}</span>
          )}
        </div>

        {qty === 0 ? (
          <button
            type="button"
            onClick={() => changeQty(1)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/85 active:scale-[0.98] disabled:opacity-60"
          >
            <Plus className="h-4 w-4" strokeWidth={2.4} />
            Add
          </button>
        ) : (
          <div className="inline-flex items-center gap-2.5 rounded-full bg-black px-2 py-1.5 text-white">
            <button
              type="button"
              onClick={() => changeQty(qty - 1)}
              disabled={busy}
              aria-label="Decrease quantity"
              className="grid h-7 w-7 place-items-center rounded-full transition hover:bg-white/15 active:scale-95 disabled:opacity-50"
            >
              <Minus className="h-4 w-4" strokeWidth={2.4} />
            </button>
            <span className="min-w-[1.25rem] text-center text-sm font-semibold tabular-nums">{qty}</span>
            <button
              type="button"
              onClick={() => changeQty(qty + 1)}
              disabled={busy}
              aria-label="Increase quantity"
              className="grid h-7 w-7 place-items-center rounded-full transition hover:bg-white/15 active:scale-95 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" strokeWidth={2.4} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
