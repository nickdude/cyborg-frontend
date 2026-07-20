"use client";

import { useParams, useRouter } from "next/navigation";
import GoalDetail from "@/components/GoalDetail";

// Standalone goal-detail route. Being a real route — not an in-page overlay —
// the phone/OS back button returns to /protocol for free. GoalDetail fetches
// the goal itself.
export default function GoalDetailPage() {
  const { goalId } = useParams();
  const router = useRouter();

  const goBack = () => {
    // Prefer real history (returns to the dashboard we came from); fall back to
    // /protocol on a deep link with no in-app history.
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/protocol");
  };

  return <GoalDetail goal={{ goalId }} onBack={goBack} />;
}
