"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, HeartPulse } from "lucide-react";
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
  const chats = useConciergeStore((s) => s.chats);
  const chatOrder = useConciergeStore((s) => s.chatOrder);
  const chatsLoaded = useConciergeStore((s) => s.chatsLoaded);
  const activeChatId = useConciergeStore((s) => s.activeChatId);
  const streamStatus = useConciergeStore((s) =>
    activeChatId ? s.streams[activeChatId]?.status : null
  );
  // Suggested prompts only belong on a fresh, empty chat — once a message has
  // been sent (or an old chat is continued) they disappear.
  const isEmptyChat = useConciergeStore((s) => {
    const list = activeChatId ? s.messages[activeChatId] : null;
    return !Array.isArray(list) || list.length === 0;
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    if (!chatsLoaded) return;

    const urlId = searchParams.get("id");

    const pickOrCreate = async () => {
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

  const disabled = !activeChatId || streamStatus === "streaming";

  return (
    <div className="flex h-dvh flex-col bg-pageBackground">
      <ChatSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeChatId={activeChatId}
        onSelect={handleSelect}
        onNew={handleNew}
      />

      {/* pb on mobile reserves room for the fixed floating BottomNavbar (lg:hidden). */}
      <div className="flex min-h-0 flex-1 flex-col pb-[calc(env(safe-area-inset-bottom)+4.75rem)] lg:pb-0">
        {/* Header: Care Team · Today · Search */}
        <div className="relative mx-auto flex w-full max-w-3xl shrink-0 items-center justify-between px-4 py-2 lg:py-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-secondary transition-colors hover:bg-pageBackground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyborg-purple-light">
              <HeartPulse className="h-3 w-3 text-white" />
            </span>
            Cyborg Care Team
          </button>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex h-7 items-center rounded-full border border-borderColor bg-white/90 px-3 py-1 text-xs font-medium text-secondary shadow-sm backdrop-blur">
              <time>Today</time>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-secondary transition-colors hover:bg-pageBackground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </div>

        <MessageList chatId={activeChatId} firstName={firstName} />

        {/* Quick-prompt chips — only on a fresh, empty chat */}
        {isEmptyChat && (
          <div className="mx-auto w-full max-w-3xl shrink-0 px-4">
            <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2 pt-1">
              {DEFAULT_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleQuickPrompt(p)}
                  disabled={disabled}
                  className="flex h-9 shrink-0 items-center whitespace-nowrap rounded-2xl border border-borderColor bg-white px-3.5 text-sm text-secondary shadow-lg shadow-black/5 transition-colors hover:bg-pageBackground hover:text-blue disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Composer + disclaimer */}
        <div className="mx-auto w-full max-w-3xl shrink-0 px-4 pb-2">
          <Composer
            value={input}
            onChange={setInput}
            onSubmit={handleSend}
            disabled={disabled}
            placeholder={
              streamStatus === "streaming"
                ? "Wait for reply to finish…"
                : "Ask anything…"
            }
          />
          <p className="mx-auto max-w-xl pt-2 text-center text-[10px] text-secondary">
            Your Cyborg AI is not intended to replace medical advice. Speak to a
            licensed provider or call 911 for emergencies.
          </p>
        </div>
      </div>
    </div>
  );
}
