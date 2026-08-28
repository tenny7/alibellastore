"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
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
  X,
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
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

interface MobileSidebarDrawerProps {
  storeName?: string;
}

export function MobileSidebarDrawer({ storeName = "MoMo Commerce" }: MobileSidebarDrawerProps) {
  const pathname = usePathname();
  const { mobileOpen, setMobileOpen } = useSidebar();

  // Close on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  // Lock scroll when open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  if (!mobileOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        style={{ animation: "fadeIn 0.2s ease-out" }}
        onClick={() => setMobileOpen(false)}
      />

      {/* Drawer */}
      <aside
        className="dc-dark absolute bottom-0 left-0 top-0 flex w-[280px] flex-col bg-ink text-cream"
        style={{ animation: "slideInLeft 0.25s ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div>
            <h1 className="font-display tracking-[-0.03em] text-lg font-bold">{storeName}</h1>
            <p className="text-xs text-surface-muted mt-0.5">Admin Panel</p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-surface-muted hover:text-white hover:bg-surface/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-5 py-3 text-sm transition-colors relative",
                  isActive
                    ? "text-white bg-surface/10"
                    : "text-surface-muted hover:text-white hover:bg-surface/5"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-page-fg rounded-r-full" />
                )}
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
