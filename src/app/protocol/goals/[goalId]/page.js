"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { actionPlanAPI, goalsAPI } from "@/services/api";
import GoalDetail from "@/components/GoalDetail";

// Priority → rank (High first), matching the dashboard / protocol step ordering.
const priorityRank = (p) => ({ High: 0, Medium: 1, Low: 2 }[p] ?? 3);

// Standalone goal-detail route (Findings / Actions). Being a real route — not an
// in-page overlay — the phone/OS back button returns to /protocol for free.
export default function GoalDetailPage() {
  const { goalId } = useParams();
  const router = useRouter();
  const [protocol, setProtocol] = useState(null);
  const [stepNumber, setStepNumber] = useState(1);

  // Fetch the plan's protocol so the Actions tab can join per-goal items to the
  // rich supplement copy (why / how / timing). GoalDetail fetches the goal itself.
  useEffect(() => {
    let cancelled = false;
    actionPlanAPI
      .getLatest()
      .then((res) => {
        const data = res?.data || res;
        if (!cancelled) setProtocol(data?.protocol || null);
      })
      .catch(() => {
        if (!cancelled) setProtocol(null);
      });
    return () => { cancelled = true; };
  }, []);

  // Derive the goal's rank number (its 1-based position when goals are sorted
  // highest-priority first) so the hero step number matches the /protocol list.
  useEffect(() => {
    let cancelled = false;
    goalsAPI
      .list()
      .then((res) => {
        const data = res?.data || res;
        const goals = [...(data?.goals || [])].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
        const idx = goals.findIndex((g) => String(g.goalId) === String(goalId));
        if (!cancelled) setStepNumber(idx >= 0 ? idx + 1 : 1);
      })
      .catch(() => {
        if (!cancelled) setStepNumber(1);
      });
    return () => { cancelled = true; };
  }, [goalId]);

  const goBack = () => {
    // Prefer real history (returns to the dashboard we came from); fall back to
    // /protocol on a deep link with no in-app history.
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/protocol");
  };

  return <GoalDetail goal={{ goalId }} protocol={protocol} onBack={goBack} stepNumber={stepNumber} />;
}
