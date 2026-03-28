"use client";

import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import HomeScheduledSection from "@/components/home/HomeScheduledSection";
import { homeScheduledData } from "@/data/homeScheduledData";

export default function Dashboard() {
    const { user } = useAuth();
    const userName = user?.firstName || "User";

    return (
        <div className="min-h-screen bg-pageBackground pb-24 lg:pb-10">
            {/* Hero */}
            <div className="relative w-full min-h-[60vh] text-white lg:min-h-[480px]">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/assets/welcome/welcome.jpg"
                        alt="Welcome background"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
                <div className="absolute inset-0 bg-black/40 z-0" />

                <div className="relative z-10 mx-auto w-full max-w-[1240px] px-6 pt-10 lg:px-8 lg:pt-14">
                    <div className="space-y-6">
                        <div>
                            <p className="text-2xl font-semibold font-inter lg:text-[2rem]">Good morning {userName},</p>
                            <h1 className="text-lg font-inter opacity-90 lg:text-xl">Welcome to
                                <span className="block">CYBORG</span>
                            </h1>
                        </div>
                    </div>

                    <div className="mt-8 bg-white/20 backdrop-blur rounded-2xl p-5 max-w-sm lg:mt-10 lg:max-w-[430px] lg:p-6">
                        <p className="text-xs font-inter uppercase tracking-wide opacity-80">{homeScheduledData.hero.panelLabel}</p>
                        <p className="text-base font-semibold font-inter mt-2 lg:text-lg">{homeScheduledData.hero.appointmentText}</p>
                        <div className="flex items-center gap-2 mt-44 lg:mt-52">
                            {homeScheduledData.hero.progressBars.map((opacity, index) => (
                                <div
                                    key={index}
                                    className="h-[3px] w-8 bg-white rounded-full"
                                    style={{ opacity }}
                                />
                            ))}
                        </div>
                        <p className="text-xs font-inter opacity-80 mt-2">{homeScheduledData.hero.statusText}</p>
                    </div>
                </div>
            </div>

            <HomeScheduledSection data={homeScheduledData} />
        </div>
    );
}