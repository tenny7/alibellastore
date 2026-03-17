"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this product? This will also remove its images.")) return;

    const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete product");
      return;
    }

    const data = await res.json();
    if (data.archived) {
      toast.success("Product has order history — moved to Draft");
    } else {
      toast.success("Product deleted");
    }
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-[#DC2626]"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
