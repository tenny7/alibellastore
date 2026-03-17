"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Tag,
  Settings,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/discounts", label: "Discounts", icon: Tag },
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
        "hidden lg:flex flex-col bg-[#1E293B] text-white shrink-0 transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      {/* Header */}
      <div className={cn("border-b border-white/10 flex items-center", collapsed ? "px-3 py-5 justify-center" : "px-6 py-5")}>
        {collapsed ? (
          <span className="text-lg font-bold">{storeName.charAt(0)}</span>
        ) : (
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold truncate">{storeName}</h1>
            <p className="text-xs text-gray-400 mt-0.5">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3">
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
                "flex items-center gap-3 text-sm transition-all relative group",
                collapsed ? "px-0 py-3 justify-center mx-2 rounded-lg" : "px-6 py-2.5",
                isActive
                  ? "text-white bg-white/10"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              {/* Active indicator bar */}
              {isActive && !collapsed && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full" />
              )}
              {isActive && collapsed && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
              )}
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleCollapsed}
        className="flex items-center justify-center gap-2 border-t border-white/10 py-3 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
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
