"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronRight, Check } from "lucide-react";
import Link from "next/link";
import GetStartedGuide from "@/components/GetStartedGuide";
import ExpandableTopics from "@/components/ExpandableTopics";
import ProductSection from "@/components/ProductSection";

export default function SemaglutidePage() {
  const productData = {
    id: "semaglutide-001",
    name: "Semaglutide",
    brand: "Cyborg",
    image: "/assets/sample-medicine.png",
    category: "Prescriptions",
    subcategory: "Weight Management",
    badges: [
      { label: "Free shipping", icon: "/assets/icons/truck.svg" },
      { label: "At-home treatment", icon: "/assets/icons/house1.svg" },
      { label: "Labs included in price", icon: "/assets/icons/shield.svg" },
    ],
    priority: "High priority",
    description:
      "Achieve your weight-loss goals with our Semaglutide, produced by a US-licensed, certified pharmacy.",
    benefits: [
      "Appetite suppression",
      "Weight loss of 10-15% of total body weight",
      "Improve cardiovascular health",
      "Blood sugar control",
      "Anti-inflammatory effects",
    ],
    disclaimer:
      "**Compounded products have not been approved by the FDA. The FDA does not verify the safety, effectiveness, or quality of compounded drugs.",
    plans: [
      {
        name: "Monthly Plan",
        id: "monthly",
        price: 349,
        frequency: "mo",
        features: [
          "30 day supply of medication",
          "Overnight shipping",
          "Repeat labs",
          "Medical evaluation",
          "Unlimited messaging",
          "Dr guided titration plan",
        ],
      },
      {
        name: "Quarterly Plan",
        id: "quarterly",
        price: 999,
        frequency: "3 months",
        features: [
          "90 day supply of medication",
          "Overnight shipping",
          "Repeat labs",
          "Medical evaluation",
          "Unlimited messaging",
          "Dr guided titration plan",
          "10% savings",
        ],
      },
    ],
    careHighlights: [
      {
        title: "Medical Evaluation",
        subtitle: "To achieve the best results",
        icon: "/assets/black-icons/notes-medical.svg",
      },
      {
        title: "Additional lab tests",
        subtitle: "Verify your results",
        icon: "/assets/black-icons/vial.svg",
      },
      {
        title: "Personalized plan",
        subtitle: "100% adapted to your body",
        icon: "/assets/black-icons/notebook.svg",
      },
      {
        title: "Ongoing Support",
        subtitle: "Always there for you",
        icon: "/assets/black-icons/message.svg",
      },
    ],
    scienceTopics: [
      {
        title: "Active ingredients",
        content: "Semaglutide is the primary active ingredient, which is the same as in commercial products like Ozempic® and Wegovy®. It's a GLP-1 receptor agonist used to manage blood sugar levels and promote weight loss. Additional excipients, stabilizers and solvents are added to help with absorption."
      },
      {
        title: "Mechanism",
        content: "Semaglutide is usually administered through subcutaneous injection. The specific dosage will be determined by healthcare professionals based on individual needs. Strict adherence to the prescribed administration guidelines is crucial for optimal results."
      },
      {
        title: "History",
        content: "Semaglutide is a relatively recent addition to the class of medications known as GLP-1 receptor agonists, which are used primarily for treating type 2 diabetes and, more recently, obesity. Semaglutide was developed by the Danish pharmaceutical company Novo Nordisk. It is based on the GLP-1 hormone, which helps regulate blood sugar levels and appetite. In December 2017, the U.S. Food and Drug Administration (FDA) approved semaglutide under the brand name Ozempic® for the treatment of type 2 diabetes.\n\nRecognizing the significant weight-loss benefits observed in clinical trials, Novo Nordisk pursued additional approval for semaglutide as a treatment for obesity, approved in June 2021 under the brand name Wegovy®."
      }
    ],
  };

  const getStartedData = {
    title: "How to get started with Semaglutide",
    steps: [
      {
        stepNumber: "1",
        title: "Fill out questionnaire",
        description: "Take our eligibility assessment to make sure you're qualified.",
        image: "/assets/started/started1.png",
      },
      {
        stepNumber: "2",
        title: "Clinical Review",
        description: "Your Cyborg clinical team (licensed physician) will review and approve.",
        image: "/assets/started/started2.png",
      },
      {
        stepNumber: "3",
        title: "Delivery",
        description: "Your boxed medications shipped discreetly to your door.",
        image: "/assets/started/started3.png",
      },
      {
        stepNumber: "4",
        title: "Support",
        description: "Weekly check-ins, adjustments, and 24/7 provider access.",
        image: "/assets/started/started4.png",
      },
    ],
    faqTitle: "Frequently asked questions",
    faqs: [
      {
        title: "Am I a good candidate for Semaglutide?",
        content: "You may be a candidate for Semaglutide if you have a BMI of 27 or higher with weight-related health conditions, or a BMI of 30 or higher. Our clinical team will review your health history and make a determination.",
      },
      {
        title: "How does it take to see results with Semaglutide therapy?",
        content: "Most patients begin to see noticeable results within 2-4 weeks of starting treatment. The medication works best when combined with healthy eating and exercise habits.",
      },
      {
        title: "What do I do if I feel I have plateaued with my Semaglutide therapy?",
        content: "If you experience a plateau, contact your provider immediately. They may adjust your dosage or recommend complementary lifestyle modifications to continue your progress.",
      },
      {
        title: "What do I do if I need a higher dose of Semaglutide than is prescribed in the titration schedule?",
        content: "Your provider can adjust your dosage based on your individual response and needs. Always consult with your healthcare professional before making any changes.",
      },
      {
        title: "What are the potential side effects?",
        content: "Common side effects may include nausea, vomiting, diarrhea, and constipation. Most side effects are mild and resolve with time. Serious side effects are rare but should be reported to your provider immediately.",
      },
      {
        title: "What are the potential contraindications?",
        content: "Semaglutide should not be used if you have a personal or family history of thyroid cancer or multiple endocrine neoplasia. Consult with your provider about your medical history.",
      },
      {
        title: "Potential drug interactions?",
        content: "Semaglutide may interact with certain medications, particularly those affecting blood sugar levels. Always inform your provider of all medications and supplements you're taking.",
      },
    ],
  };

  const featuredPlan = productData.plans[0];

  const popularProducts = [
    {
      id: 5,
      name: "Vitamin D + K2 Liquid",
      brand: "Thorne",
      category: "Vitamins",
      type: "supplement",
      price: 28.00,
      originalPrice: 35,
      image: "/assets/sample-medicine.png",
      onSale: true,
      section: "recommended"
    },
    {
      id: 6,
      name: "O.N.E. Omega - 30 Softgels",
      brand: "Pure Encapsulations",
      category: "Omega",
      type: "supplement",
      price: 34.40,
      originalPrice: 43,
      image: "/assets/sample-medicine.png",
      onSale: true,
      section: "recommended"
    },
    {
      id: 7,
      name: "CoQ10",
      brand: "Thorne",
      category: "Energy",
      type: "supplement",
      price: 43.20,
      originalPrice: 54,
      image: "/assets/sample-medicine.png",
      onSale: true,
      section: "brain"
    },
    {
      id: 8,
      name: "Magnesium Glycinate",
      brand: "Pure Encapsulations",
      category: "Minerals",
      type: "supplement",
      price: 35.48,
      originalPrice: 44.4,
      image: "/assets/sample-medicine.png",
      onSale: true,
      section: "brain"
    },
  ];

  return (
    <div className="min-h-screen bg-pageBackground">
      {/* Navbar Wrapper */}
      <div className="text-stepIndicator">
        <div className="px-6 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm font-inter font-medium">
            <Link href="/market-place" className="hover:text-blue-600">
              Marketplace
            </Link>
            <ChevronRight size={16} />
            <Link href="/market-place" className="hover:text-blue-600">
              Prescriptions
            </Link>
            <ChevronRight size={16} />
            <span className="text-black font-semibold">{productData.name}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
          {/* Product Image Section */}
          <div className="flex flex-col items-center">
            <div className="relative w-full max-w-sm h-[400px] rounded-2xl overflow-hidden mb-6">
              <Image
                src={productData.image}
                alt={productData.name}
                fill
                className="object-contain p-6"
                priority
              />
            </div>

           <p className="text-stepIndicator">**Compounded products have not been approved by the FDA. The FDA does not verify the safety, effectiveness. or quality of compounded drugs.</p>
            
          </div>

          {/* Product Info Section */}
          <div>
            {/* Header */}
            <div className="mb-6">
              <div className="flex flex-col gap-3 mb-3">
                 <span className="bg-primary/15 text-primary px-3 py-1 rounded-full text-xs font-medium font-inter w-fit">
                  {productData.priority}
                </span>
                <h1 className="text-3xl font-bold font-inter">{productData.name}</h1>
              </div>
              <p className="text-gray-600 font-inter">{productData.brand}</p>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-4 text-stepIndicator">
                {productData.badges.map((badge) => (
                  <div key={badge.label} className="flex items-center gap-2">
                    <Image
                      src={badge.icon}
                      alt={badge.label}
                      width={22}
                      height={22}
                      className="opacity-80"
                    />
                    <span className="text-base font-medium font-inter">{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <p className="text-base font-medium text-black font-inter mb-8">
              {productData.description}
            </p>

            {/* Benefits List */}
            <div className="mb-8">
              <ul className="space-y-3">
                {productData.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3 font-inter text-gray-700">
                    <Check size={20} className="text-primary mt-1 flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Disclaimer */}
            <p className="text-stepIndicator">**Compounded products have not been approved by the FDA. The FDA does not verify the safety, effectiveness. or quality of compounded drugs.</p>
          </div>
        </div>

        {/* Plans Section */}
        <div className="mb-12">
          <div className="rounded-2xl bg-white p-6 md:p-8 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
            <div className="flex items-start justify-between mb-6">
              <h3 className="text-xl font-semibold font-inter text-black">
                {featuredPlan.name}
              </h3>
              <p className="text-2xl font-semibold font-inter text-black">
                ${featuredPlan.price}/{featuredPlan.frequency}
              </p>
            </div>

            <div className="space-y-4">
              {featuredPlan.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-4 text-stepIndicator font-inter font-medium text-base"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-stepIndicator/25" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <button className="mt-8 w-full bg-black text-white py-4 rounded-lg font-semibold font-inter text-xl hover:bg-gray-900 transition-colors">
            Get Started
          </button>
        </div>

        <div className="mb-12">
          <div className="grid grid-cols-2 gap-6 mb-8">
            {productData.careHighlights.map((item) => (
              <div key={item.title}>
                <Image src={item.icon} alt={item.title} width={32} height={32} className="mb-3" />
                <h4 className="text-xl font-semibold font-inter text-black mb-1">{item.title}</h4>
                <p className="text-sm text-stepIndicator font-inter leading-relaxed">{item.subtitle}</p>
              </div>
            ))}
          </div>

          <div className="relative w-full h-60 rounded-2xl overflow-hidden mb-6">
            <Image src="/assets/semagltuide.png" alt="Semaglutide" fill className="object-cover" />
          </div>

          <h3 className="text-xl font-medium font-inter text-black mb-4">
            The science of Semaglutide
          </h3>

          <ExpandableTopics topics={productData.scienceTopics} />

          <button className="mt-6 w-fit px-4 bg-black text-white py-3 rounded-lg font-semibold font-inter hover:bg-gray-900 transition-colors">
            Get Started
          </button>
        </div>

        {/* Get Started Guide Component */}
        <GetStartedGuide data={getStartedData} />

        {/* Other Popular Products */}
        <ProductSection 
          title="Other popular products" 
          products={popularProducts} 
        />
      </div>
    </div>
  );
}
