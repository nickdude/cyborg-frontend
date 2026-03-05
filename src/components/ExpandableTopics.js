"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

export default function ExpandableTopics({ title, topics }) {
  const [expandedTopic, setExpandedTopic] = useState(null);

  return (
    <div>
      {title && (
        <h3 className="text-xl font-medium font-inter text-black mb-4">
          {title}
        </h3>
      )}

      <div className="border-t border-borderColor">
        {topics.map((topic) => (
          <div key={topic.title}>
            <button
              onClick={() =>
                setExpandedTopic(expandedTopic === topic.title ? null : topic.title)
              }
              className="w-full flex items-center justify-between py-4 border-b border-borderColor text-left hover:bg-gray-50 transition-colors"
            >
              <span
                className={`font-inter font-semibold text-base ${
                  expandedTopic === topic.title ? "text-black" : "text-gray-600"
                }`}
              >
                {topic.title}
              </span>
              {expandedTopic === topic.title ? (
                <Minus size={20} className="text-black flex-shrink-0" />
              ) : (
                <Plus size={20} className="text-gray-400 flex-shrink-0" />
              )}
            </button>
            {expandedTopic === topic.title && (
              <div className="px-0 py-4 bg-gray-50">
                <p className="text-stepIndicator font-inter leading-relaxed text-sm whitespace-pre-line">
                  {topic.content}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
