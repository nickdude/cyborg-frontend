export const mockActionPlan = {
  overview:
    "This action plan is created using your blood tests, health intake survey, and AI-assisted clinical review to help optimize your health and future goals.",

  health: {
    score: 92,
    biologicalAge: 31.2,
  },

  monitoredIssues: [
    {
      title: "Fix iron deficiency to restore energy and prevent anemia",
      priority: "High",
      description:
        "Your panel shows very low iron stores even though your blood counts are still normal.",
      actions: [
        "Start 45–60 mg elemental iron every other morning with vitamin C",
        "Increase intake of iron-rich foods",
        "Re-test CBC, ferritin, and iron levels in 6–8 weeks",
      ],
    },
    {
      title: "Support healthy androgen balance for energy and fertility",
      priority: "Medium",
      description:
        "Low available androgens may reduce energy, strength, and fertility readiness.",
      actions: [
        "Improve sleep duration to 7.5–8 hours",
        "Maintain 2–3 strength training sessions weekly",
        "Review hormone supplementation with clinician",
      ],
    },
    {
      title: "Sharpen blood sugar control and reduce long-term heart risk",
      priority: "Medium",
      description:
        "Blood sugar markers are good but not yet in the longevity-optimal zone.",
      actions: [
        "Increase fiber intake to 25–35g/day",
        "Walk 10–15 minutes after meals",
        "Reduce late-night eating and refined carbs",
      ],
    },
  ],

  protocol: [
    {
      title: "Sleep",
      items: [
        "Aim for 7.5–8 hours nightly",
        "Get morning sunlight within 30 minutes of waking",
        "Avoid screens 60 minutes before bedtime",
      ],
    },
    {
      title: "Exercise",
      items: [
        "Add one weekly Zone 2 cardio session",
        "Walk after meals to reduce glucose spikes",
        "Deload every 6–8 weeks to support recovery",
      ],
    },
    {
      title: "Nutrition",
      items: [
        "Eat iron-rich foods 3–4 times per week",
        "Pair iron foods with vitamin C",
        "Limit tea/coffee around meals",
      ],
    },
  ],

  nextSteps: [
    "Schedule follow-up blood tests in 3 months",
    "Track progress on energy and sleep quality",
    "Review results with your clinician",
  ],
};
