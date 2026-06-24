"use client";

import { useState } from "react";
import { supplementImage } from "@/utils/supplementImage";

/* ---------- tokens ---------- */

const FLAG = {
  "out of range": { dot: "bg-[#F865DD]", text: "text-[#F865DD]", label: "OUT OF RANGE" },
  low: { dot: "bg-red-500", text: "text-red-500", label: "LOW" },
  high: { dot: "bg-amber-500", text: "text-amber-600", label: "HIGH" },
  elevated: { dot: "bg-amber-500", text: "text-amber-600", label: "ELEVATED" },
  borderline: { dot: "bg-amber-500", text: "text-amber-600", label: "BORDERLINE" },
  normal: { dot: "bg-yellow-500", text: "text-yellow-600", label: "NORMAL" },
  optimal: { dot: "bg-emerald-500", text: "text-emerald-600", label: "OPTIMAL" },
};
const flagOf = (f = "") => FLAG[String(f).toLowerCase()] || FLAG.normal;

const PRIORITY = {
  High: "bg-rose-100 text-rose-600",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-emerald-100 text-emerald-700",
};

const GRADE = {
  A: "border-emerald-500 text-emerald-600",
  B: "border-yellow-400 text-yellow-600",
  C: "border-orange-500 text-orange-600",
  D: "border-red-500 text-red-600",
  F: "border-red-700 text-red-700",
};

// Position of the marker dot along a small range bar, from the flag.
const barPos = (f = "") => {
  const k = String(f).toLowerCase();
  if (k.includes("low")) return 12;
  if (k.includes("out")) return 90;
  if (k.includes("high") || k.includes("elevated") || k.includes("borderline")) return 76;
  if (k.includes("optimal")) return 52;
  return 46;
};

/* ---------- small parts ---------- */

function RangeBar({ flag }) {
  const f = flagOf(flag);
  const pos = barPos(flag);
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <div className="relative h-1.5 w-20 rounded-full bg-gradient-to-r from-rose-100 via-yellow-50 to-emerald-100">
        <span
          className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${f.dot}`}
          style={{ left: `${pos}%` }}
        />
      </div>
      <svg className="h-3.5 w-4" viewBox="0 0 16 14" fill="none" aria-hidden="true">
        <rect x="1" y="7" width="2.4" height="6" rx="1" className="fill-emerald-400" />
        <rect x="5.2" y="3" width="2.4" height="10" rx="1" className="fill-emerald-500" />
        <rect x="9.4" y="5" width="2.4" height="8" rx="1" className="fill-rose-400" />
      </svg>
    </div>
  );
}

function BiomarkerRow({ b }) {
  const f = flagOf(b.flag);
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-borderColor bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-medium text-blue">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${f.dot}`} />
          <span className="truncate">{b.name}</span>
        </p>
        <p className="mt-0.5 text-xs text-secondary">{b.value} {b.unit}</p>
      </div>
      <RangeBar flag={b.flag} />
    </div>
  );
}

function GradientSection({ n, title, grad, open, onToggle, children }) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between rounded-2xl bg-gradient-to-br ${grad} px-5 py-5 text-left shadow-sm transition active:scale-[0.995]`}
      >
        <div>
          <span className="text-[11px] font-medium uppercase tracking-wide text-white/75">{n} of 5</span>
          <h2 className="mt-1 text-2xl font-bold text-white">{title}</h2>
        </div>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/20 text-white">
          <svg className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </span>
      </button>
      {open && <div className="px-1 pb-2 pt-5">{children}</div>}
    </div>
  );
}

function Disclosure({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-borderColor last:border-0">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between py-4 text-left">
        <span className="text-base font-semibold text-blue">{title}</span>
        <svg className={`h-4 w-4 text-secondary transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

/* ---------- sections ---------- */

