"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  ArrowUp,
  ArrowDown,
  Loader2,
  Sparkles,
  MessageSquare,
  Plus,
  PanelLeftOpen,
  PanelLeftClose,
  Trash2,
  Users,
  User,
} from "lucide-react";
import { useStickyScroll } from "@/hooks/useStickyScroll";
import { doctorAPI } from "@/services/api";
import { streamDoctorMessage } from "@/services/sse";
import Message from "./concierge/Message";
import { createChatReducer, hydrateMessage } from "../stores/conciergeReducer";
import { newId } from "../utils/id";

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
  // SSE event handler — shared concierge reducer with doctor lifecycle
  // -----------------------------------------------------------------------
  const onEvent = useMemo(
    () =>
      createChatReducer({
        patchAssistant,
        onDone: () => {
          patchAssistant((m) =>
            m.thinking
              ? {
                  ...m,
                  thinking: {
                    ...m.thinking,
                    elapsedMs: m.thinking.startedAt
                      ? Date.now() - m.thinking.startedAt
                      : undefined,
                  },
                }
              : m
          );
          setStreaming(false);
        },
        onError: (evt) => {
          patchAssistant((m) => ({
            ...m,
            content: [
              ...m.content,
              {
                type: "text",
                text: `\n\n**Error:** ${
                  evt.message || "Something went wrong. Please try again."
                }`,
              },
            ],
          }));
          setStreaming(false);
        },
      }),
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
        await streamDoctorMessage(activeChatId, text, onEvent);
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
    [input, streaming, chatId, patientId, onEvent, patchAssistant]
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
    <div className="h-full flex flex-col bg-white relative border border-borderColor/80 rounded-l-3xl overflow-hidden shadow-sm">
      {/* Header */}
      <header className="flex items-center gap-2 px-4 py-3 border-b border-borderColor bg-white shrink-0">
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
          <div className="px-4 py-3 border-b border-borderColor">
            <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5">
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
          <div className="px-4 py-3 border-t border-borderColor">
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
          className="h-full overflow-y-auto bg-gray-50 px-4 py-6 space-y-4 sm:px-6"
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
                  <Message
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
      <div className="border-t border-borderColor bg-white px-4 py-3">
        <div className="flex items-end gap-2">
          <div className="flex-1 rounded-2xl border border-borderColor bg-gray-50/50 px-4 py-2.5 transition-all duration-200 focus-within:border-primary/30 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10">
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
