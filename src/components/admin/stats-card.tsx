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

// Design KPI card: uppercase label + delta chip, display-face numeral, muted sub.
// The colour variants now tint only the icon/trend chip — the card itself is ink.
const colorConfig: Record<ColorVariant, string> = {
  blue: "bg-purple/15 text-lilac",
  green: "bg-[#16A34A]/15 text-[#5BE49B]",
  amber: "bg-[#D97706]/15 text-[#FFC773]",
  purple: "bg-purple/15 text-lilac",
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  color = "blue",
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-cream/[0.09] bg-ink p-5 transition-colors hover:border-cream/20",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-display text-xs font-medium uppercase tracking-[0.12em] text-cream/45">
          {title}
        </span>
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-[7px]", colorConfig[color])}>
          <Icon className="h-[15px] w-[15px]" />
        </span>
      </div>
      <div className="mt-4 truncate font-display text-[30px] font-bold leading-none tracking-[-0.03em] text-cream">
        {value}
      </div>
      {trend && <div className="mt-2.5 text-[12.5px] text-cream/40">{trend}</div>}
    </div>
  );
}
