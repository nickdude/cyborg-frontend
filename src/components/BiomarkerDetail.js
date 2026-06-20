"use client";

function VerticalRangeChart({ value, refMin, refMax, optMin, optMax, status }) {
  const numVal = parseFloat(value) || 0;
  const lo = refMin ?? 0;
  const hi = refMax ?? (numVal * 2 || 100);
  const oMin = optMin ?? lo;
  const oMax = optMax ?? hi;
  const scaleMax = Math.max(hi * 1.3, numVal * 1.2);
  const totalH = 140;

  const toY = (v) => totalH - ((v / (scaleMax || 1)) * totalH);
  const valY = toY(numVal);
  const refMinY = refMin != null ? toY(refMin) : null;
  const refMaxY = refMax != null ? toY(refMax) : null;
  const optMinY = oMin != null ? toY(oMin) : null;
  const optMaxY = oMax != null ? toY(oMax) : null;

  const dotColor = status === "optimal" ? "#05BC7E" : status === "normal" ? "#D7D82E" : "#F865DD";

  return (
    <div className="relative flex gap-3">
      {/* Vertical colored range bar */}
      <div className="flex flex-col items-center w-2" style={{ height: totalH }}>
        <div className="w-1.5 rounded-full bg-biomarkerOutOfRange" style={{ height: refMaxY != null ? refMaxY : totalH * 0.3 }} />
        {refMaxY != null && optMaxY != null && (
          <div className="w-1.5 rounded-full bg-biomarkerNormal mt-0.5" style={{ height: Math.max(2, (optMaxY ?? refMaxY) - refMaxY) }} />
        )}
        {optMaxY != null && optMinY != null && (
          <div className="w-1.5 rounded-full bg-biomarkerOptimal mt-0.5" style={{ height: Math.max(4, optMinY - optMaxY) }} />
        )}
        {optMinY != null && refMinY != null && (
          <div className="w-1.5 rounded-full bg-biomarkerNormal mt-0.5" style={{ height: Math.max(2, refMinY - optMinY) }} />
        )}
        <div className="w-1.5 flex-1 rounded-full bg-biomarkerOutOfRange mt-0.5" />
      </div>

      {/* Chart area */}
      <div className="flex-1 relative" style={{ height: totalH }}>
        {/* Dotted horizontal line at value position */}
        <div className="absolute left-0 right-0 border-t border-dashed border-borderColor" style={{ top: valY }} />

        {/* Value dot */}
        <div
          className="absolute w-3 h-3 rounded-full shadow-sm"
          style={{ top: valY - 6, left: 20, backgroundColor: dotColor }}
        />

        {/* Optimal range box */}
        {optMaxY != null && optMinY != null && (
          <div
            className="absolute left-10 right-2 rounded-md border border-dashed border-biomarkerOptimal/60 bg-biomarkerOptimal/10"
            style={{ top: optMaxY, height: Math.max(8, optMinY - optMaxY) }}
          />
        )}
        {optMaxY != null && optMinY == null && (
          <div
            className="absolute left-10 right-2 rounded-md border border-dashed border-biomarkerOptimal/60 bg-biomarkerOptimal/10"
            style={{ top: optMaxY, height: Math.max(8, totalH - optMaxY) }}
          />
        )}

        {/* Optimal label */}
        <div className="absolute right-0 text-xs text-biomarkerOptimal font-medium" style={{ top: (optMaxY ?? totalH * 0.4) - 16 }}>
          Optimal
        </div>

        {/* Ref range labels */}
        {refMaxY != null && (
          <div className="absolute right-0 text-[10px] text-secondary" style={{ top: refMaxY - 6 }}>
            {refMax}
          </div>
        )}
        {refMinY != null && (
          <div className="absolute right-0 text-[10px] text-secondary" style={{ top: refMinY - 6 }}>
            {refMin}
          </div>
        )}
      </div>
    </div>
  );
}

