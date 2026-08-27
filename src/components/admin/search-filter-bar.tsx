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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchInput(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-[20px] border border-surface-border bg-surface py-2.5 pl-10 pr-9 text-sm text-surface-fg placeholder:text-surface-muted outline-none focus:border-surface-fg focus:ring-1 focus:ring-surface-fg transition-colors"
        />
        {search && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-muted hover:text-surface-muted"
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
          className="rounded-[20px] border border-surface-border bg-surface px-3 py-2.5 text-sm text-surface-fg outline-none focus:border-surface-fg focus:ring-1 focus:ring-surface-fg transition-colors sm:w-auto"
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
