"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

/**
 * /consults — replicates superpower's "Your consults" page.
 *
 * There is no consults/appointments endpoint in the app's API
 * (see src/services/api.js — only doctorAPI chats and conciergeAPI exist,
 * neither of which models scheduled consultation calls). Rather than
 * fabricate fake doctors/appointments, this renders the genuine empty
 * state superpower itself shows ("No consults yet. Schedule your first
 * call.") plus a real CTA that routes to /concierge (Cyborg AI), which is
 * how a member would actually start a conversation with their care team.
 */
export default function ConsultsPage() {
  const { user } = useAuth();
  const firstName =
    user?.firstName || user?.name?.split(" ")?.[0] || "";

  return (
    <div className="min-h-screen bg-pageBackground pb-24 font-inter lg:pb-10">
      <div className="mx-auto w-full max-w-[1240px] px-4 pt-6 lg:px-8 lg:pt-10">
        {/* Page title */}
        <h1 className="mb-8 font-inter text-3xl font-semibold text-black lg:mb-10 lg:text-4xl">
          Your consults
        </h1>

        {/* Empty state */}
        <div className="rounded-3xl border border-dashed border-borderColor bg-white px-6 py-16 text-center lg:py-20">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-pageBackground">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#71717B"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>

          <p className="text-lg font-medium text-secondary lg:text-xl">
            No consults yet. Schedule your first call.
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-secondary">
            {firstName ? `${firstName}, your` : "Your"} upcoming and past
            consultations with your care team will show up here.
          </p>

          <Link
            href="/concierge"
            className="mt-7 inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-900"
          >
            Talk to Cyborg AI
          </Link>
        </div>
      </div>
    </div>
  );
}
