export default function ProgressBar({ stats }) {
  return (
    <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-100">
      {(stats.optimal / stats.total) * 100 > 0 && (
        <div
          className="bg-biomarkerOptimal rounded-full"
          style={{ width: `${(stats.optimal / stats.total) * 100}%` }}
        />
      )}
      {(stats.normal / stats.total) * 100 > 0 && (
        <div
          className="bg-biomarkerNormal rounded-full"
          style={{ width: `${(stats.normal / stats.total) * 100}%` }}
        />
      )}
      {(stats.outOfRange / stats.total) * 100 > 0 && (
        <div
          className="bg-biomarkerOutOfRange rounded-full"
          style={{ width: `${(stats.outOfRange / stats.total) * 100}%` }}
        />
      )}
    </div>
  );
}
