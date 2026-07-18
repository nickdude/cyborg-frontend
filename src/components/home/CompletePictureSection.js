import Image from "next/image";

export default function CompletePictureSection() {
  return (
    <section className="bg-white px-5 pb-6 pt-12 text-black md:px-8 md:pt-16 lg:flex lg:min-h-screen lg:items-center lg:py-32">
      <div className="mx-auto w-full max-w-[430px] text-center md:max-w-[820px] lg:grid lg:max-w-[1320px] lg:grid-cols-2 lg:items-center lg:gap-24 lg:text-left">
        <h2 className="mx-auto max-w-[16ch] text-[clamp(1.8rem,7.5vw,3rem)] font-bold leading-[1.08] tracking-[-0.02em] lg:mx-0 lg:max-w-[13ch] lg:text-[56px] lg:leading-[1.04]">
          The most complete picture of your health you&apos;ve ever had
        </h2>

        <div className="mx-auto mt-8 w-full max-w-[330px] md:max-w-[420px] lg:mx-0 lg:mt-0 lg:max-w-[460px] lg:justify-self-end lg:transition-transform lg:duration-500 lg:hover:scale-[1.02]">
          <Image
            src="/assets/preview/sub-main.webp"
            alt="Cyborg health dashboard preview"
            width={1024}
            height={1536}
            sizes="(min-width: 1024px) 460px, (min-width: 768px) 420px, 80vw"
            className="h-auto w-full lg:drop-shadow-[0_30px_60px_rgba(0,0,0,0.18)]"
          />
        </div>
      </div>
    </section>
  );
}
