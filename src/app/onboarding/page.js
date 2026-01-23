"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { userAPI, questionnaireAPI } from "@/services/api";
import Link from "next/link";
import { getNextRoute } from "@/utils/navigationFlow";
import { Loader2 } from "lucide-react";

const SECTIONS = [
  {
    id: "1",
    questions: [
      {
        code: "1.1",
        title: "Health is personal.",
        description:
          "Your health isn’t one-size-fits-all. Understanding your story helps us provide the best care tailored to you. Complete the survey in one go for the best experience - it takes about 15 minutes.",
        type: "intro",
      },
      { code: "1.2", title: "What do you like to be called?", type: "text", placeholder: "Tell us here..." },
      { code: "1.3", title: "What biological sex were you assigned at birth?", type: "single", options: ["Male", "Female"] },
      {
        code: "1.4",
        title: "What is your ethnicity?",
        subtitle:
          "This information helps us better understand health patterns across different communities and provide more personalized care.",
        type: "multi",
        options: [
          "American Indian or Alaska Native",
          "Asian",
          "Black or African American",
          "Hispanic or Latino",
          "Native Hawaiian or Other Pacific Islander",
          "White",
          "Other (please specify)",
          "Prefer not to say",
        ],
      },
      { code: "1.5", title: "What is your weight (lbs)?", type: "text", placeholder: "Tell us here..." },
      { code: "1.6", title: "What is your height (ft/in)?", type: "height" },
      { code: "1.7", title: "What do you do for work?", type: "text", placeholder: "Tell us here..." },
    ],
  },
  {
    id: "2",
    questions: [
      {
        code: "2.1",
        title: "Habits are the building blocks of a healthy life.",
        description:
          "Let’s take a look at how you eat, move and sleep so we can craft the most effective plan for you.",
        type: "intro",
      },
      {
        code: "2.2",
        title: "Do you follow any of the following diets (≥70% of the time)?",
        type: "multi",
        options: [
          "No specific diet",
          "Vegetarian",
          "Vegan",
          "Pescatarian",
          "Keto",
          "Paleo",
          "Carnivore",
          "Animal-Based (70% animal protein/fats)",
          "Low Carb",
          "Mediterranean",
          "AIP",
          "Low FODMAP",
          "Other (please specify)",
        ],
      },
      { code: "2.3", title: "If you selected Other, please specify", type: "text", placeholder: "Tell us here..." },
      {
        code: "2.4",
        title: "How often do you exercise?",
        type: "single",
        options: [
          "Sedentary (0-1 times per week)",
          "Light (1-2 times per week)",
          "Moderate (2-3 times per week)",
          "Regular (4+ times per week)",
          "Intensive (athlete-level, near-daily)",
        ],
      },
      {
        code: "2.5",
        title: "Which types of exercise or activities do you do most frequently?",
        subtitle: "Select all that apply.",
        type: "multi",
        options: [
          "Cardio (running, cycling, swimming)",
          "Strength / Weights",
          "HIIT",
          "Yoga / Pilates",
          "Sports (basketball, tennis, soccer)",
          "Low-impact (walking, hiking, stretching)",
          "Other (please specify)",
        ],
      },
      { code: "2.6", title: "If you selected Other, please specify", type: "text", placeholder: "Tell us here..." },
      {
        code: "2.7",
        title: "On average, how many hours of sleep do you get per night?",
        type: "single",
        options: ["8+", "7 - 8", "6 - 7", "5 - 6", "<5"],
      },
      {
        code: "2.8",
        title: "How would you describe your typical sleep quality?",
        type: "single",
        options: [
          "Excellent: Easy to fall asleep, restful",
          "Good: Minor issues",
          "Fair: Occasional difficulty",
          "Poor: Frequent issues",
          "Very poor: Severe insomnia / unrestful",
        ],
      },
      {
        code: "2.9",
        title: "Which of the following best describes your cigarette or tobacco use?",
        type: "single",
        options: [
          "I have never smoked",
          "I used to smoke but quit",
          "I smoke occasionally (less than daily)",
          "I smoke daily - less than 5 cigarettes per day",
          "I smoke daily - 5 to 10 cigarettes per day",
          "I smoke daily - more than 10 cigarettes per day",
          "I only smoke non-tobacco products (i.e. vapes, marijuana)",
        ],
      },
      {
        code: "2.10",
        title: "On average, how often do you drink alcohol?",
        type: "single",
        options: [
          "Never",
          "Used to drink but stopped",
          "Occasionally (less than once per week)",
          "1-5 drinks per week",
          "1-2 drinks per day",
          "More than 3 drinks per day",
        ],
      },
      {
        code: "2.11",
        title: "Is there anything about your lifestyle (diet, exercise, sleep, etc) you want to add or that we didn’t cover?",
        type: "textarea",
        placeholder: "Tell us here...",
      },
    ],
  },
  {
    id: "3",
    questions: [
      {
        code: "3.1",
        title: "Your health journey is uniquely yours.",
        description:
          "Tell us about any diagnoses, symptoms and medications you use. Any details are helpful so we can make effective recommendations. The more we know, the better we can support you.",
        type: "intro",
      },
      {
        code: "3.2",
        title: "What chronic condition(s) do you have?",
        subtitle: "Select all that apply.",
        type: "multi",
        options: [
          "Digestive/gut issues (IBS, IBD, reflux, etc)",
          "Heart disease (incl. hypertension, high cholesterol)",
          "Diabetes / Prediabetes",
          "Autoimmune disease (Celiac, Hashimoto’s, RA, etc)",
          "Kidney disease",
          "Skin conditions (eczema, psoriasis, acne, rashes)",
          "Mental health (anxiety, depression, ADHD, etc)",
          "Neurodegenerative disease (Alzheimer’s, Parkinson’s, dementia)",
          "Allergies (seasonal, food, chemical)",
          "Other (please specify)",
        ],
      },
      { code: "3.3", title: "If you selected Other, please specify", type: "text", placeholder: "Tell us here..." },
      {
        code: "3.4",
        title: "Tell us more about your medical history - the more detail, the better",
        type: "textarea",
        placeholder: "Tell us here...",
      },
      {
        code: "3.5",
        title: "Do you currently have any active symptoms affecting your health day-to-day?",
        subtitle: "Select all that apply.",
        type: "multi",
        options: [
          "Fatigue",
          "Digestive issues (bloating, constipation, diarrhea)",
          "Heart/circulation issues (high BP, cholesterol, poor circulation)",
          "Weight/metabolism (weight change, cravings, blood sugar swings)",
          "Sleep, hormone issues (PMS, irregular cycles, low libido, hot flashes, poor sleep)",
          "Inflammation/pain (joints, muscles, headaches, chronic pain)",
          "Skin/hair issues (rashes, acne, thinning, loss)",
          "Frequent illness (colds, infections, low immunity)",
          "Other (please specify)",
        ],
      },
      { code: "3.6", title: "If you selected Other, please specify", type: "text", placeholder: "Tell us here..." },
      {
        code: "3.7",
        title: "Please list any prescription medications you are currently taking, including the dose and frequency.",
        type: "textarea",
        placeholder: "For example: Metformin, 500mg once per day",
      },
      { code: "3.8", title: "Please list any vitamins and / or supplements you are currently taking.", type: "textarea" },
      { code: "3.9", title: "Please list any surgeries you’ve had, including the year it was performed.", type: "textarea" },
      {
        code: "3.10",
        title:
          "Do you have any significant health conditions that run in your family? This will help us personalize proactive recommendations & insights to help mitigate risk.",
        subtitle: "Select all that apply.",
        type: "multi",
        options: [
          "Heart disease / high cholesterol / high BP",
          "Diabetes / blood sugar issues",
          "Thyroid disorders",
          "Autoimmune conditions",
          "Cancer",
          "Neurodegenerative disease",
          "None",
          "Other (please specify)",
        ],
      },
      { code: "3.11", title: "If you selected Other, please specify", type: "text", placeholder: "Tell us here..." },
      { code: "3.12", title: "Please add any details you want us to know (for example: “family history of breast cancer” or “my dad has high blood pressure”). Try to include as much detail as possible.", type: "textarea" },
      { code: "3.13", title: "Is there anything about your medical history you want to add or that we didn’t cover?", type: "textarea", placeholder: "Tell us here..." },
    ],
  },
  {
    id: "4",
    questions: [
      {
        code: "4.1",
        title:
          "Are you interested in discussing any of the following RX (prescription) treatments with your Superpower clinical team?",
        subtitle:
          "Note: You will not be charged for any services by selecting any of the options below. It will only notify your clinician of your interest in the service.",
        type: "multi",
        options: [
          "Metabolic health (GLP-1s, blood sugar, insulin resistance, weight)",
          "Skin health (topical peptides, complexion, aging)",
          "Longevity (NAD+, glutathione, rapamycin, metformin, LDN, etc)",
          "Hair loss (finasteride, dutasteride, minoxidil)",
          "Women’s hormone health (oral/topical, personalized)",
          "Men’s hormone health (testosterone stimulation)",
          "None",
        ],
      },
      {
        code: "4.2",
        title: "How interested are you in pursuing treatment?",
        type: "single",
        options: [
          "I’m currently taking treatment for this issue",
          "Very interested (I’m actively seeking help)",
          "Curious (I just want to learn more)",
          "Not interested",
        ],
      },
    ],
  },
  {
    id: "5",
    questions: [
      {
        code: "5.1",
        title: "Tell us about what you want to achieve so we can help you get there.",
        description:
          "It’s time to get clear on what truly drives you. Think of this as your “why.” The more we understand your motivations and challenges, the better health guidance you’ll achieve.",
        type: "intro",
      },
      {
        code: "5.2",
        title: "What are you most hoping to accomplish with Superpower?",
        subtitle: "Select all that apply.",
        type: "multi",
        options: [
          "Get root-cause insights into a health challenge or symptom",
          "Screen my risk for conditions & work on prevention",
          "Unlock new ways to optimize my health",
          "Understand my health at a deeper level",
          "Other (please specify)",
        ],
      },
      { code: "5.3", title: "If you selected Other, please specify", type: "text", placeholder: "Tell us here..." },
      {
        code: "5.4",
        title: "Over the course of a year, how much do you budget for health? (excluding insurance)",
        type: "single",
        options: ["<$1,000", "1,000 - 2,000", "2,000 - 5,000", "5,000 - 15,000", "15,000+"],
      },
      {
        code: "5.5",
        title: "Are there any areas you want to focus on for improving your health?",
        subtitle: "Select all that apply.",
        type: "multi",
        options: ["Products", "Medications", "Nutrition", "Exercise", "Lifestyle", "Other"],
      },
      {
        code: "5.6",
        title:
          "We craft your results in language you can understand. How technical would you like your results presented to you?",
        type: "scale",
        options: ["1", "2", "3", "4", "5"],
      },
    ],
  },
];

