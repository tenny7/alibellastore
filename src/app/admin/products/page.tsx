import Link from "next/link";
import Image from "next/image";
import { Plus, Package } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { SearchFilterBar } from "@/components/admin/search-filter-bar";
import { FloatingActionButton } from "@/components/admin/floating-action-button";
import { formatCurrency } from "@/lib/utils";
import { getSiteSettings } from "@/lib/settings";
import { PRODUCTS_PER_PAGE } from "@/lib/constants";
import { DeleteProductButton } from "./delete-button";

interface Props {
  searchParams: Promise<{ page?: string; search?: string; categoryId?: string; status?: string }>;
}

export default async function AdminProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1");
  const search = params.search;
  const categoryId = params.categoryId;
  const statusFilter = params.status;

  const [supabase, settings] = await Promise.all([
    Promise.resolve(createAdminClient()),
    getSiteSettings(),
  ]);

  // Fetch categories for filter dropdown
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  let query = supabase
    .from("products")
    .select("*, category:categories(name)", { count: "exact" });

  if (categoryId) query = query.eq("category_id", categoryId);
  if (statusFilter) query = query.eq("status", statusFilter);
  if (search) query = query.ilike("name", `%${search}%`);

  const from = (page - 1) * PRODUCTS_PER_PAGE;
  const to = from + PRODUCTS_PER_PAGE - 1;

  const { data: products, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.ceil((count ?? 0) / PRODUCTS_PER_PAGE);

  const statusVariant: Record<string, "success" | "warning" | "danger"> = {
    active: "success",
    draft: "warning",
    out_of_stock: "danger",
  };

  const categoryOptions = (categories ?? []).map((c) => ({ value: c.id, label: c.name }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1E293B]">Products</h1>
        <Link href="/admin/products/new" className="hidden lg:block">
          <Button>
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      <SearchFilterBar
        placeholder="Search products..."
        searchParamKey="search"
        filters={[
          {
            key: "categoryId",
            label: "All Categories",
            options: categoryOptions,
          },
          {
            key: "status",
            label: "All Statuses",
            options: [
              { value: "active", label: "Active" },
              { value: "draft", label: "Draft" },
              { value: "out_of_stock", label: "Out of Stock" },
            ],
          },
        ]}
      />

      {products && products.length > 0 ? (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.images?.[0] ? (
                        <div className="relative w-10 h-10 rounded overflow-hidden">
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                          N/A
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-gray-500">
                      {(product.category as { name: string })?.name ?? "—"}
                    </TableCell>
                    <TableCell>{formatCurrency(Number(product.price), settings.currency_code)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[product.status]} dot>
                        {product.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="rounded-lg px-3 py-1.5 text-sm text-primary hover:bg-blue-50 transition-colors"
                        >
                          Edit
                        </Link>
                        <DeleteProductButton productId={product.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="rounded-lg border border-[#E2E8F0] bg-white p-4"
              >
                <div className="flex gap-3">
                  {product.images?.[0] ? (
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0">
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                      <Package className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-[#1E293B] text-sm truncate">
                        {product.name}
                      </p>
                      <Badge variant={statusVariant[product.status]} size="sm" dot>
                        {product.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {(product.category as { name: string })?.name ?? "—"}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="font-semibold text-sm text-[#1E293B]">
                        {formatCurrency(Number(product.price), settings.currency_code)}
                      </p>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="text-xs text-primary font-medium"
                        >
                          Edit
                        </Link>
                        <DeleteProductButton productId={product.id} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl="/admin/products"
          />
        </>
      ) : (
        <div className="text-center py-12 rounded-lg border border-[#E2E8F0] bg-white">
          <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium mb-1">No products found</p>
          <p className="text-sm text-gray-400 mb-4">
            {search || categoryId || statusFilter
              ? "Try adjusting your filters."
              : "Add your first product to get started."}
          </p>
          <Link href="/admin/products/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>
      )}

      <FloatingActionButton href="/admin/products/new" label="Add Product" />
    </div>
  );
}
