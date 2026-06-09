"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import IconTabs from "@/components/IconTabs";
import SearchBar from "@/components/SearchBar";
import FilterTabs from "@/components/FilterTabs";
import ProductSection from "@/components/ProductSection";
import { productAPI } from "@/services/api";

export default function Marketplace() {
  const [activeTab, setActiveTab] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Backend-driven marketplace data
  const [productsData, setProductsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const dataCategories = [
    { id: "grid", icon: "/assets/data-bar-icons/grid.svg" },
    { id: "vial", icon: "/assets/data-bar-icons/vial.svg" },
    { id: "pills", icon: "/assets/data-bar-icons/pills.svg" },
    { id: "prescription", icon: "/assets/data-bar-icons/dose.svg" },
  ];

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch all active products once; tab/search/filter are applied client-side.
      // (The API also supports server-side type/section/q/page/limit for scaling.)
      const response = await productAPI.getProducts({ limit: 200 });
      const items = response?.data?.items || [];
      setProductsData(items);
    } catch (err) {
      setError(err.message || "Failed to load products");
      setProductsData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
    setActiveFilter("supplements"); // default filter for grid
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
    <div className="min-h-screen pb-24 px-4 lg:px-8">
      <IconTabs 
        categories={dataCategories} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      <div className="max-w-[1240px] mx-auto pt-20 lg:max-w-[1320px] lg:pt-28">
        {/* Desktop page header */}
        <div className="mb-8 hidden lg:flex lg:items-end lg:justify-between lg:border-b lg:border-borderColor lg:pb-7">
          <div>
            <h1 className="text-[34px] font-semibold tracking-[-0.02em] text-gray-900">Marketplace</h1>
            <p className="mt-1.5 text-[15px] text-gray-500">
              Tests, supplements and prescriptions — curated for your health goals.
            </p>
          </div>
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 rounded-full border border-borderColor bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
          >
            🛒 View Cart
          </Link>
        </div>

        {/* Desktop Layout: Sidebar + Content */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start space-y-6 lg:space-y-0">
          {/* Left Sidebar - Filters (sticky on desktop) */}
          <div className="lg:col-span-3 lg:sticky lg:top-28">
            <div className="space-y-4 lg:space-y-0 lg:rounded-2xl lg:border lg:border-borderColor lg:bg-white lg:p-6 lg:shadow-sm">
              <div className="hidden lg:block">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">Filters</h3>
              </div>
              <FilterTabs
                filters={filters}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
              />
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-9 space-y-6">
            <div className="flex items-center justify-end lg:hidden">
              <Link
                href="/cart"
                className="inline-flex items-center gap-2 rounded-full border border-borderColor bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                🛒 View Cart
              </Link>
            </div>
            {/* Search Bar */}
            <div className="lg:max-w-[520px]">
              <SearchBar
                placeholder="Search anything"
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>

            {/* Filter Tabs Mobile */}
            {/* <div className="lg:hidden">
              <FilterTabs 
                filters={filters}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
              />
            </div> */}

            {/* Product Sections */}
            <div className="space-y-8">
              {loading ? (
                /* Loading state */
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse rounded-xl p-4 lg:p-5 lg:border lg:border-borderColor lg:bg-white"
                    >
                      <div className="h-[150px] mb-3 rounded-lg bg-gray-100 lg:mb-4 lg:h-[180px]" />
                      <div className="h-3 w-1/2 rounded bg-gray-100" />
                      <div className="mt-2 h-3 w-3/4 rounded bg-gray-100" />
                      <div className="mt-3 h-4 w-1/3 rounded bg-gray-100" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                /* Error state */
                <div className="text-center py-12">
                  <p className="text-gray-700 font-medium">Couldn&apos;t load the marketplace</p>
                  <p className="mt-1 text-sm text-gray-500">{error}</p>
                  <button
                    type="button"
                    onClick={fetchProducts}
                    className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-800"
                  >
                    Try again
                  </button>
                </div>
              ) : filteredProducts.length === 0 ? (
                /* Empty state */
                <div className="text-center py-16 text-gray-500">
                  <p className="text-base font-medium text-gray-700">No products available yet</p>
                  <p className="mt-1 text-sm">
                    {searchQuery
                      ? "Try a different search."
                      : activeTab === "vial"
                      ? "Tests will appear here once they're added."
                      : activeTab === "prescription"
                      ? "Prescriptions will appear here once they're added."
                      : "Check back soon — new products are added regularly."}
                  </p>
                </div>
              ) : (
                Object.entries(groupedProducts).map(([section, products]) => (
                  <ProductSection
                    key={section}
                    title={sectionTitles[section] || section}
                    products={products}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}