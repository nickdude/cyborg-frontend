"use client";

import { useEffect, useState } from "react";
import Toggle from "./Toggle";

const STORAGE_KEY = "cyborg.notificationPrefs";

const PREFS = [
  {
    id: "coachEmail",
    channel: "Email",
    title: "Coach",
    badge: "New feature",
    description: "Personalized recommendations from your biomarkers and health goals.",
    default: true,
  },
  {
    id: "labResultsEmail",
    channel: "Email",
    title: "Lab Results",
    description: "Get notified by email when new lab results are ready to review.",
    default: true,
  },
  {
    id: "orderUpdatesEmail",
    channel: "Email",
    title: "Order Updates",
    description: "Shipping and delivery updates for your marketplace orders.",
    default: true,
  },
];

export default function NotificationsSection() {
  const [prefs, setPrefs] = useState(() =>
    PREFS.reduce((acc, p) => ({ ...acc, [p.id]: p.default }), {})
  );

  // Hydrate from localStorage after mount (real, persisted preference state).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      setPrefs((prev) => ({ ...prev, ...saved }));
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  const toggle = (id) => (value) => {
    setPrefs((prev) => {
      const next = { ...prev, [id]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage may be unavailable */
      }
      return next;
    });
  };

  // Group prefs by channel for the section headers.
  const channels = [];
  const seen = {};
  for (const p of PREFS) {
    if (!seen[p.channel]) {
      seen[p.channel] = true;
      channels.push(p.channel);
    }
  }

  return (
    <section className="rounded-3xl bg-white px-5 py-7 shadow-sm lg:px-12 lg:py-10">
      <h2 className="text-2xl font-semibold text-black lg:text-3xl">Communication preferences</h2>
      <p className="mt-3 max-w-3xl text-sm text-secondary">
        * By turning on any channels below, you agree to receive personalized insights, recommendations
        &amp; reminders from Cyborg based on your health data and activity in Cyborg.
      </p>

      <div className="mt-8 space-y-8">
        {channels.map((channel) => (
          <div key={channel}>
            <h3 className="text-xl font-semibold text-black">{channel}</h3>
            <div className="mt-4 divide-y divide-borderColor">
              {PREFS.filter((p) => p.channel === channel).map((p) => (
                <div key={p.id} className="flex items-start justify-between gap-6 py-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-black">{p.title}</p>
                      {p.badge && (
                        <span className="rounded-md bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-500">
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 max-w-xl text-sm text-secondary">{p.description}</p>
                  </div>
                  <Toggle
                    checked={!!prefs[p.id]}
                    onChange={toggle(p.id)}
                    label={`Toggle ${p.title} notifications`}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
