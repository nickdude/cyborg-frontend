import { Container } from "@/components/Container";
import { cn } from "@/lib/utils";

const MACROS = [
  { value: "100", label: "Calories" },
  { value: "10g", label: "Protein" },
  { value: "7g", label: "Fat" },
  { value: "0g", label: "Carbs" },
] as const;

const NUDGE_BODY =
  "Avoid bright light exposure and intense activity during this window to wake up with healthy energy levels. Good time to start winding down.";

/** Small gray circular "i" info button shown at the top-right of nudge cards. */
function InfoButton() {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/40 text-xs font-medium text-white">
      i
    </span>
  );
}

/** Circular check icon (inline SVG) used in the reminder cards. */
function CheckCircle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("h-6 w-6 shrink-0", className)}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 12.5l2.5 2.5L16 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A single macro stat column (big number above a small gray label). */
function MacroStat({
  value,
  label,
  faded,
}: {
  value: string;
  label: string;
  faded?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <span
        className={cn(
          "font-semibold text-black",
          faded ? "text-2xl" : "text-2xl md:text-3xl",
        )}
      >
        {value}
      </span>
      <span className="mt-1 text-xs text-black/50">{label}</span>
    </div>
  );
}

/** "The only nudges you will ever need" — heading left, notification card stack right. */
export function Nudges() {
  return (
    <section className="bg-[#ececec] py-20 md:py-24">
      <Container>
        <div className="flex flex-col items-center gap-12 md:flex-row">
          {/* Left column */}
          <div className="w-full md:w-[40%]">
            {/* Nudge preview — photo with heading + notification overlays */}
            <div className="relative mb-8 w-full max-w-[320px] overflow-hidden rounded-[28px] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.35)]">
              <img
                src="/assets/nudge/nudge_image.png"
                alt=""
                width={320}
                height={380}
                className="block h-auto w-full select-none"
                draggable={false}
              />

              {/* top scrim for legibility */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-black/45 via-black/15 to-transparent"
              />

              {/* heading — fades from solid white to translucent */}
              <h3 className="absolute inset-x-0 top-0 bg-gradient-to-b from-white via-white/75 to-white/25 bg-clip-text px-5 pt-5 text-[22px] font-semibold leading-[1.16] tracking-[-0.02em] text-transparent">
                Real-time nudges that turn your wearable and CGM into your next move
              </h3>

              {/* notification card */}
              <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-black/55 p-3 ring-1 ring-white/10 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                    <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden="true">
                      <path
                        d="M6 12.5l3.5 3.5L18 7.5"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="text-[13px] font-semibold text-white">Peak performance</span>
                  <span className="text-[13px] text-white/55">· 10:32 AM</span>
                </div>
                <div className="my-2 h-px bg-white/15" />
                <p className="text-[11.5px] leading-snug text-white/75">
                  You have unlocked your best Sleep Index (93) to date. Good time to
                  reflect on what led to this.
                </p>
              </div>
            </div>

            <h2 className="max-w-[440px] text-4xl font-semibold leading-[1.06] tracking-[-0.03em] text-black md:text-[52px]">
              The only nudges you will ever need
            </h2>
            <p className="mt-6 max-w-[420px] text-[18px] leading-relaxed text-black/60">
              Personalized nudges for a healthier you. Get tailor-made insights
              and alerts to help you make better choices in real time.
            </p>
          </div>

          {/* Right column — notification card stack */}
          <div className="flex w-full flex-col gap-4 md:flex-1">
            {/* Card 1 — faded */}
            <div className="rounded-2xl bg-white p-5 opacity-40">
              <div className="flex items-center gap-3">
                <span className="h-8 w-8 shrink-0 rounded-lg bg-black/10" />
                <span className="truncate font-semibold text-black">
                  Beef stick, zero sugar, jalapeno, medi...
                </span>
              </div>
              <div className="mt-4 grid grid-cols-4">
                {MACROS.map((m) => (
                  <MacroStat key={m.label} value={m.value} label={m.label} faded />
                ))}
              </div>
            </div>

            {/* Card 2 — full white */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/5 text-base">
                  🌯
                </span>
                <span className="truncate font-semibold text-black">
                  Beef stick, zero sugar, jalapeno, ...
                </span>
              </div>
              <div className="mt-4 grid grid-cols-4 divide-x divide-black/5">
                {MACROS.map((m) => (
                  <MacroStat key={m.label} value={m.value} label={m.label} />
                ))}
              </div>
            </div>

            {/* Card 3 — green reminder */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-500" />
                <h3 className="flex-1 font-semibold leading-snug text-black">
                  7:02 PM • Phase delay window starting soon
                </h3>
                <InfoButton />
              </div>
              <p className="mt-3 text-sm text-black/50">{NUDGE_BODY}</p>
            </div>

            {/* Card 4 — amber reminder */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-amber-500" />
                <h3 className="flex-1 font-semibold leading-snug text-black">
                  You can still do it
                </h3>
                <InfoButton />
              </div>
              <p className="mt-3 text-sm text-black/50">{NUDGE_BODY}</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
