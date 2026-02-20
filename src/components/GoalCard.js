"use client";

import Image from "next/image";

export default function GoalCard({ goal, onClick, showCTA = true }) {
  const getGradientBg = (priority) => {
    switch (priority) {
      case "high":
        return "bg-gradient-to-br from-red-700 to-red-900";
      case "medium":
        return "bg-gradient-to-br from-orange-600 to-red-700";
      case "low":
        return "bg-gradient-to-br from-blue-600 to-blue-900";
      default:
        return "bg-gradient-to-br from-gray-600 to-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-900/50 text-white";
      case "medium":
        return "bg-orange-900/50 text-white";
      case "low":
        return "bg-blue-900/50 text-white";
      default:
        return "bg-gray-900/50 text-white";
    }
  };

  const getPriorityLabel = (priority) => {
    return priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : "None";
  };

  // Alternate between two background images
  const bgImage = goal.id % 2 === 1 ? "/assets/goal-theme-1.png" : "/assets/goal-theme-2.png";

  return (
    <div
      onClick={onClick}
      className="aspect-square rounded-3xl p-6 cursor-pointer hover:shadow-lg transition text-white flex flex-col relative overflow-hidden"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/30 z-0" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Priority Badge */}
        <div className="flex justify-end mb-auto">
          <span className={`${getPriorityColor(goal.priority)} text-xs font-medium px-3 py-1 rounded-full`}>
            {getPriorityLabel(goal.priority)} priority
          </span>
        </div>

        {/* Title and Description - centered in middle */}
        <div className="flex-1 flex flex-col justify-center mt-20">
          <h3 className="text-2xl font-semibold font-inter leading-tight mb-3">{goal.title}</h3>
          <p className="text-sm font-inter opacity-90 line-clamp-3">{goal.description}</p>
        </div>

        {/* How to solve this - at bottom */}
        {showCTA && (
          <div className="flex items-center gap-1 text-sm font-inter mt-auto">
            <span>How to solve this</span>
            <span>›</span>
          </div>
        )}
      </div>
    </div>
  );
}
