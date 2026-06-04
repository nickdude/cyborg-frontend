"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { addressAPI, cartAPI, checkoutAPI } from "@/services/api";
import { formatPaise } from "@/utils/money";
import { loadRazorpay } from "@/utils/loadRazorpay";

const EMPTY_ADDRESS = {
  fullName: "", phoneNumber: "", addressLine1: "", addressLine2: "",
  landmark: "", city: "", state: "", country: "India", pincode: "",
};

function AddressForm({ onSave, onCancel, saving }) {
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const field = "w-full rounded-xl border border-borderColor px-3 py-2.5 text-sm focus:border-primary focus:outline-none";
  return (
    <div className="rounded-2xl border border-borderColor bg-gray-50 p-4">
      <div className="grid grid-cols-2 gap-3">
        <input className={field} placeholder="Full name" value={form.fullName} onChange={set("fullName")} />
        <input className={field} placeholder="Phone number" value={form.phoneNumber} onChange={set("phoneNumber")} />
        <input className={`${field} col-span-2`} placeholder="Address line 1" value={form.addressLine1} onChange={set("addressLine1")} />
        <input className={`${field} col-span-2`} placeholder="Address line 2 (optional)" value={form.addressLine2} onChange={set("addressLine2")} />
        <input className={field} placeholder="Landmark (optional)" value={form.landmark} onChange={set("landmark")} />
        <input className={field} placeholder="City" value={form.city} onChange={set("city")} />
        <input className={field} placeholder="State" value={form.state} onChange={set("state")} />
        <input className={field} placeholder="Pincode" value={form.pincode} onChange={set("pincode")} />
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={() => onSave(form)} disabled={saving} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-60">
          {saving ? "Saving…" : "Save address"}
        </button>
        <button onClick={onCancel} className="rounded-xl border border-borderColor px-5 py-2.5 text-sm font-semibold text-gray-600">Cancel</button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [cart, setCart] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [aRes, cRes] = await Promise.all([addressAPI.list(), cartAPI.get()]);
      const addrs = aRes.data || [];
      setAddresses(addrs);
      const def = addrs.find((a) => a.isDefault) || addrs[0];
      setSelectedAddress(def?.id || null);
      setShowForm(addrs.length === 0);
      setCart(cRes.data);
    } catch (e) {
      setError(e.message || "Failed to load checkout");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    load();
  }, [token, load, router]);

  const saveAddress = async (form) => {
    setSaving(true);
    setError("");
    try {
      const res = await addressAPI.create(form);
      const created = res.data;
      setAddresses((prev) => [created, ...prev]);
      setSelectedAddress(created.id);
      setShowForm(false);
    } catch (e) {
      setError(e.message || "Could not save address");
    } finally {
      setSaving(false);
    }
  };

  const placeOrder = async () => {
    if (!selectedAddress) { setError("Please select a delivery address"); return; }
    setPlacing(true);
    setError("");
    try {
      const res = await checkoutAPI.create({ addressId: selectedAddress, paymentMethod });
      const { order, payment } = res.data;

      if (paymentMethod === "cod" || payment?.method === "cod") {
        router.push(`/orders/${order.id}?placed=1`);
        return;
      }

      // Online → Razorpay
      const ok = await loadRazorpay();
      if (!ok || !window.Razorpay) { setError("Payment gateway failed to load. Please retry."); setPlacing(false); return; }

      const rzp = new window.Razorpay({
        key: payment.key_id,
        amount: payment.amount,
        currency: payment.currency,
        order_id: payment.gatewayOrderId,
        name: "Cyborg Healthcare",
        description: `Order ${order.orderNumber}`,
        prefill: { email: user?.email, contact: user?.phone },
        theme: { color: "#541D7A" },
        handler: async (resp) => {
          try {
            await checkoutAPI.verify({
              orderId: order.id,
              transactionId: resp.razorpay_payment_id,
              signature: resp.razorpay_signature,
            });
            router.push(`/orders/${order.id}?placed=1`);
          } catch (e) {
            router.push(`/orders/${order.id}?failed=1`);
          }
        },
        modal: { ondismiss: () => setPlacing(false) },
      });
      rzp.open();
    } catch (e) {
      setError(e.message || "Could not place order");
      setPlacing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-pageBackground flex items-center justify-center text-gray-500">Loading checkout…</div>;
  }

  if (cart && cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-pageBackground flex flex-col items-center justify-center px-4 text-center">
        <p className="text-lg font-medium text-gray-700">Your cart is empty</p>
        <Link href="/market-place" className="mt-4 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white">Go to Marketplace</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pageBackground pb-24">
      <div className="mx-auto w-full max-w-[1100px] px-4 py-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="space-y-6">
            {/* Address selection */}
            <section className="rounded-2xl border border-borderColor bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Delivery Address</h2>
                {!showForm && (
                  <button onClick={() => setShowForm(true)} className="text-sm font-semibold text-primary hover:underline">+ Add new</button>
                )}
              </div>

              <div className="mt-4 space-y-3">
                {addresses.map((a) => (
                  <label key={a.id} className={`flex cursor-pointer gap-3 rounded-xl border p-4 ${selectedAddress === a.id ? "border-primary bg-primary/5" : "border-borderColor"}`}>
                    <input type="radio" name="address" checked={selectedAddress === a.id} onChange={() => setSelectedAddress(a.id)} className="mt-1" />
                    <div className="text-sm">
                      <p className="font-semibold text-gray-900">{a.fullName} · {a.phoneNumber} {a.isDefault && <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Default</span>}</p>
                      <p className="text-gray-600">{a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ""}{a.landmark ? `, ${a.landmark}` : ""}</p>
                      <p className="text-gray-600">{a.city}, {a.state} {a.pincode}, {a.country}</p>
                    </div>
                  </label>
                ))}
              </div>

              {showForm && (
                <div className="mt-3">
                  <AddressForm onSave={saveAddress} onCancel={() => setShowForm(false)} saving={saving} />
                </div>
              )}
            </section>

            {/* Payment method */}
            <section className="rounded-2xl border border-borderColor bg-white p-5">
              <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
              <div className="mt-4 space-y-3">
                <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${paymentMethod === "online" ? "border-primary bg-primary/5" : "border-borderColor"}`}>
                  <input type="radio" name="pay" checked={paymentMethod === "online"} onChange={() => setPaymentMethod("online")} />
                  <div>
                    <p className="font-semibold text-gray-900">Pay Online</p>
                    <p className="text-sm text-gray-500">Card, UPI, Netbanking via Razorpay</p>
                  </div>
                </label>
                <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-borderColor"}`}>
                  <input type="radio" name="pay" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} />
                  <div>
                    <p className="font-semibold text-gray-900">Cash on Delivery</p>
                    <p className="text-sm text-gray-500">Pay with cash when your order arrives</p>
                  </div>
                </label>
              </div>
            </section>
          </div>

          {/* Order summary */}
          <div className="rounded-2xl border border-borderColor bg-white p-5 lg:sticky lg:top-6">
            <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              {cart?.items.map((it) => (
                <div key={it.productId} className="flex justify-between text-gray-600">
                  <span className="truncate pr-2">{it.name} × {it.quantity}</span>
                  <span>{formatPaise(it.totalPrice, cart.currency)}</span>
                </div>
              ))}
              <div className="mt-2 border-t border-borderColor pt-2 space-y-2">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatPaise(cart?.subtotal, cart?.currency)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Tax</span><span>{formatPaise(cart?.tax, cart?.currency)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{cart?.shipping ? formatPaise(cart.shipping, cart.currency) : "Free"}</span></div>
                <div className="flex justify-between border-t border-borderColor pt-2 font-semibold text-gray-900"><span>Total</span><span>{formatPaise(cart?.total, cart?.currency)}</span></div>
              </div>
            </div>
            <button
              onClick={placeOrder}
              disabled={placing || !selectedAddress}
              className="mt-5 w-full rounded-xl bg-black py-3 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-60"
            >
              {placing ? "Placing order…" : paymentMethod === "cod" ? "Place Order (COD)" : `Pay ${formatPaise(cart?.total, cart?.currency)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
