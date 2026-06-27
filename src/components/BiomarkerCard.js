"use client";

const STATUS_META = {
  optimal: { label: "Optimal", dot: "#05BC7E", pill: "bg-[#05BC7E]/10 text-[#04966a]" },
  normal: { label: "Normal", dot: "#D7D82E", pill: "bg-[#D7D82E]/20 text-[#8a8b0f]" },
  out_of_range: { label: "Out of range", dot: "#F865DD", pill: "bg-[#F865DD]/12 text-[#bf3aa8]" },
};

export default function BiomarkerCard({ biomarker }) {
  const { name, value, unit, status, trend } = biomarker;

  const meta = STATUS_META[status] || { label: "—", dot: "#71717B", pill: "bg-gray-100 text-gray-500" };
  const dotColor = meta.dot;

  // Only draw a trend line when there's genuine history (2+ real points)
  const hasTrend = Array.isArray(trend) && trend.length >= 2;

  const trendPoints = hasTrend
    ? (() => {
        const trendMin = Math.min(...trend);
        const trendMax = Math.max(...trend);
        const range = trendMax - trendMin;
        if (range === 0) {
          return trend.map((v, i) => ({ x: 15 + (i / (trend.length - 1)) * 70, y: 50 }));
        }
        const padding = range * 0.15;
        const lo = trendMin - padding;
        const hi = trendMax + padding;
        return trend.map((v, i) => ({
          x: 15 + (i / (trend.length - 1)) * 70,
          y: ((v - lo) / (hi - lo)) * 100,
        }));
      })()
    : [];

  const trendSvgPoints = trendPoints.map((p) => `${p.x},${100 - p.y}`).join(" ");

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-borderColor bg-white p-3.5 font-inter shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-zinc-300 hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)] lg:p-4">
      {/* Left: Status Dot + Info */}
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div
          className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full lg:h-3 lg:w-3"
          style={{ backgroundColor: dotColor }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-gray-900 lg:text-[15px]">{name || "N/A"}</p>
          <p className="mt-0.5 text-xs tabular-nums text-gray-500 lg:text-sm">
            {value || "N/A"} <span className="text-gray-400">{unit || ""}</span>
          </p>
        </div>
      </div>

      {/* Right: real trend when history exists, else a clean status pill */}
      <div className="flex flex-shrink-0 items-center">
        {hasTrend ? (
          <div className="relative h-8 w-20 lg:h-10 lg:w-28">
            <div
              className="absolute inset-0 rounded-md opacity-20"
              style={{
                backgroundColor: dotColor,
                maskImage: "linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)",
              }}
            />
            <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0">
              <line x1="10" y1="50" x2="90" y2="50" stroke="#D1D5DB" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.6" />
              <polyline
                points={trendSvgPoints}
                fill="none"
                stroke={dotColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity="0.75"
                vectorEffect="non-scaling-stroke"
              />
              {trendPoints.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={100 - p.y}
                  r={i === trendPoints.length - 1 ? 5 : 3}
                  fill={dotColor}
                  stroke="white"
                  strokeWidth="1"
                />
              ))}
            </svg>
          </div>
        ) : (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.pill}`}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
            {meta.label}
          </span>
        )}
      </div>
    </div>
  );
}
