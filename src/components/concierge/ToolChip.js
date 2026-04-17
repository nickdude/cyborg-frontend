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

function prettyJson(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
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
            : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 cursor-pointer"
        }`}
      >
        <ToolIcon
          className={`w-3.5 h-3.5 shrink-0 ${
            isRunning ? "animate-spin text-primary" : "text-gray-400"
          }`}
        />
        <span className="font-medium">
          {isRunning ? meta.running : meta.done}
        </span>
        {!isRunning && (
          <ChevronRight
            className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
              open ? "rotate-90" : ""
            }`}
          />
        )}
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ease-out ${
          open && !isRunning
            ? "max-h-[500px] opacity-100 mt-2"
            : "max-h-0 opacity-0"
        }`}
      >
        <div className="text-[11px] border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50">
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-400 font-medium bg-gray-50 border-b border-gray-200">
            Input
          </div>
          <pre className="px-3 py-2 overflow-x-auto whitespace-pre-wrap text-gray-600 bg-white font-mono">
            {prettyJson(input)}
          </pre>
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-400 font-medium bg-gray-50 border-y border-gray-200">
            Result
          </div>
          <pre className="px-3 py-2 overflow-x-auto whitespace-pre-wrap text-gray-600 bg-white max-h-60 overflow-y-auto font-mono">
            {prettyJson(result)}
          </pre>
        </div>
      </div>
    </div>
  );
}
