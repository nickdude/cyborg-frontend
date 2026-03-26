const HOW_IT_WORKS_STEPS = [
  {
    id: 1,
    title: "Test your whole body",
    description:
      "Get a comprehensive blood draw at one of our 2,000+ partner labs or from the comfort of your own home.",
    image: "/assets/preview/1.jpg",
    imageAlt: "Blood draw at home by a clinician",
  },
  {
    id: 2,
    title: "An actionable plan",
    description:
      "Easy to understand results and a clear health plan with tailored recommendations on diet, lifestyle changes & supplements.",
    image: "/assets/preview/2.jpg",
    imageAlt: "Actionable biomarker plan in the Cyborg app",
  },
  {
    id: 3,
    title: "A connected ecosystem",
    description:
      "You can book additional diagnostics, buy curated supplements with members-only discount in your Cyborg dashboard.",
    image: "/assets/preview/3.jpg",
    imageAlt: "Connected ecosystem with wearable and supplement suggestions",
  },
];

function HowItWorksStep({ step, isLast }) {
  return (
    <article className="relative pl-12 md:pl-14 lg:pl-16">
      {!isLast && (
        <span
          className="absolute left-[16px] top-12 h-[calc(100%-2.6rem)] w-px bg-[#d2d2d8] md:left-[18px] lg:left-[20px] lg:top-14 lg:h-[calc(100%-3.2rem)]"
          aria-hidden="true"
        />
      )}

      <span className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#5B2487] text-base font-semibold leading-none text-white md:h-9 md:w-9 md:text-lg lg:h-10 lg:w-10 lg:text-xl">
        {step.id}
      </span>

      <div className="lg:grid lg:grid-cols-[minmax(320px,540px)_1fr] lg:items-start lg:gap-10">
        <img
          src={step.image}
          alt={step.imageAlt}
          className="h-[152px] w-full rounded-3xl object-cover sm:h-[186px] md:h-[220px] lg:h-[248px]"
        />

        <div>
          <h3 className="mt-4 text-[clamp(1.65rem,4.7vw,2.05rem)] font-semibold leading-[1.1] text-[#0f0f13] lg:mt-1 lg:text-[clamp(2rem,2.4vw,2.6rem)]">
            {step.title}
          </h3>
          <p className="mt-3 max-w-[52ch] text-[clamp(1.2rem,3.9vw,1.5rem)] leading-[1.36] text-[#111216] lg:text-[clamp(1.1rem,1.5vw,1.45rem)]">
            {step.description}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function HowItWorksSection() {
  return (
    <section className="bg-[#ECECEC] px-5 pb-16 pt-14 text-black md:px-8 md:pb-24 md:pt-20 lg:pb-28 lg:pt-24">
      <div className="mx-auto w-full max-w-[430px] md:max-w-[860px] lg:max-w-[1180px]">
        <h2 className="text-center text-[clamp(2.2rem,8vw,3.8rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-[#0f0f13]">
          How it works
        </h2>

        <div className="mt-8 space-y-12 md:mt-12 md:space-y-16 lg:mt-14 lg:space-y-20">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <HowItWorksStep key={step.id} step={step} isLast={index === HOW_IT_WORKS_STEPS.length - 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
