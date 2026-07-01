"use client";

import { Suspense, useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import ProductSection from "@/components/ProductSection";
import { productAPI, cartAPI } from "@/services/api";

// Top-level category tabs (superpower marketplace).
// `match` maps the tab to our real product `type` values; "all" shows everything.
const CATEGORY_TABS = [
  { id: "all", label: "All", match: null },
  { id: "tests", label: "Tests", match: "test" },
  { id: "prescriptions", label: "Prescriptions", match: "prescription" },
  { id: "supplements", label: "Supplements", match: "supplement" },
];

const VALID_TAB_IDS = CATEGORY_TABS.map((t) => t.id);

// Section heading copy + supporting description (superpower-style).
const SECTION_META = {
  recommended: {
    title: "Top recommendations for you",
    subtitle: "Curated for your health goals — start here.",
  },
  wellness: {
    title: "Wellness Tests",
    subtitle: "A comprehensive baseline read on your health.",
  },
  brain: {
    title: "Brain & Cognitive Health",
    subtitle: "Support focus, memory, and long-term cognitive performance.",
  },
  digestive: {
    title: "Digestive Health",
    subtitle: "Gut health shapes immunity, mood, and metabolism.",
  },
  chronic: {
    title: "Chronic Condition Management",
    subtitle: "Ongoing support for long-term conditions.",
  },
  hormone: {
    title: "Hormone Balance",
    subtitle: "The hormones driving energy, mood, and recovery.",
  },
};

function MarketplaceInner() {
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Backend-driven marketplace data
  const [productsData, setProductsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Live cart count for the always-visible cart button (so added items are never lost).
  const [cartCount, setCartCount] = useState(0);
  const refreshCart = useCallback(async () => {
    try {
      const res = await cartAPI.get();
      setCartCount(res?.data?.itemCount || 0);
    } catch {
      /* not logged in / empty — leave the count as-is */
    }
  }, []);
  useEffect(() => {
    refreshCart();
    const onFocus = () => refreshCart();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshCart]);

  // Preselect the tab from ?category= in the URL (e.g. /market-place?category=tests).
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat && VALID_TAB_IDS.includes(cat)) {
      setActiveTab(cat);
    }
  }, [searchParams]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch all active products once; tab/search are applied client-side.
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

  // Filter products by the active category tab + search query.
  const filteredProducts = useMemo(() => {
    const tab = CATEGORY_TABS.find((t) => t.id === activeTab);
    const q = searchQuery.trim().toLowerCase();

    return productsData.filter((product) => {
      const matchesTab = !tab?.match || product.type === tab.match;

      const matchesSearch =
        !q ||
        (product.name || "").toLowerCase().includes(q) ||
        (product.brand || "").toLowerCase().includes(q) ||
        (product.category || "").toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery, productsData]);

  // Group products by section for the superpower-style section layout.
  const groupedProducts = useMemo(() => {
    const groups = {};
    filteredProducts.forEach((product) => {
      const key = product.section || "recommended";
      if (!groups[key]) groups[key] = [];
      groups[key].push(product);
    });
    return groups;
  }, [filteredProducts]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-pageBackground pb-24 font-inter lg:pb-10">
      <div className="mx-auto max-w-[1200px] px-4 pt-6 sm:px-6 lg:px-8 lg:pt-10">
        {/* Header — title + always-visible cart/orders (mobile + desktop) */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-[32px] font-semibold tracking-[-0.02em] text-blue lg:text-[40px]">
            Marketplace
          </h1>
          <div className="flex flex-shrink-0 items-center gap-2">
            <Link
              href="/cart"
              aria-label={`Cart${cartCount ? ` (${cartCount} items)` : ""}`}
              className="relative inline-flex h-11 items-center gap-2 rounded-full border border-borderColor bg-white px-4 text-sm font-semibold text-blue shadow-sm transition hover:border-primary/40 hover:text-black"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-primary px-1 text-[11px] font-bold leading-none text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link
              href="/orders"
              className="inline-flex h-11 items-center rounded-full border border-borderColor bg-white px-4 text-sm font-semibold text-blue shadow-sm transition hover:border-primary/40 hover:text-black"
            >
              Orders
            </Link>
          </div>
        </div>
        {/* Desktop-only management shortcuts */}
        <div className="mt-3 hidden flex-wrap items-center gap-x-6 gap-y-2 text-sm text-secondary sm:flex">
          <Link href="/market-place?category=supplements" className="transition hover:text-blue">
            Manage Supplements
          </Link>
          <Link href="/market-place?category=prescriptions" className="transition hover:text-blue">
            Manage Prescriptions
          </Link>
        </div>

        {/* Category tabs + search */}
        <div className="mt-6 flex flex-col gap-4 lg:mt-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-4 flex gap-2 overflow-x-auto scrollbar-hide px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-black text-white"
                    : "border border-borderColor bg-white text-secondary hover:border-black/20 hover:text-blue"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="w-full lg:max-w-[360px]">
            <SearchBar
              placeholder="Search anything"
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
        </div>

        {/* Compounded-products disclaimer (shown for prescriptions, like superpower) */}
        {(activeTab === "all" || activeTab === "prescriptions") && (
          <p className="mt-6 max-w-3xl text-xs leading-relaxed text-secondary">
            **Compounded products have not been approved by the FDA. The FDA does not verify the
            safety, effectiveness, or quality of compounded drugs.
          </p>
        )}

        {/* Product sections */}
        <div className="mt-8 space-y-12 lg:mt-10 lg:space-y-16">
          {loading ? (
            /* Loading state */
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-3xl border border-borderColor bg-white p-6"
                >
                  <div className="mb-4 h-3 w-1/3 rounded bg-borderColor" />
                  <div className="mb-5 h-[150px] rounded-2xl bg-borderColor" />
                  <div className="h-4 w-2/3 rounded bg-borderColor" />
                  <div className="mt-2 h-3 w-full rounded bg-borderColor" />
                  <div className="mt-2 h-3 w-4/5 rounded bg-borderColor" />
                  <div className="mt-5 h-9 w-1/2 rounded-full bg-borderColor" />
                </div>
              ))}
            </div>
          ) : error ? (
            /* Error state */
            <div className="rounded-3xl border border-borderColor bg-white py-12 text-center">
              <p className="font-medium text-blue">Couldn&apos;t load the marketplace</p>
              <p className="mt-1 text-sm text-secondary">{error}</p>
              <button
                type="button"
                onClick={fetchProducts}
                className="mt-4 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black/85"
              >
                Try again
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            /* Empty state */
            <div className="rounded-3xl border border-borderColor bg-white py-16 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-pageBackground text-secondary">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <p className="text-base font-medium text-blue">No products available yet</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-secondary">
                {searchQuery
                  ? "Try a different search."
                  : activeTab === "tests"
                  ? "Tests will appear here once they're added."
                  : activeTab === "prescriptions"
                  ? "Prescriptions will appear here once they're added."
                  : "Check back soon — new products are added regularly."}
              </p>
            </div>
          ) : (
            Object.entries(groupedProducts).map(([section, products]) => {
              const meta = SECTION_META[section];
              return (
                <ProductSection
                  key={section}
                  title={meta?.title || section}
                  subtitle={meta?.subtitle}
                  products={products}
                  onAdded={refreshCart}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function Marketplace() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-pageBackground" />}>
      <MarketplaceInner />
    </Suspense>
  );
}
