export const homeScheduledData = {
  hero: {
    panelLabel: "Cyborg Blood Panel",
    appointmentText: "Your appointment is in 3 days",
    statusText: "Awaiting lab results",
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
      rows: [
        [8, 9, 10, 11, 12, 13, 14],
        [15, 16, 17, 18, 19, 20, 21],
      ],
    },
    status: {
      title: "Your blood draw is being scheduled",
      description: "Your results will be uploaded to your dashboard once complete",
      steps: ["Scheduled", "Processing", "Results Ready"],
      progress: 0.3,
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
          "Have a light dinner before 7:30 PM. Do not eat for 10 hours before your appointment.",
        index: "2 / 6",
      },
      {
        title: "Avoid intense workouts",
        description:
          "Skip hard training for 24 hours prior. It can temporarily shift markers.",
        index: "3 / 6",
      },
    ],
  },
  liveBetter: {
    title: "Live better, longer together",
    cards: [
      {
        image: "/assets/refer.png",
        text: "Review family health insights from your intake",
        action: { type: "chevron" },
      },
      {
        image: "/assets/refer-friend.png",
        textLines: ["Refer your friends and", "earn $50"],
        subtext: "Get $50 each",
        action: { type: "button", label: "Earn $50" },
      },
    ],
  },
  rx: {
    title: "Cyborg for Rx",
    headline: "Manage your medications with Cyborg",
    image: "/assets/sample-medicine.png",
    benefits: [
      { icon: "DollarSign", text: "Members-only pricing" },
      { icon: "CreditCard", text: "No payment until approved" },
      { icon: "Activity", text: "Ongoing testing to manage & track progress" },
    ],
  },
};
