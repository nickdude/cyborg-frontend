"use client";

import { create } from "zustand";
import { conciergeAPI } from "@/services/api";
import { streamMessage } from "@/services/sse";
import { createChatReducer, hydrateMessage } from "./conciergeReducer";
import { newId } from "../utils/id";

export const useConciergeStore = create((set, get) => ({
  chats: {},
  chatOrder: [],
  messages: {},
  streams: {},
  activeChatId: null,
  chatsLoaded: false,

  setActive: (id) => set({ activeChatId: id }),

  loadChats: async () => {
    if (get().chatsLoaded) return;
    try {
      const res = await conciergeAPI.listChats();
      // axios response interceptor unwraps to envelope { success, data, ... }
      const list = res?.data || [];
      const chats = {};
      const order = [];
      for (const c of list) {
        chats[c._id] = c;
        order.push(c._id);
      }
      order.sort((a, b) => {
        const ua = new Date(chats[a].updatedAt || chats[a].createdAt).getTime();
        const ub = new Date(chats[b].updatedAt || chats[b].createdAt).getTime();
        return ub - ua;
      });
      set({ chats, chatOrder: order, chatsLoaded: true });
    } catch (err) {
      console.error("[concierge] loadChats failed", err);
      set({ chatsLoaded: true });
    }
  },

  loadChat: async (chatId) => {
    if (get().messages[chatId]) return;
    try {
      const res = await conciergeAPI.getChat(chatId);
      const chat = res?.data;
      if (!chat) return;
      const messages = (chat.messages || []).map(hydrateMessage);
      set((s) => ({
        chats: {
          ...s.chats,
          [chatId]: { ...s.chats[chatId], ...chat, messages: undefined },
        },
        messages: { ...s.messages, [chatId]: messages },
      }));
    } catch (err) {
      console.error("[concierge] loadChat failed", err);
    }
  },

  createChat: async () => {
    const res = await conciergeAPI.createChat();
    const chat = res?.data;
    if (!chat) throw new Error("createChat returned no data");
    set((s) => ({
      chats: { ...s.chats, [chat._id]: chat },
      chatOrder: [chat._id, ...s.chatOrder.filter((id) => id !== chat._id)],
      messages: { ...s.messages, [chat._id]: [] },
    }));
    return chat._id;
  },

  deleteChat: async (chatId) => {
    try {
      await conciergeAPI.deleteChat(chatId);
    } catch (err) {
      console.error("[concierge] deleteChat failed", err);
      return;
    }
    set((s) => {
      const { [chatId]: _c, ...chats } = s.chats;
      const { [chatId]: _m, ...messages } = s.messages;
      const { [chatId]: _st, ...streams } = s.streams;
      return {
        chats,
        messages,
        streams,
        chatOrder: s.chatOrder.filter((id) => id !== chatId),
        activeChatId: s.activeChatId === chatId ? null : s.activeChatId,
      };
    });
  },

  renameChat: async (chatId, title) => {
    try {
      await conciergeAPI.updateTitle(chatId, title);
    } catch (err) {
      console.error("[concierge] renameChat failed", err);
      return;
    }
    set((s) => ({
      chats: {
        ...s.chats,
        [chatId]: { ...(s.chats[chatId] || {}), title },
      },
    }));
  },

  sendMessage: (chatId, text) => {
    if (!chatId || !text?.trim()) return;

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

    set((s) => ({
      messages: {
        ...s.messages,
        [chatId]: [...(s.messages[chatId] || []), userMsg, assistantMsg],
      },
      streams: {
        ...s.streams,
        [chatId]: { status: "streaming", startedAt: Date.now() },
      },
    }));

    const assistantId = assistantMsg.id;

    const patchAssistant = (patch) =>
      set((s) => {
        const list = s.messages[chatId] || [];
        const idx = list.findIndex((m) => m.id === assistantId);
        if (idx === -1) return s;
        const next = [...list];
        next[idx] = patch(next[idx]);
        return { messages: { ...s.messages, [chatId]: next } };
      });

    const onEvent = createChatReducer({
      patchAssistant,
      onDone: () => {
        set((s) => {
          const existing = s.chats[chatId] || {};
          // Derive title from first user message if backend hasn't auto-set yet
          let title = existing.title;
          if (!title || title === "New Chat") {
            const firstUser = (s.messages[chatId] || []).find(
              (m) => m.role === "user"
            );
            const userText = firstUser?.content?.[0]?.text;
            if (userText) {
              title = userText.slice(0, 60).replace(/\n/g, " ").trim();
              if (userText.length > 60) title += "\u2026";
            }
          }
          return {
            streams: {
              ...s.streams,
              [chatId]: {
                status: "done",
                startedAt: s.streams[chatId]?.startedAt,
              },
            },
            chats: {
              ...s.chats,
              [chatId]: {
                ...existing,
                title: title || existing.title || "New Chat",
                updatedAt: new Date().toISOString(),
              },
            },
            chatOrder: [chatId, ...s.chatOrder.filter((id) => id !== chatId)],
          };
        });
        patchAssistant((m) => {
          // A turn that reached `done` has finished all its tools; a dropped
          // toolEnd frame must not leave a permanent spinner — resolve any step
          // still running/pending to "done".
          const content = m.content.map((b) =>
            b.type === "step" && (b.status === "running" || b.status === "pending")
              ? { ...b, status: "done" }
              : b
          );
          const thinking = m.thinking
            ? {
                ...m.thinking,
                elapsedMs: m.thinking.startedAt
                  ? Date.now() - m.thinking.startedAt
                  : undefined,
              }
            : m.thinking;
          return { ...m, content, thinking };
        });
      },
      onError: (evt) => {
        set((s) => ({
          streams: {
            ...s.streams,
            [chatId]: {
              status: "error",
              error: evt.message || "stream error",
            },
          },
        }));
        // Don't leave a blank bubble with tool steps spinning forever: flip any
        // in-flight step to "error", and if nothing visible was produced, surface
        // an inline interrupted notice so the user sees something.
        patchAssistant((m) => {
          const content = m.content.map((b) =>
            b.type === "step" && (b.status === "running" || b.status === "pending")
              ? { ...b, status: "error" }
              : b
          );
          const hasVisibleText = content.some(
            (b) => b.type === "text" && b.text && b.text.trim()
          );
          if (!hasVisibleText) {
            content.push({
              type: "text",
              text: "\n\n_The response was interrupted. Please try again._",
            });
          }
          return { ...m, content };
        });
      },
    });

    streamMessage(chatId, text, onEvent).catch((err) => {
      console.error("[concierge] streamMessage crashed", err);
      set((s) => ({
        streams: {
          ...s.streams,
          [chatId]: { status: "error", error: err?.message || "stream crashed" },
        },
      }));
    });
  },
}));
