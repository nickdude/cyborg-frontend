"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { goalsAPI } from "@/services/api";
import ProtocolProductItem from "@/components/ProtocolProductItem";
import GoalCard from "@/components/GoalCard";
import GoalDetail from "@/components/GoalDetail";

export default function Protocol() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("protocol");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [goals, setGoals] = useState([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalsError, setGoalsError] = useState("");
  const [goalsStatus, setGoalsStatus] = useState(null);

  const fetchGoals = useCallback(async () => {
    try {
      setGoalsLoading(true);
      setGoalsError("");
      setGoalsStatus(null);
      const response = await goalsAPI.list();
      const data = response?.data || response;
      const meta = data?.meta || {};
      setGoals(data?.goals || []);
      setGoalsStatus(meta.status || null);
    } catch (err) {
      if (err?.statusCode === 404 || err?.message?.includes("No report")) {
        setGoalsError("Upload a blood report to see your health goals");
      } else {
        setGoalsError("Failed to load goals");
      }
    } finally {
      setGoalsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "goals") {
      fetchGoals();
    }
  }, [activeTab, fetchGoals]);

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
    <div className="min-h-screen bg-pageBackground pb-24 font-inter lg:pb-10">
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

      <div className="mx-auto w-full max-w-[1240px] px-4 pt-6 lg:px-8 lg:pt-8">
        {/* Header with Tabs */}
        <div className="pb-6 lg:pb-8">
          <div className="mb-6 flex items-center gap-4 lg:gap-6">
            <button
              onClick={() => setActiveTab("protocol")}
              className={`font-inter text-lg font-medium transition-colors duration-300 lg:text-xl ${
                activeTab === "protocol" ? "text-black" : "text-secondary hover:text-black"
              }`}
            >
              Protocol
            </button>
            <button
              onClick={() => setActiveTab("goals")}
              className={`font-inter text-lg font-medium transition-colors duration-300 lg:text-xl ${
                activeTab === "goals" ? "text-black" : "text-secondary hover:text-black"
              }`}
            >
              Goals
            </button>
          </div>

          {/* Tab content header */}
          {activeTab === "protocol" && (
            <h2 className="animate-fade-in font-inter text-2xl font-bold text-black lg:text-3xl">Your protocol items</h2>
          )}
        </div>

        {/* Goals Tab */}
        {activeTab === "goals" && (
          goalsLoading ? (
            <div className="py-12 text-center text-gray-500">Loading goals...</div>
          ) : goalsError ? (
            <div className="py-12 text-center text-gray-500">{goalsError}</div>
          ) : goalsStatus === "awaiting_review" ? (
            <div className="animate-fade-in py-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center max-w-md mx-auto">
                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Your doctor is reviewing your health plan</h3>
                <p className="text-sm text-gray-500">You&apos;ll be notified when your personalized goals are ready.</p>
              </div>
            </div>
          ) : goalsStatus === "generating" ? (
            <div className="animate-fade-in py-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center max-w-md mx-auto">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Generating your health goals</h3>
                <p className="text-sm text-gray-500">This may take a minute. We&apos;ll notify you when ready.</p>
              </div>
            </div>
          ) : goals.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No health goals yet</div>
          ) : (
            <div className="animate-fade-in grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
              {goals.map((goal, index) => (
                <div key={goal.goalId} style={{ animation: `fadeIn 0.4s ease-out ${index * 0.1}s both` }}>
                  <GoalCard goal={goal} onClick={() => handleGoalClick(goal)} />
                </div>
              ))}
            </div>
          )
        )}

        {/* Protocol Tab */}
        {activeTab === "protocol" && (
          <div className="animate-fade-in grid grid-cols-1 gap-0 lg:grid-cols-2 lg:gap-4">
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
          <div className="animate-fade-in fixed bottom-32 right-4 rounded-full bg-black p-4 text-white shadow-lg lg:bottom-8 lg:right-8">
            <span className="text-sm">✓ Item added: {selectedProduct.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}