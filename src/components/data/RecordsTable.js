"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

/* ------------------------------------------------------------------ */
/* Field mapping helpers — map real report fields to table columns     */
/* ------------------------------------------------------------------ */

function fileName(report) {
  return report?.filename || report?.fileName || "Uploaded report";
}

// A human "Type" label derived from the file extension / mime.
function typeLabel(report) {
  const name = fileName(report).toLowerCase();
  const mime = (report?.mimeType || report?.contentType || "").toLowerCase();
  if (report?.testCount || report?.biomarkerCount || /lab|result|blood|panel/.test(name)) {
    return "Lab Results";
  }
  if (mime.includes("pdf") || name.endsWith(".pdf")) return "PDF";
  if (/\.(jpe?g|png|gif|webp|heic)$/.test(name) || mime.startsWith("image/")) return "Image";
  return "Document";
}

// Count of saved results, falling back gracefully.
function resultsCount(report) {
  const n =
    report?.testCount ??
    report?.biomarkerCount ??
    report?.resultsCount ??
    (Array.isArray(report?.biomarkers) ? report.biomarkers.length : null);
  return typeof n === "number" && n > 0 ? n : 0;
}

function fmtDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function uploadedDate(report) {
  return fmtDate(report?.createdAt || report?.uploadedAt);
}

function reportDate(report) {
  return fmtDate(report?.reportDate);
}

/* ------------------------------------------------------------------ */
/* Per-row actions menu (3-dot -> Delete)                              */
/* ------------------------------------------------------------------ */

