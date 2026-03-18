"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Category } from "@/types";

interface FilterSidebarProps {
  categories: Category[];
  categoryCounts: Record<string, number>;
  minPrice: number;
  maxPrice: number;
}

export function FilterSidebar({
  categories,
  categoryCounts,
  minPrice,
  maxPrice,
}: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Optimistic local state for categories — syncs from URL but updates instantly on click
  const urlCategories = searchParams.get("category")?.split(",").filter(Boolean) ?? [];
  const [localCategories, setLocalCategories] = useState<string[]>(urlCategories);

  // Keep local state in sync when URL changes (e.g. back/forward navigation)
  const urlKey = urlCategories.join(",");
  const prevUrlKey = useRef(urlKey);
  if (urlKey !== prevUrlKey.current) {
    prevUrlKey.current = urlKey;
    // Only sync if local state doesn't match (avoids overriding optimistic state)
    if (localCategories.join(",") !== urlKey) {
      setLocalCategories(urlCategories);
    }
  }

  const [priceMin, setPriceMin] = useState(searchParams.get("minPrice") ?? "");
  const [priceMax, setPriceMax] = useState(searchParams.get("maxPrice") ?? "");

  // Navigate with updated params — use transition so it doesn't block UI
  const navigate = useCallback(
    (overrides: { categories?: string[]; minPrice?: string; maxPrice?: string }) => {
      const params = new URLSearchParams();
      const cats = overrides.categories ?? localCategories;
      if (cats.length > 0) params.set("category", cats.join(","));
      const min = overrides.minPrice ?? priceMin;
      const max = overrides.maxPrice ?? priceMax;
      if (min) params.set("minPrice", min);
      if (max) params.set("maxPrice", max);
      const search = searchParams.get("search");
      if (search) params.set("search", search);
      const sort = searchParams.get("sort");
      if (sort) params.set("sort", sort);
      // Reset to page 1 on filter change
      startTransition(() => {
        router.push(`/products?${params.toString()}`, { scroll: false });
      });
    },
    [localCategories, priceMin, priceMax, searchParams, router]
  );

  // Toggle category: update local state INSTANTLY, then navigate in background
  function toggleCategory(slug: string) {
    const next = localCategories.includes(slug)
      ? localCategories.filter((s) => s !== slug)
      : [...localCategories, slug];
    setLocalCategories(next); // Instant checkbox update
    navigate({ categories: next }); // Background navigation
  }

  // Debounced price filter
  const priceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handlePriceChange(field: "min" | "max", value: string) {
    if (field === "min") setPriceMin(value);
    else setPriceMax(value);

    if (priceTimer.current) clearTimeout(priceTimer.current);
    priceTimer.current = setTimeout(() => {
      navigate(
        field === "min"
          ? { minPrice: value, maxPrice: priceMax }
          : { minPrice: priceMin, maxPrice: value }
      );
    }, 600);
  }

  useEffect(() => {
    return () => {
      if (priceTimer.current) clearTimeout(priceTimer.current);
    };
  }, []);

  function clearFilters() {
    setPriceMin("");
    setPriceMax("");
    setLocalCategories([]);
    const params = new URLSearchParams();
    const search = searchParams.get("search");
    if (search) params.set("search", search);
    startTransition(() => {
      router.push(`/products${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
    });
  }

  const hasFilters = localCategories.length > 0 || priceMin || priceMax;

  // Count helper: sum parent + children counts
  function getCategoryCount(cat: Category): number {
    let count = categoryCounts[cat.id] ?? 0;
    if (cat.children) {
      for (const child of cat.children) {
        count += categoryCounts[child.id] ?? 0;
      }
    }
    return count;
  }

  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-sm font-semibold text-[#1E293B] uppercase tracking-wider mb-3">
          Categories
        </h3>
        {isPending && (
          <div className="h-0.5 w-full bg-primary/20 rounded overflow-hidden mb-2">
            <div className="h-full w-1/3 bg-primary rounded animate-[shimmer_1s_ease-in-out_infinite]" />
          </div>
        )}
        <div className="space-y-1">
          {categories.map((cat) => (
            <div key={cat.id}>
              <label className="flex items-center gap-2.5 cursor-pointer group py-1">
                <input
                  type="checkbox"
                  checked={localCategories.includes(cat.slug)}
                  onChange={() => toggleCategory(cat.slug)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-600 group-hover:text-[#1E293B] flex-1 font-medium">
                  {cat.name}
                </span>
                <span className="text-xs text-gray-400">
                  ({getCategoryCount(cat)})
                </span>
              </label>
              {/* Subcategories */}
              {cat.children && cat.children.length > 0 && (
                <div className="ml-6 space-y-0.5">
                  {cat.children.map((child) => (
                    <label
                      key={child.id}
                      className="flex items-center gap-2.5 cursor-pointer group py-1"
                    >
                      <input
                        type="checkbox"
                        checked={localCategories.includes(child.slug)}
                        onChange={() => toggleCategory(child.slug)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-500 group-hover:text-[#1E293B] flex-1">
                        {child.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({categoryCounts[child.id] ?? 0})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-semibold text-[#1E293B] uppercase tracking-wider mb-3">
          Price Range
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={priceMin}
            onChange={(e) => handlePriceChange("min", e.target.value)}
            placeholder={String(minPrice)}
            min={0}
            className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <span className="text-gray-400 text-sm shrink-0">&mdash;</span>
          <input
            type="number"
            value={priceMax}
            onChange={(e) => handlePriceChange("max", e.target.value)}
            placeholder={String(maxPrice)}
            min={0}
            className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="w-full text-sm text-gray-500 hover:text-[#1E293B] py-2 transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
