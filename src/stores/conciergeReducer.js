import { newId } from "../utils/id";

// ---------------------------------------------------------------------------
// `step` content-block shape (chained-thinking model):
//   { type:"step", id, toolIndex, name, status }   <- always present
// Optional fields, populated depending on the creation path:
//   segmentIndex   - thinking-segment grouping (from narration start)
//   narrationText  - "doing X..." text from narration(start)
//   endText        - "...done" text from narration(end)
//   input          - tool input args (from toolStart)
//   result, ok     - tool outcome (from toolEnd)
// `status` is one of: "pending" | "running" | "done" | "error".
// ---------------------------------------------------------------------------

export function createChatReducer({ patchAssistant, onDone, onError }) {
  return function onEvent(evt) {
    switch (evt.type) {
      case "textDelta":
        patchAssistant((m) => {
          const content = [...m.content];
          const last = content[content.length - 1];
          if (last && last.type === "text") {
            content[content.length - 1] = { ...last, text: last.text + (evt.text || "") };
          } else {
            content.push({ type: "text", text: evt.text || "" });
          }
          return { ...m, content };
        });
        break;

      case "narration":
        patchAssistant((m) => {
          const content = [...m.content];
          if (evt.phase === "end") {
            for (let i = content.length - 1; i >= 0; i--) {
              if (content[i].type === "step" && content[i].toolIndex === evt.toolIndex) {
                content[i] = { ...content[i], endText: evt.text };
                break;
              }
            }
            return { ...m, content };
          }
          content.push({ type: "step", id: newId(), toolIndex: evt.toolIndex, segmentIndex: evt.segmentIndex, name: evt.name, narrationText: evt.text, status: "pending" });
          return { ...m, content };
        });
        break;

      case "toolStart":
        patchAssistant((m) => {
          const content = [...m.content];
          // Match a pending step by toolIndex when present (new backend);
          // fall back to matching by name when toolIndex is absent (old backend).
          const i = content.findIndex((b) => {
            if (b.type !== "step" || b.status !== "pending") return false;
            return evt.toolIndex == null ? b.name === evt.name : b.toolIndex === evt.toolIndex;
          });
          if (i === -1) {
            content.push({ type: "step", id: newId(), toolIndex: evt.toolIndex, name: evt.name, status: "running", input: evt.input });
            return { ...m, content };
          }
          content[i] = { ...content[i], input: evt.input, status: "running" };
          return { ...m, content };
        });
        break;

      case "toolEnd":
        patchAssistant((m) => {
          const content = [...m.content];
          const byIndex = typeof evt.toolIndex === "number";
          for (let i = content.length - 1; i >= 0; i--) {
            const b = content[i];
            if (b.type !== "step") continue;
            // New backend: match by toolIndex, skipping already-terminal steps.
            // Old backend (no toolIndex): match the last running step by name, so a
            // late/duplicate toolEnd can't overwrite an already-completed step.
            const match = byIndex
              ? b.toolIndex === evt.toolIndex && b.status !== "done" && b.status !== "error"
              : b.name === evt.name && b.status === "running";
            if (match) {
              content[i] = { ...b, status: evt.ok === false ? "error" : "done", result: evt.result, ok: evt.ok !== false };
              break;
            }
          }
          return { ...m, content };
        });
        break;

      case "thinkingDelta":
        patchAssistant((m) => {
          const segments = [...(m.thinking?.segments || [])];
          // NOTE: `evt.toolIndex` here is the THINKING-SEGMENT key (segmentIndex),
          // NOT a tool ordinal — an existing wire-name quirk we preserve.
          const idx = typeof evt.toolIndex === "number" ? evt.toolIndex : -1;
          const e = segments.findIndex((s) => s.toolIndex === idx);
          if (e === -1) {
            segments.push({ toolIndex: idx, text: evt.text || "" });
          } else {
            segments[e] = { ...segments[e], text: segments[e].text + (evt.text || "") };
          }
          segments.sort((a, b) => a.toolIndex - b.toolIndex);
          return { ...m, thinking: { segments, startedAt: m.thinking?.startedAt || Date.now() } };
        });
        break;

      case "thinkingUnsupported":
        break;
      case "done":
        onDone && onDone(evt);
        break;
      case "error":
        onError && onError(evt);
        break;
      default:
        break;
    }
  };
}

export function hydrateMessage(raw) {
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
  toolUses.forEach((tu, i) => {
    const block = {
      type: "step",
      id: newId(),
      toolIndex: typeof tu.toolIndex === "number" ? tu.toolIndex : i,
      name: tu.name,
      input: tu.input,
      result: tu.result,
      ok: true,
      status: "done",
    };
    if (typeof tu.segmentIndex === "number") block.segmentIndex = tu.segmentIndex;
    if (tu.narration && typeof tu.narration === "object") {
      if (tu.narration.start != null) block.narrationText = tu.narration.start;
      if (tu.narration.end != null) block.endText = tu.narration.end;
    }
    content.push(block);
  });
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
