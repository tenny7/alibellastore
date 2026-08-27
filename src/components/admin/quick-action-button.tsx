import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionButtonProps {
  href: string;
  icon: LucideIcon;
  label: string;
  description?: string;
  className?: string;
}

export function QuickActionButton({
  href,
  icon: Icon,
  label,
  description,
  className,
}: QuickActionButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-[18px] border border-cream/[0.09] bg-ink p-4 transition-all hover:border-cream/20 active:scale-[0.98]",
        className
      )}
    >
      <div className="rounded-[10px] bg-cream/[0.08] p-2.5 text-cream/70 transition-colors group-hover:bg-cream/[0.14]">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-bold text-cream">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-cream/45">{description}</p>
        )}
      </div>
    </Link>
  );
}
