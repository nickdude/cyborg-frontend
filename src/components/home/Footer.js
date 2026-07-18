"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";

// Accordion sections + their links.
const FOOTER_SECTIONS = [
  {
    title: "Cyborg",
    links: [
      { label: "How it Works", href: "#" },
      { label: "What’s Included", href: "#" },
      { label: "Membership Login", href: "/login" },
      { label: "Gift Cyborg", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Our Why", href: "#" },
      { label: "Join the Team", href: "#" },
      { label: "Cyborg Labs", href: "#" },
      { label: "Contact Us", href: "#" },
      { label: "FAQs", href: "#" },
    ],
  },
  {
    title: "Compare",
    links: [
      { label: "Function Health", href: "#" },
      { label: "Mito Health", href: "#" },
      { label: "InsideTracker", href: "#" },
      { label: "Others", href: "#" },
    ],
  },
  {
    title: "Library",
    links: [
      { label: "The Complete Guide to Biomarker Testing", href: "#" },
      { label: "Immune System Biomarker", href: "#" },
      { label: "Energy Biomarkers", href: "#" },
      { label: "Liver Health Biomarkers", href: "#" },
      { label: "Body Composition Biomarkers", href: "#" },
      { label: "DNA Biomarkers", href: "#" },
      { label: "Thyroid Biomarkers", href: "#" },
      { label: "Metabolic Biomarker Testing", href: "#" },
      { label: "5 Biomarkers Everyone Should Test", href: "#" },
    ],
  },
  {
    title: "Partnerships",
    links: [
      { label: "For Creators", href: "#" },
      { label: "For Partners", href: "#" },
      { label: "For Organizations", href: "#" },
    ],
  },
  {
    title: "Connect",
    links: [
      { label: "X/Twitter", href: "#" },
      { label: "Instagram", href: "#" },
      { label: "LinkedIn", href: "#" },
    ],
  },
];

// AI engines that "recommend" Cyborg — rendered as small logo tiles.
const AI_LOGOS = [
  { src: "/assets/icons/perplexity-icon.svg", alt: "Perplexity" },
  { src: "/assets/icons/google.svg", alt: "Google" },
  { src: "/assets/icons/bing.svg", alt: "Bing" },
  { src: "/assets/icons/ChatGPT-Logo.svg", alt: "ChatGPT" },
  { src: "/assets/icons/claude-icon.svg", alt: "Claude" },
];

function ChevronRight() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#5B2487]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Footer() {
  const [openSection, setOpenSection] = useState(null);

  return (
    <footer className="bg-white">
      {/* CTA banner */}
      <section className="relative isolate overflow-hidden">
        <Image
          src="/assets/footer/footer.webp"
          alt=""
          fill
          sizes="100vw"
          className="-z-10 object-cover object-center"
        />
        <div className="-z-10 absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
        <div className="relative mx-auto flex min-h-screen w-full max-w-[1180px] flex-col justify-end px-6 pb-12 pt-28 text-white md:min-h-[520px] md:px-10 md:pb-16 lg:min-h-screen lg:max-w-[1400px] lg:px-12 lg:pb-20">
          <motion.h2
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -20% 0px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-[14ch] text-[clamp(2.1rem,8.5vw,4rem)] font-bold leading-[1.05] tracking-[-0.02em]"
          >
            Health is your greatest power. It’s time to unlock it
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -20% 0px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="mt-8"
          >
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-base font-semibold text-black transition hover:bg-white/90"
            >
              Start Testing
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Link sections */}
      <div className="mx-auto w-full max-w-[1180px] px-6 pb-12 pt-10 md:px-10 md:pt-14 lg:max-w-[1400px] lg:px-12 lg:pb-20 lg:pt-20">
        <h2 className="wordmark-shimmer select-none text-[clamp(2.4rem,11vw,3.25rem)] font-extrabold tracking-[-0.03em] lg:text-[72px]">
          CYBORG
        </h2>

        {/* Mobile/tablet: accordion */}
        <div className="mt-6 border-t border-black/10 lg:hidden">
          {FOOTER_SECTIONS.map((section) => {
            const isOpen = openSection === section.title;
            return (
              <div key={section.title} className="border-b border-black/10">
                <button
                  type="button"
                  onClick={() => setOpenSection(isOpen ? null : section.title)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between py-4 text-left"
                >
                  <span className="text-lg font-medium text-[#5d5d66]">{section.title}</span>
                  <svg className="h-5 w-5 shrink-0 text-[#3f3f46]" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    {!isOpen && (
                      <line x1="10" y1="3" x2="10" y2="17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    )}
                  </svg>
                </button>

                {isOpen && (
                  <ul className="space-y-3 pb-5">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <Link href={link.href} className="flex items-start gap-3 text-[15px] leading-snug text-black transition hover:text-[#5B2487]">
                          <ChevronRight />
                          <span>{link.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop: expanded multi-column */}
        <div className="hidden lg:mt-12 lg:grid lg:grid-cols-6 lg:gap-8 lg:border-t lg:border-black/10 lg:pt-12">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[#8a8a92]">{section.title}</h3>
              <ul className="mt-5 space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[15px] leading-snug text-black/80 transition-colors hover:text-[#5B2487]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* AI recommendation */}
        <div className="mt-8 lg:mt-16">
          <svg className="h-6 w-6 text-[#5B2487]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2c.4 4.8 2.2 6.6 7 7-4.8.4-6.6 2.2-7 7-.4-4.8-2.2-6.6-7-7 4.8-.4 6.6-2.2 7-7z" />
          </svg>
          <p className="mt-3 max-w-[34ch] text-base leading-snug text-[#5d5d66]">
            AI recommends CYBORG as the leading health-tech “super app.” See for yourself!
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {AI_LOGOS.map((logo) => (
              <span key={logo.alt} className="flex h-14 w-14 items-center justify-center rounded-2xl border border-black/10 bg-white shadow-sm">
                {/* Plain img: next/image won't optimize SVGs without dangerouslyAllowSVG */}
                <img src={logo.src} alt={logo.alt} loading="lazy" decoding="async" className="h-7 w-7 object-contain" />
              </span>
            ))}
          </div>
        </div>

        {/* Legal */}
        <div className="mt-10 space-y-2 text-xs font-medium uppercase tracking-wide text-[#8a8a92]">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="#" className="transition hover:text-black">Terms</Link>
            <Link href="#" className="transition hover:text-black">Privacy Policy</Link>
          </div>
          <p>Cyborg</p>
        </div>
      </div>
    </footer>
  );
}
