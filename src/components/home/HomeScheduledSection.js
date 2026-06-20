"use client";

import TimelineTabs from "./TimelineTabs";
import UpcomingCard from "./UpcomingCard";
import StatusCard from "./StatusCard";
import ActionButtons from "./ActionButtons";
import BeforeAppointmentCarousel from "./BeforeAppointmentCarousel";
import LiveBetterSection from "./LiveBetterSection";
import RxCard from "./RxCard";

export default function HomeScheduledSection({ data }) {
  return (
    <div className="relative -mt-6 lg:-mt-12">
      <div className="mx-auto w-full max-w-[1240px] bg-white rounded-t-3xl px-4 pt-6 pb-12 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:rounded-3xl lg:px-12 lg:pt-10 lg:pb-16">
        <TimelineTabs tabs={data.timeline.tabs} />

        <div className="lg:mt-8 lg:grid lg:grid-cols-12 lg:gap-10">
          <div className="space-y-4 lg:col-span-7 lg:space-y-6">
            <UpcomingCard upcoming={data.timeline.upcoming} />
            <StatusCard status={data.timeline.status} />
            <ActionButtons actions={data.timeline.actions} />
            <BeforeAppointmentCarousel data={data.beforeAppointment} />
          </div>

          <div className="mt-6 space-y-6 lg:col-span-5 lg:mt-0">
            <LiveBetterSection data={data.liveBetter} />
            <RxCard data={data.rx} />
          </div>
        </div>
      </div>
    </div>
  );
}
