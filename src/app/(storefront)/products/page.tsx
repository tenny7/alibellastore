import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductGrid } from "@/components/storefront/product-grid";
import { Pagination } from "@/components/ui/pagination";
import { Breadcrumb } from "@/components/storefront/breadcrumb";
import { FilterSidebar } from "@/components/storefront/filter-sidebar";
import { SortDropdown } from "@/components/storefront/sort-dropdown";
import { MobileFilterToggle } from "@/components/storefront/mobile-filter-toggle";
import { PRODUCTS_PER_PAGE } from "@/lib/constants";
import { sanitizeSearch } from "@/lib/utils";
import type { Category, Product } from "@/types";

interface Props {
  searchParams: Promise<{
    page?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    search?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1") || 1);
  const categorySlugs = params.category?.split(",").filter(Boolean).slice(0, 20) ?? [];
  const minPriceFilter = params.minPrice ? Math.max(0, Number(params.minPrice) || 0) : undefined;
  const maxPriceFilter = params.maxPrice ? Math.max(0, Number(params.maxPrice) || 0) : undefined;
  const sort = ["newest", "price_asc", "price_desc"].includes(params.sort ?? "") ? params.sort! : "newest";
  const search = sanitizeSearch(params.search ?? "");

  const supabase = createAdminClient();

  // Fetch all categories (parents with their children)
  const { data: allCategories } = await supabase
    .from("categories")
    .select("*, children:categories!parent_id(*)")
    .is("parent_id", null)
    .order("name");

  const categories = (allCategories ?? []) as Category[];

  // Compute category counts from active products
  const { data: productCategoryIds } = await supabase
    .from("products")
    .select("category_id")
    .eq("status", "active");

  const categoryCounts: Record<string, number> = {};
  productCategoryIds?.forEach((p) => {
    categoryCounts[p.category_id] = (categoryCounts[p.category_id] || 0) + 1;
  });

  // Price bounds for the filter
  const { data: priceMinRow } = await supabase
    .from("products")
    .select("price")
    .eq("status", "active")
    .order("price", { ascending: true })
    .limit(1)
    .single();
  const { data: priceMaxRow } = await supabase
    .from("products")
    .select("price")
    .eq("status", "active")
    .order("price", { ascending: false })
    .limit(1)
    .single();

  const globalMinPrice = Math.floor(Number(priceMinRow?.price ?? 0));
  const globalMaxPrice = Math.ceil(Number(priceMaxRow?.price ?? 100000));

  // Resolve category slugs to IDs — when a parent is selected, include its children too
  let categoryIds: string[] = [];
  if (categorySlugs.length > 0) {
    const selectedSlugs = new Set(categorySlugs);
    for (const parent of categories) {
      if (selectedSlugs.has(parent.slug)) {
        categoryIds.push(parent.id);
        // Include all children of this parent
        if (parent.children) {
          for (const child of parent.children) {
            categoryIds.push(child.id);
          }
        }
      } else if (parent.children) {
        // Check if any child is selected individually
        for (const child of parent.children) {
          if (selectedSlugs.has(child.slug)) {
            categoryIds.push(child.id);
          }
        }
      }
    }
    // Deduplicate
    categoryIds = [...new Set(categoryIds)];
  }

  // Build product query
  let query = supabase
    .from("products")
    .select("*, category:categories(*)", { count: "exact" })
    .eq("status", "active");

  if (categoryIds.length > 0) {
    query = query.in("category_id", categoryIds);
  }
  if (minPriceFilter !== undefined) {
    query = query.gte("price", minPriceFilter);
  }
  if (maxPriceFilter !== undefined) {
    query = query.lte("price", maxPriceFilter);
  }
  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  // Sort
  switch (sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const from = (page - 1) * PRODUCTS_PER_PAGE;
  const to = from + PRODUCTS_PER_PAGE - 1;

  const { data: products, count } = await query.range(from, to);
  const totalPages = Math.ceil((count ?? 0) / PRODUCTS_PER_PAGE);

  // Build breadcrumb
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: search ? `Search: "${search}"` : "All Products" },
  ];

  // Build search params for pagination
  const paginationParams: Record<string, string> = {};
  if (params.category) paginationParams.category = params.category;
  if (params.minPrice) paginationParams.minPrice = params.minPrice;
  if (params.maxPrice) paginationParams.maxPrice = params.maxPrice;
  if (params.sort) paginationParams.sort = params.sort;
  if (params.search) paginationParams.search = params.search;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Breadcrumb items={breadcrumbItems} />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-[260px] shrink-0">
          <div className="sticky top-24">
            <Suspense>
              <FilterSidebar
                categories={categories}
                categoryCounts={categoryCounts}
                minPrice={globalMinPrice}
                maxPrice={globalMaxPrice}
              />
            </Suspense>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Top bar: title, count, mobile filters, sort */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#1E293B]">
                {search ? `Results for "${search}"` : "All Products"}
              </h1>
              {count !== null && count !== undefined && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {count} product{count !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Mobile filter toggle */}
              <Suspense>
                <MobileFilterToggle
                  categories={categories}
                  categoryCounts={categoryCounts}
                  minPrice={globalMinPrice}
                  maxPrice={globalMaxPrice}
                />
              </Suspense>
              <Suspense>
                <SortDropdown />
              </Suspense>
            </div>
          </div>

          {/* Product grid */}
          <ProductGrid
            products={(products ?? []) as Product[]}
            className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
          />

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl="/products"
            searchParams={paginationParams}
          />
        </div>
      </div>
    </div>
  );
}
