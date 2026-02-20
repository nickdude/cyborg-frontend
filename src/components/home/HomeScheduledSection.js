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
    <div className="relative -mt-6">
      <div className="bg-white rounded-t-3xl px-5 pt-4 pb-8 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <TimelineTabs tabs={data.timeline.tabs} />
        <UpcomingCard upcoming={data.timeline.upcoming} />
        <StatusCard status={data.timeline.status} />
        <ActionButtons actions={data.timeline.actions} />
        <BeforeAppointmentCarousel data={data.beforeAppointment} />
        <LiveBetterSection data={data.liveBetter} />
        <RxCard data={data.rx} />
      </div>
    </div>
  );
}
