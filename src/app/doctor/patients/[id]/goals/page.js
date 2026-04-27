"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { doctorAPI } from "@/services/api";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  Link2,
  ChevronDown,
  ChevronUp,
  Clock,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";

const DUMMY_PROTOCOL_ITEMS = [
  { id: "p1", name: "Zinc Bisglycinate 15 mg", price: "$14", quantity: "", dosage: "" },
  { id: "p2", name: "NAC – N-Acetylcysteine – 90 Servings", price: "$31", quantity: "90 Servings", dosage: "" },
  { id: "p3", name: "Pro-Resolve Omega", price: "$76", quantity: "", dosage: "" },
  { id: "p4", name: "Creatine – 90 Servings", price: "$43", quantity: "90 Servings", dosage: "" },
];

const PRIORITY_STYLES = {
  High: { bg: "#FEE2E2", color: "#DC2626", border: "#EF4444" },
  Medium: { bg: "#FEF3C7", color: "#D97706", border: "#F59E0B" },
  Low: { bg: "#DCFCE7", color: "#16A34A", border: "#22C55E" },
};

function getPriorityStyle(priority) {
  return PRIORITY_STYLES[priority] || PRIORITY_STYLES.Medium;
}

function autoResize(el) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

export default function GoalsProtocolPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id;

  const [activeTab, setActiveTab] = useState("goals");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Plan + goals state
  const [planId, setPlanId] = useState(null);
  const [planStatus, setPlanStatus] = useState(null);
  const [healthReport, setHealthReport] = useState(null);
  const [goals, setGoals] = useState([]);
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [approvedAt, setApprovedAt] = useState(null);

  // UI state
  const [expandedGoalId, setExpandedGoalId] = useState(null);
  const [editedGoals, setEditedGoals] = useState({});
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);

  // Protocol tab (unchanged — out of scope)
  const [protocolItems, setProtocolItems] = useState(DUMMY_PROTOCOL_ITEMS);
  const [showProtocolModal, setShowProtocolModal] = useState(false);
  const [protocolForm, setProtocolForm] = useState({
    name: "", price: "", quantity: "", dosage: "", linkedGoals: [],
  });

  // New goal form
  const [goalForm, setGoalForm] = useState({
    title: "", description: "", priority: "", whatThisMeans: "", potentialCauses: "",
  });

  const saveTimerRef = useRef(null);
  const editedGoalsRef = useRef({});

  useEffect(() => {
    editedGoalsRef.current = editedGoals;
  }, [editedGoals]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // ── Fetch action plan + goals ──
  const fetchPlan = useCallback(async () => {
    try {
      setLoading(true);
      const res = await doctorAPI.getPatientActionPlan(patientId);
      const data = res.data?.data || res.data;
      setPlanId(data._id);
      setPlanStatus(data.status);
      setHealthReport(data.healthReport);
      setGoals(data.goals || []);
      setDraftSavedAt(data.draftSavedAt);
      setApprovedAt(data.approvedAt);
      if (data.goals?.length > 0 && !expandedGoalId) {
        setExpandedGoalId(data.goals[0]._id);
      }
    } catch (err) {
      console.error("Failed to fetch action plan:", err);
      setPlanStatus("not_found");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  // ── Edit tracking ──
  const trackEdit = (goalId, field, value) => {
    setEditedGoals((prev) => ({
      ...prev,
      [goalId]: { ...(prev[goalId] || {}), [field]: value },
    }));
    debouncedSave();
  };

  const getGoalField = (goal, field) => {
    return editedGoals[goal._id]?.[field] ?? goal[field];
  };

  // ── Debounced auto-save ──
  const saveDraft = useCallback(async () => {
    const edits = Object.entries(editedGoalsRef.current);
    if (edits.length === 0) return;

    const goalsPayload = edits.map(([id, fields]) => ({ _id: id, ...fields }));
    try {
      setSaving(true);
      setSaveStatus("saving");
      const res = await doctorAPI.updatePatientGoals(patientId, goalsPayload);
      const savedGoals = res.data?.data?.goals || res.data?.goals || [];
      if (savedGoals.length > 0) {
        setGoals((prev) =>
          prev.map((g) => {
            const updated = savedGoals.find((s) => s._id === g._id);
            return updated || g;
          })
        );
      }
      setEditedGoals({});
      setSaveStatus("saved");
      setPlanStatus("draft");
      setDraftSavedAt(new Date().toISOString());
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error("Save draft failed:", err);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }, [patientId]);

  const debouncedSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveDraft(), 2500);
  }, [saveDraft]);

  const handleSaveDraft = useCallback(async () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    await saveDraft();
  }, [saveDraft]);

  // ── Add goal ──
  const handleAddGoal = async () => {
    if (!goalForm.title || !goalForm.priority) return;
    try {
      await doctorAPI.addGoal(patientId, {
        title: goalForm.title,
        description: goalForm.description,
        priority: goalForm.priority,
        whatThisMeans: goalForm.whatThisMeans,
        potentialCauses: goalForm.potentialCauses,
      });
      setGoalForm({ title: "", description: "", priority: "", whatThisMeans: "", potentialCauses: "" });
      setShowGoalModal(false);
      fetchPlan();
    } catch (err) {
      console.error("Add goal failed:", err);
    }
  };

  // ── Delete goal ──
  const handleDeleteGoal = async (goalId) => {
    if (!confirm("Remove this goal? It won't be shown to the patient.")) return;
    try {
      await doctorAPI.deleteGoal(patientId, goalId);
      setGoals((prev) => prev.filter((g) => g._id !== goalId));
      setPlanStatus("draft");
    } catch (err) {
      console.error("Delete goal failed:", err);
    }
  };

  // ── Approve ──
  const handleApprove = async () => {
    try {
      if (Object.keys(editedGoals).length > 0) await saveDraft();
      await doctorAPI.approveActionPlan(patientId);
      setPlanStatus("approved");
      setApprovedAt(new Date().toISOString());
      setShowApproveConfirm(false);
    } catch (err) {
      console.error("Approve failed:", err);
    }
  };

  // ── Filter ──
  const filteredGoals = priorityFilter === "all"
    ? goals
    : goals.filter((g) => g.priority === priorityFilter);

  const isEditable = planStatus === "pending_review" || planStatus === "draft";

  // ── Protocol handlers (unchanged) ──
  const handleAddProtocol = () => {
    if (!protocolForm.name) return;
    setProtocolItems((prev) => [...prev, {
      id: `p-${Date.now()}`, name: protocolForm.name, price: protocolForm.price,
      quantity: protocolForm.quantity, dosage: protocolForm.dosage,
    }]);
    setProtocolForm({ name: "", price: "", quantity: "", dosage: "", linkedGoals: [] });
    setShowProtocolModal(false);
  };
  const handleDeleteProtocol = (protocolId) => {
    setProtocolItems((prev) => prev.filter((p) => p.id !== protocolId));
  };

  // ── Render ──
  return (
    <div className="min-h-screen bg-[#F2F2F2] font-inter">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg width="6" height="11" viewBox="0 0 6 11" fill="none">
            <path d="M5.5 1L1 5.5L5.5 10" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-32">
        {/* Status banner */}
        {planStatus === "pending_review" && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
            <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span className="text-[13px] text-amber-800">Pending your review. Edit goals and approve when ready.</span>
          </div>
        )}
        {planStatus === "draft" && (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 mb-4">
            <Pencil className="h-4 w-4 text-orange-600 flex-shrink-0" />
            <span className="text-[13px] text-orange-800">
              Draft saved{draftSavedAt ? ` at ${new Date(draftSavedAt).toLocaleTimeString()}` : ""}. Approve when ready.
            </span>
          </div>
        )}
        {planStatus === "approved" && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="text-[13px] text-green-800">
              Approved{approvedAt ? ` on ${new Date(approvedAt).toLocaleDateString()}` : ""}. Patient can see these goals.
            </span>
          </div>
        )}
        {planStatus === "superseded" && (
          <div className="flex items-center gap-2 bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 mb-4">
            <AlertCircle className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <span className="text-[13px] text-gray-600">This plan was superseded by a newer report.</span>
          </div>
        )}

        {/* Health Report scores (read-only) */}
        {healthReport && (
          <div className="bg-white rounded-xl p-4 mb-4">
            <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF] mb-2">Health Report (read-only)</p>
            <div className="flex gap-2">
              {[
                { label: "Cyborg Score", value: healthReport.cyborgScore },
                { label: "Bio Age", value: healthReport.bioAge?.phenoAge },
                { label: "Optimal", value: healthReport.markerCounts ? `${healthReport.markerCounts.optimal}/${healthReport.markerCounts.total}` : null },
              ].map((s) => (
                <div key={s.label} className="flex-1 bg-[#F9FAFB] rounded-lg py-2 px-3 text-center">
                  <div className="text-[18px] font-bold text-black">{s.value ?? "—"}</div>
                  <div className="text-[10px] text-[#6B7280]">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
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
          {/* Save status indicator */}
          {saveStatus && activeTab === "goals" && (
            <span className="ml-auto text-[12px] text-[#9CA3AF] flex items-center gap-1">
              {saveStatus === "saving" && <><Loader2 className="h-3 w-3 animate-spin" /> Saving...</>}
              {saveStatus === "saved" && <><Check className="h-3 w-3 text-green-500" /> Saved</>}
              {saveStatus === "error" && <><AlertCircle className="h-3 w-3 text-red-500" /> Save failed</>}
            </span>
          )}
        </div>

        {/* Goals Tab */}
        {activeTab === "goals" && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : planStatus === "not_found" ? (
              <div className="text-center py-16 text-gray-400 text-sm">
                No action plan found for this patient.
              </div>
            ) : planStatus === "pending" || planStatus === "generating" ? (
              <div className="text-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-3" />
                <p className="text-[14px] text-gray-500">Goals are being generated...</p>
                <p className="text-[12px] text-gray-400 mt-1">This may take a minute.</p>
              </div>
            ) : (
              <>
                {/* Priority filter pills */}
                <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
                  {["all", "High", "Medium", "Low"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setPriorityFilter(filter)}
                      className={`px-4 py-1.5 rounded-full text-[14px] font-medium whitespace-nowrap transition-colors ${
                        priorityFilter === filter
                          ? "bg-black text-white"
                          : "bg-white text-[#495565] border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {filter === "all" ? "All" : filter}
                    </button>
                  ))}
                </div>

                {/* Goal cards */}
                {filteredGoals.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    {priorityFilter === "all" ? "No goals yet." : `No ${priorityFilter} priority goals.`}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredGoals.map((goal) => {
                      const isExpanded = expandedGoalId === goal._id;
                      const ps = getPriorityStyle(getGoalField(goal, "priority"));

                      return (
                        <div
                          key={goal._id}
                          className="bg-white rounded-lg overflow-hidden"
                          style={{ borderLeft: `3px solid ${ps.border}` }}
                        >
                          {/* Header row — always visible */}
                          <div
                            className="flex items-center justify-between px-4 py-3 cursor-pointer"
                            onClick={() => setExpandedGoalId(isExpanded ? null : goal._id)}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0"
                                style={{ backgroundColor: ps.bg, color: ps.color }}
                              >
                                {getGoalField(goal, "priority")}
                              </span>
                              <span className="text-[14px] font-semibold text-black truncate">
                                {getGoalField(goal, "title")}
                              </span>
                              {goal.delta?.status && (
                                <span className="text-[10px] text-[#9CA3AF] font-medium uppercase flex-shrink-0">
                                  {goal.delta.status}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                              {isEditable && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteGoal(goal._id); }}
                                  className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-[#9CA3AF] hover:text-red-500" />
                                </button>
                              )}
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-[#9CA3AF]" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
                              )}
                            </div>
                          </div>

                          {/* Expanded content */}
                          {isExpanded && (
                            <div className="px-4 pb-4 space-y-3">
                              {/* Editable: Title */}
                              {isEditable ? (
                                <div>
                                  <label className="text-[9px] uppercase tracking-wider text-[#9CA3AF] block mb-1">Title</label>
                                  <input
                                    type="text"
                                    value={getGoalField(goal, "title")}
                                    onChange={(e) => trackEdit(goal._id, "title", e.target.value)}
                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-[14px] font-semibold bg-[#FAFAFA] focus:border-black focus:ring-1 focus:ring-black/10 focus:bg-white outline-none transition-all"
                                  />
                                </div>
                              ) : null}

                              {/* Editable: Priority */}
                              {isEditable && (
                                <div>
                                  <label className="text-[9px] uppercase tracking-wider text-[#9CA3AF] block mb-1">Priority</label>
                                  <div className="flex gap-2">
                                    {["High", "Medium", "Low"].map((p) => {
                                      const active = getGoalField(goal, "priority") === p;
                                      const s = getPriorityStyle(p);
                                      return (
                                        <button
                                          key={p}
                                          onClick={() => trackEdit(goal._id, "priority", p)}
                                          className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
                                          style={active
                                            ? { backgroundColor: s.color, color: "#fff" }
                                            : { backgroundColor: "#F3F4F6", color: "#6B7280" }
                                          }
                                        >
                                          {p}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Editable: Description */}
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-[#9CA3AF] block mb-1">Description</label>
                                {isEditable ? (
                                  <textarea
                                    ref={(el) => autoResize(el)}
                                    value={getGoalField(goal, "description") || ""}
                                    onChange={(e) => { trackEdit(goal._id, "description", e.target.value); autoResize(e.target); }}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-[12px] bg-[#FAFAFA] focus:border-black focus:ring-1 focus:ring-black/10 focus:bg-white outline-none transition-all overflow-hidden"
                                  />
                                ) : (
                                  <p className="text-[12px] text-[#4B5563]">{goal.description || "—"}</p>
                                )}
                              </div>

                              {/* Editable: What This Means */}
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-[#9CA3AF] block mb-1">What This Means</label>
                                {isEditable ? (
                                  <textarea
                                    ref={(el) => autoResize(el)}
                                    value={getGoalField(goal, "whatThisMeans") || ""}
                                    onChange={(e) => { trackEdit(goal._id, "whatThisMeans", e.target.value); autoResize(e.target); }}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-[12px] bg-[#FAFAFA] focus:border-black focus:ring-1 focus:ring-black/10 focus:bg-white outline-none transition-all overflow-hidden"
                                  />
                                ) : (
                                  <p className="text-[12px] text-[#4B5563]">{goal.whatThisMeans || "—"}</p>
                                )}
                              </div>

                              {/* Editable: Potential Causes */}
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-[#9CA3AF] block mb-1">Potential Causes</label>
                                {isEditable ? (
                                  <textarea
                                    ref={(el) => autoResize(el)}
                                    value={getGoalField(goal, "potentialCauses") || ""}
                                    onChange={(e) => { trackEdit(goal._id, "potentialCauses", e.target.value); autoResize(e.target); }}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-[12px] bg-[#FAFAFA] focus:border-black focus:ring-1 focus:ring-black/10 focus:bg-white outline-none transition-all overflow-hidden"
                                  />
                                ) : (
                                  <p className="text-[12px] text-[#4B5563]">{goal.potentialCauses || "—"}</p>
                                )}
                              </div>

                              {/* Editable: Recommended Actions */}
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-[#9CA3AF] block mb-1">Recommended Actions</label>
                                {(getGoalField(goal, "recommendedActions") || []).map((action, idx) => (
                                  <div key={idx} className="flex items-start gap-2 mb-1">
                                    <span className="text-[11px] text-[#9CA3AF] font-semibold mt-1.5 flex-shrink-0">{idx + 1}.</span>
                                    {isEditable ? (
                                      <input
                                        type="text"
                                        value={action.detail || action.label || ""}
                                        onChange={(e) => {
                                          const actions = [...(getGoalField(goal, "recommendedActions") || [])];
                                          actions[idx] = { ...actions[idx], detail: e.target.value };
                                          trackEdit(goal._id, "recommendedActions", actions);
                                        }}
                                        className="flex-1 px-2 py-1 border border-[#E5E7EB] rounded text-[12px] bg-[#FAFAFA] focus:border-black focus:bg-white outline-none transition-all"
                                      />
                                    ) : (
                                      <span className="text-[12px] text-[#374151]">{action.label} {action.detail}</span>
                                    )}
                                  </div>
                                ))}
                                {isEditable && (
                                  <button
                                    onClick={() => {
                                      const actions = [...(getGoalField(goal, "recommendedActions") || [])];
                                      actions.push({ number: actions.length + 1, label: "", detail: "" });
                                      trackEdit(goal._id, "recommendedActions", actions);
                                    }}
                                    className="text-[11px] text-[#6B7280] hover:text-black mt-1 flex items-center gap-1"
                                  >
                                    <Plus className="h-3 w-3" /> Add action
                                  </button>
                                )}
                              </div>

                              {/* Read-only: Biomarker Evidence */}
                              {goal.biomarkerEvidence?.length > 0 && (
                                <div>
                                  <label className="text-[9px] uppercase tracking-wider text-[#B0B0B0] block mb-1">Biomarker Evidence (from report)</label>
                                  <div className="flex flex-wrap gap-1">
                                    {goal.biomarkerEvidence.map((bm, i) => {
                                      const isElevated = bm.flag?.toLowerCase().includes("high") || bm.flag?.toLowerCase().includes("elevated");
                                      const isLow = bm.flag?.toLowerCase().includes("low");
                                      return (
                                        <span
                                          key={i}
                                          className="text-[10px] font-medium px-2 py-0.5 rounded"
                                          style={{
                                            backgroundColor: isElevated ? "#FEE2E2" : isLow ? "#FEF3C7" : "#DCFCE7",
                                            color: isElevated ? "#DC2626" : isLow ? "#D97706" : "#16A34A",
                                          }}
                                        >
                                          {bm.name || bm.canonicalName} {bm.value}{bm.unit ? ` ${bm.unit}` : ""}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Read-only: Protocol items */}
                              {goal.protocolItems?.length > 0 && (
                                <div>
                                  <label className="text-[9px] uppercase tracking-wider text-[#B0B0B0] block mb-1">Linked Protocol Items</label>
                                  <div className="flex flex-wrap gap-1">
                                    {goal.protocolItems.map((pi, i) => (
                                      <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#EDE9FE] text-[#6D28D9] flex items-center gap-1">
                                        <Link2 className="h-2.5 w-2.5" />
                                        {pi.productName}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Goal Button */}
                {isEditable && (
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => {
                        setGoalForm({ title: "", description: "", priority: "", whatThisMeans: "", potentialCauses: "" });
                        setShowGoalModal(true);
                      }}
                      className="px-6 py-3 bg-black text-white rounded-full text-[14px] font-medium flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add a goal
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Protocol Tab (unchanged — out of scope) */}
        {activeTab === "protocol" && (
          <div>
            {protocolItems.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                No protocol items yet. Add one below.
              </div>
            ) : (
              <div className="space-y-3">
                {protocolItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg p-4 border border-[#e8e8e8]">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[14px] font-medium text-black mb-0.5 truncate">{item.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[14px] font-medium text-[#717178]">{item.price}</span>
                          {item.quantity && <span className="text-[12px] font-normal text-[#717178]">{item.quantity}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                        <button
                          onClick={() => {
                            setProtocolForm({ name: item.name, price: item.price, quantity: item.quantity || "", dosage: item.dosage || "", linkedGoals: [] });
                            setShowProtocolModal(true);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Pencil className="h-4 w-4 text-[#717178]" />
                        </button>
                        <button onClick={() => handleDeleteProtocol(item.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4 text-[#717178]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-center mt-6">
              <button
                onClick={() => {
                  setProtocolForm({ name: "", price: "", quantity: "", dosage: "", linkedGoals: [] });
                  setShowProtocolModal(false);
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

      {/* Sticky bottom action bar */}
      {isEditable && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] px-4 py-3 z-40">
          <div className="max-w-2xl mx-auto flex gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-[14px] font-semibold bg-[#374151] text-white hover:bg-[#4B5563] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save Draft
            </button>
            <button
              onClick={() => setShowApproveConfirm(true)}
              className="flex-1 py-3 rounded-xl text-[14px] font-semibold bg-[#059669] text-white hover:bg-[#047857] transition-colors flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4" />
              Approve & Publish
            </button>
          </div>
        </div>
      )}

      {/* Approve confirmation dialog */}
      {showApproveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowApproveConfirm(false)} />
          <div className="relative bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl">
            <h3 className="text-[16px] font-semibold text-black mb-2">Approve Action Plan</h3>
            <p className="text-[13px] text-[#6B7280] mb-5">
              Once approved, the patient will see these goals and recommendations. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowApproveConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-medium text-[#6B7280] border border-[#E5E7EB] hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold bg-[#059669] text-white hover:bg-[#047857] transition-colors"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowGoalModal(false)} />
          <div className="relative bg-white w-full sm:max-w-lg sm:rounded-[16px] rounded-t-[16px] max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white px-5 pt-5 pb-3 border-b border-gray-100 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[18px] font-semibold text-black">Add a New Goal</h2>
                  <p className="text-[14px] font-normal text-[#717178] mt-0.5">Define a new health goal for the patient</p>
                </div>
                <button onClick={() => setShowGoalModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-[14px] font-medium text-black mb-1.5">
                  Goal Title<span className="text-[#ef4444]">*</span>
                </label>
                <input
                  type="text"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Optimize Cardiovascular Health"
                  className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                />
              </div>
              <div>
                <label className="block text-[14px] font-medium text-black mb-1.5">Description</label>
                <textarea
                  ref={(el) => autoResize(el)}
                  value={goalForm.description}
                  onChange={(e) => { setGoalForm((f) => ({ ...f, description: e.target.value })); autoResize(e.target); }}
                  placeholder="Detailed description..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-lg text-[14px] overflow-hidden focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                />
              </div>
              <div>
                <label className="block text-[14px] font-medium text-black mb-1.5">
                  Priority Level<span className="text-[#ef4444]">*</span>
                </label>
                <div className="flex gap-3">
                  {[
                    { value: "High", color: "#ef4444" },
                    { value: "Medium", color: "#f59e0b" },
                    { value: "Low", color: "#22c55e" },
                  ].map((opt) => {
                    const isActive = goalForm.priority === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setGoalForm((f) => ({ ...f, priority: opt.value }))}
                        className="flex-1 py-3 px-3 rounded-xl text-[14px] font-medium transition-all text-center"
                        style={
                          isActive
                            ? { backgroundColor: opt.color, color: "#fff", border: `1px solid ${opt.color}` }
                            : { backgroundColor: "transparent", color: "#9ca3af", border: "1px solid #e5e7eb" }
                        }
                      >
                        {opt.value}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-[14px] font-medium text-black mb-1.5">What This Means</label>
                <textarea
                  ref={(el) => autoResize(el)}
                  value={goalForm.whatThisMeans}
                  onChange={(e) => { setGoalForm((f) => ({ ...f, whatThisMeans: e.target.value })); autoResize(e.target); }}
                  placeholder="Explain the significance..."
                  rows={2}
                  className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-lg text-[14px] overflow-hidden focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                />
              </div>
              <div>
                <label className="block text-[14px] font-medium text-black mb-1.5">Potential Causes</label>
                <textarea
                  ref={(el) => autoResize(el)}
                  value={goalForm.potentialCauses}
                  onChange={(e) => { setGoalForm((f) => ({ ...f, potentialCauses: e.target.value })); autoResize(e.target); }}
                  placeholder="What might be causing this..."
                  rows={2}
                  className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-lg text-[14px] overflow-hidden focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-4">
              <button onClick={() => setShowGoalModal(false)} className="py-2.5 px-4 text-[14px] font-medium text-[#717178] hover:text-gray-900 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleAddGoal}
                disabled={!goalForm.title || !goalForm.priority}
                className="py-2.5 px-6 bg-black text-white rounded-full text-[14px] font-medium flex items-center justify-center gap-1.5 hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Add Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Protocol Modal (unchanged) */}
      {showProtocolModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowProtocolModal(false)} />
          <div className="relative bg-white w-full sm:max-w-lg sm:rounded-[16px] rounded-t-[16px] max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white px-5 pt-5 pb-3 border-b border-gray-100 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[18px] font-semibold text-black">Add a New Protocol</h2>
                  <p className="text-[14px] font-normal text-[#717178] mt-0.5">Add a supplement, test, or treatment</p>
                </div>
                <button onClick={() => setShowProtocolModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-[14px] font-medium text-black mb-1.5">Item Name<span className="text-[#ef4444]">*</span></label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={protocolForm.name}
                    onChange={(e) => setProtocolForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Search supplements, tests..."
                    className="w-full pl-9 pr-3 py-2.5 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[14px] font-medium text-black mb-1.5">Price</label>
                  <input type="text" value={protocolForm.price} onChange={(e) => setProtocolForm((f) => ({ ...f, price: e.target.value }))} placeholder="$0" className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors" />
                </div>
                <div>
                  <label className="block text-[14px] font-medium text-black mb-1.5">Quantity</label>
                  <input type="text" value={protocolForm.quantity} onChange={(e) => setProtocolForm((f) => ({ ...f, quantity: e.target.value }))} placeholder="e.g. 90 Servings" className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-[14px] font-medium text-black mb-1.5">Dosage Instructions</label>
                <input type="text" value={protocolForm.dosage} onChange={(e) => setProtocolForm((f) => ({ ...f, dosage: e.target.value }))} placeholder="e.g. Take 1 capsule daily" className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black transition-colors" />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-4">
              <button onClick={() => setShowProtocolModal(false)} className="py-2.5 px-4 text-[14px] font-medium text-[#717178]">Cancel</button>
              <button onClick={handleAddProtocol} disabled={!protocolForm.name} className="py-2.5 px-6 bg-black text-white rounded-full text-[14px] font-medium flex items-center justify-center gap-1.5 hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
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
