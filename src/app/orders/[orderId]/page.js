"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { orderAPI, checkoutAPI } from "@/services/api";
import { formatPaise } from "@/utils/money";
import { loadRazorpay } from "@/utils/loadRazorpay";

const CANCELLABLE = ["Pending", "Confirmed", "Processing"];

function fmtDateTime(d) {
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token, user } = useAuth();

  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const placed = searchParams.get("placed") === "1";
  const failed = searchParams.get("failed") === "1";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [oRes, tRes] = await Promise.all([orderAPI.get(orderId), orderAPI.tracking(orderId)]);
      setOrder(oRes.data.order);
      setPayment(oRes.data.payment);
      setTracking(tRes.data);
    } catch (e) {
      setError(e.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    load();
  }, [token, load, router]);

  const cancel = async () => {
    setBusy(true);
    try {
      await orderAPI.cancel(orderId, "Cancelled by customer");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const retry = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await checkoutAPI.retry(orderId);
      const p = res.data.payment;
      const ok = await loadRazorpay();
      if (!ok || !window.Razorpay) { setError("Payment gateway failed to load."); setBusy(false); return; }
      const rzp = new window.Razorpay({
        key: p.key_id, amount: p.amount, currency: p.currency, order_id: p.gatewayOrderId,
        name: "Cyborg Healthcare", description: `Order ${order.orderNumber}`,
        prefill: { email: user?.email, contact: user?.phone }, theme: { color: "#541D7A" },
        handler: async (resp) => {
          try {
            await checkoutAPI.verify({ orderId, transactionId: resp.razorpay_payment_id, signature: resp.razorpay_signature });
            await load();
          } catch (e) { setError("Payment verification failed."); }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-pageBackground flex items-center justify-center text-gray-500">Loading order…</div>;
  if (error && !order) return (
    <div className="min-h-screen bg-pageBackground flex flex-col items-center justify-center px-4 text-center">
      <p className="text-gray-700">{error}</p>
      <Link href="/orders" className="mt-4 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white">Back to orders</Link>
    </div>
  );
  if (!order) return null;

  const a = order.shippingAddress || {};
  const canCancel = CANCELLABLE.includes(order.orderStatus);
  const canRetry = payment && payment.gateway !== "cod" && order.paymentStatus !== "success" && order.orderStatus !== "Cancelled";

  return (
    <div className="min-h-screen bg-pageBackground pb-24">
      <div className="mx-auto w-full max-w-[800px] px-4 py-6 lg:px-8">
        <Link href="/orders" className="text-sm font-semibold text-primary hover:underline">← Back to my purchases</Link>

        {placed && order.paymentStatus !== "failed" && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            🎉 Order placed successfully! {payment?.gateway === "cod" ? "Pay with cash on delivery." : "Payment received."}
          </div>
        )}
        {(failed || order.paymentStatus === "failed") && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Payment didn’t go through. You can retry below.
          </div>
        )}
        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{order.orderNumber}</h1>
            <p className="text-sm text-gray-500">Payment: {order.paymentStatus} · {payment?.gateway === "cod" ? "Cash on Delivery" : "Online"}</p>
          </div>
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-primary">{order.orderStatus}</span>
        </div>

        {/* Tracking timeline */}
        <section className="mt-6 rounded-2xl border border-borderColor bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900">Order Tracking</h2>
          <ol className="mt-4 space-y-4">
            {(tracking?.timeline || []).map((t, i) => (
              <li key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="h-3 w-3 rounded-full bg-primary" />
                  {i < tracking.timeline.length - 1 && <span className="mt-1 h-full w-px flex-1 bg-borderColor" />}
                </div>
                <div className="pb-2">
                  <p className="font-medium text-gray-900">{t.status}</p>
                  {t.note && <p className="text-sm text-gray-500">{t.note}</p>}
                  <p className="text-xs text-gray-400">{fmtDateTime(t.createdAt)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Items */}
        <section className="mt-4 rounded-2xl border border-borderColor bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900">Items</h2>
          <div className="mt-3 space-y-2">
            {order.items.map((it, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-700">{it.productName} × {it.quantity}</span>
                <span className="font-medium text-gray-900">{formatPaise(it.totalPrice, order.currency)}</span>
              </div>
            ))}
            <div className="mt-2 border-t border-borderColor pt-2 space-y-1 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatPaise(order.subtotal, order.currency)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Tax</span><span>{formatPaise(order.tax, order.currency)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{order.shipping ? formatPaise(order.shipping, order.currency) : "Free"}</span></div>
              <div className="flex justify-between border-t border-borderColor pt-1 font-semibold text-gray-900"><span>Total</span><span>{formatPaise(order.totalAmount, order.currency)}</span></div>
            </div>
          </div>
        </section>

        {/* Delivery address */}
        <section className="mt-4 rounded-2xl border border-borderColor bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900">Delivery Address</h2>
          <p className="mt-2 text-sm font-medium text-gray-900">{a.fullName} · {a.phoneNumber}</p>
          <p className="text-sm text-gray-600">{a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ""}{a.landmark ? `, ${a.landmark}` : ""}</p>
          <p className="text-sm text-gray-600">{a.city}, {a.state} {a.pincode}, {a.country}</p>
        </section>

        {(canCancel || canRetry) && (
          <div className="mt-4 flex gap-3">
            {canRetry && (
              <button onClick={retry} disabled={busy} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-60">
                Retry payment
              </button>
            )}
            {canCancel && (
              <button onClick={cancel} disabled={busy} className="rounded-xl border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">
                Cancel order
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
