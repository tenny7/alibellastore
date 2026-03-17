import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ColorVariant = "blue" | "green" | "amber" | "purple";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  color?: ColorVariant;
  className?: string;
}

const colorConfig: Record<ColorVariant, { border: string; iconBg: string; iconText: string }> = {
  blue: {
    border: "border-t-primary",
    iconBg: "bg-blue-50",
    iconText: "text-primary",
  },
  green: {
    border: "border-t-[#16A34A]",
    iconBg: "bg-green-50",
    iconText: "text-[#16A34A]",
  },
  amber: {
    border: "border-t-[#D97706]",
    iconBg: "bg-amber-50",
    iconText: "text-[#D97706]",
  },
  purple: {
    border: "border-t-purple-500",
    iconBg: "bg-purple-50",
    iconText: "text-purple-500",
  },
};

export function StatsCard({ title, value, icon: Icon, trend, color = "blue", className }: StatsCardProps) {
  const config = colorConfig[color];

  return (
    <div
      className={cn(
        "rounded-lg border border-[#E2E8F0] border-t-[3px] bg-white p-5 transition-all hover:shadow-md",
        config.border,
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-[#1E293B] truncate">{value}</p>
          {trend && (
            <p className="mt-1 text-xs text-gray-500">{trend}</p>
          )}
        </div>
        <div className={cn("rounded-xl p-3 shrink-0", config.iconBg)}>
          <Icon className={cn("h-6 w-6", config.iconText)} />
        </div>
      </div>
    </div>
  );
}
