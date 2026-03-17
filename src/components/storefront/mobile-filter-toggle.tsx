"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { MobileFilterDrawer } from "./mobile-filter-drawer";
import { FilterSidebar } from "./filter-sidebar";
import type { Category } from "@/types";

interface MobileFilterToggleProps {
  categories: Category[];
  categoryCounts: Record<string, number>;
  minPrice: number;
  maxPrice: number;
}

export function MobileFilterToggle({
  categories,
  categoryCounts,
  minPrice,
  maxPrice,
}: MobileFilterToggleProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-[#E2E8F0] rounded-lg hover:bg-gray-50 transition-colors"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
      </button>
      <MobileFilterDrawer open={open} onClose={() => setOpen(false)}>
        <FilterSidebar
          categories={categories}
          categoryCounts={categoryCounts}
          minPrice={minPrice}
          maxPrice={maxPrice}
        />
      </MobileFilterDrawer>
    </>
  );
}
