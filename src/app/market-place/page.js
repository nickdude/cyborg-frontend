"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
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
    <div className="min-h-screen pb-24 px-4 lg:bg-[#FAFBFC] lg:px-8">
      <IconTabs 
        categories={dataCategories} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      {/* Desktop: glass strip behind the floating tab bar so content scrolls cleanly underneath */}
      <div className="hidden lg:block fixed inset-x-0 top-0 z-10 h-20 bg-[#FAFBFC]/90 backdrop-blur-xl" />

      <div className="mx-auto max-w-[1240px] pt-20 lg:max-w-[1440px]">
        {/* Desktop sticky header — title · search · cart */}
        <div className="mb-8 hidden lg:sticky lg:top-20 lg:z-20 lg:flex lg:items-center lg:justify-between lg:gap-5 lg:border-b lg:border-borderColor lg:bg-[#FAFBFC]/90 lg:py-4 lg:shadow-sm lg:backdrop-blur-xl">
          <div className="min-w-0 shrink">
            <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-blue xl:text-[34px]">Marketplace</h1>
            <p className="mt-1 truncate text-[14px] text-secondary xl:text-[15px]">
              Tests, supplements and prescriptions — curated for your health goals.
            </p>
          </div>
          <div className="w-full min-w-0 max-w-[460px] shrink">
            <SearchBar
              placeholder="Search tests, supplements, prescriptions…"
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
          <Link
            href="/cart"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-purple-800 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98]"
          >
            <ShoppingCart className="h-[18px] w-[18px]" /> View Cart
          </Link>
        </div>

        {/* Layout: Sidebar + Content */}
        <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-8">
          {/* Left Sidebar — Filters (desktop, sticky) */}
          <aside className="lg:col-span-3 lg:sticky lg:top-48 lg:self-start lg:max-h-[calc(100vh-13rem)] lg:overflow-y-auto scrollbar-hide">
            <div className="space-y-4 lg:space-y-0 lg:rounded-2xl lg:border lg:border-borderColor lg:bg-white lg:p-6 lg:shadow-sm">
              <h3 className="mb-4 hidden text-xs font-semibold uppercase tracking-[0.08em] text-secondary lg:block">Filters</h3>
              <FilterTabs
                filters={filters}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
              />
            </div>
          </aside>

          {/* Right Content Area */}
          <div className="lg:col-span-9 space-y-6 lg:space-y-0">
            {/* Mobile cart link */}
            <div className="flex items-center justify-end lg:hidden">
              <Link
                href="/cart"
                className="inline-flex items-center gap-2 rounded-full border border-borderColor bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                🛒 View Cart
              </Link>
            </div>
            {/* Mobile search */}
            <div className="lg:hidden">
              <SearchBar
                placeholder="Search anything"
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>
            {/* Product Sections */}
            <div className="space-y-8 lg:space-y-10">
              {loading ? (
                /* Loading state */
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse rounded-2xl border border-borderColor bg-white p-4 lg:p-5"
                    >
                      <div className="mb-3 h-[150px] rounded-xl bg-borderColor lg:mb-4 lg:h-[190px]" />
                      <div className="h-3 w-1/2 rounded bg-borderColor" />
                      <div className="mt-2 h-3 w-3/4 rounded bg-borderColor" />
                      <div className="mt-3 h-4 w-1/3 rounded bg-borderColor" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                /* Error state */
                <div className="rounded-2xl border border-borderColor bg-white py-12 text-center">
                  <p className="font-medium text-blue">Couldn&apos;t load the marketplace</p>
                  <p className="mt-1 text-sm text-secondary">{error}</p>
                  <button
                    type="button"
                    onClick={fetchProducts}
                    className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-800"
                  >
                    Try again
                  </button>
                </div>
              ) : filteredProducts.length === 0 ? (
                /* Empty state */
                <div className="rounded-2xl border border-borderColor bg-white py-16 text-center">
                  <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-pageBackground text-secondary">
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                  <p className="text-base font-medium text-blue">No products available yet</p>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-secondary">
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