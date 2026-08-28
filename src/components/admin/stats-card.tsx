import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Two-colour system: a stat is either neutral or a problem.
type ColorVariant = "neutral" | "danger";

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
  neutral: "bg-page-fg/[0.08] text-page-fg/70",
  danger: "bg-danger/20 text-danger",
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  color = "neutral",
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-page-fg/[0.09] bg-page p-5 transition-colors hover:border-page-fg/20",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-display text-xs font-medium uppercase tracking-[0.12em] text-page-fg/45">
          {title}
        </span>
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-[7px]", colorConfig[color])}>
          <Icon className="h-[15px] w-[15px]" />
        </span>
      </div>
      <div className="mt-4 truncate font-display text-[30px] font-bold leading-none tracking-[-0.03em] text-page-fg">
        {value}
      </div>
      {trend && <div className="mt-2.5 text-[12.5px] text-page-fg/40">{trend}</div>}
    </div>
  );
}
