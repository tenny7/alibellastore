"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { FloatingActionButton } from "@/components/admin/floating-action-button";
import { SkeletonDataView } from "@/components/admin/skeleton-loader";
import toast from "react-hot-toast";
import type { Category } from "@/types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  function openCreate() {
    setEditingId(null);
    setName("");
    setParentId("");
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setEditingId(cat.id);
    setName(cat.name);
    setParentId(cat.parent_id || "");
    setModalOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    const url = editingId ? `/api/categories/${editingId}` : "/api/categories";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parent_id: parentId || null }),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Failed to save");
      setSaving(false);
      return;
    }

    toast.success(editingId ? "Category updated" : "Category created");
    setModalOpen(false);
    setSaving(false);
    fetchCategories();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;

    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Failed to delete");
      return;
    }

    toast.success("Category deleted");
    fetchCategories();
  }

  // Flatten categories for the table
  const allCategories: (Category & { level: number })[] = [];
  for (const cat of categories) {
    allCategories.push({ ...cat, level: 0 });
    if (cat.children) {
      for (const child of cat.children) {
        allCategories.push({ ...child, level: 1 });
      }
    }
  }

  // Parent options (only top-level) for the select
  const parentOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1E293B]">Categories</h1>
        <Button onClick={openCreate} className="hidden lg:inline-flex">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {loading ? (
        <SkeletonDataView rows={4} cols={4} />
      ) : allCategories.length === 0 ? (
        <div className="text-center py-12 rounded-lg border border-[#E2E8F0] bg-white">
          <FolderTree className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium mb-1">No categories yet</p>
          <p className="text-sm text-gray-400 mb-4">Create your first category to organize products.</p>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4" />
            Create Category
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {allCategories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">
                      {cat.level > 0 && <span className="text-gray-400 mr-2">└</span>}
                      {cat.name}
                    </TableCell>
                    <TableCell className="text-gray-500 font-mono text-xs">{cat.slug}</TableCell>
                    <TableCell>
                      <Badge variant={cat.level === 0 ? "info" : "default"} size="sm">
                        {cat.level === 0 ? "Parent" : "Child"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(cat)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-[#DC2626] transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {allCategories.map((cat) => (
              <div
                key={cat.id}
                className="rounded-lg border border-[#E2E8F0] bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {cat.level > 0 && <span className="text-gray-300 text-lg">└</span>}
                      <p className="font-medium text-[#1E293B] text-sm truncate">{cat.name}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">{cat.slug}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Badge variant={cat.level === 0 ? "info" : "default"} size="sm">
                      {cat.level === 0 ? "Parent" : "Child"}
                    </Badge>
                    <button
                      onClick={() => openEdit(cat)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-primary transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-[#DC2626] transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <FloatingActionButton onClick={openCreate} label="Add Category" />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Category" : "Create Category"}
      >
        <div className="space-y-4">
          <Input
            id="catName"
            label="Category Name"
            placeholder="e.g. Electronics"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Select
            id="catParent"
            label="Parent Category (optional)"
            placeholder="None (top-level)"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            options={[{ value: "", label: "None (top-level)" }, ...parentOptions]}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingId ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
