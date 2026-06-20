// Ships client-side logs to the backend so they appear in the SERVER log
// stream (e.g. the AWS app/runtime logs). On mobile — especially in production
// — the browser console is not inspectable, so without this we are blind to
// client errors like the image-upload "Network Error".
//
// Delivery is intentionally "preflight-free": navigator.sendBeacon (or a
// text/plain fetch with no custom headers) is a CORS "simple request", so it
// reaches the server even if a normal JSON API call would be blocked. That
// matters because the thing we are debugging can itself break normal requests.

export const API_BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
  "http://localhost:5001";

const ENDPOINT = `${API_BASE}/api/client-logs`;

if (typeof window !== "undefined") {
  // One-time breadcrumb — reveals if a device is wrongly hitting localhost.
  // eslint-disable-next-line no-console
  console.log("[REMOTE-LOG] init; API_BASE =", API_BASE);
}

function serializeError(error) {
  if (!error) return null;
  const out = {
    message: error.message,
    name: error.name,
    code: error.code, // ERR_NETWORK, ECONNABORTED, ...
    isAxiosError: Boolean(error.isAxiosError),
    requestSent: Boolean(error.request),
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    url: error.config?.url,
    baseURL: error.config?.baseURL,
    method: error.config?.method,
  };
  if (error.stack) {
    out.stack = String(error.stack).split("\n").slice(0, 4).join("\n");
  }
  return out;
}

function send(payload) {
  try {
    const body = JSON.stringify(payload);
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
      if (navigator.sendBeacon(ENDPOINT, blob)) return;
    }
    if (typeof fetch === "function") {
      fetch(ENDPOINT, {
        method: "POST",
        body,
        keepalive: true,
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
      }).catch(() => {});
    }
  } catch (_) {
    /* logging must never throw */
  }
}

function base(level, message, context) {
  return {
    level,
    message,
    context: context || null,
    ts: new Date().toISOString(),
    page: typeof location !== "undefined" ? location.href : undefined,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    online: typeof navigator !== "undefined" ? navigator.onLine : undefined,
  };
}

export function logRemote(level, message, context) {
  try {
    // eslint-disable-next-line no-console
    console.log(`[CLIENT ${level}]`, message, context || "");
  } catch (_) {}
  send(base(level, message, context));
}

export function logError(message, error, context) {
  const payload = base("error", message, context);
  payload.error = serializeError(error);
  try {
    // eslint-disable-next-line no-console
    console.error("[CLIENT error]", message, payload.error || "", context || "");
  } catch (_) {}
  send(payload);
}
