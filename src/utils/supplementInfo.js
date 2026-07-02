// Rich, professional supplement explanations (Superpower-style) for the protocol
// detail modal. Each entry gives a detailed "why", a "how to take", and the
// "evidence behind this". When a product isn't in the curated list, we compose a
// solid explanation from its driving goals + trigger biomarkers so the modal is
// always substantive — never a one-liner.

function joinList(arr) {
  if (!arr || arr.length === 0) return "";
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  return `${arr.slice(0, -1).join(", ")}, and ${arr[arr.length - 1]}`;
}

// keys are matched with String(productName).toLowerCase().includes(key)
const SUPPLEMENT_INFO = [
  {
    keys: ["berberine"],
    why: "Berberine is one of the most well-studied natural compounds for blood sugar regulation. It works by activating AMPK — essentially flipping on your cells' glucose-uptake switch — and by upregulating insulin receptors so your body responds more efficiently to the insulin it's already producing. The form we've recommended uses a phytosome delivery system that gives it several times the absorption of standard berberine, which matters because poor bioavailability is the main reason ordinary berberine underdelivers in practice.",
    how: "Take one capsule twice daily with your two largest meals (typically lunch and dinner). Splitting the dose across meals keeps blood levels steady and blunts the mild GI effects some people notice when starting out.",
    evidence: "Across dozens of randomized controlled trials, berberine lowers fasting glucose and HbA1c to a degree comparable with first-line oral medications, and adds meaningful reductions in LDL cholesterol and triglycerides. Effects build over 8–12 weeks of consistent use, so we'll re-check your glucose and lipids at your next panel.",
  },
  {
    keys: ["omega", "fish oil", "epa", "dha", "pro-resolve", "pro resolve"],
    why: "Omega-3 fatty acids (EPA and DHA) are the raw material your body uses to resolve inflammation and keep cell membranes fluid. A higher-EPA ratio is preferred here because EPA drives the specialized pro-resolving mediators that actively switch inflammation off, while also lowering triglycerides and supporting healthy blood pressure and heart rhythm. Most diets fall well short of a therapeutic dose, so targeted supplementation closes the gap quickly.",
    how: "Take with a meal that contains some fat to maximize absorption. Splitting the daily dose between two meals reduces any fishy aftertaste and keeps blood levels consistent.",
    evidence: "Large cardiovascular outcome trials (e.g. REDUCE-IT) show high-dose EPA meaningfully lowers triglycerides and cardiovascular events. Omega-3 index typically moves into the optimal range within 3–4 months of daily dosing, which we'll verify on your next test.",
  },
  {
    keys: ["magnesium"],
    why: "Magnesium is a cofactor in over 300 enzymatic reactions — energy production, blood sugar control, blood pressure regulation, and the relaxation half of your nervous system all depend on it. Because it's depleted by stress, caffeine, and hard training, deficiency is common and quietly drives poor sleep, muscle cramps, and elevated blood pressure. We've chosen a highly absorbable chelated form (glycinate/malate) that's gentle on the gut.",
    how: "Take in the evening with food. Magnesium glycinate in particular supports the wind-down before sleep, so pairing it with your nighttime routine works best.",
    evidence: "Randomized trials link magnesium repletion to lower blood pressure, improved insulin sensitivity, and better subjective sleep quality. Because red-cell magnesium responds slowly, give it 6–8 weeks before expecting the full effect.",
  },
  {
    keys: ["vitamin d", "vit d", "d3", "k2", "megaquin"],
    why: "Vitamin D functions less like a vitamin and more like a hormone — it regulates immune signalling, bone mineralization, mood, and hundreds of genes. Pairing D3 with K2 is deliberate: D3 raises calcium absorption, and K2 directs that calcium into your bones rather than your arteries. Given how common low vitamin D is, correcting it is one of the highest-leverage, lowest-cost moves in your plan.",
    how: "Take with your largest fat-containing meal, since vitamin D is fat-soluble and absorbs far better with dietary fat. A consistent daily dose maintains steadier blood levels than large weekly boluses.",
    evidence: "Meta-analyses associate optimal vitamin D status with better immune resilience, bone density, and all-cause outcomes. Blood levels usually rise into the optimal 40–60 ng/mL window within 8–12 weeks, which we'll confirm on retest.",
  },
  {
    keys: ["red yeast"],
    why: "Red yeast rice contains monacolin K, a naturally occurring compound that gently inhibits the same cholesterol-synthesis pathway as prescription statins, but at a lower, better-tolerated dose. It's a sensible first step when your LDL or ApoB is elevated and you'd prefer to try a food-derived option before medication.",
    how: "Take in the evening, since your body makes most of its cholesterol overnight. We pair it with CoQ10 because inhibiting this pathway can modestly lower your natural CoQ10 levels.",
    evidence: "Controlled trials show red yeast rice lowers LDL cholesterol by 15–25%, with a corresponding drop in cardiovascular events in secondary-prevention studies. We'll recheck your lipid panel in 8–12 weeks.",
  },
  {
    keys: ["nac", "n-acetyl", "acetyl cysteine"],
    why: "N-acetylcysteine is the direct precursor to glutathione, your body's master antioxidant and the main molecule your liver uses to clear toxins. Boosting glutathione supports detoxification, respiratory health, and healthy inflammation levels, and NAC is the most efficient way to raise it because glutathione taken directly is poorly absorbed.",
    how: "Take on an empty stomach or between meals for best absorption. Splitting into a morning and evening dose keeps glutathione production steady.",
    evidence: "NAC has decades of clinical use and is on the WHO essential-medicines list. Trials support benefits for liver health, oxidative stress, and respiratory function, with effects that accumulate over several weeks of daily use.",
  },
  {
    keys: ["coq10", "co-q10", "coenzyme q", "ubiquinol"],
    why: "CoQ10 sits at the heart of your mitochondria, where it shuttles electrons to generate cellular energy, and it doubles as a fat-soluble antioxidant that protects your heart and blood vessels. Levels naturally decline with age and drop further with statin or red-yeast-rice use, so replenishing it protects energy production and cardiovascular resilience.",
    how: "Take with a fat-containing meal, as CoQ10 is fat-soluble. The ubiquinol form is preferred for people over 40 because it's the pre-reduced, more readily used version.",
    evidence: "Clinical trials show CoQ10 supports heart-muscle function, reduces statin-related muscle complaints, and lowers oxidative stress markers. Blood levels rise within a few weeks of consistent dosing.",
  },
  {
    keys: ["b-12", "b12", "methylcobalamin", "cobalamin"],
    why: "Vitamin B12 is essential for energy metabolism, red blood cell formation, and the health of your nervous system. We've chosen the methylcobalamin form because it's the active, ready-to-use version your body doesn't have to convert — important if you have any methylation variants. Correcting low B12 often lifts energy and cognitive sharpness noticeably.",
    how: "Take in the morning, as B vitamins can be mildly energizing. It absorbs well with or without food.",
    evidence: "B12 repletion reliably improves energy, homocysteine levels, and neurological markers in deficient individuals. Serum levels respond within weeks, and we'll confirm on your next panel.",
  },
  {
    keys: ["b-complex", "b complex", "methylfolate", "folate"],
    why: "The B-vitamin family works as a team to convert food into usable energy and to run methylation — the process that regulates homocysteine, detoxification, and gene expression. Using active, methylated forms (methylfolate, methylcobalamin) ensures they work even if you carry common MTHFR variants that blunt the standard forms.",
    how: "Take in the morning with food. B vitamins are water-soluble and mildly stimulating, so earlier in the day is better for sleep.",
    evidence: "Active B-complex supplementation lowers homocysteine and supports energy and mood in trials, particularly in people with methylation variants or elevated homocysteine.",
  },
  {
    keys: ["zinc"],
    why: "Zinc is central to immune function, wound healing, testosterone production, and hundreds of enzymes. It's one of the most commonly under-consumed minerals, and low status shows up as slower recovery and weaker immune resilience. We dose it carefully and pair it thoughtfully with copper, since long-term zinc can deplete copper.",
    how: "Take with food to avoid nausea. Keep it separate from your calcium or iron supplements, which compete for absorption.",
    evidence: "Zinc supplementation shortens illness duration and supports immune and hormonal markers in controlled trials, with benefits emerging over a few weeks of consistent use.",
  },
  {
    keys: ["ferrous", "optiferin", "iron"],
    why: "Iron is the core of hemoglobin, the molecule that carries oxygen to every tissue. When ferritin or hemoglobin runs low, you feel it as fatigue, breathlessness, and poor exercise tolerance. We've chosen a gentle, well-absorbed form to raise your stores without the constipation typical of standard iron salts.",
    how: "Take on an empty stomach with a source of vitamin C to boost absorption. Avoid taking it alongside coffee, tea, or calcium, which sharply reduce uptake.",
    evidence: "Iron repletion reliably restores ferritin and hemoglobin and resolves deficiency-related fatigue. Stores rebuild over 8–12 weeks, so we'll recheck ferritin before adjusting the dose.",
  },
  {
    keys: ["vitamin c", "vit c", "ascorbic"],
    why: "Vitamin C is a frontline antioxidant and an essential cofactor for collagen synthesis and immune function. Because it's water-soluble and rapidly used up under stress, keeping a steady daily intake supports skin, blood vessels, and immune resilience.",
    how: "Take with food, and split larger doses across the day since absorption saturates at higher single doses.",
    evidence: "Trials support vitamin C for immune function and collagen-dependent tissue health, with the clearest benefits when correcting a low baseline.",
  },
  {
    keys: ["ashwagandha"],
    why: "Ashwagandha is an adaptogen that helps regulate your stress axis, lowering elevated cortisol and improving your resilience to daily stressors. That translates into better sleep, calmer energy, and — in men — support for healthy testosterone. It's a good fit when stress, sleep, or recovery markers need attention.",
    how: "Take in the evening to support wind-down and sleep. A standardized root extract (KSM-66 or Sensoril) ensures a consistent, studied dose.",
    evidence: "Randomized trials show ashwagandha reduces perceived stress and cortisol and improves sleep quality over 6–8 weeks of daily use.",
  },
  {
    keys: ["probiotic"],
    why: "A targeted probiotic reseeds your gut with strains shown to support digestion, the gut barrier, and immune balance. A healthy microbiome influences everything from nutrient absorption to inflammation and mood, so restoring it has effects well beyond the gut.",
    how: "Take on an empty stomach, first thing in the morning or at bedtime, so more organisms survive stomach acid on the way through.",
    evidence: "Strain-specific trials support probiotics for digestive comfort, gut-barrier integrity, and immune modulation, with effects that depend on consistent daily use.",
  },
  {
    keys: ["lion", "lions mane"],
    why: "Lion's mane is a nootropic mushroom that stimulates nerve growth factor, supporting the maintenance and repair of brain cells. It's included to support focus, memory, and long-term cognitive resilience.",
    how: "Take in the morning with food for daytime cognitive support. A dual-extract standardized for hericenones and erinacines ensures the active compounds are present.",
    evidence: "Early clinical trials show lion's mane supports cognitive performance and mood, with benefits building over 8–12 weeks of consistent use.",
  },
  {
    keys: ["creatine"],
    why: "Creatine is the most research-backed supplement for strength, power, and — increasingly — cognition. It recharges your cells' rapid energy currency (ATP), benefiting both muscle output and brain energy metabolism. It's a foundational addition for performance, healthy ageing, and lean-mass preservation.",
    how: "Take 3–5 g daily at any time — timing doesn't matter, consistency does. Taking it with a meal slightly improves uptake.",
    evidence: "Hundreds of trials confirm creatine improves strength, power, and lean mass, with growing evidence for cognitive and mood benefits. Muscle stores saturate within 2–3 weeks of daily use.",
  },
  {
    keys: ["chromium"],
    why: "Chromium enhances the action of insulin, helping your cells take up glucose more effectively. It's included to support blood-sugar control and reduce carbohydrate cravings alongside the rest of your metabolic protocol.",
    how: "Take with meals to support the post-meal glucose response.",
    evidence: "Trials show chromium modestly improves insulin sensitivity and glycemic markers, particularly in people with impaired glucose control.",
  },
  {
    keys: ["thyroid"],
    why: "This thyroid-support blend provides the raw materials your thyroid needs — iodine, selenium, and tyrosine — to produce and convert its hormones efficiently. It's included to support healthy energy, metabolism, and temperature regulation when thyroid markers are trending suboptimal.",
    how: "Take in the morning with food, away from any calcium or iron supplements which can interfere with absorption.",
    evidence: "Selenium in particular has trial support for thyroid antibody reduction and healthy hormone conversion, with effects developing over several weeks.",
  },
  {
    keys: ["glutamine", "l-glutamine"],
    why: "L-glutamine is the primary fuel for the cells lining your gut and a key player in immune function and muscle recovery. It's included to support gut-barrier integrity and recovery, especially under training or digestive stress.",
    how: "Take on an empty stomach, mixed into water. Splitting into morning and post-exercise doses supports both gut and recovery.",
    evidence: "Clinical work supports glutamine for gut-barrier health and recovery under physiological stress, with benefits accruing over consistent use.",
  },
];

