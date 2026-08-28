import { Check, Clock, CreditCard, Package, Truck, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

const TIMELINE_STEPS: { status: OrderStatus; label: string; icon: typeof Check }[] = [
  { status: "pending", label: "Order Placed", icon: Clock },
  { status: "paid", label: "Payment Received", icon: CreditCard },
  { status: "processing", label: "Processing", icon: Package },
  { status: "shipped", label: "Shipped", icon: Truck },
  { status: "delivered", label: "Delivered", icon: CheckCircle },
];

const STATUS_ORDER: Record<OrderStatus, number> = {
  pending: 0,
  paid: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
  cancelled: -1,
};

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  className?: string;
}

export function OrderTimeline({ currentStatus, className }: OrderTimelineProps) {
  if (currentStatus === "cancelled") {
    return (
      <div className={cn("flex items-center gap-3 p-4 rounded-lg bg-danger/10 border border-danger/25", className)}>
        <XCircle className="h-5 w-5 text-danger shrink-0" />
        <div>
          <p className="text-sm font-medium text-danger">Order Cancelled</p>
          <p className="text-xs text-danger mt-0.5">This order has been cancelled</p>
        </div>
      </div>
    );
  }

  const currentIndex = STATUS_ORDER[currentStatus];

  return (
    <div className={cn("space-y-0", className)}>
      {TIMELINE_STEPS.map((step, i) => {
        const stepIndex = STATUS_ORDER[step.status];
        const isComplete = stepIndex < currentIndex;
        const isCurrent = stepIndex === currentIndex;
        const Icon = step.icon;

        return (
          <div key={step.status} className="flex gap-3">
            {/* Line + dot */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full shrink-0 transition-colors",
                  isComplete
                    ? "bg-surface-fg text-surface"
                    : isCurrent
                    ? "bg-page-fg text-page"
                    : "bg-surface-hover text-surface-muted"
                )}
              >
                {isComplete ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              {i < TIMELINE_STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-0.5 h-6",
                    stepIndex < currentIndex ? "bg-surface-fg" : "bg-surface-fg/15"
                  )}
                />
              )}
            </div>

            {/* Label */}
            <div className="pt-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  isComplete
                    ? "text-surface-fg"
                    : isCurrent
                    ? "text-surface-fg"
                    : "text-surface-muted"
                )}
              >
                {step.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
