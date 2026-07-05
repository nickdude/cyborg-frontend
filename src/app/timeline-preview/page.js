"use client";

// TEMPORARY preview route for design QA (no auth). Renders the Timeline home with
// mock data so it can be screenshot-compared to the Figma frames.
// Safe to delete once the Timeline is signed off.
import { useState, useEffect } from "react";
import { Stethoscope, FlaskConical, Map } from "lucide-react";
import TimelineHome from "@/components/home/TimelineHome";
import { homeScheduledData } from "@/data/homeScheduledData";

// Mirrors the "awaiting lab results" state from the design (score cards locked).
const mockJourney = [
  { key: "advisory", tone: "purple", Icon: Stethoscope, title: "1-1 Advisory call", note: "Incomplete", date: "2026-03-22", href: "#", status: "locked", img: "/assets/timeline/review.jpg" },
  { key: "custom", tone: "purple", Icon: FlaskConical, title: "Custom Panel", note: "Upcoming", date: "2026-03-12", href: "#", status: "locked", img: "/assets/timeline/blood.jpg" },
  { key: "roadmap", tone: "purple", Icon: Map, title: "2026 Roadmap", note: null, date: "2026-01-08", href: "#", status: "active", img: "/assets/timeline/plan.jpg" },
];

export default function TimelinePreview() {
  const [tab, setTab] = useState("timeline");
  // Add ?ready to the URL to preview the "values" (ready) state instead of "awaiting".
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(new URLSearchParams(window.location.search).has("ready")); }, []);
  return (
    <TimelineHome
      data={homeScheduledData}
      greeting="Good morning"
      name="Yaman"
      initials="YN"
      activeTab={tab}
      onTabChange={setTab}
      cyborgScore={ready ? 72 : null}
      bioAge={ready ? 42.4 : null}
      planReady={ready}
      actionPlanHref="#"
      journey={mockJourney}
      processing={false}
    />
  );
}
