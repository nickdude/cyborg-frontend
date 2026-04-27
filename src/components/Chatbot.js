"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ExternalLink,
  Loader2,
  Sparkles,
  Stethoscope,
  Activity,
  Globe,
  BookOpen,
  Pill,
  History,
  MessageSquare,
  Database,
  Search,
  Plus,
  PanelLeftOpen,
  PanelLeftClose,
  Trash2,
  Users,
  User,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTypewriter } from "@/hooks/useTypewriter";
import { useStickyScroll } from "@/hooks/useStickyScroll";
import { doctorAPI } from "@/services/api";
import { streamDoctorMessage } from "@/services/sse";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function sanitiseJsonForDisplay(value) {
  try {
    const raw = typeof value === "string" ? value : JSON.stringify(value, null, 2);
    // Strip any HTML tags to prevent injection
    return raw.replace(/<[^>]*>/g, "");
  } catch {
    return String(value ?? "");
  }
}

// ---------------------------------------------------------------------------
// Tool metadata (same 8 tools the doctor backend exposes)
// ---------------------------------------------------------------------------

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
  getSchemaInfo: {
    running: "Inspecting schema…",
    done: "Inspected schema",
    Icon: Database,
  },
};

// ---------------------------------------------------------------------------
// Markdown renderer (assistant text blocks)
// ---------------------------------------------------------------------------

const markdownComponents = {
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  h2: ({ children }) => (
    <h2 className="text-base font-semibold mt-4 mb-2">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold mt-3 mb-1.5">{children}</h3>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary/30 pl-3 my-3 text-gray-600 italic">
      {children}
    </blockquote>
  ),
  code: ({ inline, children }) =>
    inline ? (
      <code className="bg-gray-100 text-primary px-1.5 py-0.5 rounded text-[13px] font-mono">
        {children}
      </code>
    ) : (
      <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 my-3 overflow-x-auto text-[13px] font-mono">
        <code>{children}</code>
      </pre>
    ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-3 rounded-lg border border-gray-200">
      <table className="w-full text-[13px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-gray-50 text-left">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 font-medium text-gray-600 border-b border-gray-200">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 border-b border-gray-100">{children}</td>
  ),
  hr: () => <hr className="my-4 border-gray-200" />,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="text-primary hover:underline"
    >
      {children}
    </a>
  ),
};

function MarkdownBody({ text }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {text}
    </ReactMarkdown>
  );
}

function TypewriterMarkdown({ text }) {
  const displayed = useTypewriter(text, true);
  return <MarkdownBody text={displayed} />;
}

// ---------------------------------------------------------------------------
// Thinking block (same as concierge ThinkingBlock)
// ---------------------------------------------------------------------------

const thinkingMarkdownComponents = {
  p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-500 not-italic">
      {children}
    </strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  code: ({ inline, children }) =>
    inline ? (
      <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px] font-mono not-italic">
        {children}
      </code>
    ) : (
      <pre className="bg-gray-50 border border-gray-200 rounded p-2 my-1.5 overflow-x-auto text-[11px] font-mono not-italic">
        <code>{children}</code>
      </pre>
    ),
  h2: ({ children }) => (
    <h2 className="text-xs font-semibold mt-2 mb-1 not-italic">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xs font-semibold mt-1.5 mb-0.5 not-italic">
      {children}
    </h3>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="text-primary hover:underline"
    >
      {children}
    </a>
  ),
};