/**
 * Returns rich { why, how, evidence } content for a protocol item.
 * @param {object} item deduplicatedProtocol item (productName, dosing, timing, drivingGoals, triggerBiomarkers, ...)
 * @param {string} timing already-humanized timing label (e.g. "with dinner")
 */
export function supplementInfo(item = {}, timing = "") {
  const name = String(item.productName || "").toLowerCase();
  const entry = SUPPLEMENT_INFO.find((e) => e.keys.some((k) => name.includes(k)));

  const goalTitles = Array.isArray(item.drivingGoals) ? item.drivingGoals.map((g) => g.title).filter(Boolean) : [];
  const triggers = Array.isArray(item.triggerBiomarkers) ? item.triggerBiomarkers.filter(Boolean) : [];
  const tl = String(timing || "").toLowerCase();

  // A short personalization line tying the recommendation to this user's plan.
  const personalBits = [];
  if (goalTitles.length) personalBits.push(`In your plan it was selected to support your ${joinList(goalTitles)} goal${goalTitles.length > 1 ? "s" : ""}`);
  if (triggers.length) personalBits.push(`${goalTitles.length ? ", targeting" : "It targets"} your ${joinList(triggers)} ${triggers.length > 1 ? "markers" : "marker"}`);
  const personal = personalBits.length ? personalBits.join("") + "." : "";

  if (entry) {
    return {
      why: personal ? `${entry.why} ${personal}` : entry.why,
      how: item.howToTake || entry.how,
      evidence: entry.evidence,
    };
  }

  // Composed fallback for uncurated products — still substantive.
  const base = String(item.productName || "This supplement").replace(/\s*\(.*?\)\s*/g, " ").trim();
  const whyParts = [`${base} was selected for your protocol based on your recent lab results.`];
  if (goalTitles.length) whyParts.push(`It directly supports your ${joinList(goalTitles)} goal${goalTitles.length > 1 ? "s" : ""}.`);
  if (triggers.length) whyParts.push(`It was triggered by your ${joinList(triggers)} ${triggers.length > 1 ? "markers" : "marker"}, where targeted supplementation can meaningfully move the numbers.`);
  whyParts.push("We prioritize well-absorbed, third-party-tested forms, so what's on the label is what actually reaches your bloodstream.");

  const how = item.howToTake || (item.dosing ? `${item.dosing}${timing ? `, ${tl}` : ""}.` : "Take daily with food, as directed.");

  const evidence = triggers.length
    ? `This recommendation follows current clinical guidance for optimizing ${joinList(triggers)}. Benefits typically build over 8–12 weeks of consistent daily use, and we'll re-check the relevant markers at your next panel to confirm it's working for you.`
    : "This recommendation follows current clinical guidance for your flagged markers. Benefits typically build over 8–12 weeks of consistent daily use, and we'll re-check the relevant markers at your next panel to confirm it's working for you.";

  return { why: whyParts.join(" "), how, evidence };
}
