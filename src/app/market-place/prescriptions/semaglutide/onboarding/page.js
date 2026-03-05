"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const SEMAGLUTIDE_SECTIONS = [
  {
    id: "intro-and-address",
    questions: [
      {
        code: "intro.1",
        title: "First up, a few questions so we can help best.",
        description:
          "The following intake questionnaire helps your clinician tailor your plan and ensure Semaglutide is a perfect match for you.",
        type: "intro",
        image: "/assets/started/started1.png",
      },
      {
        code: "address.1",
        title: "Please verify your address.",
        description:
          "We need to verify your address to ensure we can deliver your medication to you. If you need to update your address, click",
        type: "address",
        fields: {
          currentAddress: "Manan Goel\nTownship\n5521 Lawrence Street\nUSA. 400690",
        },
      },
    ],
  },
  {
    id: "contraindications",
    questions: [
      {
        code: "medical.1",
        title: "Do you have Type 1 diabetes?",
        type: "single",
        options: ["Yes", "No"],
      },
      {
        code: "medical.2",
        title: "Do you have uncontrolled Type 2 diabetes on insulin? (e.g., very high sugars, frequent hospitalizations, or ketoacidosis)",
        type: "single",
        options: ["Yes", "No"],
      },
      {
        code: "medical.3",
        title: "Do you have a history of pancreatitis or pancreatic cancer?",
        type: "single",
        options: ["Yes", "No"],
      },
      {
        code: "medical.4",
        title: "Do you have a history of thyroid cancer (medullary type) or Multiple Endocrine Neoplasia syndrome type 2 (MEN2)?",
        type: "single",
        options: ["Yes", "No"],
      },
    ],
  },
  {
    id: "medical-history",
    questions: [
      {
        code: "medical.5",
        title: "Kidney or liver disease?",
        type: "single",
        options: ["Yes", "No"],
      },
      {
        code: "medical.6",
        title: "Please provide brief details",
        type: "textarea",
        placeholder: "Tell us here...",
      },
      {
        code: "medical.7",
        title: "Cardiovascular issues? (e.g., hypertension, heart failure, CAD, arrhythmia)",
        type: "single",
        options: ["Yes", "No"],
      },
      {
        code: "medical.8",
        title: "Please provide brief details",
        type: "textarea",
        placeholder: "Tell us here...",
      },
      {
        code: "medical.9",
        title: "GI disorders? (e.g., bowel obstruction, refractory constipation; reflux/hiatal hernia)",
        type: "single",
        options: ["Yes", "No"],
      },
      {
        code: "medical.10",
        title: "Please provide brief details",
        type: "textarea",
        placeholder: "Tell us here...",
      },
      {
        code: "medical.11",
        title: "Gallbladder disease or removed?",
        type: "single",
        options: ["Yes", "No"],
      },
      {
        code: "medical.12",
        title: "Other major medical conditions not listed above?",
        type: "textarea",
        placeholder: "Tell us here...",
      },
    ],
  },
  {
    id: "medications",
    questions: [
      {
        code: "meds.1",
        title: "Current medications (choose all that apply)",
        subtitle: "Select all that apply.",
        type: "multi",
        options: [
          "Diabetes medications (GLPs, insulin, oral hypoglycemics)",
          "Heart/BP medications (e.g., ACE inhibitors, ARBs, diuretics, beta blockers, statins)",
          "Anticoagulants / antiplatelets",
          "GI medications (PPIs, H2 blockers)",
          "Thyroid medications",
          "Mental health medications (SSRIs, antipsychotics, mood stabilizers)",
          "Pain/steroid medications",
          "Other",
          "None of the above",
        ],
      },
    ],
  },
  {
    id: "weight-history",
    questions: [
      {
        code: "weight.1",
        title: "What is your weight (lbs)?",
        type: "text",
        placeholder: "Tell us here...",
      },
      {
        code: "weight.2",
        title: "Previous weight loss attempts / treatments (short text)",
        type: "textarea",
        placeholder: "Tell us here...",
      },
    ],
  },
  {
    id: "mental-health",
    questions: [
      {
        code: "mental.1",
        title: "Do you have a history of severe depression, suicidal thoughts, or self-harm?",
        type: "single",
        options: ["Yes", "No"],
      },
      {
        code: "mental.2",
        title: "Do you have a history of eating disorders? (e.g., anorexia, bulimia, binge eating)",
        type: "single",
        options: ["Yes", "No"],
      },
    ],
  },
  {
    id: "additional",
    questions: [
      {
        code: "additional.1",
        title: "Aside from what you've already listed, do you have any other conditions or medications that might affect blood sugar, digestion, or weight management?",
        type: "textarea",
        placeholder: "Tell us here...",
      },
    ],
  },
  {
    id: "consent",
    questions: [
      {
        code: "consent.1",
        title: "I understand Semaglutide is for personal use only and agree to follow application instructions.",
        description:
          "Before proceeding, please verify the key terms and instructions below. By selecting 'Yes' you are consenting to the following: I understand that I should only use Semaglutide for my personal use only.",
        disclaimer: `By selecting "Yes" below you consent that you have read the following and agree to the terms set by the Pharmacy:

Compounded medications are not FDA-approved PHARMACIES AND PHYSICIANS WHO MAY PRESCRIBE ARE LICENSED IN MULTIPLE STATES. YOU MAY NOT CONSTITUTE A PATIENT OF THE PHARMACIES NOR PHYSICIANS UNTIL YOU HAVE BEEN INFORMED CONSENT AND THE PHARMACY HAS DISPENSED YOUR ACCURATELY. YOU MAY NOT PROVIDE YOUR MEDICATION PRESCRIBED BY PHYSICIANS TO ANYONE ELSE. IF YOU DO SO, YOU ARE VIOLATING THE LAWS OR YOUR STATE.

This is intended for providing you with the information necessary to make an informed decision and to give your consent for administration of the medication to you and discuss the potential benefits and risks associated with by physicians. I hereby give my consent and agree to be abide by the clinicians instructions.`,
        type: "consent",
        options: ["Agree & Continue", "Cancel"],
      },
      {
        code: "consent.2",
        title: "I understand Semaglutide is for personal use only and agree to follow application instructions.",
        description:
          "Before proceeding, please verify the key terms and instructions below. By selecting 'Verify' you are consenting to the following: I understand that I should only use Semaglutide for my personal use only.",
        image: "/assets/started/started1.png",
        type: "final-consent",
        options: ["Verify"],
      },
    ],
  },
];

