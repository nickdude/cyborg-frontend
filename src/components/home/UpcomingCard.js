"use client";

export default function UpcomingCard({ upcoming }) {
  return (
    <div className="mt-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white lg:p-6 border border-slate-700/50 shadow-sm">
      <p className="text-lg font-semibold font-inter lg:text-xl">{upcoming.title}</p>
      <p className="text-sm font-inter opacity-75 mt-1">{upcoming.subtitle}</p>

      <div className="mt-48 lg:mt-56">
        {upcoming.rows.map((row, index) => (
          <div
            key={index}
            className={`flex items-center justify-between gap-2.5 ${index === 0 ? "" : "mt-3"}`}
          >
            {row.map((day) => (
              <div
                key={day}
                className="flex-1 h-9 rounded-full bg-white/10 backdrop-blur-sm text-white/90 flex items-center justify-center text-xs font-semibold lg:h-11 lg:text-sm border border-white/5 hover:bg-white/15 transition"
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
