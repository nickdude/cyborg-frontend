"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import FloatingActionButton from "./FloatingActionButton";
import MealDetailsSheet from "./MealDetailsSheet";

// Geometry — single source of truth. Don't edit unless you also edit the
// matching offset math below (popup bottom must equal FAB center Y).
const FAB = 56;
const FAB_R = FAB / 2;            // 28
const HALO = 6;                   // visible halo width (plate showing through)
const STROKE = 2;                 // popup outline stroke width
// CR's inner EDGE (stroke-inside) must leave HALO px to the FAB. Because a
// centered stroke extends STROKE/2 inside the geometric path, we compensate:
const CUT_R = FAB_R + HALO + STROKE / 2;  // 35
const POPUP_W = 320;
const POPUP_H = 180;              // sized to fit content
const CORNER = 22;
const DARK = "#0F0F0F";

// Popup shape: rounded rect with a concave semicircular bite at the bottom
// center. Bite arc uses sweep-flag 0 (counterclockwise traversal) so it curves
// INTO the shape; sweep-flag 1 would bulge down past the bottom edge.
const POPUP_D = (() => {
  const cx = POPUP_W / 2;
  return [
    `M ${CORNER} 0`,
    `H ${POPUP_W - CORNER}`,
    `A ${CORNER} ${CORNER} 0 0 1 ${POPUP_W} ${CORNER}`,
    `V ${POPUP_H - CORNER}`,
    `A ${CORNER} ${CORNER} 0 0 1 ${POPUP_W - CORNER} ${POPUP_H}`,
    `H ${cx + CUT_R}`,
    `A ${CUT_R} ${CUT_R} 0 0 0 ${cx - CUT_R} ${POPUP_H}`,
    `H ${CORNER}`,
    `A ${CORNER} ${CORNER} 0 0 1 0 ${POPUP_H - CORNER}`,
    `V ${CORNER}`,
    `A ${CORNER} ${CORNER} 0 0 1 ${CORNER} 0`,
    "Z",
  ].join(" ");
})();

