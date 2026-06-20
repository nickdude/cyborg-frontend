import { Container } from "@/components/Container";
import { cn } from "@/lib/utils";

type ComparisonRow = {
  label: string;
  vs01: boolean;
  oralProbiotic: boolean;
  prescriptions: boolean;
};

const ROWS: ComparisonRow[] = [
  {
    label: "Establishes an optimal, resilient vaginal microbiome",
    vs01: true,
    oralProbiotic: false,
    prescriptions: false,
  },
  {
    label: "Increases abundance of L. crispatus",
    vs01: true,
    oralProbiotic: false,
    prescriptions: false,
  },
  {
    label: "Safely interacts directly with epithelial cells in the vagina",
    vs01: true,
    oralProbiotic: false,
    prescriptions: false,
  },
];

const COLUMN_HEADERS = [
  "VS-01™",
  "Leading Oral Probiotic for Vaginal Health",
  "Certain Prescriptions",
];

function Marker({ filled }: { filled: boolean }) {
  return (
    <span className="flex items-center justify-center">
      <span
        className={cn(
          "h-3 w-3 rounded-full md:h-3.5 md:w-3.5",
          filled
            ? "bg-[#5b2487]"
            : "border-2 border-[#5b2487]/60 bg-transparent",
        )}
      />
    </span>
  );
}

export function VS01Difference() {
  return (
    <section className="bg-white py-20 md:py-24">
      <Container>
        <h2 className="max-w-[420px] text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-black md:text-[44px]">
          The VS-01&#8482; Difference
        </h2>
        <p className="mt-5 max-w-[560px] text-[15px] leading-relaxed text-black/60 md:text-[17px]">
          Many existing products and certain prescriptions for vaginal health
          only target the symptoms and can disrupt the vaginal microbiome.
          VS-01&#8482; offers a new approach that outperforms on efficacy and
          safety.
        </p>

        <div className="mt-12">
          {/* Header row */}
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] items-end border-b border-black/10 pb-4">
            <div aria-hidden />
            {COLUMN_HEADERS.map((header) => (
              <div
                key={header}
                className="px-1 text-center text-xs leading-snug text-black/70 md:text-sm"
              >
                {header}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {ROWS.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[1.4fr_1fr_1fr_1fr] items-center border-b border-black/10 py-5"
            >
              <div className="max-w-[260px] pr-2 text-[13px] font-semibold text-black md:text-[15px]">
                {row.label}
              </div>
              <Marker filled={row.vs01} />
              <Marker filled={row.oralProbiotic} />
              <Marker filled={row.prescriptions} />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
