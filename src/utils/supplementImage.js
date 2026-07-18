// Maps a (possibly AI-generated) supplement/product name to a product photo by
// keyword. The 4 real marketplace SKUs (AMINO 9 / MITO HEART / OZEMPIC / MOUNJARO)
// resolve to the MARKETPLACE's own images so they match everywhere (marketplace,
// protocol, action-plan, invite). All other supplements use the downloaded photos
// under /assets/supplements/. Returns null when nothing matches (the caller then
// falls back to the clean vector bottle). Order matters — specific brand names
// come before generic ingredients.
const SUPPLEMENT_IMAGES = [
  // Real marketplace SKUs → marketplace images (kept in sync with the product seed).
  [["amino 9", "amino9", "amino"], "/assets/preview/product-1.webp"],
  [["mito heart", "mitoheart"], "/assets/preview/product-2.webp"],
  [["ozempic", "semaglutide", "sernaglutide"], "/assets/preview/product-3.webp"],
  [["mounjaro", "tirzepatide"], "/assets/preview/product-4.webp"],

  // AI-generated supplements → downloaded photos.
  [["pro-resolve", "pro resolve"], "/assets/supplements/pro-resolve-omega.webp"],
  [["berberine"], "/assets/supplements/berberine.webp"],
  [["red yeast"], "/assets/supplements/red-yeast-rice.webp"],
  [["magnesium"], "/assets/supplements/magnesium.webp"],
  [["chromium"], "/assets/supplements/chromium.webp"],
  [["methylcobalamin", "cobalamin", "b-12", "b12"], "/assets/supplements/b12.webp"],
  [["b-complex", "b complex", "methylfolate"], "/assets/supplements/b-complex.jpg"],
  [["n-acetyl", "acetyl cysteine", "nac"], "/assets/supplements/nac.webp"],
  [["lion"], "/assets/supplements/lions-mane.webp"],
  [["vitamin d", "vit d", "d3", "k2", "megaquin"], "/assets/supplements/vitamin-d.webp"],
  [["vitamin c", "vit c", "ascorbic"], "/assets/supplements/vitamin-c.jpg"],
  [["zinc"], "/assets/supplements/zinc.webp"],
  [["ferrous", "optiferin", "iron"], "/assets/supplements/iron.jpg"],
  [["omega", "fish oil", "epa", "dha"], "/assets/supplements/omega-3.jpg"],
  [["thyroid"], "/assets/supplements/thyroid.webp"],
  [["glutamine"], "/assets/supplements/l-glutamine.webp"],
  [["ashwagandha"], "/assets/supplements/ashwagandha.webp"],
  [["probiotic"], "/assets/supplements/probiotic.webp"],
  [["coq10", "co-q10", "coenzyme q"], "/assets/supplements/coq10.webp"],
  [["creatine"], "/assets/supplements/creatine.webp"],
];

export function supplementImage(name = "") {
  const n = String(name).toLowerCase();
  for (const [keys, path] of SUPPLEMENT_IMAGES) {
    if (keys.some((k) => n.includes(k))) return path;
  }
  return null;
}
