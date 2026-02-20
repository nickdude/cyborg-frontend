"use client";

import { useState } from "react";
import BiomarkerDetail from "./BiomarkerDetail";

export default function BiomarkerCard({ biomarker }) {
  const [showDetail, setShowDetail] = useState(false);
  const { name, value, unit, category, status, trend } = biomarker;

  const getStatusDotColor = (status) => {
    switch(status) {
      case "optimal":
        return "#05BC7E";
      case "normal":
        return "#D7D82E";
      case "out_of_range":
        return "#F865DD";
      default:
        return "#71717B";
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "optimal":
        return "bg-biomarkerOptimal";
      case "normal":
        return "bg-biomarkerNormal";
      case "out_of_range":
        return "bg-biomarkerOutOfRange";
      default:
        return "bg-gray-500";
    }
  };

  // Calculate trend line points
  const trendPoints = trend ? trend.map((v, i) => ({
    x: (i / (trend.length - 1)) * 100,
    y: (v / Math.max(...trend, 100)) * 100
  })) : [];

  const trendSvgPoints = trendPoints.map(p => `${p.x},${100 - p.y}`).join(" ");

  return (
    <>
      <div
        onClick={() => setShowDetail(true)}
        className="bg-white rounded-xl p-4 font-inter flex items-center gap-4 cursor-pointer hover:shadow-md transition"
      >
      {/* Left Section: Status Dot + Info */}
      <div className="flex items-start gap-3 flex-1">
        <div 
          className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
          style={{ backgroundColor: getStatusDotColor(status) }}
        />
        <div className="flex-1">
          <p className="font-bold text-gray-900 text-sm">{name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{value} <span className="text-gray-400">{unit}</span></p>
        </div>
      </div>

      {/* Right Section: Trend Line + Vertical Range Marker */}
      <div className="flex items-center gap-2">
        {/* Horizontal Trend Line */}
        <div className="relative w-20 h-8">
          {/* Light background */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{ 
              backgroundColor: getStatusDotColor(status),
              maskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)'
            }}
          />
          
          {/* Trend line */}
          {trendPoints.length > 0 && (
            <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0">
              <defs>
                <linearGradient id={`fadeGradient-${status}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: getStatusDotColor(status), stopOpacity: 0 }} />
                  <stop offset="100%" style={{ stopColor: getStatusDotColor(status), stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <polyline
                points={trendSvgPoints}
                fill="none"
                stroke={`url(#fadeGradient-${status})`}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {/* Current value dot */}
              <circle
                cx={trendPoints[trendPoints.length - 1]?.x || 100}
                cy={100 - (trendPoints[trendPoints.length - 1]?.y || 100)}
                r="12"
                fill={getStatusDotColor(status)}
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>
          )}
        </div>

        {/* Vertical Range Indicator */}
        <div className="flex flex-col gap-1 h-12">
          <div className="flex-1 w-1 rounded-full bg-red-400" /> {/* Out of range - Red */}
          <div className="flex-1 w-1 rounded-full bg-yellow-400" /> {/* Normal - Yellow */}
          <div className="flex-1 w-1 rounded-full" style={{ backgroundColor: getStatusDotColor(status) }} /> {/* Optimal/Status - Green/Teal */}
        </div>
      </div>
      </div>

      {showDetail && (
        <BiomarkerDetail biomarker={biomarker} onClose={() => setShowDetail(false)} />
      )}
    </>
  );
}
