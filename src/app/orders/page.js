"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import Button from "@/components/Button";
import { mockOrders, orderTabs } from "@/mocks/mockOrders";

function OrderTabButton({ tab, activeTab, onTabChange }) {
  const isActive = activeTab === tab.id;

  return (
    <button
      type="button"
      onClick={() => onTabChange(tab.id)}
      className={`shrink-0 rounded-full px-4 py-2 text-base font-medium transition lg:px-5 lg:py-2.5 lg:text-base ${
        isActive
          ? "bg-black text-white"
          : "bg-gray-100 text-secondary hover:bg-gray-200"
      }`}
    >
      {tab.label}
    </button>
  );
}

function OrderCard({ order }) {
  return (
    <Link
      href={`/orders/${order.id}`}
      className="rounded-2xl border border-borderColor bg-white p-4 transition hover:shadow-sm"
    >
      <div className="flex items-start gap-4">
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-[#F7F7F8]">
          <Image
            src={order.image}
            alt={order.title}
            fill
            className="object-contain p-2"
          />
        </div>

        <div className="min-w-0 flex-1">
          {order.badge && (
            <p className="mb-2 inline-flex rounded-full bg-[#ECE3F7] px-2.5 py-1 text-sm font-medium text-primary">
              {order.badge}
            </p>
          )}
          <h3 className="text-2xl leading-tight font-semibold text-black lg:text-[1.7rem]">
            {order.title}
          </h3>
          <p className="mt-1 text-base text-secondary">{order.amount > 0 ? `$${order.amount}` : "Included"}</p>
        </div>

        <ChevronRight className="mt-1 h-5 w-5 flex-shrink-0 text-secondary" />
      </div>
    </Link>
  );
}

function EmptyState({ title, subtitle }) {
  return (
    <div className="rounded-3xl border border-dashed border-[#B9BCC6] bg-white/40 px-6 py-12 text-center lg:px-10 lg:py-14">
      <h3 className="text-3xl font-semibold text-black lg:text-4xl">{title}</h3>
      <p className="mt-3 text-lg text-secondary lg:text-xl">{subtitle}</p>
      <div className="mt-8 flex justify-center">
        <Button
          href="/market-place"
          className="h-12 min-w-[180px] bg-black px-8 text-xl font-semibold hover:bg-gray-900 lg:h-12 lg:min-w-[180px] lg:text-lg"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("all");

  const activeOrders = useMemo(
    () => mockOrders.filter((order) => order.status === "active"),
    []
  );

  const pastOrders = useMemo(
    () => mockOrders.filter((order) => order.status === "past"),
    []
  );

  const tabOrders = useMemo(() => {
    if (activeTab === "active") return activeOrders;
    if (activeTab === "past") return pastOrders;
    return mockOrders;
  }, [activeTab, activeOrders, pastOrders]);

  return (
    <div className="min-h-screen bg-pageBackground pb-24 font-inter lg:pb-10">
      <main className="mx-auto w-full max-w-[1240px] px-4 pt-8 lg:px-8 lg:pt-10">
        <h1 className="text-4xl font-semibold text-black lg:text-4xl">Your orders</h1>

        <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {orderTabs.map((tab) => (
            <OrderTabButton
              key={tab.id}
              tab={tab}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          ))}
        </div>

        <div className="mt-8 space-y-8 lg:space-y-10">
          {(activeTab === "all" || activeTab === "active") && (
            <section>
              <h2 className="text-4xl font-semibold text-black lg:text-3xl">Active orders</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
                {activeOrders.length > 0 ? (
                  activeOrders.map((order) => <OrderCard key={order.id} order={order} />)
                ) : (
                  <EmptyState
                    title="No active orders"
                    subtitle="You have no active orders"
                  />
                )}
              </div>
            </section>
          )}

          {(activeTab === "all" || activeTab === "past") && (
            <section>
              <h2 className="text-4xl font-semibold text-black lg:text-3xl">Past orders</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
                {pastOrders.length > 0 ? (
                  pastOrders.map((order) => <OrderCard key={order.id} order={order} />)
                ) : (
                  <EmptyState
                    title="No completed orders yet"
                    subtitle="You have no completed orders"
                  />
                )}
              </div>
            </section>
          )}

          {tabOrders.length === 0 && (
            <EmptyState
              title="No orders found"
              subtitle="Try a different filter"
            />
          )}
        </div>
      </main>
    </div>
  );
}
