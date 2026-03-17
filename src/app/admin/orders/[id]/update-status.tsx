"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import toast from "react-hot-toast";
import type { OrderStatus } from "@/types";

interface Props {
  orderId: string;
  currentStatus: OrderStatus;
}

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export function UpdateOrderStatus({ orderId, currentStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  async function handleUpdate() {
    if (status === currentStatus) return;
    setSaving(true);

    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      toast.error("Failed to update status");
      setSaving(false);
      return;
    }

    toast.success("Order status updated");
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <Select
        id="orderStatus"
        value={status}
        onChange={(e) => setStatus(e.target.value as OrderStatus)}
        options={statusOptions}
      />
      <Button
        onClick={handleUpdate}
        loading={saving}
        disabled={status === currentStatus}
        className="w-full"
        size="sm"
      >
        Update Status
      </Button>
    </div>
  );
}