export default function Onboarding() {
  const router = useRouter();
  const { user, updateUser, token } = useAuth();
  const [sections, setSections] = useState([]);
  const [loadingQuestionnaire, setLoadingQuestionnaire] = useState(true);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch questionnaire from API on mount
  useEffect(() => {
    const fetchQuestionnaire = async () => {
      try {
        setLoadingQuestionnaire(true);
        const response = await questionnaireAPI.get();
        if (response?.data?.questionary) {
          setSections(response.data.questionary);
        }
      } catch (err) {
        console.error("Error fetching questionnaire:", err);
        setSections(SECTIONS);
      } finally {
        setLoadingQuestionnaire(false);
      }
    };

    if (token) {
      fetchQuestionnaire();
    }
  }, [token]);

  const section = sections[sectionIndex];
  const step = section?.questions?.[stepIndex];
  const sectionTotal = section?.questions?.length || 0;
  const sectionProgress = section ? Math.round(((stepIndex + 1) / sectionTotal) * 100) : 0;

  const isRequired = useMemo(() => {
    // mark some steps required: key data like 1.3 biological sex
    return ["1.3"].includes(step?.code);
  }, [step?.code]);

  const updateAnswer = (code, value) => {
    setAnswers((prev) => ({ ...prev, [code]: value }));
    setError("");
  };

  const toggleMulti = (code, value) => {
    const current = answers[code] || [];
    const exists = current.includes(value);
    const next = exists ? current.filter((v) => v !== value) : [...current, value];
    updateAnswer(code, next);
  };

  const handleNext = () => {
    if (isRequired && !answers[step?.code]) {
      setError("Please provide an answer to continue.");
      return;
    }
    setError("");
    advanceStep();
  };

  const handleSkip = () => {
    setError("");
    advanceStep();
  };

  const handleBack = () => {
    setError("");
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
      return;
    }
    if (sectionIndex > 0) {
      const prevSection = sections[sectionIndex - 1];
      setSectionIndex((s) => s - 1);
      setStepIndex(prevSection.questions.length - 1);
    }
  };

  const advanceStep = () => {
    if (stepIndex < sectionTotal - 1) {
      setStepIndex((i) => i + 1);
      return;
    }
    if (sectionIndex < sections.length - 1) {
      setSectionIndex((s) => s + 1);
      setStepIndex(0);
      return;
    }
    handleSubmit();
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      await userAPI.saveOnboarding(user.id, {
        answers,
        questionsVersion: "2.0",
      });
      // Update user context
      updateUser({ ...user, onboardingCompleted: true });
      // Navigate to next step
      const nextRoute = getNextRoute({ ...user, onboardingCompleted: true });
      router.push(nextRoute);
    } catch (e) {
      setError(e.message || "Failed to save onboarding");
    } finally {
      setLoading(false);
    }
  };

  const renderInput = () => {
    if (!step) return null;

    switch (step.type) {
      case "intro":
        return null;
      case "text":
        return (
          <input
            type="text"
            value={answers[step.code] || ""}
            onChange={(e) => updateAnswer(step.code, e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder={step.placeholder || "Tell us here..."}
          />
        );
      case "textarea":
        return (
          <textarea
            value={answers[step.code] || ""}
            onChange={(e) => updateAnswer(step.code, e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            rows={4}
            placeholder={step.placeholder || "Tell us here..."}
          />
        );
      case "single":
        return (
          <div className="space-y-3">
            {step.options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => updateAnswer(step.code, opt)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                  answers[step.code] === opt
                    ? "border-primary bg-purple-50"
                    : "border-gray-200 hover:border-purple-400"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        );
      case "multi":
        return (
          <div className="space-y-3">
            {step.options.map((opt) => {
              const selected = (answers[step.code] || []).includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleMulti(step.code, opt)}
                  className={`w-full text-left px-4 py-3 rounded-lg border flex items-center justify-between transition ${
                    selected
                      ? "border-primary bg-purple-50"
                      : "border-gray-200 hover:border-purple-400"
                  }`}
                >
                  <span>{opt}</span>
                  <span className={`w-3 h-3 rounded-full ${selected ? "bg-primary" : "border border-gray-300"}`}></span>
                </button>
              );
            })}
          </div>
        );
      case "height": {
        const value = answers[step.code] || { ft: "", in: "" };
        return (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">Feet</label>
              <input
                type="number"
                value={value.ft}
                onChange={(e) => updateAnswer(step.code, { ...value, ft: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. 5"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Inches</label>
              <input
                type="number"
                value={value.in}
                onChange={(e) => updateAnswer(step.code, { ...value, in: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. 9"
              />
            </div>
          </div>
        );
      }
      case "scale":
        return (
          <div className="flex items-center gap-3 justify-center">
            {step.options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => updateAnswer(step.code, opt)}
                className={`w-10 h-10 rounded-md border flex items-center justify-center text-sm font-semibold transition ${
                  answers[step.code] === opt
                    ? "border-primary bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-purple-400"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  // Loading state
  if (loadingQuestionnaire) {
    return (
      <div className="min-h-screen bg-pageBackground flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading questionnaire...</p>
        </div>
      </div>
    );
  }

  // Error state - sections empty
  if (sections.length === 0) {
    return (
      <div className="min-h-screen bg-pageBackground flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Unable to load questionnaire</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-purple-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!step) {
    return null;
  }

  return (
    <div className="min-h-screen bg-pageBackground font-inter">
      <div className="max-w-md  flex flex-col justify-between min-h-screen mx-auto bg-pageBackground rounded-xl p-8 relative">
        {/* Progress bar */}
        <div className="">
            <div className="w-full h-1 bg-gray-200 rounded mb-6">
                <div
                    className="h-1 bg-primary rounded"
                    style={{ width: `${sectionProgress}%` }}
                />
            </div>

            <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                <button onClick={handleBack} className="text-gray-600 hover:text-black">←</button>
                <div>
                    Section {sectionIndex + 1} of {sections.length} · Step {stepIndex + 1} of {sectionTotal}
                </div>
            </div>

            <div className="min-h-[60vh] flex flex-col gap-8 ">
                    <h1 className="text-2xl font-extrabold tracking-tight mb-2">CYBORG</h1>

                    <div className="space-y-4">
                    <div className="text-xl font-semibold leading-tight">{step.title}</div>
                    {step.description && <p className="text-sm text-black leading-relaxed">{step.description}</p>}
                    {step.subtitle && <p className="text-xs text-gray-500 leading-relaxed">{step.subtitle}</p>}
                    </div>

                    <div className="mt-6 mb-6">{renderInput()}</div>

                    {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                    )}

            </div>
            
        </div>
       
       {/* <div className="min-h-[60vh] flex flex-col gap-8 bg-red-300">
            <h1 className="text-2xl font-extrabold tracking-tight mb-2">CYBORG</h1>

            <div className="space-y-4">
            <div className="text-xl font-semibold leading-tight">{step.title}</div>
            {step.description && <p className="text-sm text-black leading-relaxed">{step.description}</p>}
            {step.subtitle && <p className="text-xs text-gray-500 leading-relaxed">{step.subtitle}</p>}
            </div>

            <div className="mt-6 mb-6">{renderInput()}</div>

            {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
            </div>
            )}

       </div> */}

        

        <div>
            <div className="flex flex-col gap-3">
                    <button
                        onClick={handleNext}
                        disabled={loading}
                        className={`flex-1 py-3 rounded-lg font-semibold transition ${
                        loading ? "bg-gray-300 text-gray-500" : "bg-black text-white hover:bg-gray-900"
                        }`}
                    >
                        {sectionIndex === sections.length - 1 && stepIndex === sectionTotal - 1
                        ? loading ? "Saving..." : "Finish"
                        : "Next"}
                    </button>
                    {!isRequired && step?.type !== "intro" && (
                        <button
                        type="button"
                        onClick={handleSkip}
                        disabled={loading}
                        className="flex-1 py-3 rounded-lg font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50"
                        >
                        Skip
                        </button>
                    )}
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-2 text-primary text-xs">
                    {Array.from({ length: sectionTotal }).map((_, idx) => (
                        <span
                        key={idx}
                        className={`w-1.5 h-2.5 ${idx === stepIndex ? "bg-primary" : "bg-tertiary"}`}
                        />
                    ))}
            </div>
        </div>

      

        {/* <div className="mt-6 text-center">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:underline">
            Skip
          </Link>
        </div> */}
      </div>
    </div>
  );
}
