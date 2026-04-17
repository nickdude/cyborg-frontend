import Cookie from "js-cookie";

if (
  typeof process !== "undefined" &&
  process.env.NODE_ENV === "production" &&
  !process.env.NEXT_PUBLIC_API_URL
) {
  throw new Error("NEXT_PUBLIC_API_URL must be set in production builds");
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export async function streamMessage(chatId, text, onEvent) {
  const token = Cookie.get("authToken");
  const res = await fetch(`${BASE_URL}/api/chats/${chatId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify({ message: text }),
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      msg = body?.message || msg;
    } catch {}
    onEvent({ type: "error", message: msg });
    return;
  }
  if (!res.body) {
    onEvent({ type: "error", message: "Empty response body" });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() ?? "";
      for (const raw of chunks) {
        const line = raw.replace(/^data:\s?/, "").trim();
        if (!line) continue;
        try {
          onEvent(JSON.parse(line));
        } catch (err) {
          console.warn("[SSE] parse failure", line, err);
        }
      }
    }
  } catch (err) {
    onEvent({ type: "error", message: err?.message || "stream read failed" });
  }
}
