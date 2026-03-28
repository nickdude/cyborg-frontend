"use client";

import Link from "next/link";
import { UserRound, CreditCard, FileBadge2, Heart, History, Link2, ChevronRight } from "lucide-react";

const quickActions = [
  {
    title: "Profile",
    description: "Update information about your account",
    href: "/profile",
    icon: UserRound,
  },
  {
    title: "Billing",
    description: "Manage your payment information and details",
    href: "/membership",
    icon: CreditCard,
  },
];

const settingItems = [
  {
    title: "Health records",
    description: "Integrate your healthcare data into the Cyborg ecosystem",
    href: "/blood-reports",
    icon: FileBadge2,
  },
  {
    title: "Membership",
    description: "Manage your Cyborg Membership",
    href: "/membership",
    icon: Heart,
  },
  {
    title: "Order History",
    description: "Manage orders",
    href: "/market-place",
    icon: History,
  },
  {
    title: "Integrations",
    description: "Manage wearable and other platform integrations",
    href: "/concierge",
    icon: Link2,
  },
];

function QuickCard({ item }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className="flex h-[230px] flex-col rounded-2xl border border-borderColor bg-white p-4 shadow-sm transition hover:shadow-md lg:h-[260px] lg:p-6"
    >
      <Icon className="h-5 w-5 text-secondary lg:h-6 lg:w-6" strokeWidth={2} />
      <div className="mt-5 space-y-1.5 lg:mt-8">
        <h3 className="text-[1.9rem] leading-tight font-semibold text-black lg:text-[2rem]">{item.title}</h3>
        <p className="text-[0.95rem] leading-7 text-secondary lg:text-[1.05rem] lg:leading-7">
          {item.description}
        </p>
      </div>
    </Link>
  );
}

function SettingRow({ item, isLast }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`flex items-start gap-3.5 px-4 py-5 transition hover:bg-gray-50 lg:px-6 lg:py-6 ${!isLast ? "border-b border-borderColor" : ""}`}
    >
      <Icon className="mt-0.5 h-6 w-6 text-secondary lg:h-7 lg:w-7" strokeWidth={2} />
      <div className="flex-1">
        <h3 className="text-[1.05rem] leading-tight font-semibold text-black lg:text-[1.6rem]">{item.title}</h3>
        <p className="mt-2 text-[0.9rem] leading-6 text-secondary lg:mt-2.5 lg:text-[1.05rem] lg:leading-7">
          {item.description}
        </p>
      </div>
      <ChevronRight className="mt-1 h-4 w-4 text-secondary/70 lg:h-5 lg:w-5" />
    </Link>
  );
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-pageBackground pb-24 font-inter lg:pb-12">
      <main className="mx-auto w-full max-w-[1240px] px-4 pt-6 lg:px-8 lg:pt-10">
        <div className="space-y-5 lg:space-y-8">
          <h1 className="text-3xl font-semibold text-black lg:text-5xl">Settings</h1>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-12 lg:gap-6">
            {quickActions.map((item) => (
              <div key={item.title} className="lg:col-span-6">
                <QuickCard item={item} />
              </div>
            ))}
          </section>

          <section className="overflow-hidden rounded-3xl border border-borderColor bg-white shadow-sm">
            {settingItems.map((item, index) => (
              <SettingRow
                key={item.title}
                item={item}
                isLast={index === settingItems.length - 1}
              />
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}
