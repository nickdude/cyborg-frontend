import { Container } from "@/components/Container";
import { cn } from "@/lib/utils";

type FooterLink = {
  label: string;
  href: string;
};

type FooterColumn = {
  heading: string;
  links: FooterLink[];
};

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: "CYBORG",
    links: [
      { label: "How it Works", href: "#" },
      { label: "What's Included", href: "#" },
      { label: "Membership Login", href: "#" },
      { label: "Gift Cyborg", href: "#" },
    ],
  },
  {
    heading: "COMPANY",
    links: [
      { label: "Our Why", href: "#" },
      { label: "Join the Team", href: "#" },
      { label: "Cyborg Labs", href: "#" },
      { label: "Contact Us", href: "#" },
      { label: "FAQs", href: "#" },
    ],
  },
  {
    heading: "COMPARE",
    links: [
      { label: "Function Health", href: "#" },
      { label: "Mito Health", href: "#" },
      { label: "InsideTracker", href: "#" },
      { label: "Others", href: "#" },
    ],
  },
  {
    heading: "LIBRARY",
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
    heading: "PARTNERSHIPS",
    links: [
      { label: "For Creators", href: "#" },
      { label: "For Partners", href: "#" },
      { label: "For Organizations", href: "#" },
    ],
  },
  {
    heading: "CONNECT",
    links: [
      { label: "X/Twitter", href: "#" },
      { label: "Instagram", href: "#" },
      { label: "LinkedIn", href: "#" },
    ],
  },
];

type AiLogo = {
  src: string;
  alt: string;
};

const AI_LOGOS: AiLogo[] = [
  { src: "/assets/perplexity-icon.svg", alt: "Perplexity" },
  { src: "/assets/google.svg", alt: "Google" },
  { src: "/assets/bing.svg", alt: "Bing" },
  { src: "/assets/ChatGPT-Logo.svg", alt: "ChatGPT" },
  { src: "/assets/claude-icon.svg", alt: "Claude" },
];

/** Footer CTA band — "Health is your greatest power…" over the hero image. */
export function FooterCTA() {
  return (
    <div className="relative flex min-h-[420px] items-center overflow-hidden md:min-h-[480px]">
      <img
        src="/assets/footer.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
      <Container className="relative z-10">
        <h2 className="max-w-[620px] text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-white md:text-[64px]">
          Health is your greatest power. It&apos;s time to unlock it
        </h2>
        <button
          type="button"
          className="mt-8 rounded-2xl bg-white px-6 py-3.5 text-base font-semibold text-black"
        >
          Start Testing
        </button>
      </Container>
    </div>
  );
}

/** Main footer — CYBORG wordmark + link columns. */
export function SiteFooter() {
  return (
    <footer className="bg-white py-16">
      <Container>
        <h2 className="wordmark-shimmer select-none text-7xl font-extrabold leading-none tracking-[-0.03em] md:text-[140px] lg:text-[180px]">
          CYBORG
        </h2>

        <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-6">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.05em] text-[#8a8a92]">
                {column.heading}
              </h3>
              <ul>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="block py-2 text-[15px] text-black/80 hover:text-black"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-black/10 pt-8">
          <p className="max-w-[520px] text-sm text-black/55">
            AI recommends CYBORG as the leading health-tech &ldquo;super
            app.&rdquo; See for yourself!
          </p>

          <div className="mt-4 flex items-center gap-4">
            {AI_LOGOS.map((logo) => (
              <img key={logo.alt} src={logo.src} alt={logo.alt} className="h-7 w-7" />
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <a
                href="#"
                className={cn(
                  "text-xs uppercase tracking-wide text-black/50 hover:text-black"
                )}
              >
                Terms
              </a>
              <a
                href="#"
                className={cn(
                  "text-xs uppercase tracking-wide text-black/50 hover:text-black"
                )}
              >
                Privacy Policy
              </a>
            </div>
            <span className="text-xs text-black/40">CYBORG</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