function ThinkingBlock({ thinking, streaming, hasText }) {
  const [expanded, setExpanded] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!streaming || thinking?.elapsedMs) return;
    const h = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(h);
  }, [streaming, thinking?.elapsedMs]);

  if (!thinking || !thinking.segments?.length) return null;

  const elapsedMs =
    thinking.elapsedMs ??
    (thinking.startedAt ? now - thinking.startedAt : 0);
  const seconds = Math.max(1, Math.round(elapsedMs / 1000));

  const showLiveTicker = streaming && !hasText;

  if (showLiveTicker) {
    const latest = thinking.segments[thinking.segments.length - 1];
    return (
      <div className="mb-3 rounded-xl bg-gradient-to-r from-primary/5 to-purple-50 border border-primary/10 px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-primary text-xs font-medium mb-1.5">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Thinking… {seconds}s</span>
        </div>
        <div className="text-xs text-gray-500 italic line-clamp-3 leading-relaxed [&_p]:m-0">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={thinkingMarkdownComponents}
          >
            {latest?.text || ""}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <ChevronRight
          className={`w-3 h-3 transition-transform duration-200 ${
            expanded ? "rotate-90" : ""
          }`}
        />
        <Sparkles className="w-3 h-3" />
        <span>Thought for {seconds}s</span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-out ${
          expanded ? "max-h-[2000px] opacity-100 mt-2" : "max-h-0 opacity-0"
        }`}
      >
        <div className="text-xs text-gray-400 border-l-2 border-primary/15 pl-3 space-y-2 italic leading-relaxed">
          {thinking.segments.map((s, i) => (
            <div key={i}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={thinkingMarkdownComponents}
              >
                {s.text || ""}
              </ReactMarkdown>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tool chip
// ---------------------------------------------------------------------------

function ToolChip({ block }) {
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
            {sanitiseJsonForDisplay(input)}
          </pre>
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-gray-400 font-medium bg-gray-50 border-y border-gray-200">
            Result
          </div>
          <pre className="px-3 py-2 overflow-x-auto whitespace-pre-wrap text-gray-600 bg-white max-h-60 overflow-y-auto font-mono">
            {sanitiseJsonForDisplay(result)}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sources (citations from webSearch / searchMedicalEvidence)
// ---------------------------------------------------------------------------

const PERPLEXITY_TOOLS = new Set([
  "webSearch",
  "searchMedicalEvidence",
  "searchMedicalEvidenceDeep",
]);

function deriveTitleFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function extractCitationsFromResult(result) {
  if (!result || typeof result !== "object") return [];
  const out = [];
  const tryPush = (entry) => {
    if (typeof entry === "string") {
      out.push({ url: entry, title: deriveTitleFromUrl(entry) });
    } else if (entry && typeof entry === "object" && entry.url) {
      out.push({
        url: entry.url,
        title: entry.title || deriveTitleFromUrl(entry.url),
      });
    }
  };
  if (Array.isArray(result.citations)) result.citations.forEach(tryPush);
  if (Array.isArray(result.search_results))
    result.search_results.forEach((s) => s?.url && tryPush(s));
  if (Array.isArray(result.sources)) result.sources.forEach(tryPush);
  const seen = new Set();
  return out.filter((c) => {
    if (seen.has(c.url)) return false;
    seen.add(c.url);
    return true;
  });
}

function Sources({ content }) {
  if (!Array.isArray(content)) return null;
  const all = [];
  for (const block of content) {
    if (block?.type !== "tool") continue;
    if (!PERPLEXITY_TOOLS.has(block.name)) continue;
    if (block.status !== "done") continue;
    all.push(...extractCitationsFromResult(block.result));
  }
  if (!all.length) return null;

  const seen = new Set();
  const dedup = all.filter((c) => {
    if (seen.has(c.url)) return false;
    seen.add(c.url);
    return true;
  });

  return (
    <div className="mt-3">
      <div className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-1.5">
        Sources
      </div>
      <div className="flex flex-wrap gap-1.5">
        {dedup.map((c, i) => (
          <a
            key={i}
            href={c.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-[11px] bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md px-2 py-1 text-gray-600 hover:text-primary transition-colors"
            title={c.url}
          >
            <span className="truncate max-w-[120px]">{c.title}</span>
            <ExternalLink className="w-2.5 h-2.5 shrink-0 text-gray-400" />
          </a>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single message row
// ---------------------------------------------------------------------------

function MessageRow({ message, streaming }) {
  if (message.role === "user") {
    const text = message.content?.[0]?.text || "";
    return (
      <div className="flex justify-end animate-[fadeIn_0.2s_ease-out]">
        <div className="max-w-[80%] bg-primary text-white rounded-[20px] rounded-br-md px-4 py-3 text-sm whitespace-pre-wrap shadow-sm">
          {text}
        </div>
      </div>
    );
  }

  // Assistant message
  const hasText = message.content?.some((b) => b.type === "text");
  const hasAnyContent =
    (message.content?.length || 0) > 0 || message.thinking;

  return (
    <div className="flex justify-start gap-2.5 animate-[fadeIn_0.2s_ease-out]">
      {/* Avatar */}
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center shrink-0 mt-1">
        <span className="text-[10px] font-bold text-white">C</span>
      </div>

      <div className="max-w-[85%] min-w-0">
        {/* Thinking block */}
        <ThinkingBlock
          thinking={message.thinking}
          streaming={streaming}
          hasText={hasText}
        />

        {/* Animated loading dots */}
        {!hasAnyContent && streaming && (
          <div className="flex items-center gap-1.5 py-2 text-gray-400">
            <div className="flex gap-1">
              <div
                className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}

        {/* Content blocks (text, tools) */}
        <div className="text-sm text-gray-800 leading-relaxed">
          {(message.content || []).map((block, i) => {
            if (block.type === "text") {
              const isLastText =
                streaming &&
                i ===
                  message.content.length -
                    1 -
                    [...message.content]
                      .reverse()
                      .findIndex((b) => b.type === "text");
              return isLastText ? (
                <TypewriterMarkdown key={i} text={block.text} />
              ) : (
                <MarkdownBody key={i} text={block.text} />
              );
            }
            if (block.type === "tool") {
              return <ToolChip key={block.id || i} block={block} />;
            }
            return null;
          })}
        </div>

        {/* Sources */}
        <Sources content={message.content} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hydrate backend message shape into our internal content-block format
// ---------------------------------------------------------------------------

function hydrateMessage(raw) {
  if (raw.role === "user") {
    return {
      id: newId(),
      role: "user",
      content: [{ type: "text", text: raw.content || "" }],
      createdAt: raw.createdAt || new Date().toISOString(),
    };
  }
  const content = [];
  const text = raw.content || "";
  const toolUses = Array.isArray(raw.toolUses) ? raw.toolUses : [];
  for (const tu of toolUses) {
    content.push({
      type: "tool",
      id: newId(),
      name: tu.name,
      input: tu.input,
      result: tu.result,
      ok: true,
      status: "done",
    });
  }
  if (text) content.push({ type: "text", text });

  let thinking;
  if (raw.thinking && typeof raw.thinking === "object") {
    const segments = Object.entries(raw.thinking).map(([k, v]) => ({
      toolIndex: Number(k),
      text: String(v || ""),
    }));
    segments.sort((a, b) => a.toolIndex - b.toolIndex);
    if (segments.length) thinking = { segments };
  }

  return {
    id: newId(),
    role: "assistant",
    content,
    thinking,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Quick-prompt cards (doctor-specific)
// ---------------------------------------------------------------------------

const QUICK_PROMPTS = [
  "Summarize this patient's latest lab results",
  "What are the key health risks for this patient?",
  "Recommend a treatment protocol",
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Chatbot({ patientId, patientName }) {
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(null);

  // Chat history state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [chatList, setChatList] = useState([]);
  const [chatListLoading, setChatListLoading] = useState(false);
  const [showAllPatients, setShowAllPatients] = useState(false);

  const initRef = useRef(false);
  const textareaRef = useRef(null);
  const assistantIdRef = useRef(null);

  // Sticky scroll
  const { containerRef, isPinned, notifyContentChanged, jumpToBottom } =
    useStickyScroll();

  // Auto-scroll on message/stream changes
  useEffect(() => {
    notifyContentChanged();
  }, [messages, notifyContentChanged]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  // -----------------------------------------------------------------------
  // Load chat list when history panel opens
  // -----------------------------------------------------------------------
  const refreshChatList = useCallback(async () => {
    setChatListLoading(true);
    try {
      const pid = showAllPatients ? undefined : patientId;
      const res = await doctorAPI.listChats(pid);
      setChatList(res.data || []);
    } catch (err) {
      console.error("[DoctorChat] listChats failed:", err);
    } finally {
      setChatListLoading(false);
    }
  }, [patientId, showAllPatients]);

  useEffect(() => {
    if (historyOpen) refreshChatList();
  }, [historyOpen, refreshChatList]);

  // -----------------------------------------------------------------------
  // Switch to a different chat
  // -----------------------------------------------------------------------
  const switchChat = useCallback(async (targetChatId) => {
    try {
      const fullRes = await doctorAPI.getChat(targetChatId);
      const full = fullRes.data;
      setChatId(targetChatId);
      setMessages(full?.messages?.length ? full.messages.map(hydrateMessage) : []);
      setError(null);
      setHistoryOpen(false);
    } catch (err) {
      console.error("[DoctorChat] switchChat failed:", err);
    }
  }, []);

  // -----------------------------------------------------------------------
  // Create a new chat — just reset state, actual creation on first send
  // -----------------------------------------------------------------------
  const handleNewChat = useCallback(() => {
    if (streaming) return;
    setChatId(null);
    setMessages([]);
    setError(null);
    setHistoryOpen(false);
    assistantIdRef.current = null;
  }, [streaming]);

  // -----------------------------------------------------------------------
  // Delete a chat
  // -----------------------------------------------------------------------
  const handleDeleteChat = useCallback(async (targetChatId, e) => {
    e.stopPropagation();
    try {
      await doctorAPI.deleteChat(targetChatId);
      setChatList((prev) => prev.filter((c) => c._id !== targetChatId));
      if (targetChatId === chatId) {
        handleNewChat();
      }
    } catch (err) {
      console.error("[DoctorChat] deleteChat failed:", err);
    }
  }, [chatId, handleNewChat]);

  // -----------------------------------------------------------------------
  // Initialise: load most recent chat (don't create if none exist)
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (!patientId || initRef.current) return;
    initRef.current = true;

    (async () => {
      try {
        const listRes = await doctorAPI.listChats(patientId);
        const existing = listRes.data;
        if (existing && existing.length > 0) {
          const chat = existing[0];
          setChatId(chat._id);

          try {
            const fullRes = await doctorAPI.getChat(chat._id);
            const full = fullRes.data;
            if (full?.messages?.length) {
              setMessages(full.messages.map(hydrateMessage));
            }
          } catch (loadErr) {
            console.error("[DoctorChat] loadChat failed:", loadErr);
          }
        }
      } catch (err) {
        console.error("[DoctorChat] Init failed:", err);
      }
    })();
  }, [patientId]);

  // -----------------------------------------------------------------------
  // Patch helper for the in-flight assistant message
  // -----------------------------------------------------------------------
  const patchAssistant = useCallback((patchFn) => {
    setMessages((prev) => {
      const id = assistantIdRef.current;
      if (!id) return prev;
      const idx = prev.findIndex((m) => m.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = patchFn(next[idx]);
      return next;
    });
  }, []);

  // -----------------------------------------------------------------------
  // SSE event handler
  // -----------------------------------------------------------------------
  const handleEvent = useCallback(
    (evt) => {
      switch (evt.type) {
        case "textDelta":
          patchAssistant((m) => {
            const content = [...m.content];
            const last = content[content.length - 1];
            if (last && last.type === "text") {
              content[content.length - 1] = {
                ...last,
                text: last.text + (evt.text || ""),
              };
            } else {
              content.push({ type: "text", text: evt.text || "" });
            }
            return { ...m, content };
          });
          break;

        case "toolStart":
          patchAssistant((m) => ({
            ...m,
            content: [
              ...m.content,
              {
                type: "tool",
                id: newId(),
                name: evt.name,
                input: evt.input,
                status: "running",
              },
            ],
          }));
          break;

        case "toolEnd":
          patchAssistant((m) => {
            const content = [...m.content];
            for (let i = content.length - 1; i >= 0; i--) {
              const b = content[i];
              if (
                b.type === "tool" &&
                b.name === evt.name &&
                b.status === "running"
              ) {
                content[i] = {
                  ...b,
                  status: evt.ok === false ? "error" : "done",
                  result: evt.result,
                  ok: evt.ok !== false,
                };
                break;
              }
            }
            return { ...m, content };
          });
          break;

        case "thinkingDelta":
          patchAssistant((m) => {
            const segments = [...(m.thinking?.segments || [])];
            const idx =
              typeof evt.toolIndex === "number" ? evt.toolIndex : -1;
            const existing = segments.findIndex((s) => s.toolIndex === idx);
            if (existing === -1) {
              segments.push({ toolIndex: idx, text: evt.text || "" });
            } else {
              segments[existing] = {
                ...segments[existing],
                text: segments[existing].text + (evt.text || ""),
              };
            }
            segments.sort((a, b) => a.toolIndex - b.toolIndex);
            return {
              ...m,
              thinking: {
                segments,
                startedAt: m.thinking?.startedAt || Date.now(),
              },
            };
          });
          break;

        case "done":
          patchAssistant((m) => {
            if (!m.thinking) return m;
            return {
              ...m,
              thinking: {
                ...m.thinking,
                elapsedMs: m.thinking.startedAt
                  ? Date.now() - m.thinking.startedAt
                  : undefined,
              },
            };
          });
          setStreaming(false);
          break;

        case "error":
          patchAssistant((m) => {
            // Append error text so user can see what went wrong
            const content = [...m.content];
            const errText =
              evt.message || "Something went wrong. Please try again.";
            content.push({ type: "text", text: `\n\n**Error:** ${errText}` });
            return { ...m, content };
          });
          setStreaming(false);
          break;

        default:
          break;
      }
    },
    [patchAssistant]
  );

  // -----------------------------------------------------------------------
  // Send message
  // -----------------------------------------------------------------------
  const handleSend = useCallback(
    async (overrideText) => {
      const text = (overrideText || input).trim();
      if (!text || streaming) return;

      setInput("");
      setError(null);

      // Ensure we have a chat
      let activeChatId = chatId;
      if (!activeChatId) {
        try {
          const createRes = await doctorAPI.createChat(patientId);
          activeChatId = createRes.data._id;
          setChatId(activeChatId);
        } catch (err) {
          console.error("[DoctorChat] Create chat failed:", err);
          setError("Failed to create chat session. Please try again.");
          return;
        }
      }

      const userMsg = {
        id: newId(),
        role: "user",
        content: [{ type: "text", text }],
        createdAt: new Date().toISOString(),
      };
      const assistantMsg = {
        id: newId(),
        role: "assistant",
        content: [],
        thinking: undefined,
        createdAt: new Date().toISOString(),
      };
      assistantIdRef.current = assistantMsg.id;

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setStreaming(true);

      try {
        await streamDoctorMessage(activeChatId, text, handleEvent);
      } catch (err) {
        console.error("[DoctorChat] Stream crashed:", err);
        patchAssistant((m) => {
          const content = [...m.content];
          content.push({
            type: "text",
            text: `\n\n**Error:** ${err?.message || "Connection lost. Please try again."}`,
          });
          return { ...m, content };
        });
      }

      // Safety: make sure streaming is off no matter what
      setStreaming(false);
    },
    [input, streaming, chatId, patientId, handleEvent, patchAssistant]
  );

  // -----------------------------------------------------------------------
  // Keyboard
  // -----------------------------------------------------------------------
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!streaming && input.trim()) handleSend();
      }
    },
    [handleSend, streaming, input]
  );

  // -----------------------------------------------------------------------
  // Derived state
  // -----------------------------------------------------------------------
  const isEmpty = messages.length === 0;
  const firstName = patientName?.split(" ")[0] || "this patient";

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-3 border-b border-gray-100 bg-white shrink-0">
        <button
          type="button"
          onClick={() => setHistoryOpen((v) => !v)}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Chat history"
        >
          {historyOpen ? (
            <PanelLeftClose className="w-4 h-4 text-gray-600" />
          ) : (
            <PanelLeftOpen className="w-4 h-4 text-gray-600" />
          )}
        </button>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-gray-900 truncate">AI Assistant</h3>
          <p className="text-xs text-gray-500 truncate">
            {patientName
              ? `Insights for ${patientName}`
              : "Patient insights & guidance"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleNewChat}
          disabled={streaming}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30"
          aria-label="New chat"
        >
          <Plus className="w-4 h-4 text-gray-600" />
        </button>
        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
          BETA
        </span>
      </header>

      {/* Chat history sidebar */}
      {historyOpen && (
        <div className="absolute inset-0 top-[52px] z-20 bg-white flex flex-col">
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setShowAllPatients(false)}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md transition-colors ${
                  !showAllPatients
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <User className="w-3 h-3" />
                This patient
              </button>
              <button
                type="button"
                onClick={() => setShowAllPatients(true)}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md transition-colors ${
                  showAllPatients
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Users className="w-3 h-3" />
                All patients
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chatListLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              </div>
            ) : chatList.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400">
                No chats yet
              </div>
            ) : (
              <div className="py-1">
                {chatList.map((chat) => (
                  <button
                    key={chat._id}
                    type="button"
                    onClick={() => switchChat(chat._id)}
                    className={`w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors flex items-start gap-2 group ${
                      chat._id === chatId ? "bg-primary/5" : ""
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {chat.title || chat.patientName || "Untitled chat"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {chat.patientName && showAllPatients
                          ? `${chat.patientName} · `
                          : ""}
                        {new Date(chat.updatedAt || chat.createdAt).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" }
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteChat(chat._id, e)}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded transition-all"
                      aria-label="Delete chat"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="px-3 py-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-lg py-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New chat
            </button>
          </div>
        </div>
      )}

      {/* Message area */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={containerRef}
          className="h-full overflow-y-auto px-4 sm:px-6 py-6 space-y-4 bg-gray-50"
        >
          {isEmpty ? (
            /* Empty state with quick prompts */
            <div className="max-w-md mx-auto text-center mt-16">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-1">
                How can I help?
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                Ask about {firstName}&apos;s labs, biomarkers, or clinical
                recommendations.
              </p>
              <div className="flex flex-col gap-2">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleSend(p)}
                    className="text-sm text-left bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-primary/30 hover:bg-primary/[0.02] transition-all duration-200 text-gray-700 cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m) => {
                const isLastAssistant =
                  m.role === "assistant" &&
                  m.id === messages[messages.length - 1]?.id;
                return (
                  <MessageRow
                    key={m.id}
                    message={m}
                    streaming={streaming && isLastAssistant}
                  />
                );
              })}
            </>
          )}

          {/* Error banner */}
          {error && (
            <div className="mx-auto max-w-md bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Jump-to-bottom button */}
        {!isPinned && streaming && (
          <button
            onClick={jumpToBottom}
            className="absolute bottom-4 right-4 bg-primary text-white rounded-full w-9 h-9 shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all duration-150 flex items-center justify-center"
            aria-label="Jump to latest"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-gray-100 bg-white px-4 py-3">
        <div className="flex items-end gap-2">
          <div className="flex-1 border border-gray-200 rounded-2xl bg-gray-50/50 px-4 py-2.5 focus-within:bg-white focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                streaming
                  ? "Wait for reply to finish…"
                  : "Ask about biomarkers, risks…"
              }
              disabled={streaming}
              className="w-full resize-none outline-none text-sm bg-transparent placeholder:text-gray-400 disabled:text-gray-400"
            />
          </div>
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={streaming || !input.trim()}
            className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-30 hover:bg-primary/90 active:scale-95 transition-all duration-150 shrink-0 shadow-sm"
            aria-label="Send"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
