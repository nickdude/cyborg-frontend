"use client";

export default function BiomarkerCard({ biomarker }) {
  const { name, value, unit, category, status, trend } = biomarker;

  const getStatusDotColor = (status) => {
    switch(status) {
      case "optimal":
        return "#05BC7E";
      case "normal":
        return "#D7D82E";
      case "out_of_range":
        return "#F865DD";
      default:
        return "#71717B";
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "optimal":
        return "bg-biomarkerOptimal";
      case "normal":
        return "bg-biomarkerNormal";
      case "out_of_range":
        return "bg-biomarkerOutOfRange";
      default:
        return "bg-gray-500";
    }
  };

  // Calculate trend line points — normalize to value range with padding
  const trendPoints = trend && trend.length > 0 ? (() => {
    if (trend.length === 1) {
      // Single data point — center it
      return [{ x: 50, y: 50 }];
    }
    const trendMin = Math.min(...trend);
    const trendMax = Math.max(...trend);
    const range = trendMax - trendMin;
    if (range === 0) {
      // All values identical — flat line at 50%
      return trend.map((v, i) => ({
        x: 15 + (i / (trend.length - 1)) * 70,
        y: 50
      }));
    }
    const padding = range * 0.15;
    const lo = trendMin - padding;
    const hi = trendMax + padding;
    return trend.map((v, i) => ({
      x: 15 + (i / (trend.length - 1)) * 70,
      y: ((v - lo) / (hi - lo)) * 100
    }));
  })() : [];

  const trendSvgPoints = trendPoints.map(p => `${p.x},${100 - p.y}`).join(" ");

  return (
    <div className="bg-white rounded-xl p-4 lg:p-6 font-inter flex items-center gap-4 lg:border lg:border-borderColor">
      {/* Left Section: Status Dot + Info */}
      <div className="flex items-start gap-3 flex-1">
        <div 
          className="w-3 h-3 rounded-full flex-shrink-0 mt-1 lg:w-3.5 lg:h-3.5"
          style={{ backgroundColor: getStatusDotColor(status) }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm lg:text-base leading-tight">{name || "N/A"}</p>
          <p className="text-xs text-gray-500 mt-0.5 lg:text-sm">{value || "N/A"} <span className="text-gray-400">{unit || ""}</span></p>
        </div>
      </div>

      {/* Right Section: Trend Line */}
        <div className="flex items-center flex-shrink-0">
        {/* Horizontal Trend Line */}
        <div className="relative w-20 h-8 lg:w-28 lg:h-10">
          {/* Light background tint */}
          <div
            className="absolute inset-0 rounded-md opacity-20"
            style={{
              backgroundColor: getStatusDotColor(status),
              maskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)'
            }}
          />
          {/* Trend line + value dots */}
          <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0">
            {/* Subtle midline for visual reference */}
            {trendPoints.length > 1 && (
              <line
                x1="10"
                y1="50"
                x2="90"
                y2="50"
                stroke="#D1D5DB"
                strokeWidth="1"
                strokeDasharray="3 3"
                strokeOpacity="0.6"
              />
            )}
            {trendPoints.length > 1 ? (
              <>
                {/* Solid trend line */}
                <polyline
                  points={trendSvgPoints}
                  fill="none"
                  stroke={getStatusDotColor(status)}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity="0.7"
                  vectorEffect="non-scaling-stroke"
                />
                {/* Dots at ALL data points */}
                {trendPoints.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={100 - p.y}
                    r={i === trendPoints.length - 1 ? 5 : 3}
                    fill={getStatusDotColor(status)}
                    stroke="white"
                    strokeWidth="1"
                  />
                ))}
              </>
            ) : (
              /* Single data point — dashed line with dot */
              <>
                <line x1="20" y1="50" x2="75" y2="50" stroke={getStatusDotColor(status)} strokeWidth="2" strokeOpacity="0.3" strokeDasharray="4 3" />
                <circle
                  cx={trendPoints.length > 0 ? trendPoints[trendPoints.length - 1].x : 80}
                  cy={trendPoints.length > 0 ? 100 - trendPoints[trendPoints.length - 1].y : 50}
                  r="5"
                  fill={getStatusDotColor(status)}
                  stroke="white"
                  strokeWidth="1"
                />
              </>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
