"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  LogOut,
  Shield,
  Package,
  UserCircle,
  Search,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useCartStore } from "@/store/cart-store";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/storefront/notification-bell";
import { ThemeToggle } from "@/components/storefront/theme-toggle";
import type { User as UserType } from "@supabase/supabase-js";
import type { Category } from "@/types";

interface HeaderProps {
  storeName?: string;
  categories?: Category[];
}

export function Header({
  storeName = "MoMo Commerce",
  categories = [],
}: HeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const itemCount = useCartStore((s) => s.getItemCount());

  useEffect(() => {
    const supabase = createClient();

    function fetchRole(userId: string) {
      supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single()
        .then(({ data, error }) => {
          if (error) console.error("[Header] role fetch error:", error.message);
          setUserRole(data?.role || null);
        });
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchRole(user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
    setDropdownOpen(false);
    router.push("/");
    router.refresh();
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
      setMenuOpen(false);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-page-fg/[0.12] bg-page/[0.82] text-page-fg backdrop-blur-[14px]">
        <div className="flex h-16 items-center justify-between gap-6 px-5 md:px-14">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-baseline gap-2">
          <span className="font-display text-[22px] font-extrabold uppercase tracking-[-0.03em] text-page-fg">
            {storeName}
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-page-fg/50 sm:inline">
            Kigali
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 font-mono text-[11px] uppercase tracking-[0.12em] md:flex">
          <Link
            href="/products"
            className="transition-colors hover:text-accent"
          >
            Shop
          </Link>
          {categories.slice(0, 4).map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="text-page-fg/70 transition-colors hover:text-accent"
            >
              {cat.name}
            </Link>
          ))}
          <Link
            href="/about"
            className="text-page-fg/70 transition-colors hover:text-accent"
          >
            About
          </Link>
        </nav>

        {/* Desktop right actions */}
        <div className="hidden md:flex items-center gap-2">
          {/* Admin button — only visible to admins */}
          {userRole === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-[10px] border border-page-fg/25 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-page-fg transition-colors hover:bg-page-fg/[0.06]"
            >
              <Shield className="h-3.5 w-3.5" />
              Admin
            </Link>
          )}

          <ThemeToggle />

          {/* Search */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Search products"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-page-fg/25 text-page-fg transition-colors hover:bg-page-fg/[0.06]"
          >
            <Search className="h-[17px] w-[17px]" />
          </button>

          {/* Notifications */}
          {user && <NotificationBell />}

          {/* Cart */}
          <Link
            href="/cart"
            className="flex items-center gap-2.5 rounded-full border border-page-fg/[0.28] px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-page-fg transition-colors hover:border-accent hover:text-accent"
          >
            <span>Bag</span>
            <span className="inline-flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-accent px-1 text-[10px] text-accent-fg">
              {itemCount}
            </span>
          </Link>

          {/* User */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="Account menu"
                className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-page-fg/25 text-page-fg transition-colors hover:bg-page-fg/[0.06]"
              >
                <User className="h-[17px] w-[17px]" />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 z-50 mt-2 w-52 rounded-2xl border border-page-fg/[0.12] bg-well py-1.5 shadow-[0_18px_44px_rgba(11,10,18,.5)]">
                  <div className="border-b border-page-fg/[0.1] px-4 py-2.5 text-xs text-page-fg/50">
                    {user.email && !user.email.endsWith("@phone.local")
                      ? user.email
                      : user.user_metadata?.phone || "My Account"}
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-page-fg/75 transition-colors hover:bg-page-fg/[0.07] hover:text-page-fg"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <UserCircle className="h-4 w-4" />
                    My Profile
                  </Link>
                  <Link
                    href="/orders"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-page-fg/75 transition-colors hover:bg-page-fg/[0.07] hover:text-page-fg"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Package className="h-4 w-4" />
                    My Orders
                  </Link>
                  {userRole === "admin" && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-page-fg/75 transition-colors hover:bg-page-fg/[0.07] hover:text-page-fg"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Shield className="h-4 w-4" />
                      Admin Panel
                    </Link>
                  )}
                  <div className="my-1 border-t border-page-fg/[0.1]" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-page-fg/75 transition-colors hover:bg-page-fg/[0.07] hover:text-page-fg"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              aria-label="Sign in"
              className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-page-fg/25 text-page-fg transition-colors hover:bg-page-fg/[0.06]"
            >
              <User className="h-[17px] w-[17px]" />
            </Link>
          )}
        </div>

        {/* Mobile right actions */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle className="!h-9 !w-9 !border-0" />
          <button
            onClick={() => { setSearchOpen(!searchOpen); setMenuOpen(false); }}
            aria-label="Search products"
            className="p-2 text-page-fg/70"
          >
            <Search className="h-5 w-5" />
          </button>
          {user && <NotificationBell />}
          <Link href="/cart" aria-label="Cart" className="relative p-2">
            <ShoppingCart className="h-5 w-5 text-page-fg/70" />
            {itemCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-page-fg text-[10px] font-bold text-page">
                {itemCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => { setMenuOpen(!menuOpen); setSearchOpen(false); }}
            aria-label="Menu"
            className="p-2"
          >
            {menuOpen ? (
              <X className="h-5 w-5 text-page-fg/70" />
            ) : (
              <Menu className="h-5 w-5 text-page-fg/70" />
            )}
          </button>
        </div>
      </div>

      {/* Search bar (slides down) */}
      <div
        className={cn(
          "overflow-hidden border-t border-page-fg/[0.1] bg-page transition-all duration-200",
          searchOpen ? "max-h-16" : "max-h-0"
        )}
      >
        <form onSubmit={handleSearch} className="mx-auto flex max-w-[1320px] gap-2 px-4 py-3 md:px-10">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="flex-1 rounded-xl border border-page-fg/20 bg-page-fg/[0.06] px-4 py-2.5 text-sm text-page-fg placeholder:text-page-fg/40 focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-page-fg px-5 py-2.5 text-sm font-bold text-page transition-opacity hover:opacity-90"
          >
            Search
          </button>
        </form>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-t border-page-fg/[0.1] bg-page transition-all duration-200 md:hidden",
          menuOpen ? "max-h-[500px]" : "max-h-0"
        )}
      >
        <nav className="px-4 py-3 space-y-1">
          {/* Admin button — only visible to admins on mobile */}
          {userRole === "admin" && (
            <Link
              href="/admin"
              className="mb-2 flex items-center gap-2 rounded-xl bg-page-fg px-3 py-2.5 text-sm font-bold text-page"
              onClick={() => setMenuOpen(false)}
            >
              <Shield className="h-4 w-4" />
              Admin Panel
            </Link>
          )}
          <Link
            href="/products"
            className="block rounded-xl px-3 py-2.5 text-sm font-medium text-page-fg hover:bg-page-fg/[0.07]"
            onClick={() => setMenuOpen(false)}
          >
            All Products
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="block rounded-xl px-3 py-2.5 text-sm text-page-fg/70 hover:bg-page-fg/[0.07] hover:text-page-fg"
              onClick={() => setMenuOpen(false)}
            >
              {cat.name}
            </Link>
          ))}
          <Link
            href="/about"
            className="block rounded-xl px-3 py-2.5 text-sm text-page-fg/70 hover:bg-page-fg/[0.07] hover:text-page-fg"
            onClick={() => setMenuOpen(false)}
          >
            About
          </Link>

          <div className="my-2 border-t border-page-fg/[0.1]" />

          {user ? (
            <>
              <Link href="/profile" className="block rounded-xl px-3 py-2.5 text-sm text-page-fg/70 hover:bg-page-fg/[0.07] hover:text-page-fg" onClick={() => setMenuOpen(false)}>
                My Profile
              </Link>
              <Link href="/orders" className="block rounded-xl px-3 py-2.5 text-sm text-page-fg/70 hover:bg-page-fg/[0.07] hover:text-page-fg" onClick={() => setMenuOpen(false)}>
                My Orders
              </Link>
              {userRole === "admin" && (
                <Link href="/admin" className="block rounded-xl px-3 py-2.5 text-sm text-page-fg/70 hover:bg-page-fg/[0.07] hover:text-page-fg" onClick={() => setMenuOpen(false)}>
                  Admin Panel
                </Link>
              )}
              <button
                onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-page-fg/70 hover:bg-page-fg/[0.07] hover:text-page-fg"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login" className="block rounded-xl px-3 py-2.5 text-sm font-bold text-page-fg hover:bg-page-fg/[0.07]" onClick={() => setMenuOpen(false)}>
              Sign In
            </Link>
          )}
        </nav>
      </div>
      </header>
    </>
  );
}
