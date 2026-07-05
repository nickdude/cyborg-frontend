"use client";

// Last-resort error boundary: replaces the ENTIRE root layout when it (or
// anything above every segment boundary) throws, so it must render its own
// <html>/<body>. Because it stands in for the root layout, globals.css / the
// Tailwind theme are not guaranteed to be applied here — so styles are inline
// on purpose (this is the one place the "use theme tokens, never inline hex"
// rule can't hold). Hex values mirror the theme: #541D7A = primary,
// #F2F2F2 = pageBackground.
export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          background: "#F2F2F2",
          color: "#1A1A1A",
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "rgba(84,29,122,0.10)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#541D7A"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 6px" }}>
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#6B6B70",
              maxWidth: 360,
              margin: "0 0 24px",
            }}
          >
            The app hit an unexpected error. Reloading usually fixes it.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              border: "none",
              borderRadius: 12,
              background: "#541D7A",
              color: "#fff",
              fontWeight: 600,
              fontSize: 15,
              padding: "12px 24px",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
