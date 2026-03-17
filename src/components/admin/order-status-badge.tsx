import { Badge } from "@/components/ui/badge";
import type { OrderStatus, PaymentStatus } from "@/types";

const orderStatusMap: Record<OrderStatus, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
  pending: { label: "Pending", variant: "warning" },
  paid: { label: "Paid", variant: "success" },
  processing: { label: "Processing", variant: "info" },
  shipped: { label: "Shipped", variant: "info" },
  delivered: { label: "Delivered", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
};

const paymentStatusMap: Record<PaymentStatus, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
  pending: { label: "Pending", variant: "warning" },
  successful: { label: "Paid", variant: "success" },
  failed: { label: "Failed", variant: "danger" },
  timed_out: { label: "Timed Out", variant: "danger" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = orderStatusMap[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const config = paymentStatusMap[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
