"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Loader, FileText } from "lucide-react";
import { doctorAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

export default function Chatbot({ patientId, patientName }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: `Hello! I'm your AI medical assistant. I can help you with insights about ${patientName}'s health profile, biomarkers, treatment protocols, and clinical recommendations. What would you like to know?`,
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add doctor's message
    const doctorMessage = {
      id: messages.length + 1,
      text: input,
      sender: "doctor",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, doctorMessage]);
    setInput("");
    setLoading(true);

    try {
      // Call doctor AI API
      const response = await doctorAPI.ask(input, user?._id || "");

      const aiMessage = {
        id: messages.length + 2,
        text: response.data.answer || response.data.message || "I received your question.",
        sender: "ai",
        timestamp: new Date(),
        citations: response.data.citations || null,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = {
        id: messages.length + 2,
        text: "Sorry, I encountered an error processing your request. Please try again.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

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
          <p className="text-xs text-gray-500">Patient insights & guidance</p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-2">
            <div
              className={`flex ${msg.sender === "doctor" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-3 ${
                  msg.sender === "doctor"
                    ? "bg-primary text-white rounded-br-none"
                    : "bg-white border border-borderColor text-black rounded-bl-none shadow-sm"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.sender === "doctor"
                      ? "text-primary/70"
                      : "text-gray-500"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* Citations */}
            {msg.citations && msg.citations.length > 0 && (
              <div className="ml-4 space-y-2">
                <div className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Clinical References:
                </div>
                {msg.citations.map((citation, index) => (
                  <div
                    key={citation.chunk_id || index}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      {citation.url && (
                        <div className="font-medium text-blue-700 truncate flex-1">
                          {citation.url.split("/").pop()}
                        </div>
                      )}
                      {citation.page && (
                        <div className="text-gray-600 shrink-0 text-[10px] bg-white px-2 py-0.5 rounded">
                          Page {citation.page}
                        </div>
                      )}
                    </div>
                    {citation.section && (
                      <div className="text-blue-800 font-medium mb-1">{citation.section}</div>
                    )}
                    {citation.text && (
                      <div className="text-gray-700 leading-relaxed">{citation.text}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
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

      {/* Input Area */}
      <div className="border-t border-borderColor p-4 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
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
