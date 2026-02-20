"use client";

import Image from "next/image";

export default function SearchBar({ placeholder = "Search anything", value, onChange }) {
  return (
    <div className="bg-white border border-borderColor rounded-full px-5 py-3 flex items-center gap-3 font-inter">
      <Image src="/assets/icons/search.svg" alt="Search" width={20} height={20} className="opacity-60" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent outline-none flex-1 text-gray-700 placeholder:text-gray-500"
      />
    </div>
  );
}
