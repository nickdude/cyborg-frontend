"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Cookie from "js-cookie";
import {
  ArrowLeft,
  Plus,
  Check,
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

  // Helpers
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700";
      case "medium":
        return "bg-orange-100 text-orange-700";
      case "low":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-600";
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto flex items-center h-14 px-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="ml-2 text-lg font-bold text-black">
            Goals & Protocol
          </h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Tab Bar */}
        <div className="flex border-b border-gray-300 mb-4">
          {["goals", "protocol"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 pb-3 text-center text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "text-black font-bold border-b-2 border-black"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "goals" ? "Goals" : "Protocol"}
            </button>
          ))}
        </div>

        {/* Goals Tab */}
        {activeTab === "goals" && (
          <div>
            {/* Priority Filter Pills */}
            <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
              {["all", "high", "medium", "low"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setPriorityFilter(filter)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    priorityFilter === filter
                      ? "bg-black text-white"
                      : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
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
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-black mb-1 truncate">
                          {goal.title}
                        </h3>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getPriorityBadge(
                            goal.priority
                          )}`}
                        >
                          {goal.priority.charAt(0).toUpperCase() +
                            goal.priority.slice(1)}
                        </span>
                        <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                          <Link2 className="h-3 w-3" />
                          {getLinkedProtocolCount(goal)} protocol item
                          {getLinkedProtocolCount(goal) !== 1 ? "s" : ""}
                        </p>
                      </div>
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
                          <Check className="h-4 w-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Goal Button */}
            <button
              onClick={() => {
                setGoalForm({ title: "", description: "", priority: "", linkedProtocols: [] });
                setShowGoalModal(true);
              }}
              className="w-full mt-4 py-3 bg-black text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add a goal
            </button>
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
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-black mb-0.5 truncate">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm font-bold text-black">
                            {item.price}
                          </span>
                          {item.quantity && (
                            <span className="text-xs text-gray-500">
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
                          <Check className="h-4 w-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteProtocol(item.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Protocol Button */}
            <button
              onClick={() => {
                setProtocolForm({ name: "", price: "", quantity: "", dosage: "", linkedGoals: [] });
                setProtocolSearch("");
                setShowProtocolModal(true);
              }}
              className="w-full mt-4 py-3 bg-black text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add more items
            </button>
          </div>
        )}
      </div>

      {/* ── Add Goal Modal ── */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowGoalModal(false)}
          />
          <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white px-5 pt-5 pb-3 border-b border-gray-100 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-black">
                    Add a New Goal
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
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
                <label className="block text-sm font-medium text-black mb-1.5">
                  Goal Title<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={goalForm.title}
                  onChange={(e) =>
                    setGoalForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="e.g. Protect your heart and arteries"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-black mb-1.5">
                  Description
                </label>
                <textarea
                  value={goalForm.description}
                  onChange={(e) =>
                    setGoalForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Add details about this goal..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                />
              </div>

              {/* Priority Level */}
              <div>
                <label className="block text-sm font-medium text-black mb-1.5">
                  Priority Level<span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {[
                    { value: "high", label: "High Priority", color: "border-red-400 bg-red-50 text-red-700", activeColor: "border-red-500 bg-red-100 ring-2 ring-red-300" },
                    { value: "medium", label: "Medium Priority", color: "border-orange-400 bg-orange-50 text-orange-700", activeColor: "border-orange-500 bg-orange-100 ring-2 ring-orange-300" },
                    { value: "low", label: "Low Priority", color: "border-green-400 bg-green-50 text-green-700", activeColor: "border-green-500 bg-green-100 ring-2 ring-green-300" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() =>
                        setGoalForm((f) => ({ ...f, priority: opt.value }))
                      }
                      className={`flex-1 py-2 px-2 rounded-lg border text-xs font-medium transition-all ${
                        goalForm.priority === opt.value
                          ? opt.activeColor
                          : opt.color
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Link Protocol Items */}
              <div>
                <label className="block text-sm font-medium text-black mb-1.5 flex items-center gap-1.5">
                  <Link2 className="h-4 w-4" />
                  Link Protocol Items
                </label>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-40 overflow-y-auto">
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
                          className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-sm text-gray-800 truncate">
                            {item.name}
                          </span>
                          <span
                            className={`flex-shrink-0 ml-2 h-5 w-5 rounded-full flex items-center justify-center text-xs transition-colors ${
                              isLinked
                                ? "bg-black text-white"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {isLinked ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Plus className="h-3 w-3" />
                            )}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white px-5 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowGoalModal(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddGoal}
                disabled={!goalForm.title || !goalForm.priority}
                className="flex-1 py-2.5 bg-black text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowProtocolModal(false)}
          />
          <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white px-5 pt-5 pb-3 border-b border-gray-100 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-black">
                    Add a New Protocol
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
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
                <label className="block text-sm font-medium text-black mb-1.5">
                  Item Name<span className="text-red-500">*</span>
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
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                  />
                </div>
              </div>

              {/* Price & Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-black mb-1.5">
                    Price
                  </label>
                  <input
                    type="text"
                    value={protocolForm.price}
                    onChange={(e) =>
                      setProtocolForm((f) => ({ ...f, price: e.target.value }))
                    }
                    placeholder="$0"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1.5">
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
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                  />
                </div>
              </div>

              {/* Dosage Instructions */}
              <div>
                <label className="block text-sm font-medium text-black mb-1.5">
                  Dosage Instructions
                </label>
                <input
                  type="text"
                  value={protocolForm.dosage}
                  onChange={(e) =>
                    setProtocolForm((f) => ({ ...f, dosage: e.target.value }))
                  }
                  placeholder="e.g. Take 1 capsule daily with food"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                />
              </div>

              {/* Link to Goals */}
              <div>
                <label className="block text-sm font-medium text-black mb-1.5 flex items-center gap-1.5">
                  <Link2 className="h-4 w-4" />
                  Link to Goals
                </label>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-40 overflow-y-auto">
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
                          className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-sm text-gray-800 truncate">
                              {goal.title}
                            </span>
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0 ${getPriorityBadge(
                                goal.priority
                              )}`}
                            >
                              {goal.priority.charAt(0).toUpperCase() +
                                goal.priority.slice(1)}
                            </span>
                          </div>
                          <span
                            className={`flex-shrink-0 ml-2 h-5 w-5 rounded-full flex items-center justify-center text-xs transition-colors ${
                              isLinked
                                ? "bg-black text-white"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {isLinked ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Plus className="h-3 w-3" />
                            )}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white px-5 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowProtocolModal(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProtocol}
                disabled={!protocolForm.name}
                className="flex-1 py-2.5 bg-black text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
