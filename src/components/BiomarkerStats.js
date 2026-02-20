"use client";

export default function BiomarkerStats({ stats }) {
  const { total, optimal, normal, outOfRange } = stats;
  const totalCount = total || optimal + normal + outOfRange;
  
  const optimalPercent = (optimal / totalCount) * 100;
  const normalPercent = (normal / totalCount) * 100;
  const outOfRangePercent = (outOfRange / totalCount) * 100;

  return (
    <div className="bg-white rounded-2xl p-6 space-y-4 font-inter">
      <h2 className="text-sm font-medium text-gray-900">Biomarkers</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3">
        <div className="text-left">
          <p className="text-xl font-semibold text-gray-900">{total}</p>
          <p className="text-xs text-gray-500 mt-1">Total</p>
        </div>
        <div className="text-left">
          <p className="text-2xl font-bold text-biomarkerOptimal">{optimal}</p>
          <p className="text-xs text-gray-500 mt-1">Optimal</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-biomarkerNormal">{normal}</p>
          <p className="text-xs text-gray-500 mt-1">Normal</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-biomarkerOutOfRange">{outOfRange}</p>
          <p className="text-xs text-gray-500 mt-1">Out of Range</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-100">
        {optimalPercent > 0 && (
          <div
            className="bg-biomarkerOptimal rounded-full"
            style={{ width: `${optimalPercent}%` }}
          />
        )}
        {normalPercent > 0 && (
          <div
            className="bg-biomarkerNormal rounded-full"
            style={{ width: `${normalPercent}%` }}
          />
        )}
        {outOfRangePercent > 0 && (
          <div
            className="bg-biomarkerOutOfRange rounded-full"
            style={{ width: `${outOfRangePercent}%` }}
          />
        )}
      </div>
    </div>
  );
}
