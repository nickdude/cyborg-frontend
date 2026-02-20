export default function StatItem({ label, value, color = "text-gray-900" }) {
  return (
    <div className="text-left">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
