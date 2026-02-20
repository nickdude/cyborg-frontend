"use client";

import { useState, useMemo } from "react";
import IconTabs from "@/components/IconTabs";
import SearchBar from "@/components/SearchBar";
import FilterTabs from "@/components/FilterTabs";
import ProductSection from "@/components/ProductSection";

export default function Marketplace() {
  const [activeTab, setActiveTab] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const dataCategories = [
    { id: "grid", icon: "/assets/data-bar-icons/grid.svg" },
    { id: "vial", icon: "/assets/data-bar-icons/vial.svg" },
    { id: "pills", icon: "/assets/data-bar-icons/pills.svg" },
    { id: "prescription", icon: "/assets/data-bar-icons/dose.svg" },
  ];

  // Complete products data with types
  const productsData = [
    // Tests (vial)
    {
      id: 1,
      name: "Complete Blood Count (CBC)",
      brand: "LabCorp",
      category: "Blood Test",
      type: "test",
      price: 45.00,
      originalPrice: 60,
      image: "/assets/sample-medicine.png",
      onSale: true,
      section: "recommended"
    },
    {
      id: 2,
      name: "Thyroid Panel (TSH, T3, T4)",
      brand: "Quest Diagnostics",
      category: "Hormone Test",
      type: "test",
      price: 89.00,
      originalPrice: 120,
      image: "/assets/sample-medicine.png",
      onSale: true,
      section: "recommended"
    },
    {
      id: 3,
      name: "Vitamin D Test",
      brand: "LabCorp",
      category: "Vitamin Test",
      type: "test",
      price: 35.00,
      originalPrice: 50,
      image: "/assets/sample-medicine.png",
      onSale: true,
      section: "wellness"
    },
    {
      id: 4,
      name: "Lipid Panel",
      brand: "Quest Diagnostics",
      category: "Blood Test",
      type: "test",
      price: 42.00,
      originalPrice: 55,
      image: "/assets/sample-medicine.png",
      onSale: false,
      section: "wellness"
    },

    // Supplements (pills)
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
    {
      id: 9,
      name: "Probiotic Complex",
      brand: "Garden of Life",
      category: "Digestive",
      type: "supplement",
      price: 29.99,
      originalPrice: 39.99,
      image: "/assets/sample-medicine.png",
      onSale: true,
      section: "digestive"
    },

    // Prescriptions (prescription)
    {
      id: 10,
      name: "Metformin 500mg",
      brand: "Generic",
      category: "Diabetes",
      type: "prescription",
      price: 15.00,
      originalPrice: null,
      image: "/assets/sample-medicine.png",
      onSale: false,
      section: "chronic"
    },
    {
      id: 11,
      name: "Lisinopril 10mg",
      brand: "Generic",
      category: "Blood Pressure",
      type: "prescription",
      price: 12.00,
      originalPrice: null,
      image: "/assets/sample-medicine.png",
      onSale: false,
      section: "chronic"
    },
    {
      id: 12,
      name: "Levothyroxine 50mcg",
      brand: "Synthroid",
      category: "Thyroid",
      type: "prescription",
      price: 18.50,
      originalPrice: null,
      image: "/assets/sample-medicine.png",
      onSale: false,
      section: "hormone"
    },
    {
      id: 13,
      name: "Atorvastatin 20mg",
      brand: "Generic",
      category: "Cholesterol",
      type: "prescription",
      price: 14.00,
      originalPrice: null,
      image: "/assets/sample-medicine.png",
      onSale: false,
      section: "chronic"
    },
  ];

  // Dynamic filters based on active tab
  const getFilters = (tab) => {
    const baseFilters = [{ id: "all", label: "All" }];
    
    switch(tab) {
      case "vial":
        return [
          ...baseFilters,
          { id: "blood-test", label: "Blood Test" },
          { id: "hormone-test", label: "Hormone Test" },
          { id: "vitamin-test", label: "Vitamin Test" },
        ];
      case "pills":
        return [
          ...baseFilters,
          { id: "vitamins", label: "Vitamins" },
          { id: "minerals", label: "Minerals" },
          { id: "omega", label: "Omega" },
          { id: "digestive", label: "Digestive" },
        ];
      case "prescription":
        return [
          ...baseFilters,
          { id: "diabetes", label: "Diabetes" },
          { id: "blood-pressure", label: "Blood Pressure" },
          { id: "thyroid", label: "Thyroid" },
          { id: "cholesterol", label: "Cholesterol" },
        ];
      default: // grid
        return [
          ...baseFilters,
          { id: "tests", label: "Tests" },
          { id: "supplements", label: "Supplements" },
          { id: "prescriptions", label: "Prescriptions" },
        ];
    }
  };

  const filters = useMemo(() => getFilters(activeTab), [activeTab]);

  // Reset filter when tab changes
  useMemo(() => {
    setActiveFilter("all");
  }, [activeTab]);

  // Filter products based on active tab, search, and filter
  const filteredProducts = useMemo(() => {
    return productsData.filter((product) => {
      // Filter by tab
      let matchesTab = true;
      if (activeTab === "vial") {
        matchesTab = product.type === "test";
      } else if (activeTab === "pills") {
        matchesTab = product.type === "supplement";
      } else if (activeTab === "prescription") {
        matchesTab = product.type === "prescription";
      }
      // grid shows all, so no filtering needed

      // Filter by search
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter by category filter
      let matchesFilter = true;
      if (activeFilter !== "all") {
        const filterLower = activeFilter.toLowerCase().replace("-", " ");
        const categoryLower = product.category.toLowerCase();
        const typeLower = product.type.toLowerCase();
        
        // Special handling for grid filters
        if (activeTab === "grid") {
          if (activeFilter === "tests") matchesFilter = product.type === "test";
          else if (activeFilter === "supplements") matchesFilter = product.type === "supplement";
          else if (activeFilter === "prescriptions") matchesFilter = product.type === "prescription";
        } else {
          matchesFilter = categoryLower.includes(filterLower) || filterLower.includes(categoryLower);
        }
      }

      return matchesTab && matchesSearch && matchesFilter;
    });
  }, [activeTab, searchQuery, activeFilter, productsData]);

  // Group products by section
  const groupedProducts = useMemo(() => {
    const groups = {};
    filteredProducts.forEach(product => {
      if (!groups[product.section]) {
        groups[product.section] = [];
      }
      groups[product.section].push(product);
    });
    return groups;
  }, [filteredProducts]);

  // Section titles
  const sectionTitles = {
    recommended: "Top recommendations for you",
    wellness: "Wellness Tests",
    brain: "Brain & Cognitive Health",
    digestive: "Digestive Health",
    chronic: "Chronic Condition Management",
    hormone: "Hormone Balance",
  };

  return (
    <div className="min-h-screen pb-24 px-4">
      <IconTabs 
        categories={dataCategories} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      <div className="pt-20 space-y-6">
        {/* Search Bar */}
        <SearchBar 
          placeholder="Search anything" 
          value={searchQuery}
          onChange={setSearchQuery}
        />

        {/* Filter Tabs */}
        <FilterTabs 
          filters={filters}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        {/* Product Sections */}
        <div className="space-y-8">
          {Object.entries(groupedProducts).map(([section, products]) => (
            <ProductSection 
              key={section}
              title={sectionTitles[section] || section}
              products={products}
            />
          ))}

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No products found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}