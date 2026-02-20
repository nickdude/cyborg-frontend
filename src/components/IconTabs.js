"use client";

import Image from "next/image";

export default function IconTabs({ categories, activeTab, onTabChange }) {
  return (
    <div className="absolute top-3 left-3 bg-dataBarBg rounded-full p-1 flex gap-1 max-w-fit">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onTabChange(category.id)}
          className={`flex flex-col items-center px-5 py-2 rounded-full transition ${
            activeTab === category.id
              ? "bg-white shadow-md"
              : "hover:bg-gray-200"
          }`}
        >
          <Image
            src={category.icon}
            alt={category.id}
            width={20}
            height={20}
            className={`${activeTab === category.id ? "" : "opacity-60"} ${
              category.id === "dose" ? "hue-rotate-180" : ""
            }`}
          />
        </button>
      ))}
    </div>
  );
}
