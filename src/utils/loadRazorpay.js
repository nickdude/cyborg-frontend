// Lazily load the Razorpay checkout script. Resolves true once available.
export function loadRazorpay() {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector("script[data-razorpay]");
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      return;
    }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.dataset.razorpay = "true";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}