function RowMenu({ onView, onDelete, deleting, canView }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const MENU_W = 168;

  const toggle = (e) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      // Right-align the menu under the button; clamp to viewport.
      const left = Math.max(8, Math.min(r.right - MENU_W, window.innerWidth - MENU_W - 8));
      setCoords({ top: r.bottom + 6, left });
    }
    setOpen((v) => !v);
  };

  // Close on outside click, scroll, or resize (the menu is fixed-positioned).
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const onMove = () => setOpen(false);
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  // Rendered in a portal so the table card's `overflow-hidden` can't clip it.
  const menu =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: coords.top, left: coords.left, width: MENU_W, zIndex: 1000 }}
            className="overflow-hidden rounded-xl border border-borderColor bg-white py-1 shadow-[0_12px_34px_-8px_rgba(0,0,0,0.25)]"
          >
            {canView && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onView?.();
                }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-blue transition hover:bg-pageBackground"
              >
                <svg className="h-4 w-4 text-secondary" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M2.5 12C4 7.5 7.5 5 12 5s8 2.5 9.5 7c-1.5 4.5-5 7-9.5 7s-8-2.5-9.5-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                </svg>
                Open report
              </button>
            )}
            <button
              type="button"
              disabled={deleting}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onDelete?.();
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 6H21M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6L18.1327 19.0114C18.0579 20.1342 17.125 21 16 21H8C6.87502 21 5.94211 20.1342 5.86734 19.0114L5 6H19Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 11V17M14 11V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              {deleting ? "Deleting…" : "Delete report"}
            </button>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="flex items-center justify-end gap-1">
      {canView && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onView?.();
          }}
          aria-label="Open report"
          title="Open report"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-secondary transition hover:bg-pageBackground hover:text-blue"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M2.5 12C4 7.5 7.5 5 12 5s8 2.5 9.5 7c-1.5 4.5-5 7-9.5 7s-8-2.5-9.5-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </button>
      )}
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-label="More actions"
        aria-expanded={open}
        title="More actions"
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${
          open ? "bg-pageBackground text-blue ring-1 ring-borderColor" : "text-secondary hover:bg-pageBackground hover:text-blue"
        }`}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
        </svg>
      </button>
      {menu}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Records table — superpower-style                                    */
/* ------------------------------------------------------------------ */

const FILTER_OPTIONS = [
  { id: "all", label: "All Files" },
  { id: "lab", label: "Lab Results" },
  { id: "document", label: "Documents" },
];

export default function RecordsTable({
  reports,
  search,
  onSearchChange,
  filter,
  onFilterChange,
  onUpload,
  uploading,
  onView,
  onDelete,
  deletingReportId,
}) {
  const [view, setView] = useState("list"); // list | grid
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    if (!filterOpen) return;
    const onDoc = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [filterOpen]);

  const rows = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    return reports.filter((r) => {
      const matchesSearch = !q || fileName(r).toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (filter === "lab") return typeLabel(r) === "Lab Results";
      if (filter === "document") return typeLabel(r) !== "Lab Results";
      return true;
    });
  }, [reports, search, filter]);

  const activeFilterLabel =
    FILTER_OPTIONS.find((o) => o.id === filter)?.label || "All Files";

  return (
    <div className="space-y-4 pb-10">
      {/* Toolbar: search, filter, view toggle, upload */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-secondary">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
              <path d="M20 20L17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search files…"
            className="w-full rounded-full border border-borderColor bg-white py-2.5 pl-10 pr-4 text-sm text-blue outline-none transition placeholder:text-secondary focus:border-primary/40"
          />
        </div>

        {/* All Files filter dropdown */}
        <div className="relative" ref={filterRef}>
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className="inline-flex h-10 w-full items-center justify-between gap-2 rounded-full border border-borderColor bg-white px-4 text-sm font-medium text-blue transition hover:bg-pageBackground/60 sm:w-auto"
          >
            {activeFilterLabel}
            <svg className={`h-4 w-4 text-secondary transition-transform ${filterOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {filterOpen && (
            <div className="absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-xl border border-borderColor bg-white py-1 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.18)]">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onFilterChange(opt.id);
                    setFilterOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm transition hover:bg-pageBackground ${
                    filter === opt.id ? "font-medium text-blue" : "text-secondary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* List / grid view toggle */}
        <div className="inline-flex items-center rounded-full border border-borderColor bg-white p-1">
          <button
            type="button"
            onClick={() => setView("list")}
            aria-label="List view"
            aria-pressed={view === "list"}
            className={`grid h-8 w-8 place-items-center rounded-full transition ${
              view === "list" ? "bg-black text-white" : "text-secondary hover:text-blue"
            }`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M8 6H21M8 12H21M8 18H21M3.5 6H3.51M3.5 12H3.51M3.5 18H3.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setView("grid")}
            aria-label="Grid view"
            aria-pressed={view === "grid"}
            className={`grid h-8 w-8 place-items-center rounded-full transition ${
              view === "grid" ? "bg-black text-white" : "text-secondary hover:text-blue"
            }`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="4" y="4" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="2" />
              <rect x="14" y="4" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="2" />
              <rect x="4" y="14" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="2" />
              <rect x="14" y="14" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </div>

        {/* Black Upload button */}
        <button
          type="button"
          onClick={onUpload}
          disabled={uploading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-black px-5 text-sm font-medium text-white transition hover:bg-black/90 disabled:opacity-60"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 16V4M12 4L7 9M12 4L17 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 14V18C5 19.1046 5.89543 20 7 20H17C18.1046 20 19 19.1046 19 18V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-borderColor bg-white py-14 text-center text-sm text-secondary">
          No records match your search.
        </div>
      ) : view === "grid" ? (
        /* Grid view */
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((report) => {
            const isReady = !report.status || report.status === "ready";
            const isProcessing = report.status === "uploaded" || report.status === "analyzing";
            const count = resultsCount(report);
            return (
              <div
                key={report._id}
                role={isReady ? "button" : undefined}
                tabIndex={isReady ? 0 : undefined}
                onClick={() => isReady && onView(report._id)}
                onKeyDown={(e) => {
                  if (isReady && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onView(report._id);
                  }
                }}
                className={`flex flex-col gap-3 rounded-2xl border border-borderColor bg-white p-4 transition ${
                  isReady ? "cursor-pointer hover:border-secondary/40" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <FileIcon processing={isProcessing} />
                  <RowMenu
                    canView={isReady}
                    deleting={deletingReportId === report._id}
                    onView={() => onView(report._id)}
                    onDelete={() => onDelete(report._id)}
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-blue">{fileName(report)}</p>
                  <p className="mt-0.5 text-xs text-secondary">{typeLabel(report)}</p>
                </div>
                <ResultsCell processing={isProcessing} count={count} />
                <p className="text-xs text-secondary">Uploaded {uploadedDate(report)}</p>
              </div>
            );
          })}
        </div>
      ) : (
        /* List/table view */
        <div className="overflow-hidden rounded-2xl border border-borderColor bg-white">
          {/* Header row (desktop only) */}
          <div className="hidden grid-cols-[2.2fr_1fr_1.3fr_1.1fr_1.1fr_auto] gap-4 border-b border-borderColor px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-secondary lg:grid">
            <span>File</span>
            <span>Type</span>
            <span>Results</span>
            <span>Upload Date</span>
            <span>Report Date</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="divide-y divide-borderColor">
            {rows.map((report) => {
              const isReady = !report.status || report.status === "ready";
              const isProcessing = report.status === "uploaded" || report.status === "analyzing";
              const count = resultsCount(report);
              return (
                <div
                  key={report._id}
                  role={isReady ? "button" : undefined}
                  tabIndex={isReady ? 0 : undefined}
                  onClick={() => isReady && onView(report._id)}
                  onKeyDown={(e) => {
                    if (isReady && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      onView(report._id);
                    }
                  }}
                  className={`grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3.5 transition lg:grid-cols-[2.2fr_1fr_1.3fr_1.1fr_1.1fr_auto] lg:gap-4 lg:px-5 lg:py-4 ${
                    isReady ? "cursor-pointer hover:bg-pageBackground/50" : ""
                  }`}
                >
                  {/* File */}
                  <div className="flex min-w-0 items-center gap-3">
                    <FileIcon processing={isProcessing} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-blue lg:text-[15px]">{fileName(report)}</p>
                      <p className="mt-0.5 text-xs text-secondary lg:hidden">
                        {typeLabel(report)} · {uploadedDate(report)}
                      </p>
                    </div>
                  </div>

                  {/* Type */}
                  <div className="hidden text-sm text-secondary lg:block">{typeLabel(report)}</div>

                  {/* Results */}
                  <div className="hidden lg:block">
                    <ResultsCell processing={isProcessing} count={count} />
                  </div>

                  {/* Upload Date */}
                  <div className="hidden text-sm text-secondary lg:block">{uploadedDate(report)}</div>

                  {/* Report Date */}
                  <div className="hidden text-sm text-secondary lg:block">{reportDate(report)}</div>

                  {/* Actions */}
                  <div className="justify-self-end">
                    <RowMenu
                      canView={isReady}
                      deleting={deletingReportId === report._id}
                      onView={() => onView(report._id)}
                      onDelete={() => onDelete(report._id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function FileIcon({ processing }) {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center text-orange-500">
      {processing ? (
        <svg className="h-5 w-5 animate-spin text-secondary" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 3H13L19 9V19C19 20.1046 18.1046 21 17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3Z" stroke="currentColor" strokeWidth="1.8" />
          <path d="M13 3V9H19" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )}
    </span>
  );
}

function ResultsCell({ processing, count }) {
  if (processing) {
    return <span className="text-sm text-secondary">Processing…</span>;
  }
  if (count > 0) {
    return (
      <span className="text-sm font-medium text-biomarkerOptimal">
        {count} {count === 1 ? "result" : "results"} saved
      </span>
    );
  }
  return <span className="text-sm text-secondary">No results saved</span>;
}
