// Amounts are stored in paise (integer). Render as ₹ with up to 2 decimals.
export function formatPaise(paise, currency = "INR") {
  const n = Number(paise);
  const rupees = (Number.isFinite(n) ? n : 0) / 100;
  const symbol = currency === "INR" ? "₹" : "";
  return `${symbol}${rupees.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}
