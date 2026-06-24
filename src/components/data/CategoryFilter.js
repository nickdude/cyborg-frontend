"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Multi-select category filter (superpower-style). Opens a checkbox panel of all
// health categories; checking any filters the biomarker table + summary stats.
// `selected` is a Set of category labels; empty = no filter (show everything).
// The panel is rendered in a PORTAL with fixed positioning so the data card's
// `overflow-hidden` can't clip it, and it stays clamped on-screen.
export default function CategoryFilter({ categories, selected, onToggle, onClear }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 520 });
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  const place = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const width = Math.min(vw - 24, 520);
    // Align the panel's right edge under the button, then clamp to the viewport.
    let left = r.right - width;
    left = Math.max(12, Math.min(left, vw - width - 12));
    setCoords({ top: r.bottom + 8, left, width });
  };

  const toggle = () => {
    if (!open) place();
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const onMove = () => place();
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open]);

  const count = selected.size;

  const panel =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: coords.top, left: coords.left, width: coords.width, zIndex: 1000 }}
            className="rounded-2xl border border-borderColor bg-white p-5 shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-blue">Categories</p>
              <button
                type="button"
                onClick={onClear}
                className="inline-flex items-center gap-1 text-sm text-secondary transition hover:text-blue"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Clear
              </button>
            </div>

            <div className="grid max-h-[50vh] grid-cols-1 gap-x-6 gap-y-3.5 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => {
                const checked = selected.has(cat);
                return (
                  <label key={cat} className="flex cursor-pointer items-center gap-2.5 text-sm text-blue">
                    <span
                      className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] border transition ${
                        checked ? "border-orange-500 bg-orange-500 text-white" : "border-borderColor bg-white"
                      }`}
                    >
                      {checked && (
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <input type="checkbox" className="sr-only" checked={checked} onChange={() => onToggle(cat)} />
                    <span className="truncate">{cat}</span>
                  </label>
                );
              })}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-haspopup="true"
        aria-expanded={open}
        className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-borderColor bg-white px-4 text-sm font-medium text-blue transition hover:bg-pageBackground/60"
      >
        <span className={`h-2 w-2 rounded-full ${count ? "bg-orange-500" : "bg-secondary/40"}`} />
        {count ? `Category (${count})` : "Category"}
        <svg
          className={`h-4 w-4 text-secondary transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {panel}
    </div>
  );
}