export default function SemaglutideOnboarding() {
  const router = useRouter();
  const [sectionIndex, setSectionIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const section = SEMAGLUTIDE_SECTIONS[sectionIndex];
  const step = section?.questions?.[stepIndex];
  const sectionTotal = section?.questions?.length || 0;
  const sectionProgress = section ? Math.round(((stepIndex + 1) / sectionTotal) * 100) : 0;

  const canProceed = (() => {
    if (!step) return false;
    if (step.type === "intro" || step.type === "address" || step.type === "final-consent") return true;
    if (step.type === "single") return Boolean(answers[step.code]);
    if (step.type === "multi") return Array.isArray(answers[step.code]) && answers[step.code].length > 0;
    if (step.type === "text" || step.type === "textarea") return Boolean((answers[step.code] || "").trim());
    if (step.type === "consent-choice") return Boolean(answers[step.code]);
    return true;
  })();

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
    if (!canProceed) return;
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
      const prevSection = SEMAGLUTIDE_SECTIONS[sectionIndex - 1];
      setSectionIndex((s) => s - 1);
      setStepIndex(prevSection.questions.length - 1);
    }
  };

  const advanceStep = () => {
    if (stepIndex < sectionTotal - 1) {
      setStepIndex((i) => i + 1);
      return;
    }
    if (sectionIndex < SEMAGLUTIDE_SECTIONS.length - 1) {
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
      // TODO: Save semaglutide onboarding answers to API
      console.log("Semaglutide onboarding answers:", answers);
      
      // Redirect to success page or dashboard
      router.push("/market-place/prescriptions/semaglutide?onboarding=complete");
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
        return (
          <div className="flex flex-col items-center justify-center mt-4">
            {step.image && (
              <div className="relative w-full h-56 rounded-xl overflow-hidden">
                <Image
                  src={step.image}
                  alt="Introduction"
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
        );
      
      case "address":
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-[13px] font-medium text-gray-500 mb-2">Current Address</p>
              <p className="text-[18px] leading-8 font-medium text-gray-900 whitespace-pre-line">{step.fields.currentAddress}</p>
            </div>
          </div>
        );
      
      case "text":
        return (
          <input
            type="text"
            value={answers[step.code] || ""}
            onChange={(e) => updateAnswer(step.code, e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-white text-[15px] focus:outline-none"
            placeholder={step.placeholder || "Tell us here..."}
          />
        );
      
      case "textarea":
        return (
          <textarea
            value={answers[step.code] || ""}
            onChange={(e) => updateAnswer(step.code, e.target.value)}
            className="w-full h-40 px-4 py-4 rounded-2xl bg-white text-[15px] focus:outline-none resize-none"
            rows={5}
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
                className={`w-full text-left px-4 py-3 rounded-2xl border bg-white text-[17px] transition ${
                  answers[step.code] === opt
                    ? "border-primary"
                    : "border-none"
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
                  className={`w-full text-left px-4 py-3 rounded-xl border bg-white transition ${
                    selected
                      ? "border-primary"
                      : "border-none"
                  }`}
                >
                  <span className="text-[13px] leading-5">{opt}</span>
                </button>
              );
            })}
          </div>
        );
      
      case "consent-choice":
        return (
          <div className="space-y-4">
            <p className="text-[11px] text-gray-500 leading-relaxed">{step.description}</p>
            <div className="max-h-72 overflow-y-auto pr-1">
              <p className="text-[11px] text-gray-500 whitespace-pre-line leading-relaxed">{step.disclaimer}</p>
            </div>

            <button
              type="button"
              onClick={() => updateAnswer(step.code, step.options[0])}
              className={`w-full text-left px-4 py-3 rounded-xl border bg-white text-sm ${
                answers[step.code] === step.options[0] ? "border-primary" : "border-gray-200"
              }`}
            >
              {step.options[0]}
            </button>

            <button
              type="button"
              onClick={() => updateAnswer(step.code, step.options[1])}
              className={`w-full text-left px-4 py-3 rounded-xl border bg-white text-sm ${
                answers[step.code] === step.options[1] ? "border-primary" : "border-gray-200"
              }`}
            >
              {step.options[1]}
            </button>
          </div>
        );
      
      case "final-consent":
        return (
          <div className="flex flex-col items-center justify-center mt-2">
            {step.image && (
              <div className="relative w-full h-40 rounded-xl overflow-hidden mb-4">
                <Image
                  src={step.image}
                  alt="Consent"
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  if (!step) {
    return null;
  }

  return (
    <div className="min-h-screen bg-pageBackground font-inter">
      <div className="w-full max-w-[390px] flex flex-col justify-between min-h-screen mx-auto bg-[#f5f5f7] px-6 py-7 relative">
        {/* Progress bar */}
        <div>
          <div className="w-full h-1 bg-gray-300 rounded-full mb-6">
            <div
              className="h-1 bg-primary rounded-full transition-all duration-300"
              style={{ width: `${sectionProgress}%` }}
            />
          </div>

          <div className="min-h-[68vh] flex flex-col gap-5">
            {(sectionIndex > 0 || stepIndex > 0) && (
              <button onClick={handleBack} className="w-fit text-gray-500 text-3xl leading-none">←</button>
            )}

            <h1 className="text-[21px] font-extrabold tracking-tight">CYBORG</h1>

            <div className="space-y-3">
              <div className="text-[28px] font-semibold leading-[1.35] tracking-[-0.01em]">{step.title}</div>
              {step.description && <p className="text-[16px] text-gray-700 leading-[1.45]">{step.description}</p>}
              {step.subtitle && <p className="text-[13px] text-gray-500 leading-[1.45]">{step.subtitle}</p>}
            </div>

            <div className="mt-2 mb-4">{renderInput()}</div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleNext}
              disabled={loading || !canProceed}
              className={`w-full h-16 rounded-2xl text-[16px] font-semibold transition ${
                loading || !canProceed
                  ? "bg-[#d9d9dd] text-[#7d808a]"
                  : "bg-black text-white hover:bg-gray-900"
              }`}
            >
              {sectionIndex === SEMAGLUTIDE_SECTIONS.length - 1 && stepIndex === sectionTotal - 1
                ? loading
                  ? "Submitting..."
                  : "Verify"
                : step.type === "intro" || step.type === "address"
                  ? "Start"
                  : "Next"}
            </button>

            {step.type === "multi" && (
              <button
                type="button"
                onClick={handleSkip}
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold bg-white border border-gray-200 text-gray-700"
              >
                Skip
              </button>
            )}
          </div>

          <div className="mt-6 flex items-center justify-center gap-1.5">
            {Array.from({ length: SEMAGLUTIDE_SECTIONS.length }).map((_, idx) => (
              <span
                key={idx}
                className={`h-4 w-2 rounded-[1px] transition-all ${
                  idx <= sectionIndex ? "bg-primary" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
