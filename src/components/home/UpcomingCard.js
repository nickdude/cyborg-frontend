"use client";

export default function UpcomingCard({ upcoming }) {
  return (
    <div className="mt-4 bg-[#3B3B3B] rounded-2xl p-4 text-white">
      <p className="text-lg font-semibold font-inter">{upcoming.title}</p>
      <p className="text-sm font-inter opacity-70">{upcoming.subtitle}</p>

      <div className="mt-48">
        {upcoming.rows.map((row, index) => (
          <div
            key={index}
            className={`flex items-center justify-between gap-2 ${index === 0 ? "" : "mt-2"}`}
          >
            {row.map((day) => (
              <div
                key={day}
                className="w-8 h-8 rounded-full bg-white/15 text-white/90 flex items-center justify-center text-xs font-semibold"
              >
                {day}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
