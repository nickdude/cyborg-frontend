"use client";

/**
 * "Your past lab was uploaded" card (Superpower-style, orange edition).
 * The line graph plots REAL report data — never fabricated points:
 *   • ≥2 reports of history → the user's health-profile score (share of biomarkers
 *     in optimal/reference range) at each real report date, labelled by date.
 *   • A single report → the real average health-position per biomarker category.
 * Renders nothing when there isn't enough real data to draw a line.
 */

function inRange(v, lo, hi) {
  if (v == null || isNaN(v) || lo == null || hi == null) return null;
  return v >= lo && v <= hi;
}

// A biomarker's 0–100 health position — numeric when ranges exist, else from status.
function positionOf(b) {
  const lo = b.optimalRange?.min ?? b.referenceMin;
  const hi = b.optimalRange?.max ?? b.referenceMax;
  const v = parseFloat(b.value);
  if (!isNaN(v) && lo != null && hi != null && hi > lo) {
    return Math.round(Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100)));
  }
  const map = { optimal: 92, normal: 68, out_of_range: 28, high: 30, low: 30, borderline: 50 };
  return map[String(b.status || "").toLowerCase()] ?? null;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtDate(d) {
  const parts = String(d || "").split("-").map(Number);
  if (parts.length < 3 || !parts[0]) return "";
  return `${MONTHS[(parts[1] || 1) - 1]} ${parts[2] || ""}`.trim();
}
function shortCat(c) {
  const s = String(c || "");
  return s.length > 11 ? s.slice(0, 10) + "…" : s;
}

// Build a real { points, labels, mode } series from the loaded biomarkers.
export function buildLabTrend(biomarkers) {
  if (!Array.isArray(biomarkers) || biomarkers.length === 0) return null;

  // Preferred: real health-score over time (needs ≥2 reports of history).
  const withTrend = biomarkers.filter((b) => Array.isArray(b.trend) && b.trend.filter((v) => !isNaN(v)).length > 1);
  const maxLen = withTrend.reduce((mx, b) => Math.max(mx, b.trend.length), 0);
  if (maxLen >= 2) {
    const series = [];
    for (let i = 0; i < maxLen; i++) {
      let inC = 0;
      let tot = 0;
      for (const b of withTrend) {
        const idx = b.trend.length - maxLen + i; // align to the newest point
        if (idx < 0) continue;
        const r = inRange(Number(b.trend[idx]), b.optimalRange?.min ?? b.referenceMin, b.optimalRange?.max ?? b.referenceMax);
        if (r !== null) {
          tot++;
          if (r) inC++;
        }
      }
      if (tot > 0) series.push(Math.round((inC / tot) * 100));
    }
    if (series.length >= 2) {
      const spanBm = withTrend.find((b) => b.trend.length === maxLen && Array.isArray(b.trendDates));
      const labels = spanBm ? spanBm.trendDates.slice(-series.length).map(fmtDate) : series.map(() => "");
      return { points: series, labels, mode: "time" };
    }
  }

  // Fallback: real average health-position per biomarker category (current report).
  const byCat = new Map();
  for (const b of biomarkers) {
    const pos = positionOf(b);
    if (pos == null) continue;
    const c = b.category || "Other";
    if (!byCat.has(c)) byCat.set(c, []);
    byCat.get(c).push(pos);
  }
  const entries = [...byCat.entries()].map(([c, arr]) => [c, Math.round(arr.reduce((a, x) => a + x, 0) / arr.length)]);
  if (entries.length >= 2) {
    return { points: entries.map((e) => e[1]), labels: entries.map((e) => shortCat(e[0])), mode: "category" };
  }

  const snap = biomarkers.map(positionOf).filter((x) => x != null).slice(-10);
  return snap.length >= 2 ? { points: snap, labels: snap.map(() => ""), mode: "snap" } : null;
}

