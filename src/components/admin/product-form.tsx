"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ImageUploader } from "@/components/admin/image-uploader";
import toast from "react-hot-toast";
import type { Product, Category } from "@/types";

interface ProductFormProps {
  product?: Product;
  categories: Category[];
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const isEditing = !!product;

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [status, setStatus] = useState(product?.status ?? "draft");
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Flatten categories for select
  const categoryOptions: { value: string; label: string }[] = [];
  for (const cat of categories) {
    categoryOptions.push({ value: cat.id, label: cat.name });
    if (cat.children) {
      for (const child of cat.children) {
        categoryOptions.push({ value: child.id, label: `  └ ${child.name}` });
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!price || Number(price) <= 0) newErrors.price = "Valid price is required";
    if (!categoryId) newErrors.category_id = "Category is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);

    const body = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: Number(price),
      category_id: categoryId,
      status,
      images,
    };

    const url = isEditing ? `/api/products/${product.id}` : "/api/products";
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Failed to save product");
      setSaving(false);
      return;
    }

    toast.success(isEditing ? "Product updated" : "Product created");
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <Input
        id="name"
        label="Product Name"
        placeholder="e.g. Samsung Galaxy A14"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
      />

      <Textarea
        id="description"
        label="Description (optional)"
        placeholder="Describe the product..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          id="price"
          label="Price"
          type="number"
          min="0"
          step="1"
          placeholder="85000"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          error={errors.price}
        />
        <Select
          id="category"
          label="Category"
          placeholder="Select a category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          options={categoryOptions}
          error={errors.category_id}
        />
      </div>

      <Select
        id="status"
        label="Status"
        value={status}
        onChange={(e) => setStatus(e.target.value as Product["status"])}
        options={[
          { value: "draft", label: "Draft" },
          { value: "active", label: "Active" },
          { value: "out_of_stock", label: "Out of Stock" },
        ]}
      />

      <ImageUploader images={images} onChange={setImages} />

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/products")}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button type="submit" loading={saving} className="w-full sm:w-auto">
          {isEditing ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
