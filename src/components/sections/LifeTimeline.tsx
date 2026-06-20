"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";

/**
 * "Unlock all the potential your life holds" — superpower.com's signature finale.
 * The camera TRAVELS ALONG a life-timeline: the current point (the orange→white
 * head) stays at the vertical centre while the curve scrolls past on a gentle
 * diagonal slant. Orange = past, white = future. Only the active milestone is lit.
 * Ends with two rising orange sun-beams in the bottom corners.
 *
 * Milestone (x,y) are the curve anchors (the curve passes exactly through them via
 * a Catmull-Rom spline), placed at the same screen positions as the reference:
 * AGE 31 ~70%, AGE 41 ~31%, AGE 45 ~21%, AGE 60 ~61% — i.e. on the slant, not the
 * turns. The camera follows vertically so each is centred when active.
 */

const VBW = 1280;
const VBH = 720;
const CENTER_Y = 360;

type Milestone = {
  x: number;
  y: number;
  age: string;
  title: string;
  notes?: string[];
  align: "left" | "right";
};

const MILESTONES: Milestone[] = [
  { x: 195, y: 250, age: "BORN", title: "C-Section", notes: ["Microbiome optimization", "Genetic test"], align: "right" },
  { x: 980, y: 730, age: "AGE 26", title: "Gut health protocol", notes: ["Personalized probiotic", "Gut lining peptides"], align: "left" },
  { x: 800, y: 1210, age: "AGE 31", title: "Fertility protocol", notes: ["Pre-natal vitamin stack", "Post-partum nutrients"], align: "left" },
  { x: 300, y: 1690, age: "AGE 41", title: "Hormone optimization protocol", notes: ["Testosterone", "Estrogen"], align: "right" },
  { x: 175, y: 2170, age: "AGE 45", title: "Disease prevention program", notes: ["Full body MRI", "Grail cancer screening"], align: "right" },
  { x: 600, y: 2650, age: "AGE 60", title: "Longevity protocol", notes: ["Prevent Alzheimer's, heart disease, cancer", "Reduce skin age"], align: "right" },
  { x: 940, y: 3180, age: "AGE 120", title: "Aging goal", align: "left" },
];

