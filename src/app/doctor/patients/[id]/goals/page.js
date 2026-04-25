"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Cookie from "js-cookie";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  Link2,
} from "lucide-react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

// Hardcoded protocol items
const DUMMY_PROTOCOL_ITEMS = [
  { id: "p1", name: "Zinc Bisglycinate 15 mg", price: "$14", quantity: "", dosage: "" },
  { id: "p2", name: "NAC – N-Acetylcysteine – 90 Servings", price: "$31", quantity: "90 Servings", dosage: "" },
  { id: "p3", name: "Pro-Resolve Omega", price: "$76", quantity: "", dosage: "" },
  { id: "p4", name: "Creatine – 90 Servings", price: "$43", quantity: "90 Servings", dosage: "" },
];

export default function GoalsProtocolPage() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useParams();
  const patientId = params.id;

  // Tab state
  const [activeTab, setActiveTab] = useState("goals");

  // Data
  const [goals, setGoals] = useState([]);
  const [protocolItems, setProtocolItems] = useState(DUMMY_PROTOCOL_ITEMS);
  const [loading, setLoading] = useState(true);

  // Filter
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Modals
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showProtocolModal, setShowProtocolModal] = useState(false);

  // Goal form
  const [goalForm, setGoalForm] = useState({
    title: "",
    description: "",
    priority: "",
    linkedProtocols: [],
  });

  // Protocol form
  const [protocolForm, setProtocolForm] = useState({
    name: "",
    price: "",
    quantity: "",
    dosage: "",
    linkedGoals: [],
  });

  const [protocolSearch, setProtocolSearch] = useState("");

  // Fetch goals from API
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const token = Cookie.get("token");
        if (!token) return;

        const res = await fetch(`${apiUrl}/api/doctor/patients/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const json = await res.json();
          const data = json.data || json;
          const patientGoals = data.goals || [];
          setGoals(
            patientGoals.map((g, i) => ({
              id: g._id || `goal-${i}`,
              title: g.title || "",
              description: g.description || "",
              priority: g.priority || "medium",
              category: g.category || "",
              biomarkerEvidence: g.biomarkerEvidence || [],
              linkedProtocols: [],
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch patient goals:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, [patientId]);

  // Priority badge colors — exact Figma: tinted bg + colored text
  const getPriorityBadgeStyle = (priority) => {
    switch (priority) {
      case "high":
        return { backgroundColor: "#fde8e8", color: "#ef4444" };
      case "medium":
        return { backgroundColor: "#fef3cd", color: "#f59e0b" };
      case "low":
        return { backgroundColor: "#ecfccb", color: "#22c55e" };
      default:
        return { backgroundColor: "#f3f4f6", color: "#9ca3af" };
    }
  };

  const getLinkedProtocolCount = (goal) => {
    return goal.linkedProtocols ? goal.linkedProtocols.length : 0;
  };

  // Filtered goals
  const filteredGoals =
    priorityFilter === "all"
      ? goals
      : goals.filter((g) => g.priority === priorityFilter);

  // Goal CRUD
  const handleAddGoal = () => {
    if (!goalForm.title || !goalForm.priority) return;

    const newGoal = {
      id: `goal-${Date.now()}`,
      title: goalForm.title,
      description: goalForm.description,
      priority: goalForm.priority,
      category: "",
      biomarkerEvidence: [],
      linkedProtocols: goalForm.linkedProtocols,
    };

    console.log("Adding goal:", newGoal);
    setGoals((prev) => [...prev, newGoal]);
    setGoalForm({ title: "", description: "", priority: "", linkedProtocols: [] });
    setShowGoalModal(false);
  };

  const handleDeleteGoal = (goalId) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    console.log("Deleted goal:", goalId);
  };

  // Protocol CRUD
  const handleAddProtocol = () => {
    if (!protocolForm.name) return;

    const newProtocol = {
      id: `p-${Date.now()}`,
      name: protocolForm.name,
      price: protocolForm.price,
      quantity: protocolForm.quantity,
      dosage: protocolForm.dosage,
      linkedGoals: protocolForm.linkedGoals,
    };

    console.log("Adding protocol:", newProtocol);
    setProtocolItems((prev) => [...prev, newProtocol]);
    setProtocolForm({ name: "", price: "", quantity: "", dosage: "", linkedGoals: [] });
    setProtocolSearch("");
    setShowProtocolModal(false);
  };

  const handleDeleteProtocol = (protocolId) => {
    setProtocolItems((prev) => prev.filter((p) => p.id !== protocolId));
    console.log("Deleted protocol:", protocolId);
  };

  // Toggle linked protocol in goal form
  const toggleLinkedProtocol = (protocolId) => {
    setGoalForm((prev) => ({
      ...prev,
      linkedProtocols: prev.linkedProtocols.includes(protocolId)
        ? prev.linkedProtocols.filter((id) => id !== protocolId)
        : [...prev.linkedProtocols, protocolId],
    }));
  };

  // Toggle linked goal in protocol form
  const toggleLinkedGoal = (goalId) => {
    setProtocolForm((prev) => ({
      ...prev,
      linkedGoals: prev.linkedGoals.includes(goalId)
        ? prev.linkedGoals.filter((id) => id !== goalId)
        : [...prev.linkedGoals, goalId],
    }));
  };

  return (
    <div className="min-h-screen bg-[#F2F2F2] font-inter">
      {/* Header — no bg, blends into page */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {/* Back arrow: 6x11 left angle, stroke #000000 */}
          <svg width="6" height="11" viewBox="0 0 6 11" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.5 1L1 5.5L5.5 10" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-4">
        {/* Tab headings: active = large bold black, inactive = lighter gray */}
        <div className="flex items-baseline gap-5 mb-5">
          {["goals", "protocol"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`transition-colors ${
                activeTab === tab
                  ? "text-[24px] font-bold text-black"
                  : "text-[20px] font-normal text-[#c4c4c4]"
              }`}
            >
              {tab === "goals" ? "Goals" : "Protocol"}
            </button>
          ))}
        </div>

        {/* Goals Tab */}
        {activeTab === "goals" && (
          <div>
            {/* Priority Filter Pills: 14px/500, r=full, active=black bg white text, inactive=white bg #495565 text */}
            <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
              {["all", "high", "medium", "low"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setPriorityFilter(filter)}
                  className={`px-4 py-1.5 rounded-full text-[14px] font-medium whitespace-nowrap transition-colors ${
                    priorityFilter === filter
                      ? "bg-black text-white"
                      : "bg-white text-[#495565] border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            {/* Goal Cards */}
            {loading ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                Loading goals...
              </div>
            ) : filteredGoals.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                {priorityFilter === "all"
                  ? "No goals yet. Add one below."
                  : `No ${priorityFilter} priority goals.`}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="bg-white rounded-lg p-4 border border-[#e8e8e8]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Title: 14px/500 black */}
                        <h3 className="text-[14px] font-medium text-black mb-1 truncate">
                          {goal.title}
                        </h3>
                        {/* Priority badge: 10px/600, tinted bg + colored text */}
                        <span
                          className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                          style={getPriorityBadgeStyle(goal.priority)}
                        >
                          {goal.priority.charAt(0).toUpperCase() +
                            goal.priority.slice(1)}
                        </span>
                        {/* Protocol link count: 12px/400 #717178 */}
                        <p className="text-[12px] font-normal text-[#717178] mt-1.5 flex items-center gap-1">
                          <Link2 className="h-3 w-3" />
                          {getLinkedProtocolCount(goal)} protocol item
                          {getLinkedProtocolCount(goal) !== 1 ? "s" : ""}
                        </p>
                      </div>
                      {/* Edit/Delete icons: #717178 */}
                      <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                        <button
                          onClick={() => {
                            setGoalForm({
                              title: goal.title,
                              description: goal.description,
                              priority: goal.priority,
                              linkedProtocols: goal.linkedProtocols || [],
                            });
                            setShowGoalModal(true);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4 text-[#717178]" />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-[#717178]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Goal Button: bg black, white text, 14px/500, r=full, centered */}
            <div className="flex justify-center mt-6">
              <button
                onClick={() => {
                  setGoalForm({ title: "", description: "", priority: "", linkedProtocols: [] });
                  setShowGoalModal(true);
                }}
                className="px-6 py-3 bg-black text-white rounded-full text-[14px] font-medium flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add a goal
              </button>
            </div>
          </div>
        )}

        {/* Protocol Tab */}
        {activeTab === "protocol" && (
          <div>
            {protocolItems.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                No protocol items yet. Add one below.
              </div>
            ) : (
              <div className="space-y-3">
                {protocolItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg p-4 border border-[#e8e8e8]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Name: 14px/500 black */}
                        <h3 className="text-[14px] font-medium text-black mb-0.5 truncate">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          {/* Price: 14px/500 #717178 */}
                          <span className="text-[14px] font-medium text-[#717178]">
                            {item.price}
                          </span>
                          {/* Quantity: 12px/400 #717178 */}
                          {item.quantity && (
                            <span className="text-[12px] font-normal text-[#717178]">
                              {item.quantity}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                        <button
                          onClick={() => {
                            setProtocolForm({
                              name: item.name,
                              price: item.price,
                              quantity: item.quantity || "",
                              dosage: item.dosage || "",
                              linkedGoals: item.linkedGoals || [],
                            });
                            setShowProtocolModal(true);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4 text-[#717178]" />
                        </button>
                        <button
                          onClick={() => handleDeleteProtocol(item.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-[#717178]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Protocol Button: bg black, white text, centered */}
            <div className="flex justify-center mt-6">
              <button
                onClick={() => {
                  setProtocolForm({ name: "", price: "", quantity: "", dosage: "", linkedGoals: [] });
                  setProtocolSearch("");
                  setShowProtocolModal(true);
                }}
                className="px-6 py-3 bg-black text-white rounded-full text-[14px] font-medium flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add more items
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Goal Modal ── */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowGoalModal(false)}
          />
          {/* bg white, r=16 */}
          <div className="relative bg-white w-full sm:max-w-lg sm:rounded-[16px] rounded-t-[16px] max-h-[90vh] overflow-y-auto shadow-xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white px-5 pt-5 pb-3 border-b border-gray-100 z-10">
              <div className="flex items-center justify-between">
                <div>
                  {/* 18px/600 black */}
                  <h2 className="text-[18px] font-semibold text-black">
                    Add a New Goal
                  </h2>
                  {/* 14px/400 #717178 */}
                  <p className="text-[14px] font-normal text-[#717178] mt-0.5">
                    Define a new health goal for the patient
                  </p>
                </div>
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Goal Title */}
              <div>
                {/* Label: 14px/500 black, required star #ef4444 */}
                <label className="block text-[14px] font-medium text-black mb-1.5">
                  Goal Title<span className="text-[#ef4444]">*</span>
                </label>
                {/* Input: border #e5e7eb, r=8, 14px/400 */}
                <input
                  type="text"
                  value={goalForm.title}
                  onChange={(e) =>
                    setGoalForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Enter a name for the recipe"
                  className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-lg text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[14px] font-medium text-black mb-1.5">
                  Description
                </label>
                <textarea
                  value={goalForm.description}
                  onChange={(e) =>
                    setGoalForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Detailed description of the goal..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-lg text-[14px] font-normal resize-none focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                />
              </div>

              {/* Priority Level */}
              <div>
                <label className="block text-[14px] font-medium text-black mb-1.5">
                  Priority Level<span className="text-[#ef4444]">*</span>
                </label>
                {/* Priority buttons: active=solid bg white text, inactive=border only */}
                <div className="flex gap-2">
                  {[
                    { value: "high", label: "High\nPriority", color: "#ef4444" },
                    { value: "medium", label: "Medium\nPriority", color: "#f59e0b" },
                    { value: "low", label: "Low\nPriority", color: "#22c55e" },
                  ].map((opt) => {
                    const isActive = goalForm.priority === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() =>
                          setGoalForm((f) => ({ ...f, priority: opt.value }))
                        }
                        className="flex-1 py-3 px-2 rounded-lg text-[13px] font-medium transition-all whitespace-pre-line leading-tight text-center"
                        style={
                          isActive
                            ? {
                                backgroundColor: opt.color,
                                color: "#ffffff",
                                border: `1px solid ${opt.color}`,
                              }
                            : {
                                backgroundColor: "transparent",
                                color: "#9ca3af",
                                border: "1px solid #e5e7eb",
                              }
                        }
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Link Protocol Items */}
              <div>
                <label className="text-[14px] font-medium text-black mb-1.5 flex items-center gap-1.5">
                  <Link2 className="h-4 w-4" />
                  Link Protocol Items
                </label>
                <div className="border border-[#e5e7eb] rounded-lg divide-y divide-gray-100 max-h-40 overflow-y-auto">
                  {protocolItems.length === 0 ? (
                    <p className="text-xs text-gray-400 px-3 py-3 text-center">
                      No protocol items to link
                    </p>
                  ) : (
                    protocolItems.map((item) => {
                      const isLinked = goalForm.linkedProtocols.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleLinkedProtocol(item.id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                        >
                          {/* Radio-style circle indicator */}
                          <span
                            className={`flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isLinked
                                ? "border-black bg-black"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {isLinked && (
                              <span className="h-2 w-2 rounded-full bg-white" />
                            )}
                          </span>
                          <span className="text-[14px] text-black font-medium truncate">
                            {item.name}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
                {goalForm.linkedProtocols.length > 0 && (
                  <p className="text-[12px] text-[#717178] mt-1.5">
                    {goalForm.linkedProtocols.length} item{goalForm.linkedProtocols.length !== 1 ? "s" : ""} selected
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-4">
              {/* Cancel: 14px/500 #717178, plain text */}
              <button
                onClick={() => setShowGoalModal(false)}
                className="py-2.5 px-4 text-[14px] font-medium text-[#717178] hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              {/* + Add a goal: bg black white text */}
              <button
                onClick={handleAddGoal}
                disabled={!goalForm.title || !goalForm.priority}
                className="py-2.5 px-6 bg-black text-white rounded-lg text-[14px] font-medium flex items-center justify-center gap-1.5 hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Add a goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Protocol Modal ── */}
      {showProtocolModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowProtocolModal(false)}
          />
          {/* bg white, r=16 */}
          <div className="relative bg-white w-full sm:max-w-lg sm:rounded-[16px] rounded-t-[16px] max-h-[90vh] overflow-y-auto shadow-xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white px-5 pt-5 pb-3 border-b border-gray-100 z-10">
              <div className="flex items-center justify-between">
                <div>
                  {/* 18px/600 black */}
                  <h2 className="text-[18px] font-semibold text-black">
                    Add a New Protocol
                  </h2>
                  {/* 14px/400 #717178 */}
                  <p className="text-[14px] font-normal text-[#717178] mt-0.5">
                    Add a supplement, test, or treatment
                  </p>
                </div>
                <button
                  onClick={() => setShowProtocolModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-[14px] font-medium text-black mb-1.5">
                  Item Name<span className="text-[#ef4444]">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={protocolForm.name}
                    onChange={(e) =>
                      setProtocolForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Search supplements, tests..."
                    className="w-full pl-9 pr-3 py-2.5 border border-[#e5e7eb] rounded-lg text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                  />
                </div>
              </div>

              {/* Price & Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[14px] font-medium text-black mb-1.5">
                    Price
                  </label>
                  <input
                    type="text"
                    value={protocolForm.price}
                    onChange={(e) =>
                      setProtocolForm((f) => ({ ...f, price: e.target.value }))
                    }
                    placeholder="$0"
                    className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-lg text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-medium text-black mb-1.5">
                    Quantity / Servings
                  </label>
                  <input
                    type="text"
                    value={protocolForm.quantity}
                    onChange={(e) =>
                      setProtocolForm((f) => ({
                        ...f,
                        quantity: e.target.value,
                      }))
                    }
                    placeholder="e.g. 90 Servings"
                    className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-lg text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                  />
                </div>
              </div>

              {/* Dosage Instructions */}
              <div>
                <label className="block text-[14px] font-medium text-black mb-1.5">
                  Dosage Instructions
                </label>
                <input
                  type="text"
                  value={protocolForm.dosage}
                  onChange={(e) =>
                    setProtocolForm((f) => ({ ...f, dosage: e.target.value }))
                  }
                  placeholder="e.g. Take 1 capsule daily with food"
                  className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-lg text-[14px] font-normal focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                />
              </div>

              {/* Link to Goals */}
              <div>
                <label className="text-[14px] font-medium text-black mb-1.5 flex items-center gap-1.5">
                  <Link2 className="h-4 w-4" />
                  Link to Goals
                </label>
                <div className="border border-[#e5e7eb] rounded-lg divide-y divide-gray-100 max-h-40 overflow-y-auto">
                  {goals.length === 0 ? (
                    <p className="text-xs text-gray-400 px-3 py-3 text-center">
                      No goals to link
                    </p>
                  ) : (
                    goals.map((goal) => {
                      const isLinked = protocolForm.linkedGoals.includes(goal.id);
                      return (
                        <button
                          key={goal.id}
                          onClick={() => toggleLinkedGoal(goal.id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                        >
                          {/* Radio-style circle indicator */}
                          <span
                            className={`flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isLinked
                                ? "border-black bg-black"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {isLinked && (
                              <span className="h-2 w-2 rounded-full bg-white" />
                            )}
                          </span>
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-[14px] text-black font-medium truncate">
                              {goal.title}
                            </span>
                            {/* Priority badge with Figma colors */}
                            <span
                              className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0"
                              style={getPriorityBadgeStyle(goal.priority)}
                            >
                              {goal.priority.charAt(0).toUpperCase() +
                                goal.priority.slice(1)}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-4">
              {/* Cancel: 14px/500 #717178, plain text */}
              <button
                onClick={() => setShowProtocolModal(false)}
                className="py-2.5 px-4 text-[14px] font-medium text-[#717178] hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProtocol}
                disabled={!protocolForm.name}
                className="py-2.5 px-6 bg-black text-white rounded-lg text-[14px] font-medium flex items-center justify-center gap-1.5 hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Add Protocol
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
