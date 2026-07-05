"use client";

// TEMPORARY preview route for design QA (no auth). Renders the Timeline home with
// static design data so it can be screenshot-compared to the Figma frames.
// Safe to delete once the Timeline is signed off.
import { useState } from "react";
import TimelineHome from "@/components/home/TimelineHome";
import { homeScheduledData } from "@/data/homeScheduledData";

export default function TimelinePreview() {
  const [tab, setTab] = useState("timeline");
  return (
    <TimelineHome
      data={homeScheduledData}
      greeting="Good morning"
      name="Mark"
      initials="MD"
      activeTab={tab}
      onTabChange={setTab}
    />
  );
}
