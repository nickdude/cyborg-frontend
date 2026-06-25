"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { SmoothScroll } from "@/components/SmoothScroll";
import { BackgroundVideo } from "@/components/BackgroundVideo";
import { LandingPreloader } from "@/components/LandingPreloader";
import { Reveal } from "@/components/Reveal";
import { Hero } from "@/components/sections/Hero";
import { TiltTablet } from "@/components/sections/TiltTablet";
import { Products } from "@/components/sections/Products";
import { AllInOneApp } from "@/components/sections/AllInOneApp";
import { Nudges } from "@/components/sections/Nudges";
import { LabsByCyborg } from "@/components/sections/LabsByCyborg";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { MarketplaceScatter } from "@/components/sections/MarketplaceScatter";
import { WholeYouGrid } from "@/components/sections/WholeYouGrid";
import { MembershipIncluded } from "@/components/sections/MembershipIncluded";
import { MedicalProfessionals } from "@/components/sections/MedicalProfessionals";
import { BackedByBest } from "@/components/sections/BackedByBest";
import { AdvancedPlan } from "@/components/sections/AdvancedPlan";
import { MetabolicQuote } from "@/components/sections/MetabolicQuote";
import { VS01Difference } from "@/components/sections/VS01Difference";
import { Testimonial } from "@/components/sections/Testimonial";
import { LifeTimeline } from "@/components/sections/LifeTimeline";
import { ChangeYourHealth } from "@/components/sections/ChangeYourHealth";
import { FooterCTA, SiteFooter } from "@/components/sections/SiteFooter";
import { CyborgLabsBanner } from "@/components/sections/CyborgLabsBanner";
import { BiomarkersTested } from "@/components/sections/BiomarkersTested";
import { FAQ } from "@/components/sections/FAQ";

export default function Home() {
  const { token, loading } = useAuth();
  const router = useRouter();

  // Logged-in visitors go straight to their dashboard (unchanged behaviour).
  useEffect(() => {
    if (!loading && token) {
      router.push("/dashboard");
    }
  }, [token, loading, router]);

  return (
    <>
      <LandingPreloader />
      <SmoothScroll>
        <BackgroundVideo />
      <main className="relative z-10 overflow-x-clip">
        {/* Hero is transparent so the fixed scroll.mp4 shows through */}
        <Hero />

        {/* Everything below sits on an opaque backdrop so reveals don't bleed the video */}
        <div className="relative overflow-x-clip bg-black">
          <TiltTablet />

          <Reveal><Products /></Reveal>
          <Reveal><AllInOneApp /></Reveal>
          <Reveal><Nudges /></Reveal>
          <Reveal><LabsByCyborg /></Reveal>
          <Reveal><HowItWorks /></Reveal>

          <MarketplaceScatter />
          <WholeYouGrid />

          <Reveal><MembershipIncluded /></Reveal>
          <Reveal><MedicalProfessionals /></Reveal>

          <BackedByBest />

          <Reveal><AdvancedPlan /></Reveal>
          <Reveal><MetabolicQuote /></Reveal>
          <Reveal><VS01Difference /></Reveal>

          <Testimonial />

          <LifeTimeline />

          <Reveal><ChangeYourHealth /></Reveal>

          <FooterCTA />

          <Reveal><CyborgLabsBanner /></Reveal>
          <Reveal><BiomarkersTested /></Reveal>
          <Reveal><FAQ /></Reveal>

          <SiteFooter />
        </div>
      </main>
      </SmoothScroll>
    </>
  );
}
