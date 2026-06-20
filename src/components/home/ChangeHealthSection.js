import Link from "next/link";

export default function ChangeHealthSection() {
  return (
    <section className="bg-white px-5 pb-10 pt-4 md:px-8 lg:pb-24 lg:pt-10">
      <div className="mx-auto w-full max-w-[430px] md:max-w-[820px] lg:max-w-[1320px]">
        {/* Brand-purple radial as a stand-in for the globe artwork */}
        <div className="relative isolate overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_50%_35%,#8b5cf6_0%,#5b21b6_45%,#330a63_100%)] lg:rounded-[36px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.18),transparent_60%)]" />
          <div className="relative flex flex-col items-center justify-center px-6 py-20 text-center text-white md:py-24 lg:min-h-[78vh] lg:py-44">
            <h2 className="max-w-[14ch] text-[clamp(2rem,8vw,2.8rem)] font-bold leading-[1.08] tracking-[-0.02em] lg:text-[60px] lg:leading-[1.03]">
              Change your health for good.
            </h2>
            <p className="mt-4 max-w-[22ch] text-[clamp(1.05rem,4.4vw,1.35rem)] leading-snug text-white/90 lg:mt-5 lg:max-w-[30ch] lg:text-[22px]">
              Feel lasting results in one week
            </p>
            <Link
              href="/market-place"
              className="mt-7 inline-flex items-center justify-center rounded-2xl bg-white px-10 py-3.5 text-base font-semibold text-black transition hover:bg-white/90 lg:mt-9 lg:px-12 lg:py-4 lg:text-lg lg:hover:-translate-y-0.5 lg:hover:shadow-2xl"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
