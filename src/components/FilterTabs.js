"use client";

export default function FilterTabs({ filters, activeFilter, onFilterChange }) {
  return (
    <div className="flex lg:flex-col gap-2 lg:gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`px-4 py-2 lg:w-full lg:text-left rounded-full lg:rounded-xl text-sm font-semibold whitespace-nowrap lg:whitespace-normal transition lg:px-3.5 lg:py-2.5 lg:transition-all lg:duration-200 ${
            activeFilter === filter.id
              ? "bg-black text-white lg:bg-purple-50 lg:text-primary lg:ring-1 lg:ring-primary/30"
              : "bg-dataBarBg text-gray-700 hover:bg-gray-300 lg:bg-transparent lg:text-secondary lg:hover:bg-pageBackground lg:hover:text-blue"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
