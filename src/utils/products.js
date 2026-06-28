// Normalize a product name for comparison ("AMINO 9" == "AMINO9 (Essential Amino Acids)").
const norm = (name) => String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const isAmino9 = (name) => norm(name).includes("amino9");

/**
 * Dedupe recommended/protocol products by name and float AMINO 9 (a foundational
 * supplement) to the top. Tolerates either { productName } or { name } items.
 * Defensive on the display side so older plans (which stored duplicates with
 * AMINO 9 appended last) still render a clean, AMINO-9-first list.
 */
export function orderRecommendedProducts(items = []) {
  const seen = new Set();
  const out = [];
  for (const it of items || []) {
    const key = norm(it?.productName || it?.name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  const i = out.findIndex((it) => isAmino9(it?.productName || it?.name));
  if (i > 0) {
    const [a] = out.splice(i, 1);
    out.unshift(a);
  }
  return out;
}
