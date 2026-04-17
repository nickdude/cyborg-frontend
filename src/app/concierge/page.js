"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useConciergeStore } from "@/stores/concierge";
import ChatSidebar from "@/components/concierge/ChatSidebar";
import MessageList from "@/components/concierge/MessageList";
import Composer from "@/components/concierge/Composer";

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
        setActive(urlId);
        loadChat(urlId);
        return;
      }
      if (chatOrder.length) {
        const mostRecent = chatOrder[0];
        setActive(mostRecent);
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

  return (
    <div className="h-dvh flex bg-pageBackground">
      <ChatSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeChatId={activeChatId}
        onSelect={handleSelect}
        onNew={handleNew}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-borderColor bg-white">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1 rounded hover:bg-gray-100"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="font-semibold">Concierge</div>
          <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
            BETA
          </span>
        </header>

        <MessageList
          chatId={activeChatId}
          firstName={firstName}
          onQuickPrompt={handleQuickPrompt}
        />

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
