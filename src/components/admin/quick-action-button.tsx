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
        "flex items-center gap-3 rounded-lg border border-[#E2E8F0] bg-white p-4 transition-all hover:shadow-md hover:border-primary/20 active:scale-[0.98] group",
        className
      )}
    >
      <div className="rounded-lg bg-blue-50 p-2.5 group-hover:bg-blue-100 transition-colors">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium text-[#1E293B]">{label}</p>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
    </Link>
  );
}
