"use client";

export default function FilterTabs({ filters, activeFilter, onFilterChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
            activeFilter === filter.id
              ? "bg-black text-white"
              : "bg-dataBarBg text-gray-700 hover:bg-gray-300"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
