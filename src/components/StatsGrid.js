import StatItem from "./StatItem";

export default function StatsGrid({ stats }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      <StatItem label="Total" value={stats.total} color="text-gray-900" />
      <StatItem label="Optimal" value={stats.optimal} color="text-biomarkerOptimal" />
      <StatItem label="Normal" value={stats.normal} color="text-biomarkerNormal" />
      <StatItem label="Out of Range" value={stats.outOfRange} color="text-biomarkerOutOfRange" />
    </div>
  );
}