function TrendLineChart({ trend, unit, optimalRange, referenceMin, referenceMax, status }) {
  if (!trend || trend.length < 2) return null;

  const viewW = 300;
  const viewH = 200;
  const padL = viewW * 0.15;
  const padR = viewW * 0.85;
  const padT = 24; // top padding for labels
  const padB = viewH - 16; // bottom padding for labels

  // Gather all values to determine y-axis bounds
  const allValues = [...trend];
  const oMin = optimalRange?.min;
  const oMax = optimalRange?.max;
  const rMin = referenceMin;
  const rMax = referenceMax;
  if (oMin != null) allValues.push(oMin);
  if (oMax != null) allValues.push(oMax);
  if (rMin != null) allValues.push(rMin);
  if (rMax != null) allValues.push(rMax);

  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  const range = dataMax - dataMin;
  const padding = range === 0 ? 1 : range * 0.15;
  const yLo = dataMin - padding;
  const yHi = dataMax + padding;

  const toX = (i) => padL + (i / (trend.length - 1)) * (padR - padL);
  const toY = (v) => padB - ((v - yLo) / (yHi - yLo)) * (padB - padT);

  // Determine per-point status based on range bounds
  const getPointStatus = (v) => {
    if (oMin != null && oMax != null && v >= oMin && v <= oMax) return "optimal";
    if (oMax != null && oMin == null && v <= oMax) return "optimal";
    if (oMin != null && oMax == null && v >= oMin) return "optimal";
    if (rMin != null && rMax != null && v >= rMin && v <= rMax) return "normal";
    if (rMax != null && rMin == null && v <= rMax) return "normal";
    if (rMin != null && rMax == null && v >= rMin) return "normal";
    return "out_of_range";
  };

  const statusColor = (s) =>
    s === "optimal" ? "#05BC7E" : s === "normal" ? "#D7D82E" : "#F865DD";

  // Build polyline points
  const points = trend.map((v, i) => ({ x: toX(i), y: toY(v), val: v }));
  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Range band helpers — for one-sided ranges, extend to chart edge
  const refBandY1 = rMax != null ? toY(rMax) : (rMin != null ? padT : null);
  const refBandY2 = rMin != null ? toY(rMin) : (rMax != null ? padB : null);
  const optBandY1 = oMax != null ? toY(oMax) : (oMin != null ? padT : null);
  const optBandY2 = oMin != null ? toY(oMin) : (oMax != null ? padB : null);

  // Vertical range bar — computed in SVG coordinates for perfect alignment
  const barX = 6;
  const barW = 5;
  const barTop = padT;
  const barBottom = padB;
  const barRefMaxY = rMax != null ? toY(rMax) : null;
  const barRefMinY = rMin != null ? toY(rMin) : null;
  const barOptMaxY = oMax != null ? toY(oMax) : null;
  const barOptMinY = oMin != null ? toY(oMin) : null;

  // Build vertical bar segments top-to-bottom
  const barSegments = [];
  const topBound = barRefMaxY ?? barOptMaxY ?? barTop;
  const bottomBound = barRefMinY ?? barOptMinY ?? barBottom;
  const optTop = barOptMaxY ?? barTop;
  const optBottom = barOptMinY ?? barBottom;
  const refTop = barRefMaxY ?? barTop;
  const refBottom = barRefMinY ?? barBottom;

  // Top out-of-range
  if (topBound > barTop) {
    barSegments.push({ y: barTop, h: topBound - barTop, color: "#F865DD" });
  }
  // Normal zone above optimal (between refMax and optMax)
  if (barRefMaxY != null && barOptMaxY != null && barOptMaxY > barRefMaxY) {
    barSegments.push({ y: barRefMaxY, h: barOptMaxY - barRefMaxY, color: "#D7D82E" });
  }
  // Optimal zone
  if (optTop < optBottom) {
    barSegments.push({ y: optTop, h: optBottom - optTop, color: "#05BC7E" });
  }
  // Normal zone below optimal (between optMin and refMin)
  if (barOptMinY != null && barRefMinY != null && barRefMinY > barOptMinY) {
    barSegments.push({ y: barOptMinY, h: barRefMinY - barOptMinY, color: "#D7D82E" });
  }
  // Bottom out-of-range
  if (bottomBound < barBottom) {
    barSegments.push({ y: bottomBound, h: barBottom - bottomBound, color: "#F865DD" });
  }

  return (
    <div>
      <svg
        width="100%"
        viewBox={`0 0 ${viewW} ${viewH}`}
        className="overflow-visible"
        style={{ height: 200 }}
      >
        {/* Vertical range bar inside SVG */}
        {barSegments.map((seg, i) => (
          <rect
            key={`bar-${i}`}
            x={barX}
            y={seg.y}
            width={barW}
            height={Math.max(2, seg.h)}
            rx={2.5}
            fill={seg.color}
            opacity="0.8"
          />
        ))}
        {/* Reference range band */}
        {refBandY1 != null && refBandY2 != null && (
          <rect
            x={padL - 4}
            y={refBandY1}
            width={padR - padL + 8}
            height={Math.max(1, refBandY2 - refBandY1)}
            fill="#D7D82E"
            opacity="0.08"
            rx="4"
          />
        )}

        {/* Optimal range band */}
        {optBandY1 != null && optBandY2 != null && (
          <rect
            x={padL - 4}
            y={optBandY1}
            width={padR - padL + 8}
            height={Math.max(1, optBandY2 - optBandY1)}
            fill="#05BC7E"
            opacity="0.12"
            rx="4"
          />
        )}

        {/* Optimal range dashed borders */}
        {optBandY1 != null && (
          <line
            x1={padL - 4} y1={optBandY1}
            x2={padR + 4} y2={optBandY1}
            stroke="#05BC7E" strokeWidth="0.5" strokeDasharray="4 3" opacity="0.4"
          />
        )}
        {optBandY2 != null && (
          <line
            x1={padL - 4} y1={optBandY2}
            x2={padR + 4} y2={optBandY2}
            stroke="#05BC7E" strokeWidth="0.5" strokeDasharray="4 3" opacity="0.4"
          />
        )}

        {/* Connecting line */}
        <polyline
          points={polyline}
          fill="none"
          stroke="#A0A0AB"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points + labels */}
        {points.map((p, i) => {
          const ptStatus = getPointStatus(p.val);
          const color = statusColor(ptStatus);
          // Alternate label position to avoid overlap
          const labelAbove = i % 2 === 0;
          const labelY = labelAbove ? p.y - 10 : p.y + 16;
          return (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r="5"
                fill={color}
                stroke="white"
                strokeWidth="1.5"
              />
              <text
                x={p.x}
                y={labelY}
                textAnchor="middle"
                fontSize="9"
                fontWeight="600"
                fill="#3F3F46"
              >
                {p.val}
              </text>
            </g>
          );
        })}

        {/* Right-side range labels */}
        {oMax != null && (
          <text x={padR + 8} y={optBandY1 + 3} fontSize="8" fill="#05BC7E" fontWeight="500">
            {oMax}
          </text>
        )}
        {oMin != null && (
          <text x={padR + 8} y={optBandY2 + 3} fontSize="8" fill="#05BC7E" fontWeight="500">
            {oMin}
          </text>
        )}
      </svg>
    </div>
  );
}

