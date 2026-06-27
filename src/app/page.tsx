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
import { ChecklistStorySection } from "@/components/sections/ChecklistStorySection";
import {
  VisualStorySection,
  VISUALISE_PART_ONE,
  VISUALISE_PART_TWO,
} from "@/components/sections/VisualStorySection";
import MedicalProfessionalsSection from "@/components/home/MedicalProfessionalsSection";
import MembershipPlanSection from "@/components/home/MembershipPlanSection";
import TagOverlaySection from "@/components/home/TagOverlaySection";
import VsDifferenceSection from "@/components/home/VsDifferenceSection";
import CyborgLabsSection from "@/components/home/CyborgLabsSection";
import ChangeHealthSection from "@/components/home/ChangeHealthSection";
import FaqAccordion from "@/components/home/FaqAccordion";
import TestCoverageTabs from "@/components/home/TestCoverageTabs";
import Footer from "@/components/home/Footer";

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
      <main className="relative z-10">
        {/* Hero is transparent so the fixed scroll.mp4 shows through */}
        <Hero />

        {/* Everything below sits on an opaque backdrop so reveals don't bleed the video */}
        <div className="relative bg-black">

          <Reveal><Products /></Reveal>
          <Reveal><AllInOneApp /></Reveal>
          <Reveal><Nudges /></Reveal>
          <Reveal><LabsByCyborg /></Reveal>
          <ChecklistStorySection />

              <Reveal><MedicalProfessionalsSection /></Reveal>
              <Reveal><MembershipPlanSection /></Reveal>
              <Reveal><VisualStorySection cards={VISUALISE_PART_ONE} /></Reveal>
              <Reveal><VisualStorySection cards={VISUALISE_PART_TWO} /></Reveal>
              <Reveal><TagOverlaySection image="/assets/testinomial/test1.png" /></Reveal>
              <Reveal><VsDifferenceSection /></Reveal>
              <Reveal><CyborgLabsSection /></Reveal>
              <Reveal><ChangeHealthSection /></Reveal>
              <Reveal><FaqAccordion /></Reveal>
              <Reveal><TestCoverageTabs /></Reveal>
              <Footer />
        </div>
      </main>
      </SmoothScroll>
    </>
  );
}
