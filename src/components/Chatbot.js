"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader, FileText } from "lucide-react";
import { doctorAPI } from "@/services/api";
import { streamDoctorMessage } from "@/services/sse";
import { useAuth } from "@/contexts/AuthContext";

export default function Chatbot({ patientId, patientName }) {
  const { user } = useAuth();
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      text: `Hello! I'm your AI medical assistant. I can help you with insights about ${patientName}'s health profile, biomarkers, treatment protocols, and clinical recommendations. What would you like to know?`,
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const messagesEndRef = useRef(null);
  const initRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

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
          if (chat.messages && chat.messages.length > 0) {
            const restored = chat.messages.map((m, i) => ({
              id: `restored-${i}`,
              text: m.content,
              role: m.role,
              timestamp: new Date(m.createdAt || Date.now()),
            }));
            setMessages((prev) => [...prev, ...restored]);
          }
          return;
        }

        const createRes = await doctorAPI.createChat(patientId);
        setChatId(createRes.data._id);
      } catch (err) {
        console.error("[DoctorChat] Init failed:", err);
      }
    })();
  }, [patientId]);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;

    const text = input.trim();
    setInput("");

    const userMsg = {
      id: `user-${Date.now()}`,
      text,
      role: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setStreamingText("");

    let activeChatId = chatId;
    if (!activeChatId) {
      try {
        const createRes = await doctorAPI.createChat(patientId);
        activeChatId = createRes.data._id;
        setChatId(activeChatId);
      } catch (err) {
        console.error("[DoctorChat] Create chat failed:", err);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            text: "Failed to create chat session. Please try again.",
            role: "assistant",
            timestamp: new Date(),
          },
        ]);
        setLoading(false);
        return;
      }
    }

    let accumulated = "";

    await streamDoctorMessage(activeChatId, text, (event) => {
      if (event.type === "text" || event.type === "content_block_delta") {
        const chunk = event.text || event.delta?.text || "";
        accumulated += chunk;
        setStreamingText(accumulated);
      } else if (event.type === "done" || event.type === "message_stop") {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            text: accumulated || "I processed your request.",
            role: "assistant",
            timestamp: new Date(),
          },
        ]);
        setStreamingText("");
        setLoading(false);
      } else if (event.type === "error") {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            text: event.message || "Something went wrong. Please try again.",
            role: "assistant",
            timestamp: new Date(),
          },
        ]);
        setStreamingText("");
        setLoading(false);
      }
    });

    if (loading) {
      if (accumulated) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            text: accumulated,
            role: "assistant",
            timestamp: new Date(),
          },
        ]);
      }
      setStreamingText("");
      setLoading(false);
    }
  }, [input, loading, chatId, patientId]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-borderColor p-4 flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">AI</span>
        </div>
        <div>
          <h3 className="text-sm font-bold text-black">AI Assistant</h3>
          <p className="text-xs text-gray-500">
            {patientName ? `Insights for ${patientName}` : "Patient insights & guidance"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-2">
            <div
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-br-none"
                    : "bg-white border border-borderColor text-black rounded-bl-none shadow-sm"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.role === "user" ? "text-white/60" : "text-gray-400"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}

        {streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[85%] bg-white border border-borderColor rounded-lg rounded-bl-none px-4 py-3 shadow-sm">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{streamingText}</p>
            </div>
          </div>
        )}

        {loading && !streamingText && (
          <div className="flex justify-start">
            <div className="bg-white border border-borderColor rounded-lg rounded-bl-none px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Loader className="h-4 w-4 text-primary animate-spin" />
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-borderColor p-4 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask about biomarkers, risks..."
            disabled={loading}
            className="flex-1 px-4 py-2 border border-borderColor rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-100 disabled:text-gray-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className="p-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center h-10 w-10"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
