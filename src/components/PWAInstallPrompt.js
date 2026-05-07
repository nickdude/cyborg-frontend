"use client";

import { useState, useEffect } from "react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl border border-purple-200 bg-white p-4 shadow-2xl animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100">
          <span className="text-xl font-bold text-purple-700">C</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-black">Install Cyborg</p>
          <p className="text-xs text-[#717178]">
            Add to home screen for faster access
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-xs text-[#717178] transition-colors hover:text-black"
          >
            Later
          </button>
          <button
            onClick={handleInstall}
            className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
