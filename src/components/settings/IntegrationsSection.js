"use client";

import Link from "next/link";
import { ArrowRight, Heart, Activity, Watch, Footprints, Moon, Bike, Dumbbell, Smartphone } from "lucide-react";

// Wearable catalog mirrors superpower's Integrations tab. We have no backend to
// store OAuth connections, so every device is shown in its real, unconnected
// state — no fabricated "connected" accounts.
const WEARABLES = [
  { name: "Apple Health", icon: Heart, status: "Download the mobile app to connect", action: "download" },
  { name: "Oura", icon: Activity, status: "Not connected", action: "soon" },
  { name: "Whoop", icon: Watch, status: "For now, you can connect Whoop through Apple Health.", action: "soon" },
  { name: "Withings", icon: Heart, status: "Not connected", action: "soon" },
  { name: "Ultrahuman", icon: Footprints, status: "Not connected", action: "soon" },
  { name: "Fitbit", icon: Activity, status: "Not connected", action: "soon" },
  { name: "Peloton", icon: Bike, status: "Not connected", action: "soon" },
  { name: "Eight Sleep", icon: Moon, status: "Not connected", action: "soon" },
  { name: "Garmin", icon: Dumbbell, status: "Not connected", action: "soon" },
];

function ActionButton({ action }) {
  if (action === "soon") {
    return (
      <span className="shrink-0 rounded-lg border border-borderColor px-4 py-2 text-sm font-medium text-secondary">
        Coming soon
      </span>
    );
  }
  const label = action === "download" ? "Download App" : "Connect";
  return (
    <Link
      href="/concierge"
      className="shrink-0 rounded-lg border border-borderColor px-4 py-2 text-sm font-medium text-black transition hover:bg-gray-50"
    >
      {label}
    </Link>
  );
}

export default function IntegrationsSection() {
  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Mobile integrations banner */}
      <Link
        href="/concierge"
        className="flex items-center justify-between gap-4 rounded-3xl bg-white px-5 py-5 shadow-sm transition hover:shadow-md lg:px-8"
      >
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pageBackground">
            <Smartphone className="h-6 w-6 text-black" />
          </span>
          <div>
            <p className="font-medium text-black">Mobile Integrations</p>
            <p className="text-sm text-secondary">Connect more wearables in our mobile app</p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-secondary" />
      </Link>

      {/* Wearables */}
      <section className="rounded-3xl bg-white px-5 py-6 shadow-sm lg:px-10 lg:py-9">
        <h2 className="text-xl font-semibold text-black lg:text-2xl">Connect your wearables</h2>
        <div className="mt-6 grid grid-cols-1 gap-x-12 gap-y-6 lg:grid-cols-2">
          {WEARABLES.map((w) => {
            const Icon = w.icon;
            return (
              <div key={w.name} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-medium text-black">{w.name}</p>
                    <p className="text-sm text-secondary">{w.status}</p>
                  </div>
                </div>
                <ActionButton action={w.action} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
