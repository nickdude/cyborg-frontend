"use client";

import Image from "next/image";
import ExpandableTopics from "./ExpandableTopics";

export default function GetStartedGuide({ data }) {
  return (
    <div className="mb-12">
      {/* Title */}
      <h2 className="text-2xl font-semibold font-inter text-black mb-8">
        {data.title}
      </h2>

      {/* Steps Section */}
      <div className="grid grid-cols-1 gap-6 mb-12">
        {data.steps.map((step, index) => (
          <div key={index} className="space-y-3">
            <div className="relative w-full h-64 rounded-2xl overflow-hidden">
              <Image
                src={step.image}
                alt={step.title}
                fill
                className="object-cover"
              />
              {/* Step Number Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-9xl font-bold drop-shadow-lg opacity-20">
                  {step.stepNumber}
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold font-inter text-black mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-stepIndicator font-inter leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ Section using ExpandableTopics */}
      <div>
        <h3 className="text-2xl font-semibold font-inter text-black mb-4">
          {data.faqTitle}
        </h3>
        <ExpandableTopics topics={data.faqs} />
      </div>
    </div>
  );
}
