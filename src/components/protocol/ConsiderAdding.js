"use client";

import Link from "next/link";
import { supplementImage } from "@/utils/supplementImage";

// Diagnostic-test name → panel image (supplementImage only covers supplements).
const TEST_IMAGES = [
  [["lipid", "cholesterol", "apob", "ldl", "hdl"], "/assets/tests/heart-vascular.png"],
  [["crp", "homocysteine", "inflamm"], "/assets/tests/inflammation.png"],
  [["hba1c", "glucose", "insulin", "metabolic"], "/assets/tests/metabolic-health.png"],
  [["thyroid", "tsh", "t3", "t4"], "/assets/tests/thyroid-health.png"],
  [["vitamin", "ferritin", "iron", "nutrient", "b12"], "/assets/tests/nutrient.png"],
  [["liver", "alt", "ast"], "/assets/tests/liver-health.png"],
  [["kidney", "egfr", "creatinine"], "/assets/tests/kidney.png"],
];

function testImage(name) {
  const n = String(name || "").toLowerCase();
  for (const [keys, path] of TEST_IMAGES) {
    if (keys.some((k) => n.includes(k))) return path;
  }
  return "/assets/tests/metabolic-health.png";
}

const FALLBACK = "/assets/preview/product-1.webp";

// "Consider adding" — recommended supplements + diagnostic tests from the action
// plan, shown as display-only cards that link to the marketplace.
function toCard(item, kind) {
  const name = item.productName || item.name;
  if (!name) return null;
  return {
    kind,
    label: kind === "test" ? "Testing" : "Supplement",
    name,
    image: kind === "test" ? testImage(name) : supplementImage(name) || FALLBACK,
    blurb: item.whatItIs || item.whyTestIt || item.dose || item.dosing || "",
  };
}

export default function ConsiderAdding({ plan }) {
  const recs = (plan?.nextSteps?.recommendedProducts || []).map((i) => toCard(i, "supplement"));
  const tests = (plan?.protocol?.diagnosticTests || []).map((i) => toCard(i, "test"));

  const seen = new Set();
  const cards = [...recs, ...tests]
    .filter((c) => {
      if (!c) return false;
      const key = `${c.kind}:${c.name.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 2); // show at most two recommendations

  if (!cards.length) return null;

  return (
    <section>
      <h2 className="mb-stack-md font-title-md text-title-md text-on-surface">Consider adding</h2>
      <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2">
        {cards.map((c, i) => (
          <Link
            key={i}
            href="/market-place"
            className="group relative flex h-full flex-col overflow-hidden rounded-xl bg-surface-container-lowest p-5 custom-shadow transition-shadow hover:shadow-md"
          >
            <div className="mb-4">
              <span className="mb-2 block font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant">{c.label}</span>
              <h4 className="font-title-md text-title-md leading-tight text-on-surface">{c.name}</h4>
            </div>
            <div className="mt-auto flex justify-center pt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.image}
                alt=""
                className="h-28 w-28 object-contain"
                onError={(e) => (e.currentTarget.style.visibility = "hidden")}
              />
            </div>
            <span
              aria-hidden="true"
              className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-lg transition-transform hover:scale-110 active:scale-95"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
