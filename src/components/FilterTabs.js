"use client";

export default function FilterTabs({ filters, activeFilter, onFilterChange }) {
  return (
    <div className="flex lg:flex-col gap-2 lg:gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`px-4 py-2 lg:w-full lg:text-left rounded-full lg:rounded-lg text-sm font-semibold whitespace-nowrap lg:whitespace-normal transition ${
            activeFilter === filter.id
              ? "bg-black text-white lg:bg-purple-50 lg:text-purple-600 lg:border-2 lg:border-purple-600"
              : "bg-dataBarBg text-gray-700 hover:bg-gray-300 lg:bg-transparent lg:text-gray-700 lg:hover:bg-purple-50"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
