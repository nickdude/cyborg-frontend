import { Container } from "@/components/Container";

const PILLS: readonly string[] = [
  "Ultra-Processed Diet",
  "Chronic Stress",
  "Poor Sleep",
  "Sedentary Lifestyle",
  "Insulin Resistance",
  "Visceral Fat",
  "Gut Dysbiosis",
  "Chronic Inflammation",
  "Endocrine Disruptors",
  "Yo-Yo Dieting",
  "Alcohol",
  "Excess Sugar",
  "Hormonal Decline",
  "Mitochondrial Dysfunction",
  "Sarcopenia",
  "Hyperglycemia",
];

export function MetabolicQuote() {
  return (
    <section className="bg-white py-10 md:py-12">
      <Container>
        <div className="relative flex min-h-[560px] w-full flex-col items-center overflow-hidden rounded-3xl md:min-h-[620px]">
          <img
            src="/assets/sm/test1.webp"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/45" />

          <div className="relative z-10 flex w-full flex-col items-center px-6 pt-10 text-center md:px-12 md:pt-14">
            <p className="max-w-[900px] text-base font-medium leading-relaxed text-white md:text-lg">
              {"“Day-to-day life silently disrupts your metabolic signaling — blunting your body’s critical appetite and energy regulator, GLP-1.”"}
            </p>

            <div className="mt-6 flex max-w-[920px] flex-wrap justify-center gap-2.5">
              {PILLS.map((pill) => (
                <span
                  key={pill}
                  className="rounded-full border border-white/40 bg-white/5 px-4 py-2 text-xs text-white backdrop-blur-sm md:text-sm"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
