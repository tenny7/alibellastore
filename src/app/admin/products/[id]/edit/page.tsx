import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductForm } from "@/components/admin/product-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("id", id)
      .single(),
    supabase
      .from("categories")
      .select("*, children:categories!parent_id(*)")
      .is("parent_id", null)
      .order("name"),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h1 className="font-display tracking-[-0.03em] text-2xl font-bold text-surface-fg mb-6">Edit Product</h1>
      <div className="rounded-[20px] border border-surface-border bg-surface p-6">
        <ProductForm product={product} categories={categories ?? []} />
      </div>
    </div>
  );
}
