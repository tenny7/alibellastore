"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, ChevronRight, LogOut, Settings, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSidebar } from "./sidebar-context";
import type { User } from "@/types";

interface TopbarProps {
  user: User;
}

const BREADCRUMB_LABELS: Record<string, string> = {
  admin: "Dashboard",
  products: "Products",
  categories: "Categories",
  orders: "Orders",
  discounts: "Discounts",
  settings: "Settings",
  new: "New",
  edit: "Edit",
};

export function Topbar({ user }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { setMobileOpen } = useSidebar();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // Build breadcrumbs
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label = BREADCRUMB_LABELS[seg] || seg;
    return { href, label };
  });

  return (
    <header className="h-14 lg:h-16 border-b border-[#E2E8F0] bg-white px-4 lg:px-6 flex items-center justify-between shrink-0">
      {/* Left: hamburger + breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumbs — hidden on mobile */}
        <nav className="hidden sm:flex items-center gap-1 text-sm min-w-0">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1 min-w-0">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />}
              {i === breadcrumbs.length - 1 ? (
                <span className="text-[#1E293B] font-medium truncate capitalize">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-gray-400 hover:text-primary transition-colors truncate capitalize"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Right: view store + user dropdown */}
      <div className="flex items-center gap-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-[#E2E8F0] rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">View Store</span>
        </Link>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span className="hidden sm:block text-sm font-medium text-[#1E293B] max-w-[120px] truncate">
            {user.name}
          </span>
        </button>

        {dropdownOpen && (
          <div
            className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-[#E2E8F0] bg-white shadow-lg py-1 z-50"
            style={{ animation: "scaleIn 0.15s ease-out" }}
          >
            <div className="px-4 py-3 border-b border-[#E2E8F0]">
              <p className="text-sm font-medium text-[#1E293B] truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
            <Link
              href="/admin/settings"
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              onClick={() => setDropdownOpen(false)}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#DC2626] hover:bg-red-50 transition-colors w-full text-left"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}
      </div>
      </div>
    </header>
  );
}
