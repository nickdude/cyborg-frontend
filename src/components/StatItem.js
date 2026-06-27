const DOT = {
  "text-gray-900": "#18181b",
  "text-biomarkerOptimal": "#05BC7E",
  "text-biomarkerNormal": "#D7D82E",
  "text-biomarkerOutOfRange": "#F865DD",
};

export default function StatItem({ label, value, color = "text-gray-900" }) {
  return (
    <div className="flex min-h-[82px] flex-col items-center justify-center rounded-2xl border border-borderColor bg-white px-2 py-3 text-center">
      <p className={`text-2xl font-bold tabular-nums lg:text-[28px] ${color}`}>{value ?? "N/A"}</p>
      <div className="mt-1.5 flex items-center justify-center gap-1.5">
        <span
          className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
          style={{ backgroundColor: DOT[color] || "#71717B" }}
        />
        <p className="text-[11px] font-medium leading-tight text-gray-500">{label}</p>
      </div>
    </div>
  );
}
