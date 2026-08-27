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
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-cream/[0.08] bg-ink px-4 lg:h-16 lg:px-6">
      {/* Left: hamburger + breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-1.5 text-cream/60 transition-colors hover:bg-cream/[0.08] hover:text-cream lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumbs — hidden on mobile */}
        <nav className="hidden sm:flex items-center gap-1 text-sm min-w-0">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1 min-w-0">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-cream/25" />}
              {i === breadcrumbs.length - 1 ? (
                <span className="truncate font-medium capitalize text-cream">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="truncate capitalize text-cream/45 transition-colors hover:text-cream"
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
          className="flex items-center gap-1.5 rounded-[10px] border border-cream/[0.14] px-3 py-2 text-xs font-bold text-cream/75 transition-colors hover:bg-cream/[0.08] hover:text-cream"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">View Store</span>
        </Link>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-cream/[0.07] transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-page-fg flex items-center justify-center text-white text-sm font-medium">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span className="hidden max-w-[120px] truncate text-sm font-medium text-cream sm:block">
            {user.name}
          </span>
        </button>

        {dropdownOpen && (
          <div
            className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-cream/[0.12] bg-ink-raised py-1.5 shadow-[0_18px_44px_rgba(11,10,18,.5)]"
            style={{ animation: "scaleIn 0.15s ease-out" }}
          >
            <div className="border-b border-cream/[0.1] px-4 py-3">
              <p className="truncate text-sm font-medium text-cream">{user.name}</p>
              <p className="text-xs text-cream/45 truncate">{user.email}</p>
            </div>
            <Link
              href="/admin/settings"
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-surface-muted hover:bg-cream/[0.07] transition-colors"
              onClick={() => setDropdownOpen(false)}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors w-full text-left"
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
