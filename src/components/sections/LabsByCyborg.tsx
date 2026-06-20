import Link from "next/link";
import { Container } from "@/components/Container";

const FEATURES = [
  "80+ blood markers synced with your lifestyle data",
  "18+ high-impact markers, beyond standard tests.",
  "Comprehensive AI clinician's summary",
  "Track health across biomarkers, sleep, and activity",
] as const;

export function LabsByCyborg() {
  return (
    <section className="bg-white py-16 md:py-20">
      <Container>
        <div className="bg-cyborg-labs overflow-hidden rounded-3xl p-8 md:p-12">
          <div className="flex flex-col items-center gap-8 md:flex-row">
            {/* LEFT column */}
            <div className="text-white md:flex-1">
              <h2 className="text-4xl font-semibold leading-[1.03] tracking-[-0.02em] md:text-[60px]">
                Labs by CYBORG
              </h2>
              <p className="mt-4 text-[20px] text-white/90">
                Decoding the language of blood biomarkers
              </p>
              <img
                src="/assets/sm/mobile-image-2.webp"
                alt="Labs by Cyborg app preview"
                className="mt-8 h-auto w-[320px] md:w-[420px]"
              />
            </div>

            {/* RIGHT column — glassy feature card */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-6 text-white backdrop-blur-md md:w-[380px] md:p-8">
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-semibold md:text-[34px]">
                  Labs by CYBORG
                </h3>
                <span className="text-base font-medium text-white/90">
                  Starts at $100
                </span>
              </div>

              <ul className="mt-6 flex flex-col gap-3 text-[15px] text-white/95">
                {FEATURES.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span aria-hidden="true">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-3">
                <Link
                  href="/market-place"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-[#ececec] py-3.5 text-xl font-semibold text-black"
                >
                  Buy Blood Vision
                </Link>
                <Link
                  href="/concierge"
                  className="inline-flex w-full items-center justify-center rounded-2xl border-2 border-white/70 bg-transparent py-3.5 text-xl font-medium text-white"
                >
                  Talk to a specialist
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
