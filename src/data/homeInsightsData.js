import { biomarkersData } from "@/data/biomarkersData";

export const homeInsightsData = {
  keyInsight: {
    tag: "Top health priority:",
    message: "Protect your heart and arteries",
  },
  summary: {
    total: 75,
    optimal: 43,
    normal: 27,
    outOfRange: 5,
  },
  biomarkers: biomarkersData,
  contributingBiomarkers: [
    {
      id: 1,
      name: "Lipoprotein (a)",
      value: "177.4",
      unit: "nmol/L",
      category: "Contributing Biomarkers",
      status: "out_of_range",
      trend: [150, 162, 170, 177.4],
    },
    {
      id: 2,
      name: "LDL Cholesterol",
      value: "104",
      unit: "mg/dL",
      category: "Contributing Biomarkers",
      status: "out_of_range",
      trend: [96, 99, 101, 104],
    },
    {
      id: 3,
      name: "Apolipoprotein B",
      value: "78",
      unit: "mg/dL",
      category: "Contributing Biomarkers",
      status: "normal",
      trend: [71, 73, 75, 78],
    },
    {
      id: 4,
      name: "HDL Cholesterol",
      value: "59",
      unit: "mg/dL",
      category: "Contributing Biomarkers",
      status: "normal",
      trend: [52, 55, 57, 59],
    },
    {
      id: 5,
      name: "Homocysteine",
      value: "10",
      unit: "umol/L",
      category: "Contributing Biomarkers",
      status: "normal",
      trend: [8.5, 9.1, 9.6, 10],
    },
  ],
  timelineActions: [
    { label: "Log Food", variant: "solid" },
    { label: "Add an activity", variant: "solid" },
  ],
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
};
