import Image from "next/image";
import Link from "next/link";

export default function CyborgLabsSection() {
  return (
    <section className="bg-white px-5 py-4 md:px-8 lg:py-10">
      <div className="mx-auto w-full max-w-[430px] md:max-w-[820px] lg:max-w-[1320px]">
        <div className="group relative isolate overflow-hidden rounded-[28px] lg:rounded-[36px]">
          {/* Closest existing photo as backdrop — swap for the real lab image later */}
          <Image
            src="/assets/testinomial/test5.png"
            alt=""
            fill
            sizes="(min-width: 1024px) 1320px, (min-width: 768px) 820px, 100vw"
            className="-z-10 object-cover object-center lg:transition-transform lg:duration-700 lg:group-hover:scale-105"
          />
          <div className="-z-10 absolute inset-0 bg-black/45" />

          <div className="flex flex-col items-center justify-center px-6 py-16 text-center text-white md:py-20 lg:min-h-[78vh] lg:py-44">
            <h2 className="text-[clamp(1.9rem,7.5vw,2.6rem)] font-bold tracking-[-0.02em] lg:text-[56px]">
              CYBORG Labs
            </h2>
            <p className="mt-4 max-w-[22ch] text-[clamp(1.05rem,4.4vw,1.35rem)] leading-snug text-white/90 lg:mt-5 lg:max-w-[30ch] lg:text-[22px]">
              Because health is not just human.
            </p>
            <Link
              href="#"
              className="mt-7 inline-flex items-center justify-center rounded-2xl bg-white px-10 py-3.5 text-base font-semibold text-black transition hover:bg-white/90 lg:mt-9 lg:px-12 lg:py-4 lg:text-lg lg:hover:-translate-y-0.5 lg:hover:shadow-2xl"
            >
              Read More
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
