const COLUMNS = [
  "VS-01™",
  "Leading Oral Probiotic for Vaginal Health",
  "Certain Prescriptions",
];

const ROWS = [
  { label: "Establishes an optimal, resilient vaginal microbiome", marks: [true, false, false] },
  { label: "Increases abundance of L. crispatus", marks: [true, false, false] },
  { label: "Safely interacts directly with epithelial cells in the vagina", marks: [true, false, false] },
];

function Mark({ filled }) {
  return filled ? (
    <span className="inline-block h-3.5 w-3.5 rounded-full bg-[#541D7A]" />
  ) : (
    <span className="inline-block h-3.5 w-3.5 rounded-full border-[1.5px] border-[#541D7A]" />
  );
}

export default function VsDifferenceSection() {
  return (
    <section className="bg-white px-5 py-12 text-black md:px-8 md:py-16 lg:py-40">
      <div className="mx-auto w-full max-w-[430px] md:max-w-[820px] lg:max-w-[1040px]">
        <h2 className="max-w-[12ch] text-[clamp(1.7rem,7vw,2.6rem)] font-bold leading-[1.1] tracking-[-0.02em] lg:text-[44px]">
          The VS-01™ Difference
        </h2>

        <p className="mt-4 max-w-[46ch] text-[15px] leading-[1.5] text-black/80 lg:mt-5 lg:max-w-[60ch] lg:text-[17px] lg:leading-[1.6] lg:text-black/65">
          Many existing products and certain prescriptions for vaginal health only target the symptoms and can disrupt the vaginal microbiome. VS-01™ offers a new approach that outperforms on efficacy and safety.
        </p>

        <div className="mt-8 lg:mt-12">
          {/* Header */}
          <div className="grid grid-cols-[1.5fr_repeat(3,1fr)] items-end gap-2 border-b border-black/10 pb-3 lg:gap-6 lg:pb-5">
            <div />
            {COLUMNS.map((col) => (
              <div key={col} className="px-1 text-center text-[11px] font-semibold leading-tight text-black/80 lg:text-[15px]">
                {col}
              </div>
            ))}
          </div>

          {/* Rows */}
          {ROWS.map((row) => (
            <div key={row.label} className="grid grid-cols-[1.5fr_repeat(3,1fr)] items-center gap-2 border-b border-black/10 py-5 lg:gap-6 lg:py-7">
              <div className="pr-2 text-[13px] font-medium leading-snug text-black/90 lg:text-[17px]">{row.label}</div>
              {row.marks.map((filled, i) => (
                <div key={i} className="flex justify-center">
                  <Mark filled={filled} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
