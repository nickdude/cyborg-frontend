"use client";

import GoalCard from "./GoalCard";
import BiomarkerCard from "./BiomarkerCard";
import ProtocolItem from "./ProtocolItem";

export default function GoalDetail({ goal, onBack }) {
  // Static detailed data for the goal
  const goalDetails = {
    1: {
      title: "Protect your heart and arteries",
      description: "Your blood work shows a genetically high LP(a) with LDL/ApoB leaving extra cholesterol particles in circulation. As a 49-year-old man with past high blood pressure and sleep apnea, this elevates long-term heart and stroke risk, so it's the top focus.",
      priority: "High Priority",
      healthImpact: "Heart protection",
      recoveryTime: "8 - 12 weeks",
      whatItMeans: "LP(a) acceleration growth and promotes clotting; lowering apoB/LDL and strengthening the vessel lining meaningfully cuts risk even though LP(a) itself is genetic. This directly supports your longevity and peak-performance goals.",
      potentialCauses: "LP(a) is inherited. LDL/ApoB are influenced by saturated fat intake, high carbs, visceral fat, limited soluble fiber, suboptimal sleep/apnea control, stress, and genetics; mildly high homocysteine may add endothelial strain.",
      biomarkers: [
        { id: 1, name: "Lipoprotein (a)", value: "1774 nmol/L", status: "high", category: "Lipids", trend: [1500, 1650, 1774], optimalRange: { min: 0, max: 500 } },
        { id: 2, name: "LDL Cholesterol", value: "104 mg/dL", status: "high", category: "Lipids", trend: [95, 100, 104], optimalRange: { min: 0, max: 100 } },
        { id: 3, name: "Apolipoprotein B", value: "78 mg/dL", status: "normal", category: "Lipids", trend: [75, 76, 78], optimalRange: { min: 0, max: 90 } },
        { id: 4, name: "HDL Cholesterol", value: "59 mg/dL", status: "optimal", category: "Lipids", trend: [55, 57, 59], optimalRange: { min: 40, max: 200 } },
        { id: 5, name: "Homocysteine", value: "10 umol/L", status: "normal", category: "Amino Acids", trend: [9, 9.5, 10], optimalRange: { min: 0, max: 15 } },
      ],
      recommendedActions: [
        {
          title: "Medical care:",
          description: "See a cardiologist within 1 month to review results and discuss statin use. Consider CPAP nightly and check blood pressure at home to maintain control.",
        },
        {
          title: "Fiber-forward pescatarian eating:",
          description: "Build meals around vegetables, legumes, certified gluten-free oats, and viscous fibers (beans, okra, eggplant) with extra-virgin olive oil; gluten-free grains 2x/week; limit saturated fats (full-fat dairy, coconut) and refined snacks.",
        },
        {
          title: "Train for lipids:",
          description: "Do 150-300 minutes/week of moderate cardio plus 2–3/week of resistance training; add a 10-minute walk after meals to improve blood fats and glucose.",
        },
      ],
      protocolItems: [
        {
          name: "Red Yeast Rice + CoQ10",
          description: "Your LDL is 104 mg/dL and apoB 78 mg/dL. Red yeast rice can lower LDL/apoB while added CoQ10 supports mitochondrial function.",
          instruction: "Take with an evening meal.",
        },
      ],
    },
  };

  const details = goalDetails[goal?.id] || goalDetails[1];

  return (
    <div className="min-h-screen bg-pageBackground pb-24">
      {/* Header with back button */}
      <div className="flex items-center gap-4 pt-6 px-4 pb-6 border-b border-borderColor">
        <button
          onClick={onBack}
          className="text-2xl text-black hover:text-secondary transition-colors"
        >
          ‹
        </button>
        <h1 className="text-lg font-semibold font-inter text-black">Goals</h1>
      </div>

      {/* Goal Card Preview */}
      <div className="px-4 pt-6 pb-6 flex justify-center">
        <div className="w-full max-w-sm">
          <GoalCard goal={goal} onClick={() => {}} showCTA={false} />
        </div>
      </div>

      {/* Goal Info Cards */}
      <div className="px-4 pb-6 grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-4">
          <p className="text-xs text-secondary font-inter mb-2">Health Impact</p>
          <p className="text-sm font-semibold font-inter text-black">{details.healthImpact}</p>
        </div>
        <div className="bg-white rounded-2xl p-4">
          <p className="text-xs text-secondary font-inter mb-2">Recovery Time</p>
          <p className="text-sm font-semibold font-inter text-black">{details.recoveryTime}</p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="px-4 space-y-8">
        {/* What this means */}
        <div>
          <h3 className="text-lg font-semibold font-inter text-black mb-3">What this means:</h3>
          <p className="text-sm font-inter text-black leading-relaxed">{details.whatItMeans}</p>
        </div>

        {/* Potential Causes */}
        <div>
          <h3 className="text-lg font-semibold font-inter text-black mb-3">Potential Causes:</h3>
          <p className="text-sm font-inter text-black leading-relaxed">{details.potentialCauses}</p>
        </div>

        {/* Biomarkers to improve */}
        <div>
          <h3 className="text-lg font-semibold font-inter text-black mb-4">Biomarkers to improve:</h3>
          <div className="space-y-4">
            {details.biomarkers.map((biomarker) => (
              <BiomarkerCard
                key={biomarker.id}
                biomarker={biomarker}
                onClick={() => {}}
              />
            ))}
          </div>
        </div>

        {/* Recommended Actions */}
        <div>
          <h3 className="text-lg font-semibold font-inter text-black mb-4">Recommended Actions:</h3>
          <div className="space-y-4">
            {details.recommendedActions.map((action, index) => (
              <div key={index}>
                <p className="text-sm font-semibold font-inter text-primary mb-2">
                  {index + 1}. {action.title}
                </p>
                <p className="text-sm font-inter text-black leading-relaxed ml-6">{action.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Select your protocol items */}
        <div>
          <h3 className="text-lg font-semibold font-inter text-black mb-4">Select your protocol items:</h3>
          <div className="space-y-4">
            {details.protocolItems.map((item, index) => (
              <ProtocolItem key={index} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
