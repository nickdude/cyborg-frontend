"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import UserActions from "@/components/UserActions";
import { conciergeAPI } from "@/services/api";

const quickPrompts = [
  "How does the feature work?",
  "Any tips for getting started?",
  "Can I personalize my setup?",
];

const initialMessages = [
  {
    id: "m1",
    sender: "ai",
    title: "Ask your Superpower AI",
    text: "Simple questions, advice and analysis. I usually reply immediately.",
    meta: "Immediate",
  },
];

function Badge({ children }) {
  return (
    <span className="px-3 py-1 rounded-full border border-purple-600 text-purple-700 text-xs font-semibold tracking-wide">
      {children}
    </span>
  );
}

function Card({ title, subtitle, meta, highlight, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left rounded-2xl border p-4 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-purple-500 ${
        highlight
          ? "border-purple-500 bg-white/70"
          : "border-borderColor bg-white hover:border-purple-200"
      }`}
    >
      <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border border-borderColor bg-gray-100" />
          <span className="w-3 h-3 rounded-full border border-borderColor bg-gray-100" />
          <span className="w-3 h-3 rounded-full border border-borderColor bg-gray-100" />
        </div>
        <div className="flex items-center gap-1">
          <Image src="/assets/icons/clock-five.svg" alt="timer" width={14} height={14} />
          <span>{meta}</span>
        </div>
      </div>
      <div className="text-xl font-semibold text-gray-900 mb-1">{title}</div>
      <div className="text-base text-gray-600">{subtitle}</div>
    </button>
  );
}

function MessageBubble({ sender, text, citations }) {
  const isUser = sender === "user";
  return (
    <div className="space-y-2">
      <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
            isUser ? "bg-black text-white" : "bg-white text-gray-800 border border-borderColor"
          }`}
        >
          <div className="whitespace-pre-wrap">{text}</div>
        </div>
      </div>
      {citations && citations.length > 0 && (
        <div className="ml-4 space-y-2">
          <div className="text-xs font-semibold text-gray-600">Sources:</div>
          {citations.map((citation, index) => (
            <div
              key={citation.chunk_id || index}
              className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                {citation.url && (
                  <div className="font-medium text-purple-600 truncate flex-1">
                    {citation.url.split("/").pop()}
                  </div>
                )}
                {citation.page && (
                  <div className="text-gray-500 shrink-0">Page {citation.page}</div>
                )}
              </div>
              {citation.section && (
                <div className="text-gray-600 font-medium mb-1">{citation.section}</div>
              )}
              {citation.text && (
                <div className="text-gray-700 leading-relaxed">{citation.text}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Concierge</span>
            <button onClick={onClose} className="text-gray-500 hover:text-black">
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Search...."
              className="w-full px-4 py-2.5 rounded-full bg-gray-100 outline-none focus:ring-2 focus:ring-purple-500"
            />

            <Link
              href="/concierge/new"
              className="flex items-center gap-3 text-gray-700 hover:text-black font-medium transition"
            >
              <span>✎</span> New AI chat
            </Link>

            <Link
              href="/concierge/care-team"
              className="flex items-center gap-3 text-gray-700 hover:text-black font-medium transition"
            >
              <span>👤</span> Ask care team
            </Link>
          </div>

          <div className="pt-4 border-t border-borderColor space-y-3">
            <div className="text-sm font-semibold text-gray-900">Today</div>
            <Link
              href="#"
              className="block text-sm text-gray-600 hover:text-gray-900 truncate"
            >
              Understanding how the...
            </Link>
            <Link
              href="#"
              className="block text-sm text-gray-600 hover:text-gray-900 truncate"
            >
              Understanding how the...
            </Link>
          </div>

          <div className="pt-4 border-t border-borderColor space-y-3">
            <div className="text-sm font-semibold text-gray-900">Older</div>
            <Link
              href="#"
              className="block text-sm text-gray-600 hover:text-gray-900 truncate"
            >
              Understanding how the...
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ConciergePage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isActive = (path) => pathname === path;

  const name = useMemo(() => {
    if (!user) return "there";
    return user.name || user.fullName || user.email?.split("@")[0] || "there";
  }, [user]);

  const handleSend = async () => {
    const value = input.trim();
    if (!value || isLoading) return;

    const userMsg = { 
      id: crypto.randomUUID(), 
      sender: "user", 
      text: value 
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await conciergeAPI.ask(value, user?._id || "");
      
      const aiMsg = {
        id: crypto.randomUUID(),
        sender: "ai",
        text: response.data.answer || response.data.message || "I received your question. Let me help you with that.",
        citations: response.data.citations || null,
      };
      
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMsg = {
        id: crypto.randomUUID(),
        sender: "ai",
        text: "I'm sorry, I encountered an error processing your request. Please try again.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-gray-900">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="max-w-md mx-auto px-4 pt-8 pb-20 flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm hover:bg-gray-50 transition"
            >
              <Image src="/assets/icons/sidebar.svg" alt="menu" width={20} height={20} />
            </button>
            <div>
              <div className="text-xl font-medium">Concierge</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge>BETA</Badge>
            <UserActions />
          </div>
        </header>

        <div>
          <div className="text-3xl font-semibold leading-tight">Hi {name}, how can we help you?</div>
        </div>

        <div className="space-y-3">
          <Card
            title="Ask your Superpower AI"
            subtitle="Simple questions, advice and analysis"
            meta="Immediate"
            disabled
            onClick={() => setInput("Ask your Superpower AI")}
          />
          <Card
            title="Ask your care team"
            subtitle="Complex topics and customer service"
            meta="<24h on weekdays"
            onClick={() => setInput("Ask your care team")}
            disabled
          />
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-borderColor space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-700">Recent</div>
            <Link href="#" className="text-xs text-purple-600 hover:underline">
              New AI chat
            </Link>
          </div>
          <div className="space-y-2">
            {messages
              .filter((m) => m.text && m.sender !== "system")
              .map((msg) => (
                <MessageBubble 
                  key={msg.id} 
                  sender={msg.sender} 
                  text={msg.text}
                  citations={msg.citations}
                />
              ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 border border-borderColor rounded-2xl px-4 py-3 text-sm shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-borderColor p-3 flex items-center gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything..."
            className="flex-1 bg-transparent outline-none text-base"
            disabled={isLoading}
          />
          <button
            type="button"
            className="w-9 h-9 rounded-full border border-borderColor flex items-center justify-center text-xl text-gray-600 hover:bg-gray-50"
            onClick={() => setInput((prev) => (prev ? prev + " " : "") + "+")}
            disabled={isLoading}
          >
            +
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading}
            className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ↑
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setInput(prompt)}
              className="px-4 py-2 rounded-full bg-white border border-borderColor text-sm text-gray-700 shadow-sm hover:border-purple-300"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="text-xs text-secondary leading-relaxed text-center px-4">
          Your Superpower AI is not intended to replace medical advice, and is solely provided to offer suggestions and education. Always seek the advice of a licensed human healthcare provider for any medical questions and call emergency services if you are experiencing an emergent medical issue.
        </div>
      </div>

      <nav className="fixed bottom-0 inset-x-0 bg-white shadow-lg">
        <div className="max-w-md mx-auto py-3 flex items-center justify-center text-[10px] font-bold">
          <Link href="/concierge" className={`flex-1 flex flex-col items-center gap-1 ${isActive("/") ? "text-black" : "text-secondary"}`}>
            <Image src="/assets/icons/house.svg" alt="home" width={24} height={24} className={isActive("/") ? "" : "opacity-60"} />
            <span>Home</span>
          </Link>
          <Link href="/concierge" className={`flex-1 flex flex-col items-center gap-1 ${isActive("/data") ? "text-black" : "text-secondary"}`}>
            <Image src="/assets/icons/chart.svg" alt="data" width={24} height={24} className={isActive("/data") ? "" : "opacity-60"} />
            <span>Data</span>
          </Link>
          <Link href="/concierge" className="flex-1 flex flex-col items-center gap-1 text-black">
            <span className="text-2xl flex justify-center items-center bg-black text-white rounded-full w-20 h-20 border-8 border-gray-50">＋</span>
          </Link>
          <Link href="/concierge" className={`flex-1 flex flex-col items-center gap-1 ${isActive("/chat") ? "text-black" : "text-secondary"}`}>
            <Image src="/assets/icons/text.svg" alt="chat" width={24} height={24} className={isActive("/chat") ? "" : "opacity-60"} />
            <span>Concierge</span>
          </Link>
          <Link href="/concierge" className={`flex-1 flex flex-col items-center gap-1 ${isActive("/marketplace") ? "text-black" : "text-secondary"}`}>
            <Image src="/assets/icons/store.svg" alt="marketplace" width={24} height={24} className={isActive("/marketplace") ? "" : "opacity-60"} />
            <span>Marketplace</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
