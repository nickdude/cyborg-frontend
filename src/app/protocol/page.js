"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtocolProductItem from "@/components/ProtocolProductItem";
import GoalCard from "@/components/GoalCard";
import GoalDetail from "@/components/GoalDetail";

export default function Protocol() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("protocol");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);

  // Get user name
  const userName = user?.firstName || "User";

  // Sample protocol products
  const protocolProducts = [
    {
      id: 1,
      name: "Zinc Bisglycinate 15 mg",
      price: 14,
    },
    {
      id: 2,
      name: "NAC - N-Acetylcysteine - 90 Servings",
      price: 31,
    },
    {
      id: 3,
      name: "Pro-Resolve Omega",
      price: 76,
    },
    {
      id: 4,
      name: "Creatine - 90 Servings",
      price: 43,
    },
    {
      id: 5,
      name: "Vitamin D + K2 Liquid",
      price: 32,
    },
    {
      id: 6,
      name: "Advanced Blood Panel",
      price: 359,
    },
  ];

  // Sample health goals
  const healthGoals = [
    {
      id: 1,
      title: "Protect your heart and arteries",
      description: "Your blood work shows a genetically high LP(a) with LDL/ApoB leaving extra cholesterol particles in circulation. As a 4...",
      priority: "high",
      bgImage: "/assets/goal-bg-high.jpg",
    },
    {
      id: 2,
      title: "Lower atherogenic cholesterol to protect your heart",
      description: "Your lipid profile shows elevated LDL cholesterol levels. This increases your risk of atherosclerosis...",
      priority: "medium",
      bgImage: "/assets/goal-bg-medium.jpg",
    },
    {
      id: 3,
      title: "Increase free testosterone by reducing SHBG",
      description: "Your sex hormone-binding globulin (SHBG) levels are elevated, reducing your free testosterone availability...",
      priority: "medium",
      bgImage: "/assets/goal-bg-medium2.jpg",
    },
    {
      id: 4,
      title: "Raise vitamin D to the optimal zone",
      description: "Your vitamin D levels are below optimal. Vitamin D is crucial for immune function, bone health...",
      priority: "low",
      bgImage: "/assets/goal-bg-low.jpg",
    },
  ];

  const handleBuyClick = (product) => {
    setSelectedProduct(product);
  };

  const handleGoalClick = (goal) => {
    setSelectedGoal(goal);
  };

  // If a goal is selected, show the detail view
  if (selectedGoal) {
    return <GoalDetail goal={selectedGoal} onBack={() => setSelectedGoal(null)} />;
  }

  return (
    <div className="min-h-screen pb-24 px-4 font-inter bg-pageBackground">
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        .animate-slide-in {
          animation: slideInLeft 0.3s ease-out;
        }
      `}</style>

      {/* Header with Tabs */}
      <div className="pt-6 pb-6">
        <div className="flex items-center gap-4 mb-6">
          {activeTab === "goals" && (
            <>
              <button
                onClick={() => setActiveTab("goals")}
                className="font-inter text-black text-lg font-medium transition-all duration-300 animate-slide-in"
              >
                Goals
              </button>
              <button
                onClick={() => setActiveTab("protocol")}
                className="font-inter text-secondary text-lg font-medium hover:text-black transition-colors duration-300"
              >
                Protocol
              </button>
            </>
          )}
          {activeTab === "protocol" && (
            <>
              <button
                onClick={() => setActiveTab("protocol")}
                className="font-inter text-black text-lg font-medium transition-all duration-300 animate-slide-in"
              >
                Protocol
              </button>
              <button
                onClick={() => setActiveTab("goals")}
                className="font-inter text-secondary text-lg font-medium hover:text-black transition-colors duration-300"
              >
                Goals
              </button>
            </>
          )}
        </div>

        {/* Tab content header */}
        {activeTab === "protocol" && (
          <h2 className="text-2xl font-bold text-black font-inter animate-fade-in">Your protocol items</h2>
        )}
      </div>

      {/* Goals Tab */}
      {activeTab === "goals" && (
        <div className="space-y-4 animate-fade-in">
          {healthGoals.map((goal, index) => (
            <div key={goal.id} style={{ animation: `fadeIn 0.4s ease-out ${index * 0.1}s both` }}>
              <GoalCard goal={goal} onClick={() => handleGoalClick(goal)} />
            </div>
          ))}
        </div>
      )}

      {/* Protocol Tab */}
      {activeTab === "protocol" && (
        <div className="space-y-0 animate-fade-in">
          {protocolProducts.map((product, index) => (
            <div key={product.id} style={{ animation: `fadeIn 0.4s ease-out ${index * 0.05}s both` }}>
              <ProtocolProductItem
                product={product}
                onBuyClick={handleBuyClick}
              />
            </div>
          ))}
        </div>
      )}

      {/* Buy confirmation (can expand this later) */}
      {selectedProduct && (
        <div className="fixed bottom-32 right-4 bg-black text-white rounded-full p-4 shadow-lg animate-fade-in">
          <span className="text-sm">✓ Item added: {selectedProduct.name}</span>
        </div>
      )}
    </div>
  );
}