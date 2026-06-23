"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useConciergeStore } from "@/stores/concierge";
import ChatSidebar from "@/components/concierge/ChatSidebar";
import MessageList from "@/components/concierge/MessageList";
import Composer from "@/components/concierge/Composer";
import { DEFAULT_PROMPTS } from "@/components/concierge/prompts";

export default function ConciergePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const firstName = user?.firstName || user?.name?.split(" ")[0];

  const loadChats = useConciergeStore((s) => s.loadChats);
  const loadChat = useConciergeStore((s) => s.loadChat);
  const createChat = useConciergeStore((s) => s.createChat);
  const setActive = useConciergeStore((s) => s.setActive);
  const sendMessage = useConciergeStore((s) => s.sendMessage);
  const deleteChat = useConciergeStore((s) => s.deleteChat);
  const chats = useConciergeStore((s) => s.chats);
  const chatOrder = useConciergeStore((s) => s.chatOrder);
  const chatsLoaded = useConciergeStore((s) => s.chatsLoaded);
  const activeChatId = useConciergeStore((s) => s.activeChatId);
  const streamStatus = useConciergeStore((s) =>
    activeChatId ? s.streams[activeChatId]?.status : null
  );
  const activeMessageCount = useConciergeStore((s) =>
    activeChatId ? s.messages[activeChatId]?.length ?? 0 : 0
  );
  const showChips = activeMessageCount === 0;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    if (!chatsLoaded) return;

    const urlId = searchParams.get("id");
    const urlQ = searchParams.get("q");

    const pickOrCreate = async () => {
      // A pending ?q= (auto-ask) is handled by its own effect below — bail here
      // so we don't race it and spawn a duplicate chat.
      if (urlQ) return;
      if (urlId && chats[urlId]) {
        if (activeChatId !== urlId) setActive(urlId);
        loadChat(urlId);
        return;
      }
      if (chatOrder.length) {
        const mostRecent = chatOrder[0];
        if (activeChatId !== mostRecent) setActive(mostRecent);
        loadChat(mostRecent);
        router.replace(`/concierge?id=${mostRecent}`);
        return;
      }
      try {
        const id = await createChat();
        setActive(id);
        router.replace(`/concierge?id=${id}`);
      } catch (err) {
        console.error("[concierge] failed to create initial chat", err);
      }
    };

    pickOrCreate();
  }, [
    chatsLoaded,
    searchParams,
    chats,
    chatOrder,
    activeChatId,
    setActive,
    loadChat,
    createChat,
    router,
  ]);

  // Auto-ask: when arriving with ?q= (from the dashboard "Ask anything" input, a
  // biomarker's suggested questions, etc.), open a fresh chat, drop the question
  // in, and send it — so the user lands on a real answer instead of an empty
  // chat. The ref + URL-strip make it fire exactly once (no resend on refresh).
  const autoAskRef = useRef(false);
  useEffect(() => {
    if (!chatsLoaded) return;
    const q = searchParams.get("q");
    if (!q || autoAskRef.current) return;
    autoAskRef.current = true;
    (async () => {
      try {
        const id = await createChat();
        setActive(id);
        router.replace(`/concierge?id=${id}`);
        sendMessage(id, q);
      } catch (err) {
        console.error("[concierge] auto-ask failed", err);
        autoAskRef.current = false;
      }
    })();
  }, [chatsLoaded, searchParams, createChat, setActive, router, sendMessage]);

  const handleSelect = (id) => {
    setActive(id);
    loadChat(id);
    router.replace(`/concierge?id=${id}`);
    setSidebarOpen(false);
  };

  const handleNew = async () => {
    try {
      const id = await createChat();
      setActive(id);
      router.replace(`/concierge?id=${id}`);
      setSidebarOpen(false);
    } catch (err) {
      console.error("[concierge] failed to create chat", err);
    }
  };

  const handleDelete = async (id) => {
    const wasActive = activeChatId === id;
    await deleteChat(id);

    if (!wasActive) return;

    // Pick the next most-recent remaining chat, else create a fresh one.
    const remaining = useConciergeStore
      .getState()
      .chatOrder.filter((cid) => cid !== id);
    if (remaining.length) {
      const next = remaining[0];
      setActive(next);
      loadChat(next);
      router.replace(`/concierge?id=${next}`);
    } else {
      try {
        const newChatId = await createChat();
        setActive(newChatId);
        router.replace(`/concierge?id=${newChatId}`);
      } catch (err) {
        console.error("[concierge] failed to create chat after delete", err);
        router.replace("/concierge");
      }
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || !activeChatId) return;
    if (streamStatus === "streaming") return;
    sendMessage(activeChatId, text);
    setInput("");
  };

  const handleQuickPrompt = (p) => {
    if (!activeChatId || streamStatus === "streaming") return;
    sendMessage(activeChatId, p);
  };

  const avatarInitial =
    user?.firstName?.[0]?.toUpperCase() ||
    user?.name?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <div className="flex h-dvh bg-white pb-[calc(76px+env(safe-area-inset-bottom,0px))] lg:pb-0">
      <ChatSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeChatId={activeChatId}
        onSelect={handleSelect}
        onNew={handleNew}
        onDelete={handleDelete}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white">
          <div className="flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex min-w-0 items-center gap-2.5 text-left"
              aria-label="Open chats"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-slate-300 to-slate-400 text-[13px] font-semibold text-white">
                {avatarInitial}
              </span>
              <span className="truncate text-[17px] font-semibold text-blue">
                Cyborg AI
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Search messages"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-secondary transition hover:bg-pageBackground hover:text-blue"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                <path d="M20 20L17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Search
            </button>
          </div>
        </header>

        <MessageList
          chatId={activeChatId}
          firstName={firstName}
          onQuickPrompt={handleQuickPrompt}
        />

        {showChips && (
          <div className="bg-white px-4 sm:px-6">
            <div className="mx-auto max-w-3xl">
              <div className="-mx-4 flex gap-2.5 overflow-x-auto scrollbar-hide px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
                {DEFAULT_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleQuickPrompt(p)}
                    disabled={!activeChatId || streamStatus === "streaming"}
                    className="flex-none rounded-2xl border border-borderColor bg-white px-4 py-2.5 text-center text-[13.5px] font-medium leading-snug text-blue transition-colors hover:border-lightGray hover:bg-pageBackground disabled:opacity-50 cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <Composer
          value={input}
          onChange={setInput}
          onSubmit={handleSend}
          disabled={!activeChatId || streamStatus === "streaming"}
          placeholder={
            streamStatus === "streaming"
              ? "Wait for reply to finish…"
              : "Message Cyborg…"
          }
        />
      </div>
    </div>
  );
}
