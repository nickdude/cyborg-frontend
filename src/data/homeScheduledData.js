// Static content for the Timeline home feed, matched to the Figma design
// (node 2176-103056). The swipeable score cards and the dated milestone rows are
// driven by REAL member data (passed in from the dashboard). The sections below are
// the static scaffolding: calendar strip, onboarding prompts, live-better, and Rx.
export const homeScheduledData = {
  timeline: {
    tabs: [
      { label: "Timeline", locked: false },
      { label: "Digital Twin", locked: true },
    ],
    upcoming: {
      title: "Upcoming",
      subtitle: "in the next 2 weeks",
      // Two rows of seven. `bloodDraw: true` renders the vials icon instead of the number.
      rows: [
        [
          { day: 8 }, { day: 9 }, { day: 10 }, { day: 11 },
          { day: 12 }, { day: 13, bloodDraw: true }, { day: 14 },
        ],
        [
          { day: 15 }, { day: 16 }, { day: 17 }, { day: 18 },
          { day: 19 }, { day: 20 }, { day: 21 },
        ],
      ],
    },
  },
  onboarding: {
    title: "Finish onboarding to get most out of Cyborg",
    items: [
      { key: "insurance", icon: "ShieldCheck", title: "Insurance", sub: "Get the most value from Cyborg", href: "/settings" },
      { key: "wearable", icon: "Watch", title: "Wearable", sub: "Sync data from your health trackers", href: "/settings" },
      { key: "identify", icon: "ScanFace", title: "Identify", sub: "Verify your identity to import past medical records", href: "/onboarding" },
    ],
  },
  liveBetter: {
    title: "Live better, longer together",
    cards: [
      {
        image: "/assets/timeline/live-family.png",
        text: "Review family health insights from your intake",
        action: { type: "chevron" },
      },
      {
        image: "/assets/timeline/live-refer.png",
        textLines: ["Refer your friends and", "earn $50"],
        subtext: "Get $50 each",
        action: { type: "button", label: "Earn $50" },
      },
    ],
  },
  rx: {
    eyebrow: "Cyborg for Rx",
    headline: "Manage your medications with Cyborg",
    image: "/assets/timeline/rx-vial.png",
    benefits: [
      { icon: "DollarSign", text: "Members-only pricing" },
      { icon: "CreditCard", text: "No payment until approved" },
      { icon: "Activity", text: "Ongoing testing to manage & track progress" },
    ],
  },
};
