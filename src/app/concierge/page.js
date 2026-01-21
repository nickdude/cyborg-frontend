"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

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
          : "border-gray-200 bg-white hover:border-purple-200"
      }`}
    >
      <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border border-gray-300 bg-gray-100" />
          <span className="w-3 h-3 rounded-full border border-gray-300 bg-gray-100" />
          <span className="w-3 h-3 rounded-full border border-gray-300 bg-gray-100" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-lg">⏱️</span>
          <span>{meta}</span>
        </div>
      </div>
      <div className="text-xl font-semibold text-gray-900 mb-1">{title}</div>
      <div className="text-base text-gray-600">{subtitle}</div>
    </button>
  );
}

function MessageBubble({ sender, text }) {
  const isUser = sender === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
          isUser ? "bg-black text-white" : "bg-white text-gray-800 border border-gray-200"
        }`}
      >
        {text}
      </div>
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

          <div className="pt-4 border-t border-gray-200 space-y-3">
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

          <div className="pt-4 border-t border-gray-200 space-y-3">
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
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const name = useMemo(() => {
    if (!user) return "there";
    return user.name || user.fullName || user.email?.split("@")[0] || "there";
  }, [user]);

  const handleSend = () => {
    const value = input.trim();
    if (!value) return;
    const userMsg = { id: crypto.randomUUID(), sender: "user", text: value };
    const aiMsg = {
      id: crypto.randomUUID(),
      sender: "ai",
      text: "Thanks for your question. A member of the team or the AI will get back to you shortly.",
    };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-gray-900">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="max-w-md mx-auto px-4 pt-8 pb-20 flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center shadow-sm hover:bg-gray-50 transition"
            >
              <span className="text-lg">≡</span>
            </button>
            <div>
              <div className="text-2xl font-semibold">Concierge</div>
              <div className="text-xs text-gray-500">Your personal help desk</div>
            </div>
          </div>
          <Badge>BETA</Badge>
        </header>

        <div>
          <div className="text-3xl font-semibold leading-tight">Hi {name}, how can we help you?</div>
        </div>

        <div className="space-y-3">
          <Card
            title="Ask your Superpower AI"
            subtitle="Simple questions, advice and analysis"
            meta="Immediate"
            highlight
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

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 space-y-3">
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
                <MessageBubble key={msg.id} sender={msg.sender} text={msg.text} />
              ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 flex items-center gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 bg-transparent outline-none text-base"
          />
          <button
            type="button"
            className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-xl text-gray-600 hover:bg-gray-50"
            onClick={() => setInput((prev) => (prev ? prev + " " : "") + "+")}
          >
            +
          </button>
          <button
            type="button"
            onClick={handleSend}
            className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-lg hover:bg-gray-900"
          >
            ↑
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setInput(prompt)}
              className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 shadow-sm hover:border-purple-300"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="text-xs text-gray-500 leading-relaxed text-center px-4">
          Your Superpower AI is not intended to replace medical advice, and is solely provided to offer suggestions and education. Always seek the advice of a licensed human healthcare provider for any medical questions and call emergency services if you are experiencing an emergent medical issue.
        </div>
      </div>

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-md mx-auto px-6 py-3 flex items-center justify-between text-sm font-medium">
          <Link href="/" className="flex flex-col items-center gap-1 text-gray-500">
            <span className="text-xl">🏠</span>
            <span>Home</span>
          </Link>
          <Link href="/data" className="flex flex-col items-center gap-1 text-gray-500">
            <span className="text-xl">📊</span>
            <span>Data</span>
          </Link>
          <Link href="/" className="flex flex-col items-center gap-1 text-black">
            <span className="text-2xl">＋</span>
            <span className="text-black">Concierge</span>
          </Link>
          <Link href="/marketplace" className="flex flex-col items-center gap-1 text-gray-500">
            <span className="text-xl">🛍️</span>
            <span>Marketplace</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
