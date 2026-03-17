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
      <div className={cn("flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-100", className)}>
        <XCircle className="h-5 w-5 text-[#DC2626] shrink-0" />
        <div>
          <p className="text-sm font-medium text-[#DC2626]">Order Cancelled</p>
          <p className="text-xs text-red-400 mt-0.5">This order has been cancelled</p>
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
                    ? "bg-[#16A34A] text-white"
                    : isCurrent
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-400"
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
                    stepIndex < currentIndex ? "bg-[#16A34A]" : "bg-gray-200"
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
                    ? "text-[#16A34A]"
                    : isCurrent
                    ? "text-primary"
                    : "text-gray-400"
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
