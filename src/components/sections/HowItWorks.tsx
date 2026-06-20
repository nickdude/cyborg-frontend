import { Container } from "@/components/Container";

type Step = {
  number: number;
  image: string;
  title: string;
  body: string;
};

const steps: Step[] = [
  {
    number: 1,
    image: "/assets/1.jpg",
    title: "Test your whole body",
    body: "Get a comprehensive blood draw at one of our 2,000+ partner labs or from the comfort of your own home.",
  },
  {
    number: 2,
    image: "/assets/2.jpg",
    title: "An actionable plan",
    body: "Easy to understand results and a clear health plan with tailored recommendations on diet, lifestyle changes & supplements.",
  },
  {
    number: 3,
    image: "/assets/3.jpg",
    title: "A connected ecosystem",
    body: "You can book additional diagnostics, buy curated supplements with members-only discount in your Cyborg dashboard.",
  },
];

/** "How it works" — three numbered steps, each with a landscape image and copy. */
export function HowItWorks() {
  return (
    <section className="bg-[#ececec] py-20 md:py-24">
      <Container>
        <h2 className="mb-16 text-center text-4xl font-semibold tracking-[-0.02em] text-[#0f0f13] md:text-[64px]">
          How it works
        </h2>

        <div className="mx-auto flex max-w-[920px] flex-col gap-12 md:gap-16">
          {steps.map((step) => (
            <div
              key={step.number}
              className="flex flex-col items-center gap-8 md:flex-row"
            >
              <img
                src={step.image}
                alt={step.title}
                className="h-[280px] w-full shrink-0 rounded-2xl object-cover md:w-[480px]"
              />

              <div className="flex-1">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#5b2487] text-sm font-semibold text-white">
                  {step.number}
                </span>
                <h3 className="mt-4 text-2xl font-semibold leading-tight text-[#0f0f13] md:text-[34px]">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-[360px] text-[17px] leading-relaxed text-black/55">
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
