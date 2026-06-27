"use client";
import { useId, useState } from "react";
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

export const TOOL_META = {
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

function prettyJson(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function RawPanel({ input, result, id }) {
  return (
    <div
      id={id}
      className="text-[11px] border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50"
    >
      <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-500 font-medium bg-gray-50 border-b border-gray-200">
        Input
      </div>
      <pre className="px-3 py-2 overflow-x-auto whitespace-pre-wrap break-all text-gray-600 bg-white font-mono">
        {prettyJson(input)}
      </pre>
      <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-500 font-medium bg-gray-50 border-y border-gray-200">
        Result
      </div>
      <pre className="px-3 py-2 overflow-x-auto whitespace-pre-wrap break-all text-gray-600 bg-white max-h-60 overflow-y-auto font-mono">
        {prettyJson(result)}
      </pre>
    </div>
  );
}

export default function ToolChip({ block, bare = false }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const { name, input, result, status } = block;
  const isRunning = status === "running";

  if (bare) {
    if (input === undefined && result === undefined) return null;
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-gray-500 hover:text-gray-700 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1"
        >
          <ChevronRight
            aria-hidden="true"
            className={`w-3 h-3 transition-transform ${open ? "rotate-90" : ""}`}
          />
          {open ? "Hide raw" : "View raw"}
        </button>
        {open && (
          <div className="mt-1.5">
            <RawPanel id={panelId} input={input} result={result} />
          </div>
        )}
      </div>
    );
  }

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
        aria-expanded={isRunning ? undefined : open}
        aria-controls={isRunning ? undefined : panelId}
        className={`flex max-w-full min-w-0 items-center gap-2 text-xs rounded-lg px-3 py-2 transition-all duration-200 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 ${
          isRunning
            ? "bg-primary/5 border-primary/10 text-primary"
            : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 cursor-pointer"
        }`}
      >
        <ToolIcon
          aria-hidden="true"
          className={`w-3.5 h-3.5 shrink-0 ${
            isRunning ? "animate-spin text-primary" : "text-gray-400"
          }`}
        />
        <span className="font-medium truncate">
          {isRunning ? meta.running : meta.done}
        </span>
        {!isRunning && (
          <ChevronRight
            aria-hidden="true"
            className={`w-3 h-3 shrink-0 text-gray-400 transition-transform duration-200 ${
              open ? "rotate-90" : ""
            }`}
          />
        )}
      </button>

      {open && !isRunning && (
        <div className="mt-2">
          <RawPanel id={panelId} input={input} result={result} />
        </div>
      )}
    </div>
  );
}
