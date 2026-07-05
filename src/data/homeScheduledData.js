// Static content for the Timeline home feed, matched to the Figma design
// (node 2176-103056). Copy is verbatim from the design screenshots. Where a value
// maps to real member state (greeting, name, initials, appointment/report status),
// the dashboard passes live data in and overrides these defaults.
export const homeScheduledData = {
  hero: {
    // Appointment card shown over the hero photo.
    panelLabel: "Cyborg Blood Panel",
    appointmentText: "Your appointment is in 3 days",
    statusText: "Awaiting lab results",
    // Three-segment stepper (opacity per segment).
    progressBars: [1, 0.8, 0.6],
  },
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
    status: {
      title: "Your blood draw is being scheduled",
      description: "Your results will be uploaded to your dashboard once complete",
      steps: ["Scheduled", "Processing", "Results Ready"],
      // 0..1 — fill stops at the first (Scheduled) stage.
      progress: 0.33,
      activeStep: 0,
    },
    actions: [
      { label: "Add to calendar", variant: "outline", chevron: true },
      { label: "Get directions", variant: "solid" },
    ],
  },
  beforeAppointment: {
    title: "Before your appointment",
    subtitle: "Jan 22nd, 2026, 8:15 AM",
    cards: [
      {
        title: "Stay hydrated",
        description:
          "Drink at least 1L (4 cups) of water the before and the morning of your visit. Good hydration makes blood draw easier",
        index: "1 / 6",
      },
      {
        title: "Fast for 10 hours",
        description:
          "Have a light, healthy meal beforehand, then start your fast 10 hours before your appointment.",
        index: "2 / 6",
      },
      {
        title: "No caffeine and no alcohol",
        description:
          "Skip alcohol and caffeine the day before. Avoid all exercise for 24 hours, as it can affect your results",
        index: "3 / 6",
      },
      {
        title: "Avoid heavy, fatty foods",
        description:
          "Avoid heavy, fatty foods such as ice cream and coconut cream before your fast as these can influence your results if not part of your normal diet",
        index: "4 / 6",
      },
      {
        title: "Stop taking Biotin Supplements",
        description:
          "Stop taking supplements with biotin, commonly found in multivitamins, B-complex, or hair skin and nail vitamins. continue any prescriptions provided by your clinician.",
        index: "5 / 6",
      },
      {
        title: "Keep your arms warm",
        description:
          "Warm arm helps your veins dilate, making the draw quicker and more comfortable",
        index: "6 / 6",
      },
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
