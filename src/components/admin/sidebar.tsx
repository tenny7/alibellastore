"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Tag,
  Settings,
  Truck,
  Boxes,
  Users,
  Banknote,
  MessageSquare,
  FileText,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/dispatch", label: "Dispatch", icon: Truck },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/support", label: "Support", icon: MessageSquare },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/payouts", label: "Payouts", icon: Banknote },
  { href: "/admin/discounts", label: "Discounts", icon: Tag },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  storeName?: string;
}

export function Sidebar({ storeName = "MoMo Commerce" }: SidebarProps) {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useSidebar();

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-cream/[0.08] bg-ink text-cream transition-all duration-300 lg:flex",
        collapsed ? "w-[72px]" : "w-[248px]"
      )}
    >
      {/* Header */}
      <div className={cn("flex items-center gap-2.5 px-4 py-5", collapsed && "justify-center px-3")}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-cream">
          <ShoppingBag className="h-[17px] w-[17px] text-ink" strokeWidth={2.2} />
        </span>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-base font-bold leading-none tracking-[-0.02em]">
              {storeName}
            </h1>
            <p className="mt-1.5 text-[11px] leading-none text-cream/45">Admin</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex h-10 items-center gap-[11px] rounded-[11px] text-sm font-medium transition-all",
                collapsed ? "justify-center px-0" : "px-3",
                isActive
                  ? "bg-cream text-ink"
                  : "text-cream/60 hover:bg-cream/[0.07] hover:text-cream"
              )}
            >
              {/* Design uses a dot, not a rail */}
              {!collapsed && (
                <span
                  className={cn(
                    "h-[7px] w-[7px] shrink-0 rounded-full transition-colors",
                    isActive ? "bg-ink" : "bg-cream/25 group-hover:bg-cream/50"
                  )}
                />
              )}
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="flex-1">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleCollapsed}
        className="flex items-center justify-center gap-2 border-t border-cream/[0.08] py-3 text-sm text-cream/50 transition-colors hover:bg-cream/[0.06] hover:text-cream"
      >
        {collapsed ? (
          <ChevronsRight className="h-4 w-4" />
        ) : (
          <>
            <ChevronsLeft className="h-4 w-4" />
            <span>Collapse</span>
          </>
        )}
      </button>
    </aside>
  );
}
