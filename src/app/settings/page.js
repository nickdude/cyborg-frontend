"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SettingsTabs from "@/components/settings/SettingsTabs";
import ProfileSection from "@/components/settings/ProfileSection";
import BillingSection from "@/components/settings/BillingSection";
import MembershipSection from "@/components/settings/MembershipSection";
import HistorySection from "@/components/settings/HistorySection";
import IntegrationsSection from "@/components/settings/IntegrationsSection";
import NotificationsSection from "@/components/settings/NotificationsSection";

const TABS = [
  { id: "profile", label: "Profile", Component: ProfileSection },
  { id: "billing", label: "Billing", Component: BillingSection },
  { id: "membership", label: "Membership", Component: MembershipSection },
  { id: "history", label: "History", Component: HistorySection },
  { id: "integrations", label: "Integrations", Component: IntegrationsSection },
  { id: "notifications", label: "Notifications", Component: NotificationsSection },
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const requested = searchParams.get("tab");
  const activeTab = TABS.some((t) => t.id === requested) ? requested : TABS[0].id;
  const ActiveSection =
    (TABS.find((t) => t.id === activeTab) || TABS[0]).Component;

  return (
    <div className="min-h-screen bg-pageBackground pb-24 font-inter lg:pb-16">
      <main className="mx-auto w-full max-w-[1240px] px-4 pt-6 lg:px-8 lg:pt-10">
        <h1 className="text-3xl font-semibold text-black lg:text-5xl">Settings</h1>

        <div className="mt-6 border-b border-borderColor lg:mt-8">
          <SettingsTabs tabs={TABS} activeTab={activeTab} />
        </div>

        <div className="mt-6 lg:mt-8">
          <ActiveSection />
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-pageBackground font-inter">
          <div className="mx-auto w-full max-w-[1240px] px-4 pt-6 lg:px-8 lg:pt-10">
            <h1 className="text-3xl font-semibold text-black lg:text-5xl">Settings</h1>
            <p className="mt-8 text-secondary">Loading…</p>
          </div>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
