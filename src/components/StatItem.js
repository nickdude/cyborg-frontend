const DOT = {
  "text-gray-900": "#18181b",
  "text-biomarkerOptimal": "#05BC7E",
  "text-biomarkerNormal": "#D7D82E",
  "text-biomarkerOutOfRange": "#F865DD",
};

export default function StatItem({ label, value, color = "text-gray-900" }) {
  return (
    <div className="rounded-xl border border-borderColor bg-pageBackground/40 px-3 py-3 text-left lg:px-4 lg:py-3.5">
      <p className={`text-2xl font-bold tabular-nums lg:text-[28px] ${color}`}>{value ?? "N/A"}</p>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: DOT[color] || "#71717B" }} />
        <p className="text-[11px] font-medium text-gray-500 lg:text-xs">{label}</p>
      </div>
    </div>
  );
}