export default function LabUploadedCard({ biomarkers, onClose, onViewData }) {
  const trend = buildLabTrend(biomarkers);
  if (!trend) return null;

  const { points, labels, mode } = trend;
  const count = Array.isArray(biomarkers) ? biomarkers.length : 0;
  const caption = mode === "time" ? "Health score across your reports" : "Health score across systems";

  // Geometry — phone-width card so the SVG scales without distorting the dots.
  const W = 360;
  const H = 176;
  const padX = 28;
  const padTop = 30;
  const padBot = 40;
  const plotW = W - padX * 2;
  const plotH = H - padTop - padBot;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const pts = points.map((v, i) => {
    const x = padX + (points.length === 1 ? 0.5 : i / (points.length - 1)) * plotW;
    const norm = max === min ? 0.5 : (v - min) / range;
    const y = padTop + (1 - norm) * plotH;
    return [x, y];
  });
  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `M ${padX},${H - padBot} L ${line.split(" ").join(" L ")} L ${W - padX},${H - padBot} Z`;
  const last = pts[pts.length - 1];
  const yBase = H - padBot;
  const yMid = padTop + plotH / 2;

  // Only label a few x-positions so the axis never crowds.
  const showIdx = new Set([0, pts.length - 1]);
  if (pts.length >= 3) showIdx.add(Math.floor((pts.length - 1) / 2));

  return (
    <div className="mx-auto w-full max-w-[440px] overflow-hidden rounded-[26px] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.12)]">
      {/* Green graph */}
      <div className="relative bg-gradient-to-br from-[#f2a355] via-[#e07b34] to-[#c1531a]">
        <span className="absolute right-4 top-4 z-10 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#c1531a] shadow-sm">
          New data
        </span>
        <span className="absolute left-5 top-4 z-10 text-[11px] font-medium text-white/80">{caption}</span>
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-[196px] w-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="labArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* faint y gridlines + value labels (real min / mid / max of the series) */}
          {[padTop, yMid, yBase].map((gy, i) => (
            <line key={i} x1={padX} y1={gy} x2={W - padX} y2={gy} stroke="#ffffff" strokeOpacity="0.16" strokeWidth="1" />
          ))}
          <text x={padX} y={padTop - 5} fill="#ffffff" fillOpacity="0.75" fontSize="10">{max}</text>
          <text x={padX} y={yMid - 4} fill="#ffffff" fillOpacity="0.6" fontSize="10">{Math.round((max + min) / 2)}</text>
          <text x={padX} y={yBase - 4} fill="#ffffff" fillOpacity="0.6" fontSize="10">{min}</text>
          {/* dashed marker at the newest point */}
          <line x1={last[0]} y1={padTop - 6} x2={last[0]} y2={yBase} stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1" strokeDasharray="3 3" />
          {/* area + line */}
          <path d={area} fill="url(#labArea)" />
          <polyline points={line} fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {pts.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 5 : 3.5} fill="#ffffff" stroke="#c1531a" strokeWidth={i === pts.length - 1 ? 2 : 0} />
          ))}
          {/* x-axis labels — real report dates (time) or category names */}
          {pts.map(([x], i) =>
            showIdx.has(i) && labels[i] ? (
              <text
                key={`l${i}`}
                x={Math.min(W - 4, Math.max(4, x))}
                y={H - 12}
                fill="#ffffff"
                fillOpacity="0.85"
                fontSize="10"
                textAnchor={i === 0 ? "start" : i === pts.length - 1 ? "end" : "middle"}
              >
                {labels[i]}
              </text>
            ) : null
          )}
        </svg>
      </div>

      {/* White footer */}
      <div className="px-6 py-5">
        <h3 className="text-[19px] font-semibold text-black">Your past lab was uploaded</h3>
        <p className="mt-1 text-sm leading-snug text-secondary">
          Your health profile was just updated with {count} new data point{count === 1 ? "" : "s"} in your twin.
        </p>
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full py-3 text-sm font-medium text-black transition hover:bg-pageBackground"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onViewData}
            className="flex-1 rounded-full bg-black py-3 text-sm font-medium text-white transition hover:bg-gray-900"
          >
            View Data
          </button>
        </div>
      </div>
    </div>
  );
}
