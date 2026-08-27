import { cn } from "@/lib/utils";

/** Two-colour system: states read by fill weight, not hue. `danger` is the
 *  single chromatic exception, reserved for failures and cancellations.
 *  Variant names are kept so existing call sites don't churn. */
type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  // outline only — the weakest state
  default: "border-surface-border text-surface-muted",
  // solid, inverted — the strongest, terminal state
  success: "border-transparent bg-surface-fg text-surface",
  // faint wash
  warning: "border-surface-border bg-surface-fg/[0.06] text-surface-muted",
  // the one colour
  danger: "border-danger/30 bg-danger/10 text-danger",
  // mid weight
  info: "border-transparent bg-surface-fg/15 text-surface-fg",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-surface-muted",
  success: "bg-surface",
  warning: "bg-surface-fg/40",
  danger: "bg-danger",
  info: "bg-surface-fg",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-0.5 text-xs",
};

export function Badge({ variant = "default", size = "md", children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[variant])} />}
      {children}
    </span>
  );
}