function QuickActionPopup({ open, onClose, onFilesPicked }) {
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  // Reset hidden file inputs when popup reopens so picking the same file
  // twice still fires onChange.
  useEffect(() => {
    if (open) {
      if (cameraRef.current) cameraRef.current.value = "";
      if (galleryRef.current) galleryRef.current.value = "";
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handlePick = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    onFilesPicked?.(files);
  };

  return (
    <>
      {/* Scrim — tap to close. Below popup/nav, above app content. */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-[50] bg-black/30 transition-opacity ${
          open ? "opacity-100 pointer-events-auto duration-200" : "opacity-0 pointer-events-none duration-150"
        }`}
      />

      {/* Popup — fixed, horizontally centered to viewport (flex symmetry
          places the FAB at viewport center too, so cutout aligns). Bottom
          edge sits at the FAB's center Y (nav-padding-bottom + fab-radius),
          making the cutout wrap the FAB's top half with an 8px halo.
          Popup z-55: above scrim (50) and nav bg plate (52), below nav content
          layer (60) — so the FAB and nav icons stay visible on top. */}
      <div
        className="fixed left-1/2 z-[55] [--popup-bottom:40px] lg:[--popup-bottom:58px]"
        style={{
          bottom: `calc(var(--popup-bottom) + env(safe-area-inset-bottom, 0px))`,
          width: `${POPUP_W}px`,
          height: `${POPUP_H}px`,
          transform: open ? "translateX(-50%) scale(1)" : "translateX(-50%) scale(0.92)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transformOrigin: "50% 100%",
          transition: open
            ? "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms cubic-bezier(0.22, 1, 0.36, 1)"
            : "transform 180ms cubic-bezier(0.4, 0, 1, 1), opacity 180ms cubic-bezier(0.4, 0, 1, 1)",
        }}
      >
        <svg
          viewBox={`0 0 ${POPUP_W} ${POPUP_H}`}
          width={POPUP_W}
          height={POPUP_H}
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            zIndex: 0,
            filter: "drop-shadow(0 -8px 22px rgba(0,0,0,0.18))",
          }}
        >
          {/* Solid popup shape — fill only, no stroke (no outer outline). */}
          <path d={POPUP_D} fill={DARK} />
          {/* Ring overlay tracing JUST the cutout's interior edge. Same
              semicircle as the popup's bite, drawn in reverse direction so
              sweep-flag=1 (opposite of the cutout's 0) traces the same top
              half. Stroked only, no fill. Hidden when popup is closed. */}
          <path
            d={`M ${POPUP_W / 2 - CUT_R} ${POPUP_H} A ${CUT_R} ${CUT_R} 0 0 1 ${POPUP_W / 2 + CUT_R} ${POPUP_H}`}
            fill="none"
            stroke={DARK}
            strokeWidth={STROKE}
            opacity={open ? 1 : 0}
          />
        </svg>

        <div
          className="relative flex h-full flex-col px-5"
          style={{
            zIndex: 1,
            paddingBottom: `${CUT_R + 8}px`,
            paddingTop: "18px",
          }}
        >
          <div className="mb-3 flex items-center justify-center gap-1.5">
            <h2 className="text-sm font-semibold text-white">Add a meal</h2>
            <svg className="h-3.5 w-3.5 text-white/60" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 11v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="12" cy="8" r="0.8" fill="currentColor" />
            </svg>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex flex-col items-center gap-2 rounded-2xl border border-[#e4e6ef] bg-white px-4 py-4 text-[13px] font-medium text-[#1e2027] transition hover:border-[#9ea3b1] active:scale-95"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h3l2-3h6l2 3h3a1 1 0 011 1v11a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              <span>Take photo</span>
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="flex flex-col items-center gap-2 rounded-2xl border border-[#e4e6ef] bg-white px-4 py-4 text-[13px] font-medium text-[#1e2027] transition hover:border-[#9ea3b1] active:scale-95"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="9" cy="10" r="1.5" fill="currentColor" />
                <path d="M4 17l5-5 4 4 3-3 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Upload image</span>
            </button>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handlePick} className="hidden" />
          <input ref={galleryRef} type="file" accept="image/*" multiple onChange={handlePick} className="hidden" />
        </div>
      </div>
    </>
  );
}

export default function BottomNavbar() {
  const pathname = usePathname();
  const isActive = (path) => pathname === path;

  // activeSheet: "actions" (popup) | "details" (meal details) | null
  const [activeSheet, setActiveSheet] = useState(null);
  const [pickedFiles, setPickedFiles] = useState([]);
  const popupOpen = activeSheet === "actions";

  const handleFilesPicked = (files) => {
    setPickedFiles(files);
    setActiveSheet("details");
  };

  const slotClass = (active) =>
    `flex-1 flex flex-col items-center gap-1 ${active ? "text-black" : "text-secondary"}`;

  return (
    <>
      <FloatingActionButton />

      <QuickActionPopup
        open={popupOpen}
        onClose={() => setActiveSheet(null)}
        onFilesPicked={handleFilesPicked}
      />

      {/* Nav background plate — RENDERED AS ITS OWN FIXED SIBLING, not
          nested inside <nav>. This is deliberate: `position: fixed` creates a
          stacking context, so nesting the plate inside <nav> would trap both
          plate (z-52) and content (z-60) inside the nav's context, and the
          popup (z-55 in root) would paint over the entire nav tree.
          Splitting them into two fixed siblings puts plate (52), popup (55),
          and nav items (60) at comparable root-level z-indices so the popup
          correctly sandwiches between plate and items. */}
      <div
        aria-hidden="true"
        className="fixed bottom-0 inset-x-0 h-[80px] bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)] lg:bottom-4 lg:mx-auto lg:max-w-[900px] lg:h-[84px] lg:rounded-2xl lg:border lg:border-borderColor lg:shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
        style={{ zIndex: 52 }}
      />

      {/* Nav items — z-60 so they stay visible/clickable above the popup. */}
      <nav
        className="fixed bottom-0 inset-x-0 lg:bottom-4 lg:mx-auto lg:max-w-[900px]"
        style={{ zIndex: 60 }}
      >
        <div
          className="relative mx-auto flex max-w-md items-center justify-around px-2 py-3 text-[10px] font-semibold lg:max-w-none lg:px-6 lg:py-3.5 lg:text-xs"
        >
          <Link href="/dashboard" className={slotClass(isActive("/dashboard"))}>
            <Image src="/assets/icons/house.svg" alt="home" width={22} height={22} className={isActive("/dashboard") ? "" : "opacity-60"} />
            <span>Home</span>
          </Link>

          <Link href="/data" className={slotClass(isActive("/data"))}>
            <Image src="/assets/icons/chart.svg" alt="data" width={22} height={22} className={isActive("/data") ? "" : "opacity-60"} />
            <span>Data</span>
          </Link>

          {/* Center slot — FAB lives HERE in the nav row. Same DOM parent
              whether popup is open or closed; only the inner icon rotates
              when toggling, so the button's hit area stays rock-steady. */}
          <div className="flex-1 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setActiveSheet((s) => (s === "actions" ? null : "actions"))}
              aria-label={popupOpen ? "Close quick actions" : "Open quick actions"}
              aria-expanded={popupOpen}
              className="rounded-full flex items-center justify-center"
              style={{
                width: `${FAB}px`,
                height: `${FAB}px`,
                // Open state: white FAB sits INSIDE the popup's cutout arc —
                // the dark ring comes from that SVG stroke, NOT a CSS border.
                backgroundColor: popupOpen ? "#FFFFFF" : DARK,
                color: popupOpen ? DARK : "#FFFFFF",
                border: "none",
                boxShadow: popupOpen ? "none" : "0 4px 14px rgba(0,0,0,0.22)",
                transition: "background-color 180ms ease-out, color 180ms ease-out, box-shadow 200ms ease-out",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="h-5 w-5"
                style={{
                  transform: popupOpen ? "rotate(45deg)" : "rotate(0deg)",
                  transition: "transform 200ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Protocol slot — label/target swap to Concierge when popup open */}
          <Link
            href={popupOpen ? "/concierge" : "/protocol"}
            className={slotClass(isActive(popupOpen ? "/concierge" : "/protocol"))}
          >
            <Image
              src={popupOpen ? "/assets/icons/text.svg" : "/assets/icons/protocol.svg"}
              alt={popupOpen ? "concierge" : "protocol"}
              width={22}
              height={22}
              className={isActive(popupOpen ? "/concierge" : "/protocol") ? "" : "opacity-60"}
            />
            <span>{popupOpen ? "Concierge" : "Protocol"}</span>
          </Link>

          <Link href="/market-place" className={slotClass(isActive("/market-place"))}>
            <Image src="/assets/icons/store.svg" alt="marketplace" width={22} height={22} className={isActive("/market-place") ? "" : "opacity-60"} />
            <span>Marketplace</span>
          </Link>
        </div>
      </nav>

      <MealDetailsSheet
        open={activeSheet === "details"}
        initialFiles={pickedFiles}
        onClose={() => setActiveSheet(null)}
      />
    </>
  );
}
