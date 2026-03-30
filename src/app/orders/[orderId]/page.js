"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin, ChevronDown } from "lucide-react";
import Button from "@/components/Button";
import { mockOrders } from "@/mocks/mockOrders";

function SummaryCard({ order }) {
  return (
    <div className="rounded-2xl border border-borderColor bg-white p-4 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-[#F7F7F8]">
          <Image
            src={order.image}
            alt={order.title}
            fill
            className="object-contain p-2"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[1.75rem] font-semibold leading-tight text-black lg:text-2xl">{order.title}</h2>
          <p className="mt-1 text-sm text-secondary lg:text-base">{order.subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function DetailBlock({ order }) {
  if (order.type === "test_booking") {
    return (
      <div className="space-y-5 text-black">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 h-5 w-5 text-secondary" />
          <div>
            <p className="text-secondary">{order.details.appointmentType}</p>
            <p className="font-semibold">{order.details.date}</p>
            <p className="font-semibold">{order.details.time}</p>
            <Link href={order.details.calendarUrl} className="mt-2 inline-flex items-center gap-1 text-primary">
              Add to calendar <ChevronDown className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 text-secondary" />
          <div>
            <p className="text-secondary">Address</p>
            <p className="font-semibold">{order.details.address}</p>
            <Link href={order.details.directionsUrl} className="mt-2 inline-flex items-center gap-1 text-primary">
              View directions <ChevronDown className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (order.type === "medicine") {
    return (
      <div className="space-y-2 text-base text-secondary lg:text-lg">
        <p>
          <span className="font-semibold text-black">Source:</span> {order.source}
        </p>
        <p>
          <span className="font-semibold text-black">Status:</span> {order.details.fulfillment}
        </p>
        <p>{order.details.eta}</p>
        <p>{order.details.support}</p>
      </div>
    );
  }

  if (order.type === "concierge") {
    return (
      <div className="space-y-2 text-base text-secondary lg:text-lg">
        <p>
          <span className="font-semibold text-black">Session date:</span> {order.details.sessionDate}
        </p>
        <p>
          <span className="font-semibold text-black">Mode:</span> {order.details.sessionMode}
        </p>
        <p>{order.details.summary}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 text-base text-secondary lg:text-lg">
      <p>
        <span className="font-semibold text-black">Generated at:</span> {order.details.generatedAt}
      </p>
      <p>{order.details.statusText}</p>
      <p>{order.details.nextStep}</p>
    </div>
  );
}

export default function OrderSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const order = useMemo(
    () => mockOrders.find((item) => item.id === params.orderId),
    [params.orderId]
  );

  const handleConfirm = async () => {
    setSubmitting(true);
    setTimeout(() => {
      router.push("/orders");
    }, 500);
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-pageBackground px-4 py-8 font-inter">
        <div className="mx-auto w-full max-w-[760px] rounded-2xl border border-borderColor bg-white p-6 text-center">
          <h1 className="text-3xl font-semibold text-black">Order not found</h1>
          <p className="mt-2 text-secondary">This order does not exist.</p>
          <div className="mt-6">
            <Button href="/orders" className="bg-black text-white hover:bg-gray-900">Back to orders</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pageBackground pb-10 font-inter">
      <main className="mx-auto w-full max-w-[760px] px-4 pt-8 lg:pt-10">
        <h1 className="text-5xl font-semibold text-black lg:text-4xl">Order Summary</h1>
        <p className="mt-2 text-xl text-secondary lg:text-base">Confirm your order details below.</p>

        <div className="mt-6 space-y-6">
          <SummaryCard order={order} />

          <section>
            <h2 className="text-4xl font-semibold text-black lg:text-3xl">{order.type === "test_booking" ? "Appointment Details" : "Order Details"}</h2>
            <div className="mt-4 rounded-2xl border border-borderColor bg-white p-4 lg:p-5">
              <DetailBlock order={order} />
            </div>
          </section>

          <div className="space-y-3 pt-2">
            <Button
              fullWidth
              size="lg"
              disabled={submitting}
              onClick={handleConfirm}
              className="bg-black text-white hover:bg-gray-900"
            >
              {submitting ? "Confirming..." : "Confirm"}
            </Button>
            <Button
              fullWidth
              size="lg"
              variant="secondary"
              onClick={() => router.back()}
              className="border border-borderColor bg-white text-black shadow-none"
            >
              Back
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
