"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

interface OrderSearchBarProps {
  defaultValue?: string;
}

export function OrderSearchBar({ defaultValue = "" }: OrderSearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    const status = searchParams.get("status");
    if (status) params.set("status", status);
    if (query.trim()) params.set("q", query.trim());
    router.push(`/admin/orders${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function handleClear() {
    setQuery("");
    const params = new URLSearchParams();
    const status = searchParams.get("status");
    if (status) params.set("status", status);
    router.push(`/admin/orders${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <form onSubmit={handleSearch} className="relative w-full sm:w-72">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search order ID, name, phone..."
        className="w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
