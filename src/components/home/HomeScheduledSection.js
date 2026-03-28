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
    <div className="relative -mt-6 lg:-mt-16">
      <div className="mx-auto w-full max-w-[1240px] bg-white rounded-t-3xl px-5 pt-4 pb-8 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] lg:rounded-3xl lg:px-8 lg:pt-6 lg:pb-10">
        <TimelineTabs tabs={data.timeline.tabs} />

        <div className="lg:mt-6 lg:grid lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-7">
            <UpcomingCard upcoming={data.timeline.upcoming} />
            <StatusCard status={data.timeline.status} />
            <ActionButtons actions={data.timeline.actions} />
            <BeforeAppointmentCarousel data={data.beforeAppointment} />
          </div>

          <div className="lg:col-span-5 lg:pt-4">
            <LiveBetterSection data={data.liveBetter} />
            <RxCard data={data.rx} />
          </div>
        </div>
      </div>
    </div>
  );
}
