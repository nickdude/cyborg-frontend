"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { cartAPI } from "@/services/api";
import { formatPaise } from "@/utils/money";

function Row({ label, value, bold }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-gray-900" : "text-gray-600"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default function CartPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await cartAPI.get();
      setCart(res.data);
    } catch (e) {
      setError(e.message || "Failed to load cart");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    load();
  }, [token, load, router]);

  const setQty = async (productId, quantity) => {
    setBusy(true);
    try {
      const res = await cartAPI.updateItem(productId, quantity);
      setCart(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const removeItem = async (productId) => {
    setBusy(true);
    try {
      const res = await cartAPI.removeItem(productId);
      setCart(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-pageBackground pb-24">
      <div className="mx-auto w-full max-w-[1100px] px-4 py-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
          <Link href="/market-place" className="text-sm font-semibold text-primary hover:underline">
            Continue shopping
          </Link>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="mt-10 text-center text-gray-500">Loading cart…</div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-lg font-medium text-gray-700">Your cart is empty</p>
            <p className="mt-1 text-sm text-gray-500">Browse the marketplace to add products.</p>
            <Link href="/market-place" className="mt-5 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-purple-800">
              Go to Marketplace
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
            {/* Items */}
            <div className="space-y-3">
              {cart.items.map((it) => (
                <div key={it.productId} className="flex gap-4 rounded-2xl border border-borderColor bg-white p-4">
                  <div className="relative h-20 w-20 shrink-0 rounded-lg bg-gray-50">
                    {it.image ? (
                      <Image src={it.image} alt={it.name} fill className="object-contain p-2" />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-gray-500">{it.brand}</p>
                        <h3 className="font-semibold text-gray-900">{it.name}</h3>
                      </div>
                      <button
                        onClick={() => removeItem(it.productId)}
                        disabled={busy}
                        className="text-sm text-gray-400 hover:text-red-600"
                        aria-label="Remove"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center rounded-lg border border-borderColor">
                        <button type="button" onClick={() => setQty(it.productId, it.quantity - 1)} disabled={busy || it.quantity <= 1} className="px-3 py-1.5 text-lg leading-none text-gray-600 disabled:opacity-40">−</button>
                        <span className="min-w-[2rem] text-center text-sm font-medium">{it.quantity}</span>
                        <button type="button" onClick={() => setQty(it.productId, it.quantity + 1)} disabled={busy} className="px-3 py-1.5 text-lg leading-none text-gray-600">+</button>
                      </div>
                      <span className="font-semibold text-gray-900">{formatPaise(it.totalPrice, cart.currency)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="rounded-2xl border border-borderColor bg-white p-5 lg:sticky lg:top-6">
              <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
              <div className="mt-4 space-y-2 text-sm">
                <Row label={`Subtotal (${cart.itemCount} items)`} value={formatPaise(cart.subtotal, cart.currency)} />
                {cart.discount > 0 && <Row label="Discount" value={`− ${formatPaise(cart.discount, cart.currency)}`} />}
                <Row label="Tax" value={formatPaise(cart.tax, cart.currency)} />
                <Row label="Shipping" value={cart.shipping ? formatPaise(cart.shipping, cart.currency) : "Free"} />
                <div className="border-t border-borderColor pt-2">
                  <Row label="Total" value={formatPaise(cart.total, cart.currency)} bold />
                </div>
              </div>
              <button
                onClick={() => router.push("/checkout")}
                disabled={busy}
                className="mt-5 w-full rounded-xl bg-black py-3 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-60"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
