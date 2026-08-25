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
      <h1 className="font-display tracking-[-0.03em] text-2xl font-bold text-surface-fg mb-6">Add Product</h1>
      <div className="rounded-[20px] border border-surface-border bg-surface p-6">
        <ProductForm categories={categories ?? []} />
      </div>
    </div>
  );
}
