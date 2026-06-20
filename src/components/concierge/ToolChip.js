"use client";
import { useState } from "react";
import {
  ChevronRight,
  Loader2,
  Stethoscope,
  Activity,
  Globe,
  BookOpen,
  Pill,
  MessageSquare,
  History,
  Brain,
  Database,
  Search,
  UtensilsCrossed,
} from "lucide-react";

const TOOL_META = {
  getMedicalData: {
    running: "Reading medical data…",
    done: "Read medical data",
    Icon: Stethoscope,
  },
  getWearableData: {
    running: "Checking wearable data…",
    done: "Checked wearable data",
    Icon: Activity,
  },
  webSearch: {
    running: "Searching the web…",
    done: "Searched the web",
    Icon: Globe,
  },
  searchMedicalEvidence: {
    running: "Searching medical literature…",
    done: "Searched medical literature",
    Icon: BookOpen,
  },
  searchMedicalEvidenceDeep: {
    running: "Deep-searching evidence…",
    done: "Searched medical literature",
    Icon: BookOpen,
  },
  suggestMedication: {
    running: "Preparing recommendation…",
    done: "Prepared recommendation",
    Icon: Pill,
  },
  searchChatHistory: {
    running: "Searching past chats…",
    done: "Searched past chats",
    Icon: History,
  },
  fetchFullChat: {
    running: "Loading past chat…",
    done: "Loaded past chat",
    Icon: MessageSquare,
  },
  saveMemory: {
    running: "Saving to memory…",
    done: "Saved to memory",
    Icon: Brain,
  },
  recallMemories: {
    running: "Recalling memories…",
    done: "Recalled memories",
    Icon: Brain,
  },
  getSchemaInfo: {
    running: "Inspecting schema…",
    done: "Inspected schema",
    Icon: Database,
  },
  getMealData: {
    running: "Checking meal history…",
    done: "Checked meal history",
    Icon: UtensilsCrossed,
  },
};

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// "daysRequested" / "result_count" -> "Days Requested" / "Result Count"
function humanizeKey(key) {
  const spaced = String(key)
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function ScalarValue({ value }) {
  if (value === null || value === undefined)
    return <span className="italic text-secondary">—</span>;
  if (typeof value === "boolean")
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
          value ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
        }`}
      >
        {value ? "Yes" : "No"}
      </span>
    );
  if (typeof value === "number")
    return <span className="font-medium tabular-nums text-blue">{value}</span>;
  const str = String(value);
  if (/^https?:\/\//i.test(str))
    return (
      <a
        href={str}
        target="_blank"
        rel="noreferrer noopener"
        className="break-all text-primary hover:underline"
      >
        {str}
      </a>
    );
  return <span className="break-words text-blue">{str}</span>;
}

// Recursively render any tool input/result value as readable cards (no raw JSON).
// `bare` skips the outer border/padding when the value sits directly inside a
// titled section card (which already provides the container).
function DataView({ value, bare = false }) {
  if (Array.isArray(value)) {
    if (value.length === 0)
      return (
        <div className={bare ? "px-4 py-3" : ""}>
          <span className="text-[12.5px] italic text-secondary">Empty</span>
        </div>
      );
    return (
      <div className={`space-y-1.5 ${bare ? "p-3" : ""}`}>
        {value.map((item, i) =>
          isPlainObject(item) || Array.isArray(item) ? (
            <div key={i} className="rounded-xl border border-borderColor bg-white p-2">
              <DataView value={item} />
            </div>
          ) : (
            <div
              key={i}
              className="flex items-baseline gap-2 rounded-xl border border-borderColor bg-white px-3 py-2 text-[12.5px]"
            >
              <span className="tabular-nums font-medium text-primary">{i + 1}.</span>
              <ScalarValue value={item} />
            </div>
          )
        )}
      </div>
    );
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0)
      return (
        <div className={bare ? "px-4 py-3" : ""}>
          <span className="text-[12.5px] italic text-secondary">No data</span>
        </div>
      );
    return (
      <div
        className={`divide-y divide-borderColor ${
          bare ? "" : "overflow-hidden rounded-xl border border-borderColor bg-white"
        }`}
      >
        {entries.map(([k, v]) => {
          const nested = isPlainObject(v) || Array.isArray(v);
          return nested ? (
            <div key={k} className="px-4 py-3">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {humanizeKey(k)}
              </div>
              <DataView value={v} />
            </div>
          ) : (
            <div
              key={k}
              className="flex items-baseline justify-between gap-3 px-4 py-3 transition-colors hover:bg-pageBackground"
            >
              <span className="shrink-0 text-[12.5px] font-medium text-secondary">
                {humanizeKey(k)}
              </span>
              <span className="min-w-0 text-right text-[12.5px]">
                <ScalarValue value={v} />
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`text-[12.5px] ${
        bare ? "px-4 py-3" : "rounded-xl border border-borderColor bg-white px-3 py-2.5"
      }`}
    >
      <ScalarValue value={value} />
    </div>
  );
}

export default function ToolChip({ block }) {
  const [open, setOpen] = useState(false);
  const { name, input, result, status } = block;
  const isRunning = status === "running";

  const meta = TOOL_META[name] || {
    running: `Calling ${name}…`,
    done: name,
    Icon: Search,
  };
  const ToolIcon = isRunning ? Loader2 : meta.Icon;

  return (
    <div className="my-2">
      <button
        type="button"
        onClick={() => !isRunning && setOpen((v) => !v)}
        className={`inline-flex items-center gap-2 text-xs rounded-lg px-3 py-2 transition-all duration-200 border ${
          isRunning
            ? "bg-primary/5 border-primary/10 text-primary"
            : "bg-white border-borderColor text-secondary hover:bg-pageBackground hover:border-lightGray cursor-pointer"
        }`}
      >
        <ToolIcon
          className={`w-3.5 h-3.5 shrink-0 ${
            isRunning ? "animate-spin text-primary" : "text-secondary"
          }`}
        />
        <span className="font-medium">
          {isRunning ? meta.running : meta.done}
        </span>
        {!isRunning && (
          <ChevronRight
            className={`w-3 h-3 text-secondary transition-transform duration-200 ${
              open ? "rotate-90" : ""
            }`}
          />
        )}
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ease-out ${
          open && !isRunning
            ? "max-h-[720px] opacity-100 mt-2"
            : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-3">
          {input !== undefined && input !== null && (
            <div className="overflow-hidden rounded-2xl border border-borderColor bg-white shadow-sm">
              <div className="bg-gradient-to-r from-slate-600 to-slate-800 px-4 py-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white">
                  Input
                </span>
              </div>
              <DataView value={input} bare />
            </div>
          )}
          <div className="overflow-hidden rounded-2xl border border-borderColor bg-white shadow-sm">
            <div className="bg-gradient-to-r from-primary to-purple-600 px-4 py-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white">
                Result
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              <DataView value={result} bare />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