// Smooth Catmull-Rom spline through the milestone anchors.
function buildPath(pts: Array<[number, number]>): string {
  const d = [`M ${pts[0][0]} ${pts[0][1]}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? pts[i + 1];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d.push(`C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`);
  }
  return d.join(" ");
}

const PATH = buildPath(MILESTONES.map((m) => [m.x, m.y] as [number, number]));

function MilestoneNode({ m, headY }: { m: Milestone; headY: MotionValue<number> }) {
  const top = useTransform(headY, (h) => `${((m.y - h + CENTER_Y) / VBH) * 100}%`);
  const opacity = useTransform(headY, (h) => {
    const d = Math.abs(h - m.y);
    if (d <= 70) return 1;
    return Math.max(0.16, 1 - (d - 70) / 420);
  });
  const right = m.align === "right";

  return (
    <motion.div
      className="absolute z-20"
      style={{ left: `${(m.x / VBW) * 100}%`, top, opacity }}
    >
      <span className="absolute left-0 top-0 h-[110px] w-px -translate-x-1/2 bg-white/12" />
      <div
        className={
          "absolute bottom-3 w-[300px] " +
          (right ? "left-4 text-left" : "right-4 text-right")
        }
      >
        <div className={"flex items-center gap-2 " + (right ? "justify-start" : "justify-end")}>
          {!right && <span className="h-[7px] w-[7px] rounded-[2px] border border-[#ff7a00]" />}
          <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#ff7a00]">
            {m.age}
          </span>
          {right && <span className="h-[7px] w-[7px] rounded-[2px] border border-[#ff7a00]" />}
        </div>
        <p className="mt-1 text-lg font-medium text-white md:text-xl">{m.title}</p>
        {m.notes && (
          <ul className="mt-1.5 space-y-1">
            {m.notes.map((n) => (
              <li key={n} className="text-[13px] text-white/55">
                {right ? `› ${n}` : `${n} ‹`}
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}

export function LifeTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const samples = useRef<Array<[number, number]>>([]);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const headX = useMotionValue(MILESTONES[0].x);
  const headY = useMotionValue(MILESTONES[0].y);
  const ty = useTransform(headY, (h) => CENTER_Y - h);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const total = path.getTotalLength();
    const N = 700;
    const pts: Array<[number, number]> = [];
    for (let i = 0; i <= N; i++) {
      const pt = path.getPointAtLength((total * i) / N);
      pts.push([pt.x, pt.y]);
    }
    samples.current = pts;
    const apply = (p: number) => {
      const a = samples.current;
      if (!a.length) return;
      const i = Math.min(a.length - 1, Math.max(0, Math.round(p * (a.length - 1))));
      headX.set(a[i][0]);
      headY.set(a[i][1]);
    };
    apply(scrollYProgress.get());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const a = samples.current;
    if (!a.length) return;
    const i = Math.min(a.length - 1, Math.max(0, Math.round(p * (a.length - 1))));
    headX.set(a[i][0]);
    headY.set(a[i][1]);
  });

  const headingOpacity = useTransform(scrollYProgress, [0, 0.04, 0.1, 0.8, 0.9], [0, 0, 1, 1, 0]);
  const pathLength = useTransform(scrollYProgress, [0, 0.8], [0, 1]);
  const headLeft = useTransform(headX, (x) => `${(x / VBW) * 100}%`);

  // Ending (1:15–1:18): the whole curve recedes + fades, then a fiery sun rises
  // from the bottom (same feel as the opening sunrise), engulfing the screen.
  const recedeScale = useTransform(scrollYProgress, [0.72, 0.84], [1, 0.38]);
  const recedeFade = useTransform(scrollYProgress, [0.74, 0.84], [1, 0]);
  const headFade = useTransform(scrollYProgress, [0.72, 0.8], [1, 0]);
  const sunH = useTransform(scrollYProgress, [0.74, 0.98], ["0vh", "180vh"]);
  const sunOpacity = useTransform(scrollYProgress, [0.74, 0.82], [0, 1]);

  return (
    <section ref={ref} className="relative h-[640vh] bg-black">
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div
          style={{ opacity: headingOpacity }}
          className="pointer-events-none absolute inset-x-0 top-[6vh] z-30 text-center"
        >
          <h2 className="mx-auto max-w-[680px] text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-white md:text-[56px]">
            Unlock all the potential your life holds
          </h2>
        </motion.div>

        {/* Curve + milestones + head — recede (shrink + fade) at the very end */}
        <motion.div
          className="absolute inset-0 origin-center"
          style={{ scale: recedeScale, opacity: recedeFade }}
        >
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox={`0 0 ${VBW} ${VBH}`}
            preserveAspectRatio="none"
          >
            <motion.g style={{ y: ty }}>
              <path
                ref={pathRef}
                d={PATH}
                fill="none"
                stroke="rgba(255,255,255,0.55)"
                strokeWidth={2.2}
                strokeLinecap="round"
              />
              <motion.path
                d={PATH}
                fill="none"
                stroke="#ff7a00"
                strokeWidth={3.2}
                strokeLinecap="round"
                style={{
                  pathLength,
                  filter: "drop-shadow(0 0 6px #ff7a00) drop-shadow(0 0 16px #ff3d00)",
                }}
              />
            </motion.g>
          </svg>

          {MILESTONES.map((m) => (
            <MilestoneNode key={m.age} m={m} headY={headY} />
          ))}

          {/* Glowing head dot at the orange→white boundary */}
          <motion.div
            className="absolute top-1/2 z-30 h-[12px] w-[12px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff7a00]"
            style={{ left: headLeft, opacity: headFade, boxShadow: "0 0 14px 5px rgba(255,122,0,0.9)" }}
          />

          {/* Depth vignette */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background:
                "radial-gradient(125% 78% at 50% 50%, rgba(0,0,0,0) 32%, rgba(0,0,0,0.5) 64%, #000 90%)",
            }}
          />
        </motion.div>

        {/* Sunrise ending: a fiery sun rises from the bottom (like the opening) */}
        <motion.div
          aria-hidden
          style={{
            height: sunH,
            opacity: sunOpacity,
            borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
            background:
              "radial-gradient(115% 112% at 50% 0%, #fff6e0 0%, #ffd24d 11%, #ff9000 25%, #ff3000 43%, #9a0f00 59%, rgba(0,0,0,0) 80%)",
          }}
          className="pointer-events-none absolute bottom-0 left-1/2 z-40 w-[165vw] -translate-x-1/2"
        />
      </div>
    </section>
  );
}
