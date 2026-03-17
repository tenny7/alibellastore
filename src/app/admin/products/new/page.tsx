import { createAdminClient } from "@/lib/supabase/admin";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  const supabase = createAdminClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*, children:categories!parent_id(*)")
    .is("parent_id", null)
    .order("name");

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1E293B] mb-6">Add Product</h1>
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-6">
        <ProductForm categories={categories ?? []} />
      </div>
    </div>
  );
}
