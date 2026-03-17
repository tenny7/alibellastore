"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

interface FilterOption {
  value: string;
  label: string;
}

interface SearchFilterBarProps {
  placeholder?: string;
  searchParamKey?: string;
  filters?: {
    key: string;
    label: string;
    options: FilterOption[];
  }[];
  // For client-side mode (no URL params)
  onSearchChange?: (value: string) => void;
  onFilterChange?: (key: string, value: string) => void;
}

export function SearchFilterBar({
  placeholder = "Search...",
  searchParamKey = "search",
  filters,
  onSearchChange,
  onFilterChange,
}: SearchFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isUrlMode = !onSearchChange;

  const [search, setSearch] = useState(
    isUrlMode ? (searchParams.get(searchParamKey) ?? "") : ""
  );

  // Debounce URL-mode search
  useEffect(() => {
    if (!isUrlMode) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) {
        params.set(searchParamKey, search);
      } else {
        params.delete(searchParamKey);
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, isUrlMode, searchParamKey, searchParams, router]);

  function handleSearchInput(value: string) {
    setSearch(value);
    if (!isUrlMode && onSearchChange) {
      onSearchChange(value);
    }
  }

  function handleClear() {
    setSearch("");
    if (!isUrlMode && onSearchChange) {
      onSearchChange("");
    }
  }

  function handleFilterSelect(key: string, value: string) {
    if (isUrlMode) {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    } else if (onFilterChange) {
      onFilterChange(key, value);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      {/* Search input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchInput(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-[#E2E8F0] bg-white py-2.5 pl-10 pr-9 text-sm text-[#1E293B] placeholder-gray-400 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        />
        {search && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter dropdowns */}
      {filters?.map((filter) => (
        <select
          key={filter.key}
          value={isUrlMode ? (searchParams.get(filter.key) ?? "") : undefined}
          onChange={(e) => handleFilterSelect(filter.key, e.target.value)}
          className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#1E293B] outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors sm:w-auto"
        >
          <option value="">{filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
