"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Percent, DollarSign, Ticket, Zap, Tag } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { FloatingActionButton } from "@/components/admin/floating-action-button";
import { SkeletonDataView } from "@/components/admin/skeleton-loader";
import { formatCurrency } from "@/lib/utils";
import { useSiteSettings } from "@/lib/hooks/use-site-settings";
import type { Discount, DiscountType } from "@/types";
import toast from "react-hot-toast";

const DISCOUNT_TYPES: { value: DiscountType; label: string }[] = [
  { value: "percentage", label: "Percentage" },
  { value: "fixed", label: "Fixed Amount" },
  { value: "coupon", label: "Coupon" },
  { value: "flash_sale", label: "Flash Sale" },
];

const typeIcons: Record<DiscountType, typeof Percent> = {
  percentage: Percent,
  fixed: DollarSign,
  coupon: Ticket,
  flash_sale: Zap,
};

const defaultForm = {
  type: "percentage" as DiscountType,
  value: "",
  code: "",
  max_usage: "",
  min_cart_value: "",
  max_discount_cap: "",
  starts_at: new Date().toISOString().slice(0, 16),
  expires_at: "",
  is_active: true,
};

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `Expired ${Math.abs(diffDays)}d ago`;
  if (diffDays === 0) return "Expires today";
  if (diffDays === 1) return "Expires tomorrow";
  if (diffDays <= 30) return `Expires in ${diffDays}d`;
  return date.toLocaleDateString();
}

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { currencyCode } = useSiteSettings();

  const fetchDiscounts = useCallback(async () => {
    const res = await fetch("/api/discounts");
    if (res.ok) {
      const data = await res.json();
      setDiscounts(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  function openCreate() {
    setForm(defaultForm);
    setEditingId(null);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(d: Discount) {
    setForm({
      type: d.type,
      value: String(d.value),
      code: d.code ?? "",
      max_usage: d.max_usage ? String(d.max_usage) : "",
      min_cart_value: d.min_cart_value ? String(d.min_cart_value) : "",
      max_discount_cap: d.max_discount_cap ? String(d.max_discount_cap) : "",
      starts_at: d.starts_at.slice(0, 16),
      expires_at: d.expires_at.slice(0, 16),
      is_active: d.is_active,
    });
    setEditingId(d.id);
    setErrors({});
    setModalOpen(true);
  }

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!form.value || Number(form.value) <= 0) newErrors.value = "Value must be greater than 0";
    if (form.type === "percentage" && Number(form.value) > 100) newErrors.value = "Percentage cannot exceed 100";
    if (!form.expires_at) newErrors.expires_at = "Expiry date is required";
    if (form.expires_at && form.starts_at && form.expires_at <= form.starts_at) {
      newErrors.expires_at = "Expiry must be after start date";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);

    const payload = {
      type: form.type,
      value: Number(form.value),
      code: form.code || null,
      max_usage: form.max_usage ? Number(form.max_usage) : null,
      min_cart_value: form.min_cart_value ? Number(form.min_cart_value) : null,
      max_discount_cap: form.max_discount_cap ? Number(form.max_discount_cap) : null,
      starts_at: new Date(form.starts_at).toISOString(),
      expires_at: new Date(form.expires_at).toISOString(),
      is_active: form.is_active,
    };

    const url = editingId ? `/api/discounts/${editingId}` : "/api/discounts";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast.success(editingId ? "Discount updated" : "Discount created");
      setModalOpen(false);
      fetchDiscounts();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to save");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this discount?")) return;

    const res = await fetch(`/api/discounts/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Discount deleted");
      fetchDiscounts();
    } else {
      toast.error("Failed to delete");
    }
  }

  async function handleToggleActive(d: Discount) {
    const res = await fetch(`/api/discounts/${d.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !d.is_active }),
    });
    if (res.ok) {
      toast.success(d.is_active ? "Discount deactivated" : "Discount activated");
      fetchDiscounts();
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B] mb-6">Discounts</h1>
        <SkeletonDataView rows={3} cols={6} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1E293B]">Discounts</h1>
        <Button onClick={openCreate} size="sm" className="hidden lg:inline-flex">
          <Plus className="h-4 w-4" />
          New Discount
        </Button>
      </div>

      {discounts.length > 0 ? (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Type</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {discounts.map((d) => {
                  const TypeIcon = typeIcons[d.type];
                  return (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4 text-gray-400" />
                          <span className="capitalize">{d.type.replace("_", " ")}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{d.code ?? "—"}</TableCell>
                      <TableCell className="font-medium">
                        {d.type === "percentage" ? `${d.value}%` : formatCurrency(Number(d.value), currencyCode)}
                      </TableCell>
                      <TableCell>
                        {d.usage_count}
                        {d.max_usage ? ` / ${d.max_usage}` : ""}
                      </TableCell>
                      <TableCell>
                        <button onClick={() => handleToggleActive(d)}>
                          <Badge variant={d.is_active ? "success" : "default"} dot>
                            {d.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell className="text-gray-500 text-xs">
                        {formatRelativeDate(d.expires_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(d)}
                            className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 hover:text-primary transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(d.id)}
                            className="p-1.5 rounded-md text-gray-400 hover:bg-red-50 hover:text-[#DC2626] transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {discounts.map((d) => {
              const TypeIcon = typeIcons[d.type];
              return (
                <div key={d.id} className="rounded-lg border border-[#E2E8F0] bg-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-gray-100 p-1.5">
                        <TypeIcon className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1E293B] capitalize">
                          {d.type.replace("_", " ")}
                        </p>
                        {d.code && (
                          <p className="text-xs font-mono text-gray-400">{d.code}</p>
                        )}
                      </div>
                    </div>
                    <button onClick={() => handleToggleActive(d)}>
                      <Badge variant={d.is_active ? "success" : "default"} size="sm" dot>
                        {d.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E2E8F0]">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-semibold text-[#1E293B]">
                        {d.type === "percentage" ? `${d.value}%` : formatCurrency(Number(d.value), currencyCode)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatRelativeDate(d.expires_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(d)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-primary transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-[#DC2626] transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-12 rounded-lg border border-[#E2E8F0] bg-white">
          <Tag className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium mb-1">No discounts yet</p>
          <p className="text-sm text-gray-400 mb-4">Create your first discount or promotion.</p>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4" />
            Create Discount
          </Button>
        </div>
      )}

      <FloatingActionButton onClick={openCreate} label="New Discount" />

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Discount" : "Create Discount"}
      >
        <div className="space-y-4">
          <Select
            id="type"
            label="Discount Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as DiscountType })}
            options={DISCOUNT_TYPES}
          />

          <Input
            id="value"
            label={form.type === "percentage" ? "Percentage (%)" : `Amount (${currencyCode})`}
            type="number"
            placeholder={form.type === "percentage" ? "10" : "5000"}
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            error={errors.value}
          />

          <Input
            id="code"
            label="Discount Code (optional)"
            placeholder="SAVE20"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="starts_at"
              label="Start Date"
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
            />
            <Input
              id="expires_at"
              label="Expiry Date"
              type="datetime-local"
              value={form.expires_at}
              onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              error={errors.expires_at}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="max_usage"
              label="Max Uses (optional)"
              type="number"
              placeholder="100"
              value={form.max_usage}
              onChange={(e) => setForm({ ...form, max_usage: e.target.value })}
            />
            <Input
              id="min_cart_value"
              label="Min Cart Value (optional)"
              type="number"
              placeholder="10000"
              value={form.min_cart_value}
              onChange={(e) => setForm({ ...form, min_cart_value: e.target.value })}
            />
          </div>

          {form.type === "percentage" && (
            <Input
              id="max_discount_cap"
              label={`Max Discount Cap (optional, ${currencyCode})`}
              type="number"
              placeholder="50000"
              value={form.max_discount_cap}
              onChange={(e) => setForm({ ...form, max_discount_cap: e.target.value })}
            />
          )}

          <div className="flex items-center gap-2">
            <input
              id="is_active"
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
          </div>

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
