"use client";

import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import HomeScheduledSection from "@/components/home/HomeScheduledSection";
import { homeScheduledData } from "@/data/homeScheduledData";

export default function Home() {
    const { user } = useAuth();
    const userName = user?.firstName || "Yaman";
    const initials = `${user?.firstName?.[0] || "Y"}${user?.lastName?.[0] || "N"}`;

    return (
        <div className="min-h-screen bg-pageBackground pb-24">
            {/* Hero */}
            <div className="relative w-full min-h-[60vh] text-white">
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

                <div className="relative z-10 px-6 pt-10">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-2xl font-semibold font-inter ">Good morning {userName},</p>
                            <h1 className="text-lg  font-inter opacity-90">Welcome to
                                <span className="block">CYBORG</span>
                            </h1>
                        </div>
                        <div className="w-11 h-11 rounded-full bg-white/80 text-black flex items-center justify-center text-sm font-semibold font-inter">
                            {initials}
                        </div>
                    </div>

                    <div className="mt-8 bg-white/20 backdrop-blur rounded-2xl p-5 max-w-sm">
                        <p className="text-xs font-inter uppercase tracking-wide opacity-80">{homeScheduledData.hero.panelLabel}</p>
                        <p className="text-base font-semibold font-inter mt-2">{homeScheduledData.hero.appointmentText}</p>
                        <div className="flex items-center gap-2 mt-44">
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