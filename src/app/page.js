"use client";

import Link from "next/link";
import Button from "@/components/Button";
import HeroSection from "@/components/home/HeroSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import MedicalProfessionalsSection from "@/components/home/MedicalProfessionalsSection";
import MembershipSection from "@/components/home/MembershipSection";
import MembershipPlanSection from "@/components/home/MembershipPlanSection";
import AllInOneImageSwitcher from "@/components/home/AllInOneImageSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { token, loading } = useAuth();
  const router = useRouter();
  const featuredProducts = [
    {
      name: "Amino 9",
      image: "/assets/preview/product-1.png",
    },
    {
      name: "Mito Heart",
      image: "/assets/preview/product-2.png",
    },
    {
      name: "Ozempic",
      image: "/assets/preview/product-3.png",
    },
    {
      name: "Mounjaro",
      image: "/assets/preview/product-4.png",
    },
  ];
  const allInOneImages = [
    { src: "/assets/all-in-one/1.png" },
    { src: "/assets/all-in-one/2.png" },
    { src: "/assets/all-in-one/3.png" },
    { src: "/assets/all-in-one/4.png" },
  ];

  useEffect(() => {
    if (!loading && token) {
      router.push("/dashboard");
    }
  }, [token, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold">Loading...</div>
      </div>
    );
  }

  return (
    <main className="overflow-x-hidden bg-black">
      <HeroSection />

      <section className="bg-[#5B2487] px-5 pb-14 pt-12 text-white md:px-8 md:pb-20 md:pt-16">
        <div className="mx-auto w-full max-w-[430px] md:max-w-[980px]">
          <h2 className="md:max-w-[40ch] text-[24px] font-bold leading-[1.1] tracking-[-0.02em]">
            Whole body health starts with the right signal.
          </h2>

          <p className="mt-7 md:max-w-[40ch] leading-[1.35] text-white/95 ">
            Formulations that provide fast-acting and sustained support using scientifically and clinically studied ingredients.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3 md:mt-12 md:gap-5">
            {featuredProducts.map((product) => (
              <article
                key={product.name}
                className="rounded-[24px] bg-[#9C7DB9] px-4 pb-4 pt-4 text-center md:px-6 md:pb-5 md:pt-5"
              >
                <div className="inline-flex rounded-xl bg-[#5B2487] px-3 py-1.5 text-[clamp(0.9rem,2.2vw,1rem)] font-medium leading-none text-white">
                  Best Seller
                </div>

                <h3 className="mt-2 text-left  font-semibold leading-[1.1] text-white">
                  {product.name}
                </h3>

                <img
                  src={product.image}
                  alt={product.name}
                  className="mx-auto  h-[120px] w-auto object-contain md:h-[250px]"
                />

                <Button
                  href="/login"
                  variant="secondary"
                  className="mt-3  w-full rounded-2xl border-none bg-[#ECECEC] py-3 font-semibold text-[#101010] shadow-none hover:bg-[#e2e2e2]"
                >
                  Join Today
                </Button>

                <p className="mt-3 font-medium text-white/95">Starting at $49.99</p>
              </article>
            ))}
          </div>

          <div className="mt-8 flex justify-end md:mt-10">
            <Link
              href="/market-place"
              className=" font-semibold text-white underline underline-offset-8"
            >
              Shop All →
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#ECECEC] px-5 pb-16 pt-14 text-black md:px-8 md:pb-20 md:pt-16">
        <div className="mx-auto w-full max-w-[430px] text-center md:max-w-[820px]">
          <h2 className="mx-auto max-w-[8ch] text-[clamp(2.2rem,8.6vw,4rem)] font-semibold leading-[0.95] tracking-[-0.02em]">
            All in one app.
          </h2>

          <AllInOneImageSwitcher images={allInOneImages} />

          <p className="mx-auto mt-8 max-w-[28ch] text-[clamp(1.2rem,4.2vw,1.75rem)] leading-[1.34] text-black/95 md:mt-10 md:max-w-[34ch]">
            Leverage the Cyborg&apos;s advanced, discreet and preventive health monitoring to guide your path toward vitality and a longer, healthier life
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#ECECEC] px-5 pb-0 pt-14 text-black md:px-8 md:pt-16">
        <div className="mx-auto w-full max-w-[430px] md:max-w-[820px]">
          <h2 className="max-w-[12ch] text-[clamp(1.8rem,7.2vw,3.2rem)] font-semibold leading-[1.12] tracking-[-0.02em]">
            The only nudges you will ever need
          </h2>

          <p className="mt-7 max-w-[27ch] text-[clamp(1.15rem,3.9vw,1.6rem)] leading-[1.38] text-black/95 md:max-w-[36ch]">
            Personalized nudges for a healthier you. Get tailor-made insights and alerts to help you make better choices in real time.
          </p>

          <div className="mt-8 space-y-3 pb-12">
            <article className="rounded-3xl border-2 border-[#d6d7ef] bg-white/45 p-5 opacity-30">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-12 w-12 rounded-xl bg-[#eceef4]" />
                <p className="truncate pt-1 text-[clamp(1.05rem,3.1vw,1.35rem)] font-medium leading-[1.2]">Beef stick, zero sugar, jalapeno, medi...</p>
              </div>
              <div className="mt-4 grid grid-cols-4 text-center text-[#6a6a7a]">
                <div>
                  <p className="text-[clamp(1.55rem,4.8vw,2rem)] leading-none">100</p>
                  <p className="mt-1 text-[14px]">Calories</p>
                </div>
                <div className="border-x border-[#d4d8ea]">
                  <p className="text-[clamp(1.55rem,4.8vw,2rem)] leading-none">10g</p>
                  <p className="mt-1 text-[14px]">Protein</p>
                </div>
                <div>
                  <p className="text-[clamp(1.55rem,4.8vw,2rem)] leading-none">7g</p>
                  <p className="mt-1 text-[14px]">Fat</p>
                </div>
                <div>
                  <p className="text-[clamp(1.55rem,4.8vw,2rem)] leading-none">0g</p>
                  <p className="mt-1 text-[14px]">Carbs</p>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border-2 border-[#d6d7ef] bg-white p-5 shadow-none">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#eceef4] text-[20px]">🌯</div>
                <p className="truncate pt-1 text-[clamp(1.05rem,3.1vw,1.35rem)] font-medium leading-[1.2]">Beef stick, zero sugar, jalapeno, ...</p>
              </div>
              <div className="mt-4 grid grid-cols-4 text-center text-[#3f4150]">
                <div>
                  <p className="text-[clamp(1.55rem,4.8vw,2rem)] leading-none">100</p>
                  <p className="mt-1 text-[14px]">Calories</p>
                </div>
                <div className="border-x border-[#d4d8ea]">
                  <p className="text-[clamp(1.55rem,4.8vw,2rem)] leading-none">10g</p>
                  <p className="mt-1 text-[14px]">Protein</p>
                </div>
                <div>
                  <p className="text-[clamp(1.55rem,4.8vw,2rem)] leading-none">7g</p>
                  <p className="mt-1 text-[14px]">Fat</p>
                </div>
                <div>
                  <p className="text-[clamp(1.55rem,4.8vw,2rem)] leading-none">0g</p>
                  <p className="mt-1 text-[14px]">Carbs</p>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border-2 border-[#d6d7ef] bg-white p-4 shadow-none">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-[#33c067] text-[18px] text-[#33c067]">✓</div>
                  <p className="max-w-[13ch] text-[clamp(1rem,3.2vw,1.35rem)] font-medium leading-[1.2]">7:02 PM • Phase delay window starting soon</p>
                </div>
                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#747684] text-[16px] text-white">i</div>
              </div>
              <div className="my-3 border-t border-[#d4d8ea]" />
              <p className="text-[clamp(0.95rem,2.9vw,1.15rem)] leading-[1.35] text-[#5d6375]">
                Avoid bright light exposure and intense activity during this window to wake up with healthy energy levels. Good time to start winding down.
              </p>
            </article>

            <article className="rounded-3xl border-2 border-[#d6d7ef] bg-white p-4 shadow-none opacity-90">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-[#f09a3a] text-[18px] text-[#f09a3a]">✓</div>
                  <p className="text-[clamp(1rem,3.2vw,1.35rem)] font-medium leading-[1.2]">You can still do it</p>
                </div>
                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#747684] text-[16px] text-white">i</div>
              </div>
              <div className="my-3 border-t border-[#d4d8ea]" />
              <p className="text-[clamp(0.95rem,2.9vw,1.15rem)] leading-[1.35] text-[#8a8f9f]">
                Avoid bright light exposure and intense activity during this window to wake up with healthy energy levels. Good time to start winding down.
              </p>
            </article>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#ECECEC] to-transparent" />
      </section>

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_50%_-4%,#cb86ff_0%,#a14ff1_34%,#7f31d3_68%,#631aa6_100%)] px-5 pb-10 pt-16 text-white md:px-8 md:pb-16 md:pt-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.22),transparent_56%)]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#5f1aa5]/35" />
        <div className="mx-auto w-full max-w-[430px] lg:max-w-[1180px]">
          <div className="text-center lg:grid lg:grid-cols-[1fr_1.03fr] lg:items-end lg:gap-12 lg:text-left">
            <div className="lg:pb-6">
              <h2 className="text-[clamp(2.3rem,9vw,4.3rem)] font-semibold leading-[1.06] tracking-[-0.02em] lg:max-w-[12ch]">
                Labs by CYBORG
              </h2>
              <p className="mx-auto mt-7 max-w-[18ch] text-[clamp(1.1rem,4.4vw,1.9rem)] font-medium leading-[1.34] lg:mx-0 lg:max-w-[20ch]">
                Decoding the language of blood biomarkers
              </p>

              <img
                src="/assets/preview/mobile-image-2.png"
                alt="Labs by Cyborg app preview"
                className="relative top-20 z-1 scale-150 mx-auto mb-[-52px] mt-9 w-full max-w-[388px] sm:max-w-[205px] md:mb-[-66px] md:mt-12 md:max-w-[228px] lg:z-0 lg:mx-0 lg:mb-[-120px] lg:mt-12 lg:max-w-[310px]"
              />
            </div>

            {/* <article className="relative z-10 mt-0 rounded-[30px] border border-white/30 bg-gradient-to-b from-white/18 to-white/8 p-5 pt-14 text-left shadow-[0_10px_26px_rgba(0,0,0,0.18)] backdrop-blur-[2px] md:pt-16 lg:mt-0 lg:self-end lg:p-7 lg:pt-7"> */}
            <article className="relative z-10 mt-0 rounded-[30px] border border-white/25 
                bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.18))] 
                p-5 pt-14 text-white 
                shadow-[0_10px_40px_rgba(0,0,0,0.25)] 
                backdrop-blur-[70px]
                md:pt-16 lg:mt-0 lg:self-end lg:p-7 lg:pt-7">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-[clamp(1.05rem,4.9vw,1.55rem)] font-semibold leading-[1.05] lg:text-[clamp(1.45rem,2.4vw,2.25rem)]">Labs by CYBORG</h3>
                <p className="text-right text-[clamp(1.05rem,4.9vw,1.45rem)] font-semibold leading-[1.05] lg:text-[clamp(1.4rem,2.3vw,2.1rem)]">Starts at $100</p>
              </div>

              <ul className="mt-5 space-y-4 text-[clamp(1.02rem,3.8vw,1.45rem)] leading-[1.34]">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-[1.7rem] leading-none">✓</span>
                  <span>80+ blood markers synced with your lifestyle data</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-[1.7rem] leading-none">✓</span>
                  <span>18+ high-impact markers, beyond standard tests.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-[1.7rem] leading-none">✓</span>
                  <span>Comprehensive AI clinician&apos;s summary</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 text-[1.7rem] leading-none">✓</span>
                  <span>Track health across biomarkers, sleep, and activity</span>
                </li>
              </ul>

              <div className="mt-7 space-y-3">
                <Link
                  href="/blood-reports"
                  className="flex h-[54px] w-full items-center justify-center rounded-2xl bg-[#ECECEC] text-[clamp(1.25rem,4vw,1.8rem)] font-semibold text-black"
                >
                  Buy Blood Vision
                </Link>

                <Link
                  href="/concierge"
                  className="flex h-[54px] w-full items-center justify-center gap-3 rounded-2xl border-2 border-white/70 text-[clamp(1.25rem,4vw,1.8rem)] font-medium text-white"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M8.5 5.5C5.46 5.5 3 7.74 3 10.5C3 13.26 5.46 15.5 8.5 15.5C9.13 15.5 9.73 15.4 10.3 15.23L13.14 17.1C13.59 17.4 14.18 17.02 14.1 16.49L13.75 14.17C15.1 13.28 16 11.99 16 10.5C16 7.74 13.54 5.5 10.5 5.5H8.5Z" fill="currentColor"/>
                    <path d="M16.5 9.5C19.54 9.5 22 11.74 22 14.5C22 17.26 19.54 19.5 16.5 19.5C15.87 19.5 15.27 19.4 14.7 19.23L11.86 21.1C11.41 21.4 10.82 21.02 10.9 20.49L11.25 18.17C9.9 17.28 9 15.99 9 14.5C9 11.74 11.46 9.5 14.5 9.5H16.5Z" fill="currentColor" opacity="0.9"/>
                  </svg>
                  Talk to a specialist
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <HowItWorksSection />
      <MembershipSection />
      <MedicalProfessionalsSection />
      <MembershipPlanSection />
    </main>
  );
}