function Overview() {
  const items = [
    ["Health Report", "An explanation of your Cyborg Score, biological age and biomarkers, which track your health across 7 dimensions."],
    ["Monitored Issues", "The core issues we are monitoring based on your data, together with a root-cause analysis."],
    ["Protocol", "Your custom recommendations and the next steps you can take to superpower your health."],
  ];
  return (
    <div>
      <p className="text-[15px] leading-relaxed text-secondary">
        At the core of your Cyborg Health experience is your personal report, which steps through:
      </p>
      <ol className="mt-4 space-y-4">
        {items.map(([t, d], i) => (
          <li key={t} className="flex gap-3">
            <span className="text-sm font-bold text-blue">{i + 1}.</span>
            <span>
              <span className="block text-sm font-semibold text-blue">{t}</span>
              <span className="mt-0.5 block text-sm leading-relaxed text-secondary">{d}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-5 text-[15px] text-blue">Here&apos;s the data we reviewed to create your report:</p>
      <ul className="mt-2 space-y-1.5 text-sm text-secondary">
        {["Latest and historical blood test results", "Messaging with your care team and Cyborg AI", "Your health intake survey responses"].map((x) => (
          <li key={x} className="flex gap-2.5"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue/40" />{x}</li>
        ))}
      </ul>
    </div>
  );
}

function HealthReport({ hr, thesis }) {
  const score = hr?.cyborgScore?.final ?? hr?.cyborgScore ?? null;
  const bio = Number(hr?.bioAge?.phenoAge ?? hr?.bioAge);
  const bioStr = Number.isFinite(bio) ? bio.toFixed(1) : "—";
  const delta = hr?.bioAge?.delta;
  const mc = hr?.markerCounts || {};
  const grades = Object.entries(hr?.categoryGrades || {});
  return (
    <div>
      {thesis?.title && (
        <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-white p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Clinical Thesis</p>
          <h3 className="mt-2 text-lg font-bold leading-snug text-blue">{thesis.title}</h3>
          {thesis.reasoning && <p className="mt-2 text-sm leading-relaxed text-secondary">{thesis.reasoning}</p>}
        </div>
      )}
      <p className="mt-5 text-[15px] leading-relaxed text-blue">
        Your Health Report distills your Cyborg Score, Biological Age and Biomarkers to show how your health tracks across your categories.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-borderColor bg-white p-4">
          <p className="text-xs font-medium text-secondary">Cyborg Score</p>
          <p className="mt-1 text-[28px] font-bold leading-none text-blue">{score != null ? Math.round(score) : "—"}</p>
          <p className="mt-2 text-xs text-secondary">{score >= 80 ? "You're very healthy. Keep going!" : "Room to improve."}</p>
        </div>
        <div className="rounded-2xl border border-borderColor bg-white p-4">
          <p className="text-xs font-medium text-secondary">Biological age</p>
          <p className="mt-1 text-[28px] font-bold leading-none text-blue">{bioStr}</p>
          <p className="mt-2 text-xs text-secondary">{delta != null ? `${Math.abs(delta)} years ${delta >= 0 ? "younger" : "older"} than your actual age` : "PhenoAge estimate"}</p>
        </div>
      </div>
      {(mc.total != null) && (
        <div className="mt-3 rounded-2xl border border-borderColor bg-white p-5">
          <p className="text-sm font-bold text-blue">Biomarkers</p>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            {[["Total", mc.total], ["Optimal", mc.optimal], ["Normal", mc.inRange ?? mc.normal], ["Out of Range", mc.outOfRange]].map(([l, v]) => (
              <div key={l}>
                <p className="text-xl font-bold text-blue">{v ?? 0}</p>
                <p className="text-[11px] text-secondary">{l}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-borderColor">
            <div className="flex h-full">
              <div className="bg-emerald-500" style={{ width: `${pct(mc.optimal, mc.total)}%` }} />
              <div className="bg-yellow-400" style={{ width: `${pct(mc.inRange ?? mc.normal, mc.total)}%` }} />
              <div className="bg-[#F865DD]" style={{ width: `${pct(mc.outOfRange, mc.total)}%` }} />
            </div>
          </div>
        </div>
      )}
      {grades.length > 0 && (
        <div className="mt-5">
          <h3 className="text-lg font-bold text-blue">Overview</h3>
          <p className="mt-1 text-sm text-secondary">We have processed 100+ biomarkers to provide you with this comprehensive report.</p>
          <div className="mt-4 grid grid-cols-2 gap-y-4">
            {grades.map(([k, v]) => {
              const g = String(v?.grade ?? v).toUpperCase();
              return (
                <div key={k} className="flex items-center gap-2.5">
                  <span className={`grid h-7 w-7 place-items-center rounded-full border-2 text-xs font-bold ${GRADE[g] || "border-zinc-300 text-zinc-400"}`}>{g}</span>
                  <span className="text-sm text-blue">{humanize(k)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MonitoredIssues({ issues }) {
  return (
    <div>
      <p className="text-[15px] leading-relaxed text-secondary">
        Monitored issues highlight potential health concerns based on your test results to focus on — pinpointing areas for proactive care.
      </p>
      <p className="mt-3 text-[15px] text-blue">We detected <b>{issues.length} monitored issue{issues.length === 1 ? "" : "s"}</b> you should be aware of.</p>
      <div className="mt-5 space-y-9">
        {issues.map((g, i) => {
          const evidence = Array.isArray(g.biomarkerEvidence) ? g.biomarkerEvidence : [];
          const actions = Array.isArray(g.recommendedActions) ? g.recommendedActions : [];
          return (
            <div key={g.goalId || i}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-bold leading-tight text-blue">{i + 1}. {g.title}</h3>
                {g.priority && <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${PRIORITY[g.priority] || PRIORITY.Medium}`}>{g.priority} priority</span>}
              </div>
              {g.description && <p className="mt-2 text-sm leading-relaxed text-secondary">{g.description}</p>}
              {evidence.length > 0 && (
                <div className="mt-4 space-y-2.5">
                  {evidence.map((b, j) => <BiomarkerRow key={(b.name || "") + j} b={b} />)}
                </div>
              )}
              {g.whatThisMeans && <Block title="What this means:" body={g.whatThisMeans} />}
              {g.potentialCauses && <Block title="Potential Causes:" body={g.potentialCauses} />}
              {actions.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-bold text-blue">Recommended Actions:</p>
                  <div className="mt-2 space-y-3">
                    {actions.map((a, j) => (
                      <div key={j}>
                        <p className="text-sm font-semibold text-primary">{j + 1}. {a.label || a}</p>
                        {a.detail && <p className="mt-0.5 text-sm leading-relaxed text-secondary">{a.detail}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProtocolSection({ protocol, thesis, issues }) {
  const ls = protocol?.lifestyle || {};
  const redFlags = (issues || []).flatMap((g) => (g.biomarkerEvidence || []))
    .filter((b) => !/optimal|normal/i.test(b.flag || ""))
    .slice(0, 4);
  return (
    <div>
      <p className="text-[15px] leading-relaxed text-secondary">
        Cyborg has designed a personal protocol to target your monitored issues. Each lever below is mapped to the markers it moves — follow it, re-test, and watch the numbers shift.
      </p>
      {thesis?.reasoning && (
        <div className="mt-4 rounded-2xl border-l-4 border-primary bg-purple-50/50 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">How these connect — the system view</p>
          <p className="mt-2 text-sm leading-relaxed text-secondary">{thesis.reasoning}</p>
        </div>
      )}
      <div className="mt-5">
        <Disclosure title="Lifestyle">
          <LifeList items={[...(ls.sleep || []), ...(ls.exercise || []), ...(ls.stress || [])]} />
        </Disclosure>
        <Disclosure title="Nutrition"><LifeList items={protocol?.nutrition || []} /></Disclosure>
        <Disclosure title="Supplements">
          {(protocol?.supplements || []).length ? (
            <div className="space-y-3">
              {protocol.supplements.map((s, i) => (
                <div key={i} className="rounded-2xl border border-borderColor p-4">
                  <p className="text-sm font-semibold text-blue">{s.name} {s.dose && <span className="font-normal text-secondary">· {s.dose}</span>}</p>
                  {s.whyItMatters && <p className="mt-1 text-sm leading-relaxed text-secondary">{s.whyItMatters}</p>}
                  {s.timing && <p className="mt-1 text-xs text-primary">{s.timing}</p>}
                </div>
              ))}
            </div>
          ) : <Empty />}
        </Disclosure>
        <Disclosure title="Diagnostic Tests">
          {(protocol?.diagnosticTests || []).length ? (
            <div className="space-y-3">
              {protocol.diagnosticTests.map((t, i) => (
                <div key={i} className="rounded-2xl border border-borderColor p-4">
                  <p className="text-sm font-semibold text-blue">{t.name}</p>
                  {t.whyTestIt && <p className="mt-1 text-sm leading-relaxed text-secondary">{t.whyTestIt}</p>}
                </div>
              ))}
            </div>
          ) : <Empty />}
        </Disclosure>
      </div>
      {redFlags.length > 0 && (
        <div className="mt-7">
          <h3 className="text-lg font-bold text-blue">Red flags</h3>
          <div className="mt-3 space-y-3">
            {redFlags.map((b, i) => {
              const f = flagOf(b.flag);
              return (
                <div key={i} className="rounded-2xl bg-[#17171b] p-4 text-white">
                  <div className="flex items-baseline justify-between">
                    <p className="font-semibold">{b.name}</p>
                    <p className="text-sm">{b.value} <span className="text-white/60">{b.unit}</span></p>
                  </div>
                  <p className={`mt-0.5 text-[11px] font-bold ${f.text}`}>{f.label}</p>
                  <div className="mt-2 h-1 rounded-full bg-white/10"><div className={`h-full rounded-full ${f.dot}`} style={{ width: `${barPos(b.flag)}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function NextSteps({ next }) {
  const checkpoints = Array.isArray(next?.checkpoints) ? next.checkpoints : [];
  const products = Array.isArray(next?.recommendedProducts) ? next.recommendedProducts : [];
  return (
    <div>
      {checkpoints.length > 0 && (
        <>
          <h3 className="text-lg font-bold text-blue">Your re-test timeline</h3>
          <p className="mt-1 text-sm text-secondary">Tap a checkpoint to mark it done. Re-testing on this cadence is how we confirm the plan is working.</p>
          <div className="mt-4 space-y-5">
            {checkpoints.map((c, i) => (
              <div key={i} className="flex gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-borderColor" />
                <div>
                  <p className="text-sm font-semibold text-blue">{c.label || `Week ${c.weekNumber}`}</p>
                  {c.description && <p className="mt-0.5 text-sm leading-relaxed text-secondary">{c.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {next?.text && <p className="mt-5 text-sm leading-relaxed text-secondary">{next.text}</p>}
      {products.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-semibold text-blue">{products.length} item{products.length === 1 ? "" : "s"} recommended for you</p>
          <div className="mt-3 space-y-2.5">
            {products.map((p, i) => {
              const img = supplementImage(p.productName);
              return (
                <div key={i} className="flex items-center justify-between gap-3 rounded-2xl border border-borderColor bg-white p-3">
                  <div className="flex items-center gap-3">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={p.productName} className="h-10 w-10 shrink-0 rounded-xl border border-borderColor bg-white object-contain p-0.5" />
                    ) : (
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pageBackground text-secondary">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none"><path d="M9 3v6l-5 9a2 2 0 0 0 1.8 3h12.4A2 2 0 0 0 20 18l-5-9V3" stroke="currentColor" strokeWidth="1.6" /></svg>
                      </span>
                    )}
                    <div>
                      <p className="text-sm font-medium text-blue">{p.productName}</p>
                      {p.price != null && <p className="text-xs text-secondary">${p.price}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- shared tiny helpers ---------- */
const pct = (a, total) => (total ? Math.round(((a || 0) / total) * 100) : 0);
const humanize = (k = "") => k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const Block = ({ title, body }) => (
  <div className="mt-4">
    <p className="text-sm font-bold text-blue">{title}</p>
    <p className="mt-1 text-sm leading-relaxed text-secondary">{body}</p>
  </div>
);
const LifeList = ({ items }) => items?.length ? (
  <ul className="space-y-2">
    {items.map((it, i) => <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-secondary"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />{it.text || it}</li>)}
  </ul>
) : <Empty />;
const Empty = () => <p className="py-2 text-sm text-secondary">Nothing here yet.</p>;

/* ---------- main ---------- */

export default function ActionPlan({ plan, userName = "Your" }) {
  const [open, setOpen] = useState("health"); // one section open at a time
  const toggle = (k) => setOpen((cur) => (cur === k ? null : k));

  const date = plan?.createdAt ? new Date(plan.createdAt) : null;
  const sections = [
    { key: "overview", n: 1, title: "Overview", grad: "from-orange-400 to-orange-600", body: <Overview /> },
    { key: "health", n: 2, title: "Health Report", grad: "from-purple-400 to-stone-300", body: <HealthReport hr={plan?.healthReport} thesis={plan?.clinicalThesis} /> },
    { key: "issues", n: 3, title: "Monitored Issues", grad: "from-emerald-800 to-emerald-950", body: <MonitoredIssues issues={plan?.monitoredIssues || []} /> },
    { key: "protocol", n: 4, title: "Protocol", grad: "from-red-500 to-red-900", body: <ProtocolSection protocol={plan?.protocol} thesis={plan?.clinicalThesis} issues={plan?.monitoredIssues} /> },
    { key: "next", n: 5, title: "Next Steps", grad: "from-amber-300 to-amber-500", body: <NextSteps next={plan?.nextSteps ? { ...plan.nextSteps, checkpoints: plan.checkpoints } : { checkpoints: plan?.checkpoints }} /> },
  ];

  return (
    <div className="mx-auto w-full max-w-[640px]">
      <h1 className="text-3xl font-bold tracking-tight text-blue">{userName}&apos;s Action Plan</h1>
      {date && <p className="mt-1 text-sm text-secondary">{date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}</p>}
      <div className="mt-5 space-y-3">
        {sections.map((s) => (
          <GradientSection key={s.key} n={s.n} title={s.title} grad={s.grad} open={open === s.key} onToggle={() => toggle(s.key)}>
            {s.body}
          </GradientSection>
        ))}
      </div>
    </div>
  );
}
