"use client";
import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const DISPLAY = {
  getMedicalData: {
    running: "Reading your medical data",
    done: "Read medical data",
  },
  getWearableData: {
    running: "Checking wearable data",
    done: "Checked wearable data",
  },
  webSearch: { running: "Searching the web", done: "Searched the web" },
  searchMedicalEvidence: {
    running: "Searching medical evidence",
    done: "Searched medical evidence",
  },
  searchMedicalEvidenceDeep: {
    running: "Deep-searching medical evidence",
    done: "Searched medical evidence",
  },
  suggestMedication: {
    running: "Preparing a recommendation",
    done: "Prepared recommendation",
  },
  searchChatHistory: {
    running: "Searching past chats",
    done: "Searched past chats",
  },
  fetchFullChat: { running: "Loading past chat", done: "Loaded past chat" },
  saveMemory: { running: "Saving memory", done: "Saved memory" },
  recallMemories: { running: "Recalling memory", done: "Recalled memory" },
  getSchemaInfo: { running: "Inspecting schema", done: "Inspected schema" },
};

function label(name, status) {
  const d = DISPLAY[name];
  if (d) return status === "running" ? d.running : d.done;
  return status === "running" ? `Calling ${name}` : name;
}

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
  const isError = status === "error";

  const Icon = isRunning ? Loader2 : isError ? AlertCircle : CheckCircle2;
  const iconClass = isRunning
    ? "w-3.5 h-3.5 animate-spin text-purple-600"
    : isError
    ? "w-3.5 h-3.5 text-red-500"
    : "w-3.5 h-3.5 text-green-600";

  return (
    <div className="my-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-full px-3 py-1.5 transition"
      >
        <Icon className={iconClass} />
        <span>{label(name, status)}</span>
        {!isRunning &&
          (open ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          ))}
      </button>

      {open && !isRunning && (
        <div className="mt-2 text-[11px] border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-3 py-1.5 text-gray-500 font-medium">
            Input
          </div>
          <pre className="bg-white px-3 py-2 overflow-x-auto whitespace-pre-wrap text-gray-700">
            {prettyJson(input)}
          </pre>
          <div className="bg-gray-50 px-3 py-1.5 text-gray-500 font-medium border-t border-gray-200">
            Result
          </div>
          <pre className="bg-white px-3 py-2 overflow-x-auto whitespace-pre-wrap text-gray-700 max-h-80 overflow-y-auto">
            {prettyJson(result)}
          </pre>
        </div>
      )}
    </div>
  );
}