function InsightCard({ title, body, cta }) {
  return (
    <div className="border border-borderColor rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-black text-white text-xs flex items-center justify-center font-bold flex-shrink-0 leading-none">C</div>
        <div>
          <p className="text-sm font-semibold text-primary">{title}</p>
          <p className="text-xs text-secondary mt-2 leading-relaxed">{body}</p>
        </div>
      </div>
      {cta && (
        <button className="text-xs text-secondary mt-3 flex items-center gap-2 px-10">
          {cta} <span>→</span>
        </button>
      )}
    </div>
  );
}

function AskItem({ text }) {
  return (
    <div className="border border-borderColor rounded-xl p-3 flex items-center gap-3">
      <div className="w-7 h-7 rounded-full bg-black text-white text-xs flex items-center justify-center font-bold flex-shrink-0 leading-none">C</div>
      <p className="text-sm text-gray-900 flex-1">{text}</p>
      <span className="text-gray-400">→</span>
    </div>
  );
}

export default function BiomarkerDetail({ biomarker, onClose }) {
  const bioName = biomarker?.name || "Unknown Biomarker";
  const detail = {
    name: bioName,
    value: biomarker?.value || "—",
    unit: biomarker?.unit || "",
    status: biomarker?.status || "normal",
    optimalRange: biomarker?.optimalRange || { min: null, max: null },
    timeline: biomarker?.timeline || null,
    insight: biomarker?.insight || {
      title: `About ${bioName}`,
      body: `Tap "Ask Cyborg AI" below to learn more about your ${bioName} levels and what they mean for your health.`,
      cta: null,
    },
    questions: biomarker?.questions || [
      `What does my ${bioName} level mean for my health?`,
      `How can I improve my ${bioName} through lifestyle changes?`,
      `Should I get additional testing related to ${bioName}?`,
    ],
    description: biomarker?.description || null,
  };
  return (
    <div className="fixed inset-0 bg-black/40 flex items-end z-50">
      <div className="w-full bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto font-inter pb-10">
        <div className="flex justify-center pt-3">
          <div className="w-14 h-1.5 bg-borderColor rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pt-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">{detail.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status Pill */}
        <div className="px-6 pt-4">
          <div className={`inline-flex items-center gap-2 ${detail.status === "optimal" ? "bg-biomarkerOptimal/10 text-biomarkerOptimal" : detail.status === "normal" ? "bg-biomarkerNormal/10 text-biomarkerNormal" : "bg-biomarkerOutOfRange/10 text-biomarkerOutOfRange"} rounded-full px-4 py-2 text-sm font-medium`}>
            <span className={`w-2.5 h-2.5 rounded-full ${detail.status === "optimal" ? "bg-biomarkerOptimal" : detail.status === "normal" ? "bg-biomarkerNormal" : "bg-biomarkerOutOfRange"}`} />
            {detail.status === "optimal" ? "Optimal" : detail.status === "normal" ? "Normal" : "Out of Range"}
            <span className="text-gray-500 font-normal">{detail.value} {detail.unit}</span>
          </div>
        </div>

        {/* Chart Area */}
        <div className="px-6 pt-6">
          {biomarker?.trend && biomarker.trend.length >= 2 ? (
            <TrendLineChart
              trend={biomarker.trend}
              unit={detail.unit}
              optimalRange={detail.optimalRange}
              referenceMin={biomarker?.referenceMin}
              referenceMax={biomarker?.referenceMax}
              status={detail.status}
            />
          ) : (
            <VerticalRangeChart
              value={detail.value}
              refMin={biomarker?.referenceMin}
              refMax={biomarker?.referenceMax}
              optMin={detail.optimalRange.min}
              optMax={detail.optimalRange.max}
              status={detail.status}
            />
          )}
        </div>

        {/* Info Cards */}
        <div className="px-6 pt-6 grid grid-cols-2 gap-3">
          <div className="border border-borderColor rounded-lg p-3">
            <p className="text-xs text-secondary">Latest result</p>
            <p className={`text-lg font-semibold ${detail.status === "optimal" ? "text-biomarkerOptimal" : detail.status === "normal" ? "text-biomarkerNormal" : "text-biomarkerOutOfRange"}`}>
              {detail.value} <span className="text-xs text-secondary">{detail.unit}</span>
            </p>
          </div>
          <div className="border border-borderColor rounded-lg p-3">
            <p className="text-xs text-secondary">Optimal range</p>
            <p className="text-lg font-semibold text-biomarkerOptimal">
              {detail.optimalRange.min != null && detail.optimalRange.max != null
                ? <>{detail.optimalRange.min} - {detail.optimalRange.max} <span className="text-xs text-secondary">{detail.unit}</span></>
                : detail.optimalRange.max != null
                ? <>{"< "}{detail.optimalRange.max} <span className="text-xs text-secondary">{detail.unit}</span></>
                : detail.optimalRange.min != null
                ? <>{"> "}{detail.optimalRange.min} <span className="text-xs text-secondary">{detail.unit}</span></>
                : <span className="text-secondary text-sm">Not established</span>
              }
            </p>
          </div>
        </div>

        {/* Key Insight */}
        <div className="px-6 pt-4">
          <InsightCard title={detail.insight.title} body={detail.insight.body} cta={detail.insight.cta} />
        </div>

        {/* Ask Cyborg AI */}
        <div className="px-6 pt-6">
          <h3 className="text-lg font-semibold text-gray-900">Ask Cyborg AI</h3>
          <div className="mt-3 space-y-3">
            {detail.questions.map((q) => (
              <AskItem key={q} text={q} />
            ))}
          </div>
        </div>

        {detail.description && (
          <div className="px-6 pt-6">
            <h3 className="text-lg font-semibold text-gray-900">What is {detail.name}</h3>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              {detail.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
