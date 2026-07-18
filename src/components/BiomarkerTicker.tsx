const MARKERS = [
  "ApoB",
  "HbA1c",
  "hs-CRP",
  "Lp(a)",
  "Testosterone",
  "Cortisol",
  "TSH",
  "Vitamin D",
  "Ferritin",
  "HDL-C",
  "eGFR",
  "Insulin",
  "HOMA-IR",
  "ALT",
];

// Margins (not flex gap) so both copies are pixel-identical — the -50% loop
// depends on the two halves measuring exactly the same.
function TickerRow({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div aria-hidden={ariaHidden || undefined} className="flex items-center">
      {MARKERS.map((name) => (
        <span
          key={name}
          className="mr-10 text-[13px] font-medium uppercase tracking-[0.18em] text-white/45"
        >
          {name}
          <span className="ml-10 text-cyborg-purple-light/70">·</span>
        </span>
      ))}
    </div>
  );
}

/**
 * Slow infinite marquee of biomarker names at the hero → products seam.
 * Pure CSS (`animate-ticker` in tailwind.config.js); pauses on hover, and the
 * global reduced-motion rule freezes it to a static row.
 */
export function BiomarkerTicker() {
  return (
    <section
      aria-label="Biomarkers we test"
      className="overflow-hidden border-y border-white/10 bg-cyborg-ink py-4"
    >
      <div className="flex w-max animate-ticker whitespace-nowrap hover:[animation-play-state:paused]">
        <TickerRow />
        <TickerRow ariaHidden />
      </div>
    </section>
  );
}
